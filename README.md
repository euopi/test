# Daily News Digest

Fetches the last day's articles from 19 sources, summarizes them into a single
English digest, and sends it to Telegram.

The summarizing is done by a Claude Code session, not by an API call, so no
Anthropic API key is needed - it runs on the Claude subscription.

## Layout

    sources.py        The 19 sources and their per-source settings.
    fetch_news.py     Gathers + cleans articles -> articles.json. No summarizing.
    send_telegram.py  Sends text to Telegram, splitting at the 4096-char limit.
    get_chat_id.py    One-off helper to find your Telegram chat ID.
    .env              Bot token and chat ID. Gitignored - never commit it.

## Running it by hand

    pip install -r requirements.txt
    python fetch_news.py              # writes articles.json
    # ...read articles.json, write the digest to digest.md...
    python send_telegram.py digest.md

`fetch_news.py --no-seen` ignores the dedupe file, which is useful for testing.
`--hours N` overrides every source's own lookback window.

## Why some sources are thinner than others

Several sites either sit behind a paywall or block this server's IP, so we can
only get headlines and feed blurbs for them. `full_text=False` in `sources.py`
marks these, and the digest carries a footnote saying which ones they are.

  Paywalled:      Financial Times, Mediapart, The Information
  Blocks our IP:  Reuters, Orient XXI, Diario Red, RFI, OpenAI

Two sources have no RSS feed at all (The AP, Anthropic), so we scrape their
listing pages for article links instead.

Sources publish at very different rates, so each one has its own `hours`
lookback window - a daily wire uses 24, a weekly needs 96 or it never appears.
`seen.json` remembers what has already been sent for 14 days, so a wider
window never causes repeats.
