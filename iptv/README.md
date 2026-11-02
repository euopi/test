# IPTV

A browser IPTV player. No install, no build step.

Open `index.html` in your browser (double-clicking it works). Some browsers are
stricter with pages opened from disk; if anything misbehaves, serve the folder
instead with `python3 -m http.server` and go to http://localhost:8000.

## What it does

- Ships with about 8,000 free, legal live channels from 179 countries, taken
  from the public [iptv-org](https://github.com/iptv-org/iptv) database.
  Browse by country, filter by category, or search everything.
- Loads your own M3U playlist from a URL or a file. It's remembered between
  visits; switch between it and the built-in list with the dropdown.
- Favorites and recently watched, kept per source in your browser.
- Each channel's backup stream URLs are tried in turn before it's marked dead.
- Keys: ↑/↓ change channel, F favorite, / search, Esc stop.

## Limits worth knowing

Plenty of public streams are geo-blocked or just offline on any given day, so
expect some channels to fail. Playlist URLs only load if their host allows
browser downloads (CORS); if one doesn't, download the file and load it from
disk. Plain `http://` streams won't play if you host this page on `https://`.

## Refreshing the built-in list

    python3 build_data.py

This rewrites `data/channels.js` from the current iptv-org data.
