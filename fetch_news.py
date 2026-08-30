"""Collect the last day's articles from every source into articles.json.

This script only gathers and cleans text - it does no summarizing. The
summarizing is done by the Claude Code session that runs this, which reads
articles.json and writes the digest.

    python fetch_news.py [--hours 24] [--no-seen]
"""
import argparse
import json
import re
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import feedparser
import requests

from sources import SOURCES

HERE = Path(__file__).parent
SEEN_PATH = HERE / "seen.json"
OUT_PATH = HERE / "articles.json"

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
HEADERS = {"User-Agent": UA}
BODY_CHARS = 4000       # per-article cap fed to the summarizer
SEEN_DAYS = 14          # how long a URL stays remembered
PROXY = "https://r.jina.ai/"   # reader proxy, tried when a site blocks us

# Sport is filtered out entirely. Matched as whole words only - as substrings
# these eat real news ("nfl" sits inside "inflacion", "pga" inside "propaganda").
SKIP_TERMS = [
    "nascar", "nfl", "nba", "mlb", "nhl", "ufc", "pga", "fifa", "uefa",
    "premier league", "super bowl", "world cup", "olympics", "olympic",
    "tennis", "wimbledon", "golf", "formula 1", "grand prix", "boxing",
    "cricket", "rugby", "quarterback", "playoff", "playoffs", "grand slam",
    "ballon d'or", "ligue 1", "la liga", "serie a", "hall of fame",
    "football", "basketball", "baseball", "sport", "sports",
]
SKIP_TERM_RE = re.compile(
    r"\b(" + "|".join(re.escape(t) for t in SKIP_TERMS) + r")\b", re.I)

# URL path fragments. Only checked on real URLs - Google News links are opaque
# base64 that matches these by chance.
SKIP_URL_PARTS = ["/sport", "/sports", "/deportes", "/football", "/nfl/", "/nba/"]


def log(msg):
    print(msg, file=sys.stderr)


def load_seen():
    if not SEEN_PATH.exists():
        return {}
    try:
        return json.loads(SEEN_PATH.read_text())
    except (json.JSONDecodeError, OSError):
        log("seen.json unreadable, starting fresh")
        return {}


def save_seen(seen):
    cutoff = time.time() - SEEN_DAYS * 86400
    pruned = {url: ts for url, ts in seen.items() if ts > cutoff}
    SEEN_PATH.write_text(json.dumps(pruned))


def entry_time(entry):
    """UTC datetime for a feed entry, or None if the feed omits a date."""
    for key in ("published_parsed", "updated_parsed"):
        parsed = entry.get(key)
        if parsed:
            return datetime(*parsed[:6], tzinfo=timezone.utc)
    return None


def clean(html):
    """Strip tags and collapse whitespace - feed summaries are often HTML."""
    text = re.sub(r"<[^>]+>", " ", html or "")
    text = (text.replace("&nbsp;", " ").replace("&amp;", "&")
                .replace("&#39;", "'").replace("&quot;", '"')
                .replace("&lt;", "<").replace("&gt;", ">"))
    return re.sub(r"\s+", " ", text).strip()


class Response:
    """Minimal stand-in for a requests.Response, for the curl fallback."""

    def __init__(self, status_code, text):
        self.status_code = status_code
        self.text = text
        self.content = text.encode("utf-8", "replace")

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"{self.status_code} for curl fetch")


def curl_get(url, ua, timeout=25):
    """Fetch via curl. Some CDNs fingerprint the TLS handshake rather than the
    user-agent, so they reject urllib/requests but allow curl with identical
    headers. Only used as a fallback after a 403."""
    try:
        proc = subprocess.run(
            ["curl", "-sS", "-L", "--max-time", str(timeout), "-A", ua,
             "-w", "\n%{http_code}", url],
            capture_output=True, text=True, timeout=timeout + 5)
        body, _, code = proc.stdout.rpartition("\n")
        return Response(int(code) if code.strip().isdigit() else 599, body)
    except Exception:
        return Response(599, "")


def get(url, ua=None, timeout=25):
    """GET, escalating through the workarounds a few of these sites need:
    the given UA, then a plain one, then curl for TLS-fingerprint blocks."""
    agent = ua or UA
    try:
        resp = requests.get(url, headers={"User-Agent": agent}, timeout=timeout)
        if resp.status_code != 403:
            return resp
    except requests.RequestException:
        pass
    return curl_get(url, agent, timeout)


def is_sport(item):
    """True if this looks like sports coverage, which the user doesn't want."""
    if SKIP_TERM_RE.search(item.get("title", "")):
        return True
    url = item.get("url", "").lower()
    if "news.google.com" in url:
        return False  # opaque base64 - the title is all we can judge on
    if any(part in url for part in SKIP_URL_PARTS):
        return True
    # Slug words are hyphen-separated, so the same whole-word match works once
    # the separators become spaces.
    return bool(SKIP_TERM_RE.search(re.sub(r"[-/_]", " ", url)))


def fetch_body(url, ua=None):
    """Full article text, or None. Never raises - a failure just means we
    fall back to the feed's own summary.

    Tries the site directly, then a reader proxy. Several sources here (RFI,
    OpenAI) serve their feed but 403 article pages from this server's IP; the
    proxy fetches from its own IP and returns the article as text, which is
    the only way we get bodies from them."""
    try:
        import trafilatura
        resp = get(url, ua, timeout=20)
        if resp.status_code == 200:
            text = trafilatura.extract(resp.text, include_comments=False,
                                       include_tables=False, no_fallback=False)
            if text and len(text.strip()) > 200:
                return text.strip()
    except Exception:
        pass

    try:
        resp = requests.get(PROXY + url, timeout=40,
                            headers={"User-Agent": "NewsDigest/1.0"})
        text = resp.text.strip()
        # A blocked or empty fetch comes back as a stub page, not an article.
        if resp.status_code == 200 and len(text) > 800:
            # Strip the proxy's own header lines.
            if "Markdown Content:" in text:
                text = text.split("Markdown Content:", 1)[1].strip()
            return text
    except Exception:
        pass
    return None


def from_rss(src, cutoff, seen):
    """Recent, unseen entries from an RSS/Atom feed."""
    try:
        resp = get(src["url"], src.get("ua"))
        resp.raise_for_status()
    except Exception as exc:
        log(f"  ! {src['name']}: feed fetch failed ({exc})")
        return []

    feed = feedparser.parse(resp.content)
    out, undated = [], 0
    for entry in feed.entries:
        url = entry.get("link")
        if not url or url in seen:
            continue
        published = entry_time(entry)
        if published is None:
            # Undated feed: take a few and rely on seen.json to avoid repeats.
            undated += 1
            if undated > src["cap"]:
                continue
        elif published < cutoff:
            continue
        out.append(dict(url=url, title=clean(entry.get("title", "")),
                        summary=clean(entry.get("summary", ""))[:1200],
                        published=published.isoformat() if published else None))
        if len(out) >= src["cap"]:
            break
    return out


def from_index(src, cutoff, seen):
    """Article links scraped off a listing page (for sites with no feed)."""
    try:
        resp = get(src["url"], src.get("ua"))
        resp.raise_for_status()
    except Exception as exc:
        log(f"  ! {src['name']}: page fetch failed ({exc})")
        return []

    base = src.get("base", "")
    out, seen_here = [], set()
    for match in re.finditer(src["link_re"], resp.text):
        # A capture group means the regex grabbed a relative path.
        path = match.group(1) if match.groups() else match.group(0)
        url = base + path if path.startswith("/") else path
        if url in seen or url in seen_here:
            continue
        seen_here.add(url)
        out.append(dict(url=url, title="", summary="", published=None))
        if len(out) >= src["cap"]:
            break
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hours", type=int, default=None,
                    help="override every source's own lookback window")
    ap.add_argument("--no-seen", action="store_true",
                    help="ignore seen.json (useful for a first test run)")
    args = ap.parse_args()

    now = datetime.now(timezone.utc)
    seen = {} if args.no_seen else load_seen()
    articles = []

    for src in SOURCES:
        hours = args.hours or src.get("hours", 24)
        cutoff = now - timedelta(hours=hours)
        gather = from_index if src["kind"] == "index" else from_rss
        items = gather(src, cutoff, seen)

        items = [i for i in items if not is_sport(i)]

        for item in items:
            if src["full_text"]:
                body = fetch_body(item["url"], src.get("ua"))
                if body:
                    item["body"] = body[:BODY_CHARS]
                    # Index pages give us no title; take it from the article.
                    if not item["title"]:
                        item["title"] = body.split("\n")[0][:200]
            item.setdefault("body", "")
            item["source"] = src["name"]
            item["lang"] = src["lang"]
            item["headline_only"] = not item["body"]
            articles.append(item)
            seen[item["url"]] = time.time()

        got = len(items)
        full = sum(1 for i in items if i.get("body"))
        log(f"  {src['name']:<20} {got:>2} article(s), {full} full text  ({hours}h)")

    OUT_PATH.write_text(json.dumps(articles, indent=2, ensure_ascii=False))
    if not args.no_seen:
        save_seen(seen)

    log(f"\n{len(articles)} articles -> {OUT_PATH.name}")
    return 0 if articles else 1


if __name__ == "__main__":
    sys.exit(main())
