# Sidebar Browser

A web browser that runs inside a browser tab, with tabs in a vertical sidebar.

Pages load through [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet):
a service worker rewrites each page so it's served from this app's own origin,
which strips the `X-Frame-Options` / CSP headers that normally stop sites from
loading in an iframe. Requests travel over a [Wisp](https://github.com/MercuryWorkshop/wisp-js)
WebSocket to `server.js`, which opens the TCP connections. TLS is handled in your
browser by the epoxy transport, so the server only relays encrypted bytes.

## Run

```
cd browser
npm install
npm start
```

Then open http://localhost:8080. Service workers only run on `localhost` or
over HTTPS, so if you host this anywhere else it has to be behind HTTPS, and the
host has to allow WebSockets (for `/wisp/`).

`PORT` changes the port. By default the proxy refuses to connect to private and
loopback addresses so it can't be used to reach the server's own network; set
`ALLOW_PRIVATE=1` to allow that for local testing.

## Use

- Type a URL or search terms (DuckDuckGo) in the sidebar box.
- Links with `target="_blank"`, Ctrl/Cmd-clicks and `window.open` popups open as new sidebar tabs.
- Tabs are saved and restored on reload; restored tabs load when you click them.

Shortcuts (Ctrl+T / Ctrl+W belong to the outer browser, so these use Alt):

| Keys | Action |
| --- | --- |
| Alt+T | New tab |
| Alt+W | Close tab |
| Alt+R | Reload |
| Alt+Left / Alt+Right | Back / forward |
| Alt+1 … Alt+9 | Switch to tab N |
| Ctrl/Cmd+L | Focus the address box |

## Limits

Heavy web apps (YouTube, Google Docs, Discord) can break in places because
Ultraviolet's rewriting doesn't cover every browser API. Sites with aggressive
bot detection (Google search, Cloudflare challenges) may block or challenge the
proxy.
