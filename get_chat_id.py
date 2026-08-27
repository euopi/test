"""One-off helper: prints your Telegram chat ID.

Usage:
    1. Put TELEGRAM_BOT_TOKEN in .env
    2. Send your bot any message in Telegram ("hi")
    3. python get_chat_id.py
"""
import os
import sys

import requests
from dotenv import load_dotenv

load_dotenv()

token = os.environ.get("TELEGRAM_BOT_TOKEN")
if not token:
    sys.exit("TELEGRAM_BOT_TOKEN is not set. Add it to .env first.")

resp = requests.get(f"https://api.telegram.org/bot{token}/getUpdates", timeout=30)
data = resp.json()

if not data.get("ok"):
    sys.exit(f"Telegram rejected the token: {data.get('description', data)}")

chats = {}
for update in data.get("result", []):
    msg = update.get("message") or update.get("channel_post") or {}
    chat = msg.get("chat")
    if chat:
        chats[chat["id"]] = chat.get("username") or chat.get("title") or chat.get("first_name", "")

if not chats:
    sys.exit(
        "No messages found. Open your bot in Telegram, press Start, send it a "
        "message, then run this again. (Telegram only keeps updates ~24h.)"
    )

for chat_id, name in chats.items():
    print(f"TELEGRAM_CHAT_ID={chat_id}   # {name}")
