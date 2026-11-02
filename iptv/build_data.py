"""Build the built-in channel list the IPTV app loads.

Pulls the public iptv-org database (https://github.com/iptv-org/api), keeps
only channels that have at least one HTTPS stream (browsers block plain-HTTP
video on an HTTPS page), drops NSFW and closed channels, and writes:

  data/channels.js   channels grouped by country, as a script so index.html
                     works when opened straight from disk (file://)

Run it again whenever you want fresh stream lists:  python3 build_data.py
"""

import json
import os
import urllib.request

API = "https://iptv-org.github.io/api/"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")


def get(url):
    print("fetching", url)
    with urllib.request.urlopen(url, timeout=120) as r:
        return json.load(r)


def build_channels():
    channels = {c["id"]: c for c in get(API + "channels.json")}
    countries = get(API + "countries.json")
    streams = get(API + "streams.json")
    logos = get(API + "logos.json")

    logo_for = {}
    for lg in logos:
        cid = lg["channel"]
        # prefer the main-channel logo (feed is None) and the widest one
        score = (lg["feed"] is None, lg.get("width") or 0)
        if cid not in logo_for or score > logo_for[cid][0]:
            logo_for[cid] = (score, lg["url"])

    by_channel = {}
    for s in streams:
        cid = s["channel"]
        if not cid or cid not in channels or not s["url"].startswith("https://"):
            continue
        # streams needing a custom referrer or user agent can't be set from a browser
        if s.get("referrer") or s.get("user_agent"):
            continue
        by_channel.setdefault(cid, []).append(s)

    def qrank(s):
        q = (s.get("quality") or "").rstrip("pi")
        return int(q) if q.isdigit() else 0

    out = {}
    for cid, sts in by_channel.items():
        ch = channels[cid]
        if ch.get("is_nsfw") or ch.get("closed") or not ch.get("country"):
            continue
        sts.sort(key=qrank, reverse=True)
        entry = {
            "id": cid,
            "n": ch["name"],
            "s": [s["url"] for s in sts][:4],
        }
        if ch.get("categories"):
            entry["k"] = ch["categories"]
        if cid in logo_for:
            entry["l"] = logo_for[cid][1]
        if qrank(sts[0]):
            entry["q"] = sts[0]["quality"]
        out.setdefault(ch["country"], []).append(entry)

    for lst in out.values():
        lst.sort(key=lambda e: e["n"].lower())

    meta = {c["code"]: {"name": c["name"], "flag": c["flag"]}
            for c in countries if c["code"] in out}
    data = {"countries": meta, "channels": out}
    with open(os.path.join(OUT, "channels.js"), "w", encoding="utf-8") as f:
        f.write("window.IPTV_DATA = ")
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    total = sum(len(v) for v in out.values())
    print(f"wrote {total} channels across {len(out)} countries")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    build_channels()
