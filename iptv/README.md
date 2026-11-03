# IPTV

A browser IPTV player. No install, no build step.

Open `IPTV.html` in your browser. It is one self-contained file (styles, channel
list and player all inlined), so you can copy it anywhere and double-click it.
To rebuild it after editing the source, run `python3 bundle.py`.

For development, `index.html` loads the same pieces as separate files. Some browsers are
stricter with pages opened from disk; if anything misbehaves, serve the folder
instead with `python3 -m http.server` and go to http://localhost:8000.

## What it does

- Ships with about 8,000 free, legal live channels from 179 countries, taken
  from the public [iptv-org](https://github.com/iptv-org/iptv) database.
  Browse by country, filter by category, or search everything.
- Saves as many of your own M3U playlists as you like, from a URL or a file,
  and lists them in the dropdown next to the built-in list. Playlists saved by
  URL download a fresh copy when you open them if the saved one is over 6
  hours old, or right away with the ⟳ button. Pasting a single stream link
  saves it as a one-channel playlist.
- Rename or remove playlists, and Export/Import them all (with favorites) as
  a JSON backup, for moving to another browser or computer.
- Favorites and recently watched, kept per playlist in your browser.
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
