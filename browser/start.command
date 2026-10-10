#!/bin/sh
# Double-click on macOS, or run ./start.command on Linux.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install it from https://nodejs.org and run this again."
  exit 1
fi
[ -d node_modules ] || npm install
( sleep 2; (open http://localhost:8080 || xdg-open http://localhost:8080) >/dev/null 2>&1 ) &
node server.js
