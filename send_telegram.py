"""Send text to Telegram, splitting to respect the 4096-character limit.

    python send_telegram.py digest.md
    echo "hello" | python send_telegram.py
"""
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

LIMIT = 4000  # under Telegram's 4096, leaving room for the part counter

load_dotenv(Path(__file__).parent / ".env")


def split_message(text, limit=LIMIT):
    """Split on paragraph breaks where possible, then lines, then hard chars,
    so a digest never gets cut mid-sentence."""
    if len(text) <= limit:
        return [text]

    parts, current = [], ""
    for para in text.split("\n\n"):
        if len(para) > limit:
            # A single oversized paragraph: fall back to line-by-line.
            for line in para.split("\n"):
                while len(line) > limit:
                    parts.append(line[:limit])
                    line = line[limit:]
                if len(current) + len(line) + 1 > limit:
                    parts.append(current.strip())
                    current = ""
                current += line + "\n"
            continue
        if len(current) + len(para) + 2 > limit:
            parts.append(current.strip())
            current = ""
        current += para + "\n\n"

    if current.strip():
        parts.append(current.strip())
    return parts


def send(text):
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        sys.exit("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set "
                 "(in .env locally, or as repository secrets in CI).")

    parts = split_message(text)
    for i, part in enumerate(parts, 1):
        if len(parts) > 1:
            part = f"({i}/{len(parts)})\n\n{part}"
        resp = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": part,
                  "parse_mode": "Markdown", "disable_web_page_preview": True},
            timeout=30,
        )
        data = resp.json()
        if not data.get("ok"):
            # Markdown in article titles can be malformed; retry as plain text
            # rather than losing the digest entirely.
            resp = requests.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={"chat_id": chat_id, "text": part,
                      "disable_web_page_preview": True},
                timeout=30,
            )
            data = resp.json()
            if not data.get("ok"):
                sys.exit(f"Telegram rejected part {i}: {data.get('description')}")
        if i < len(parts):
            time.sleep(1)  # stay clear of rate limits

    print(f"Sent {len(parts)} message(s).")


if __name__ == "__main__":
    body = Path(sys.argv[1]).read_text() if len(sys.argv) > 1 else sys.stdin.read()
    if not body.strip():
        sys.exit("Nothing to send.")
    send(body)
