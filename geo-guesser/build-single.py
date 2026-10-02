"""Inline every local script into one self-contained HTML file: atlas-drill.html."""
import pathlib, re

root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text(encoding="utf-8")

def inline(m):
    src = (root / m.group(1)).read_text(encoding="utf-8").replace("</script", "<\\/script")
    return f"<script>\n{src}\n</script>"

out = re.sub(r'<script src="([^"]+)"></script>', inline, html)
(root / "atlas-drill.html").write_text(out, encoding="utf-8")
print(f"atlas-drill.html: {len(out.encode()) / 1e6:.1f} MB")
