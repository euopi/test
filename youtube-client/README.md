# Tube

A YouTube client that runs in your browser. No build step, no server code, no
Google sign-in: three static files that talk to the YouTube Data API with your
own API key and play videos through YouTube's embedded player.

## What it does

- A "For you" home feed that learns from what you watch (see below), plus a
  plain newest-first Subscriptions tab
- Subscriptions you follow inside this app, or imported from Google Takeout's
  `subscriptions.csv`, or your real ones if you sign in
- Trending for any region, search with type and sort filters
- Watch page with description, clickable timestamps, comments and replies
- Resumes videos where you left off, and shows watch progress on thumbnails
- Channel pages (uploads and playlists), playlist pages with a play-all queue
  that autoplays the next video
- Watch later and history, with export/import of everything as JSON
- Paste any YouTube link (video, short, channel, @handle, playlist) into the
  search box to jump straight to it
- Shorts hidden everywhere by default (toggle in Settings). The API has no
  Shorts flag, so the app asks for each video's embed size, which follows the
  video's real shape: vertical and 3 minutes or less counts as a Short.
- Keyboard: `/` focuses search

- Optional Google sign-in: your real subscriptions feed the home page, and
  Subscribe, like/dislike, comments and Save to playlist act on your actual
  account. Your playlists and Liked videos show up in Library.

Watch later and history always stay in this browser's localStorage, signed in
or not, because the API doesn't expose the real ones. Everything else you save
without signing in lives there too. Nothing is sent
anywhere except `googleapis.com` (metadata), `youtube-nocookie.com` (the
player) and `accounts.google.com` (sign-in, if you use it).

## Hosted copy

https://euopi.github.io/test/youtube-client/ (served by GitHub Pages from this
branch). Add `https://euopi.github.io/test/*` to your key's allowed websites.

## Running it locally

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

## How "For you" works

The app keeps a taste profile in your browser: weights for channels,
categories and topics (title words and tags). Opening a video nudges them up,
finishing it nudges them more, bailing in the first 15% nudges them down,
likes and dislikes count heavily, and "Not interested" (the × on a home card)
pushes that video's channel and topics down. Everything halves in weight every
45 days, so old phases fade.

Candidates come from your subscriptions' uploads, channels you watch but
don't follow, the charts for your top categories, channels featured on your
favorite channels' pages, and four searches a day built from topics that show
up together in videos you finished (e.g. "minecraft redstone farm"). Topic
match outweighs channel loyalty in the score, and a video from a channel you
don't know only gets in if it clearly shares your topics, which keeps random
chart videos out. A Settings slider sets how much of the feed goes to new
channels versus familiar ones; each card says why it's there; and videos shown
on four different days without being opened drop out. Library shows what it
learned and lets you remove any of it.

Smart matching (on by default, toggle in Settings) adds meaning on top of
word matching. A small language model, all-MiniLM-L6-v2 loaded through
Transformers.js, runs in the browser and turns each title into a vector; a
candidate scores by how close it sits to the things you've watched, so
"I built a castle in Minecraft" matches "Building a medieval fortress in
survival mode" with no words in common, while "Building a gaming PC" no
longer sneaks in on the word "building". The model is a 23 MB one-time
download that the browser caches; vectors are stored in IndexedDB so each
video is only processed once. The model is English-trained, so it's weaker
on titles in other languages. If it can't load, the feed falls back to word
matching.

To start with your real taste instead of a blank slate, import your YouTube
watch history: in Google Takeout, Deselect all, pick "YouTube and YouTube
Music", limit it to history (JSON or HTML), and load `watch-history.json` in
Library -> Recommendations. Importing rebuilds the profile from that file.

Quota: a home load costs roughly 30-50 units when its caches are stale (the
topic searches, 400 units, run once a day), and nothing when they're fresh.

## Signing in (optional)

In the same Cloud project:

1. Google Auth Platform -> Get started. Audience: External, left in Testing,
   with your own Gmail added as a test user.
2. Clients -> Create client -> Web application. Authorized JavaScript origins:
   `https://euopi.github.io` and/or `http://localhost:8000`.
3. Paste the client ID into Settings and click Sign in.

Google shows an "app isn't verified" warning, which is expected for a personal
app in testing mode. Browser-only sign-ins last an hour; after that the app
asks again with a quick popup. While signed in, requests use your sign-in
instead of the API key, so the key is optional.

## Limits

- Some uploaders disable embedding, and those videos won't play here. The
  player shows a "Watch on YouTube" link when that happens.
- Ads in the embedded player are YouTube's call, not this app's.
- The Data API no longer offers "related videos", so there is no
  recommendations sidebar outside of playlists.
- Watch later, history and YouTube's own recommendations can't be read by any
  third-party app, so those stay local or absent even when signed in.
