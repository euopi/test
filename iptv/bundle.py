"""Bundle the app into one self-contained file, IPTV.html, with the styles,
channel list, player code and hls.js all inlined. Run build_data.py first if
you want fresh channels."""

import os
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
HLS = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js"


def read(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return f.read()


def script(code):
    # a literal "</script" inside inlined JS would end the tag early
    return "<script>" + code.replace("</script", "<\\/script") + "</script>"


html = read("index.html")
with urllib.request.urlopen(HLS, timeout=60) as r:
    hls = r.read().decode("utf-8")

html = html.replace('<link rel="stylesheet" href="style.css">', "<style>" + read("style.css") + "</style>")
html = html.replace(f'<script src="{HLS}"></script>', script(hls))
html = html.replace('<script src="data/channels.js"></script>', script(read("data/channels.js")))
html = html.replace('<script src="app.js"></script>', script(read("app.js")))

out = os.path.join(HERE, "IPTV.html")
with open(out, "w", encoding="utf-8") as f:
    f.write(html)
print(f"wrote {out} ({os.path.getsize(out) / 1e6:.1f} MB)")
