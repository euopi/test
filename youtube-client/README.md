# Tube

A YouTube client that runs in your browser. No build step, no server code, no
Google sign-in: three static files that talk to the YouTube Data API with your
own API key and play videos through YouTube's embedded player.

## What it does

- Subscription feed built from channels you follow inside this app (or import
  your real ones from Google Takeout's `subscriptions.csv`)
- Trending for any region, search with type and sort filters
- Watch page with description, clickable timestamps, comments and replies
- Resumes videos where you left off, and shows watch progress on thumbnails
- Channel pages (uploads and playlists), playlist pages with a play-all queue
  that autoplays the next video
- Watch later and history, with export/import of everything as JSON
- Paste any YouTube link (video, short, channel, @handle, playlist) into the
  search box to jump straight to it
- Keyboard: `/` focuses search

Everything you save lives in this browser's localStorage. Nothing is sent
anywhere except `googleapis.com` (metadata) and `youtube-nocookie.com` (the
player).

## Running it

It has to be served over http, not opened as a file. YouTube's player refuses
to play without a referrer, and `file://` pages don't send one (you'd see
"error 153").

    cd youtube-client
    python3 -m http.server 8000

Then open http://localhost:8000 and go to Settings to paste your key. Any
static file server works the same way (`npx serve`, GitHub Pages, etc.).

## Getting an API key

1. Create a project in the Google Cloud console.
2. Enable "YouTube Data API v3" for it.
3. Credentials -> Create credentials -> API key.
4. Restrict the key: Websites -> `http://localhost:8000/*` (plus wherever else
   you host it), and API restrictions -> YouTube Data API v3 only.

The free quota is 10,000 units a day. Most calls cost 1 unit; a search costs
100. The subscription feed costs roughly one unit per subscribed channel and is
cached for 15 minutes.

## Limits

- Some uploaders disable embedding, and those videos won't play here. The
  player shows a "Watch on YouTube" link when that happens.
- Ads in the embedded player are YouTube's call, not this app's.
- The Data API no longer offers "related videos", so there is no
  recommendations sidebar outside of playlists.
- Subscriptions, watch later and history are local to this app and never touch your
  Google account.
