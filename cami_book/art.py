"""Reusable flat-vector SVG characters and props for "Cami the Chameleon".

Every character is drawn in local coordinates with (0, 0) at the ground,
centred under the body, and placed on a page with place().
"""
import colorsys
import itertools
import math

_ids = itertools.count(1)


def uid(prefix="id"):
    return f"{prefix}{next(_ids)}"


# ---------------------------------------------------------------- colour utils
def _rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def _hex(r, g, b):
    return "#%02X%02X%02X" % tuple(max(0, min(255, round(v * 255))) for v in (r, g, b))


def shade(color, amt):
    """amt > 0 lightens, amt < 0 darkens (in HLS lightness)."""
    h, l, s = colorsys.rgb_to_hls(*_rgb(color))
    l = l + (1 - l) * amt if amt > 0 else l * (1 + amt)
    return _hex(*colorsys.hls_to_rgb(h, l, s))


def mix(c1, c2, t):
    a, b = _rgb(c1), _rgb(c2)
    return _hex(*(x + (y - x) * t for x, y in zip(a, b)))


INK = "#3B2F4A"
BLUSH = "#FF8FA3"
PINK = "#F27BB8"
CAMI_GREEN = "#5DC26A"
GRANDMA = "#7FB7A8"
GREY = "#A3A3A8"


# ------------------------------------------------------------------- helpers
def path(d, fill, stroke=None, sw=6, extra=""):
    s = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"' if stroke else ""
    return f'<path d="{d}" fill="{fill}"{s} {extra}/>'


def circle(x, y, r, fill, stroke=None, sw=6, extra=""):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}"{s} {extra}/>'


def ellipse(x, y, rx, ry, fill, stroke=None, sw=6, rot=0, extra=""):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    t = f' transform="rotate({rot} {x} {y})"' if rot else ""
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}"{s}{t} {extra}/>'


def line(x1, y1, x2, y2, stroke, sw, extra=""):
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" '
            f'stroke-width="{sw}" stroke-linecap="round" {extra}/>')


def stroke_path(d, stroke, sw, extra=""):
    return (f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" {extra}/>')


def outlined_stroke(d, color, outline, w, ow=6):
    """A thick rounded stroke with an outline (tails, limbs)."""
    return stroke_path(d, outline, w + 2 * ow) + stroke_path(d, color, w)


def place(svg, x, y, s=1.0, flip=False, shadow=True, shadow_w=150, rot=0):
    sx = -s if flip else s
    sh = ""
    if shadow:
        sh = ellipse(x, y + 4 * s, shadow_w * s, 16 * s, "#000", extra='opacity="0.13"')
    r = f" rotate({rot})" if rot else ""
    return f'{sh}<g transform="translate({x},{y}) scale({sx},{s}){r}">{svg}</g>'


def eye_dot(x, y, r=9, look=(0, 0)):
    """Shiny black cartoon eye used by every non-chameleon animal."""
    x2, y2 = x + look[0] * r * 0.25, y + look[1] * r * 0.25
    return (ellipse(x2, y2, r, r * 1.15, INK) + circle(x2 - r * 0.35, y2 - r * 0.45, r * 0.38, "#fff")
            + circle(x2 + r * 0.35, y2 + r * 0.35, r * 0.17, "#fff"))


def blush(x, y, r=11):
    return ellipse(x, y, r * 1.25, r * 0.8, BLUSH, extra='opacity="0.6"')


def mouth(kind, x, y, w=24, color=INK):
    if kind == "smile":
        return stroke_path(f"M{x - w},{y} Q{x},{y + w * 0.9} {x + w},{y}", color, 5)
    if kind == "w":  # little "w" cat-mouth
        return stroke_path(f"M{x - w},{y - 2} Q{x - w / 2},{y + w * 0.6} {x},{y - 2} "
                           f"Q{x + w / 2},{y + w * 0.6} {x + w},{y - 2}", color, 5)
    if kind == "open":  # talking
        return (path(f"M{x - w},{y - 3} Q{x},{y + w * 1.3} {x + w},{y - 3} Q{x},{y + w * 0.15} {x - w},{y - 3} Z",
                     INK, color, 4)
                + ellipse(x, y + w * 0.55, w * 0.45, w * 0.22, "#F2788F"))
    if kind == "sad":
        return stroke_path(f"M{x - w * 0.7},{y + 6} Q{x},{y - w * 0.4} {x + w * 0.7},{y + 6}", color, 5)
    if kind == "o":
        return ellipse(x, y + 4, w * 0.35, w * 0.45, INK)
    return ""


# ------------------------------------------------------------------ CHAMELEON
BODY_D = ("M-105,-105 C-105,-160 -45,-185 15,-182 C75,-179 105,-150 105,-110 "
          "C105,-72 65,-58 0,-58 C-65,-58 -105,-68 -105,-105 Z")
HEAD_D = ("M45,-140 C38,-200 66,-250 98,-254 C140,-250 196,-214 206,-162 "
          "C213,-118 184,-92 142,-92 C92,-92 52,-102 45,-140 Z")
EYE = (130, -172)


def chameleon(color=CAMI_GREEN, expr="happy", look=(1, 0), grandma=False, patches=None,
              reach=False, sparkles=False, swirl=False, sweat=False, crayon="#F2546B"):
    """Cami (and Grandma). Same drawing every time; only colour/expression change."""
    defs = ""
    D = shade(color, -0.42)
    L = shade(color, 0.35)
    M = shade(color, -0.12)
    S = shade(color, 0.18)  # pattern spots
    fill = color
    if patches:
        gid = uid("pg")
        n = len(patches)
        stops = "".join(f'<stop offset="{i / n:.3f}" stop-color="{c}"/><stop offset="{(i + 1) / n:.3f}" stop-color="{c}"/>'
                        for i, c in enumerate(patches))
        defs += (f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="-190" y1="-60" x2="200" y2="-200">'
                 f'{stops}</linearGradient>')
        fill = f"url(#{gid})"
        D, L, M, S = "#5A4A6E", "#FFFFFF", fill, "#FFFFFF"
    bclip, hclip, eclip = uid("bc"), uid("hc"), uid("ec")
    ex, ey = EYE
    defs += (f'<clipPath id="{bclip}"><path d="{BODY_D}"/></clipPath>'
             f'<clipPath id="{hclip}"><path d="{HEAD_D}"/></clipPath>'
             f'<clipPath id="{eclip}"><circle cx="{ex}" cy="{ey}" r="27"/></clipPath>')
    o = [f"<defs>{defs}</defs>"]

    def leg(x, col, reach_to=None):
        if reach_to:
            x2, y2 = reach_to
        else:
            x2, y2 = x + 6, -22
        part = stroke_path(f"M{x},-95 L{x2},{y2}", D, 34)
        if reach_to:
            part += ellipse(x2 + 6, y2, 16, 14, col, D, 6)
        else:
            part += ellipse(x2 + 8, -13, 23, 13, col, D, 6)
        part += stroke_path(f"M{x},-95 L{x2},{y2}", col, 22)
        return part

    # far legs (slightly darker for depth)
    o.append(leg(-35, M) + leg(82, M))
    # curly tail
    tail_a = "M-92,-112 C-150,-118 -196,-92 -194,-52"
    tail_b = "M-194,-52 C-192,-14 -158,-2 -140,-20 C-124,-36 -134,-62 -156,-60 C-172,-58 -172,-38 -158,-36"
    o.append(stroke_path(tail_a, D, 44) + stroke_path(tail_b, D, 34)
             + stroke_path(tail_a, fill, 32) + stroke_path(tail_b, fill, 22))
    # back ridge bumps
    for (bx, by) in [(-82, -150), (-57, -168), (-28, -178), (2, -182), (32, -180)]:
        o.append(circle(bx, by - 4, 10, M, D, 5))
    # body + belly + spots
    o.append(path(BODY_D, fill, D, 6))
    belly = path("M-120,-88 C-60,-50 60,-50 120,-96 L120,-40 L-120,-40 Z", L, extra='opacity="0.85"')
    spots = "".join(circle(x, y, r, S, extra='opacity="0.75"') for x, y, r in
                    [(-58, -132, 13), (-20, -150, 9), (18, -128, 15), (-80, -112, 7), (55, -150, 8)])
    if patches:
        spots = "".join(circle(x, y, r, "#fff", extra='opacity="0.35"') for x, y, r in
                        [(-58, -132, 13), (18, -128, 15), (55, -150, 8)])
    o.append(f'<g clip-path="url(#{bclip})">{belly}{spots}</g>')
    o.append(path(BODY_D, "none", D, 6))
    if swirl:  # stomach "turn and twist"
        o.append(stroke_path("M-10,-100 C-10,-118 14,-120 16,-104 C18,-88 -8,-84 -14,-100 "
                             "C-20,-122 10,-136 28,-120 C44,-104 34,-80 10,-76", "#7A4FA0", 5))
    # near legs
    o.append(leg(-70, fill))
    if reach:
        o.append(leg(45, fill, reach_to=(128, -42)))
        # crayon held in the hand
        o.append(f'<g transform="translate(140,-46) rotate(55)">'
                 + path("M-8,-34 L8,-34 L8,10 L-8,10 Z", crayon, D, 4)
                 + path("M-8,10 L8,10 L0,26 Z", crayon, D, 4)
                 + path("M-8,-20 L8,-20 L8,-12 L-8,-12 Z", "#fff", None, extra='opacity="0.7"') + "</g>")
    else:
        o.append(leg(45, fill))
    # head
    o.append(path(HEAD_D, fill, D, 6))
    hspots = "".join(circle(x, y, r, S, extra='opacity="0.75"') for x, y, r in [(82, -228, 8), (100, -212, 6), (66, -200, 6)])
    jaw = path("M40,-112 C90,-96 170,-96 215,-128 L215,-80 L40,-80 Z", L, extra='opacity="0.85"')
    if patches:
        hspots = ""
    o.append(f'<g clip-path="url(#{hclip})">{jaw}{hspots}</g>')
    o.append(path(HEAD_D, "none", D, 6))
    o.append(circle(197, -170, 3.5, D))  # nostril
    # turret eye
    o.append(circle(ex, ey, 40, fill, D, 6))
    o.append(circle(ex, ey, 33, "none", S if not patches else "#fff", 4, extra='opacity="0.8"'))
    lx, ly = look
    px, py = ex + lx * 7, ey + ly * 7
    eye_in = (circle(ex, ey, 27, "#fff") + circle(px, py, 16, INK)
              + circle(px - 6, py - 6, 6, "#fff") + circle(px + 5, py + 5, 2.6, "#fff"))
    lid = ""
    if grandma:
        lid = (path(f"M{ex - 35},{ey - 40} L{ex + 35},{ey - 40} L{ex + 35},{ey - 9} L{ex - 35},{ey - 9} Z", fill)
               + line(ex - 30, ey - 9, ex + 30, ey - 9, D, 5))
    elif expr in ("sad", "grey"):
        lid = (path(f"M{ex - 35},{ey - 40} L{ex + 35},{ey - 40} L{ex + 35},{ey - 16} L{ex - 35},{ey + 0} Z", fill)
               + line(ex - 30, ey + 0, ex + 30, ey - 14, D, 5))
    o.append(f'<g clip-path="url(#{eclip})">{eye_in}{lid}</g>')
    o.append(circle(ex, ey, 27, "none", D, 4))
    # brows for worried / sad looks
    if expr in ("worried", "sad", "grey", "think"):
        o.append(stroke_path(f"M{ex - 26},{ey - 50} Q{ex},{ey - 58} {ex + 24},{ey - 70}", D, 6))
    if expr == "surprised":
        o.append(stroke_path(f"M{ex - 24},{ey - 58} Q{ex},{ey - 72} {ex + 24},{ey - 60}", D, 6))
    # mouth
    mx, my = 168, -116
    if expr == "happy":
        o.append(stroke_path(f"M{mx - 14},{my - 2} Q{mx + 10},{my + 14} {mx + 34},{my - 12}", D, 5))
    elif expr == "big":
        o.append(path(f"M{mx - 16},{my - 4} Q{mx + 10},{my + 26} {mx + 36},{my - 14} Q{mx + 10},{my + 2} {mx - 16},{my - 4} Z",
                      INK, D, 4))
        o.append(ellipse(mx + 10, my + 8, 9, 4.5, "#F2788F"))
    elif expr in ("sad", "grey"):
        o.append(stroke_path(f"M{mx - 8},{my + 4} Q{mx + 12},{my - 10} {mx + 32},{my + 2}", D, 5))
    elif expr in ("worried", "think"):
        o.append(stroke_path(f"M{mx - 10},{my} q8,-7 15,0 q8,7 15,0 q7,-7 12,-4", D, 5))
    elif expr == "surprised":
        o.append(ellipse(mx + 14, my - 2, 9, 11, INK, D, 3))
    elif expr == "calm":
        o.append(stroke_path(f"M{mx - 6},{my} Q{mx + 12},{my + 8} {mx + 30},{my - 8}", D, 5))
    if expr not in ("grey",):
        o.append(blush(150, -116, 10))
    if grandma:
        # round reading glasses + wrinkle lines + a knitted shawl
        o.append(circle(ex, ey, 44, "none", "#8B5A2B", 6))
        o.append(stroke_path(f"M{ex - 44},{ey - 4} L{ex - 92},{ey - 14}", "#8B5A2B", 5))
        o.append(stroke_path(f"M{ex + 42},{ey + 8} Q{ex + 56},{ey + 2} {ex + 66},{ey + 6}", "#8B5A2B", 5))
        o.append(stroke_path("M194,-118 q6,6 12,4", D, 4))
        shawl = ("M78,-150 C60,-196 -20,-206 -72,-168 C-82,-160 -84,-150 -80,-140 "
                 "Q-66,-120 -50,-136 Q-34,-112 -18,-130 Q-2,-106 14,-124 Q30,-100 46,-118 Q60,-96 74,-112 Z")
        for k, fx in enumerate((-50, -18, 14, 46)):
            fy = (-130, -124, -118, -112)[k] + 12
            o.append(stroke_path(f"M{fx},{fy} l-2,16 M{fx + 6},{fy} l0,16", "#6E3A78", 4))
        o.append(path(shawl, "#B06BB8", "#6E3A78", 6))
        for (dx, dy) in [(-50, -160), (-20, -172), (12, -176), (44, -170), (-34, -142), (0, -150), (32, -146), (62, -140)]:
            o.append(circle(dx, dy, 5, "#F3C6F0"))
        # flower on her casque
        for a in range(0, 360, 72):
            o.append(circle(96 + 13 * math.cos(math.radians(a)), -256 + 13 * math.sin(math.radians(a)), 10, "#FFB3C7", "#D46A8A", 3))
        o.append(circle(96, -256, 8, "#FFD54A", "#C99A16", 3))
    if sweat:
        o.append(path("M222,-224 C214,-206 210,-196 218,-190 C226,-184 236,-192 232,-204 Z", "#8FD3F4", "#3E87B5", 4))
    if sparkles:
        for (sx, sy, r) in [(-40, -150, 10), (20, -120, 7), (80, -230, 8), (-70, -100, 6)]:
            o.append(star4(sx, sy, r, "#FFFFFF", opacity=0.9))
    return "".join(o)


# ----------------------------------------------------------------- FRIENDS
def frog(color="#6CC24A", expr="smile", look=(0, 0)):
    D, L = shade(color, -0.45), shade(color, 0.45)
    o = [ellipse(-74, -34, 48, 32, shade(color, -0.08), D, 6), ellipse(74, -34, 48, 32, shade(color, -0.08), D, 6)]
    o.append(path("M-85,-28 C-95,-110 -70,-150 0,-150 C70,-150 95,-110 85,-28 C80,-4 -80,-4 -85,-28 Z", color, D, 6))
    o.append(ellipse(0, -52, 52, 40, L))
    for sx in (-1, 1):
        o.append(circle(sx * 46, -150, 33, color, D, 6))
        o.append(circle(sx * 46, -152, 23, "#fff"))
        o.append(eye_dot(sx * 46, -152, 13, look))
        for k in (-1, 0, 1):
            o.append(circle(sx * 36 + k * 11, -8, 8, color, D, 4))
        o.append(ellipse(sx * 36, -16, 22, 11, color))
    o.append(mouth("smile" if expr != "open" else "open", 0, -104, 42 if expr != "open" else 20, D))
    o.append(blush(-60, -100, 12) + blush(60, -100, 12))
    return "".join(o)


def monkey(color="#9C6B3F", face="#F0D1A6", expr="smile", look=(0, 0), wave=False):
    D = shade(color, -0.45)
    o = [outlined_stroke("M48,-60 C118,-58 132,-138 98,-160 C74,-176 58,-150 78,-140", color, D, 18)]
    o.append(ellipse(-34, -14, 30, 17, color, D, 6) + ellipse(34, -14, 30, 17, color, D, 6))
    o.append(ellipse(0, -82, 60, 68, color, D, 6))
    o.append(ellipse(0, -76, 38, 46, face))
    o.append(outlined_stroke("M-50,-118 L-64,-58", color, D, 24) + circle(-64, -52, 15, face, D, 5))
    if wave:
        o.append(outlined_stroke("M50,-118 L88,-170", color, D, 24) + circle(92, -178, 15, face, D, 5))
    else:
        o.append(outlined_stroke("M50,-118 L64,-58", color, D, 24) + circle(64, -52, 15, face, D, 5))
    o.append(circle(-64, -186, 25, color, D, 6) + circle(-64, -186, 13, face))
    o.append(circle(64, -186, 25, color, D, 6) + circle(64, -186, 13, face))
    o.append(circle(0, -190, 62, color, D, 6))
    o.append(stroke_path("M-6,-250 C-2,-268 18,-266 14,-252", D, 5))
    o.append(circle(-21, -198, 26, face) + circle(21, -198, 26, face) + ellipse(0, -166, 42, 29, face))
    o.append(eye_dot(-21, -200, 9, look) + eye_dot(21, -200, 9, look))
    o.append(circle(-6, -176, 3, D) + circle(6, -176, 3, D))
    o.append(mouth("open" if expr == "open" else "smile", 0, -162, 18 if expr != "open" else 14, D))
    o.append(blush(-40, -168, 9) + blush(40, -168, 9))
    return "".join(o)


GOLD = "#E3A845"


def dog(color=GOLD, collar="#E8505B", expr="smile", look=(0, 0), tongue=True):
    D, L, Dk = shade(color, -0.48), shade(color, 0.55), shade(color, -0.15)
    o = [path("M52,-40 C100,-50 128,-90 120,-130 C108,-100 82,-80 50,-74 Z", Dk, D, 6)]  # fluffy tail
    o.append(ellipse(-52, -30, 36, 30, color, D, 6) + ellipse(52, -30, 36, 30, color, D, 6))
    o.append(path("M-62,-12 C-80,-92 -55,-160 0,-160 C55,-160 80,-92 62,-12 C40,0 -40,0 -62,-12 Z", color, D, 6))
    o.append(path("M-30,-140 C-40,-110 -32,-80 0,-66 C32,-80 40,-110 30,-140 Z", L))
    for sx in (-1, 1):
        o.append(stroke_path(f"M{sx * 30},-100 L{sx * 30},-18", D, 36) + ellipse(sx * 30, -11, 22, 13, L, D, 5)
                 + stroke_path(f"M{sx * 30},-100 L{sx * 30},-18", color, 24))
    o.append(path("M-48,-150 Q0,-128 48,-150 L46,-136 Q0,-114 -46,-136 Z", collar, shade(collar, -0.4), 4))
    o.append(circle(0, -122, 9, "#F7D046", "#B88A16", 3))
    o.append(ellipse(0, -202, 62, 56, color, D, 6))
    o.append(ellipse(-60, -192, 22, 46, Dk, D, 6, rot=18) + ellipse(60, -192, 22, 46, Dk, D, 6, rot=-18))
    o.append(ellipse(0, -176, 34, 25, L))
    o.append(eye_dot(-24, -212, 9, look) + eye_dot(24, -212, 9, look))
    o.append(stroke_path("M-34,-232 q8,-6 16,-2", D, 4) + stroke_path("M34,-232 q-8,-6 -16,-2", D, 4))
    o.append(path("M-12,-190 Q0,-197 12,-190 Q12,-180 0,-176 Q-12,-180 -12,-190 Z", INK))
    if expr == "open":
        o.append(mouth("open", 0, -164, 14, D))
    else:
        o.append(stroke_path("M0,-176 L0,-168 M-16,-166 Q-8,-158 0,-168 Q8,-158 16,-166", D, 4))
        if tongue:
            o.append(path("M-7,-163 Q0,-146 7,-163 Z", "#F2788F", "#C24C66", 3))
    o.append(blush(-40, -182, 9) + blush(40, -182, 9))
    return "".join(o)


def bunny(color="#EADFF2", inner="#F9B8C8", expr="smile", look=(0, 0)):
    D = "#7A6890"
    o = [circle(46, -46, 16, "#fff", D, 5)]
    o.append(ellipse(-22, -232, 17, 52, color, D, 6, rot=-10) + ellipse(-22, -230, 8, 38, inner, rot=-10))
    o.append(ellipse(22, -232, 17, 52, color, D, 6, rot=12) + ellipse(22, -230, 8, 38, inner, rot=12))
    o.append(ellipse(0, -62, 52, 58, color, D, 6))
    o.append(ellipse(0, -56, 32, 38, "#fff"))
    o.append(ellipse(-30, -10, 26, 13, color, D, 5) + ellipse(30, -10, 26, 13, color, D, 5))
    o.append(ellipse(-44, -82, 14, 22, color, D, 5) + ellipse(44, -82, 14, 22, color, D, 5))
    o.append(circle(0, -148, 52, color, D, 6))
    o.append(eye_dot(-20, -154, 8, look) + eye_dot(20, -154, 8, look))
    o.append(path("M-7,-136 L7,-136 L0,-128 Z", inner, "#D96C8A", 3))
    o.append(mouth("open" if expr == "open" else "w", 0, -126, 10, D))
    o.append(blush(-34, -132, 9) + blush(34, -132, 9))
    return "".join(o)


# --------------------------------------------------------------- GROWN-UPS
def elephant(color="#9DB0C8", expr="open", look=(0, 0)):
    D, L = shade(color, -0.45), shade(color, 0.4)
    o = []
    for sx in (-1, 1):
        o.append(ellipse(sx * 96, -238, 62, 72, color, D, 6) + ellipse(sx * 96, -236, 40, 50, "#F4C3CF"))
    o.append(path("M-88,-20 C-98,-150 -60,-196 0,-196 C60,-196 98,-150 88,-20 C60,-4 -60,-4 -88,-20 Z", color, D, 6))
    for sx in (-1, 1):
        o.append(path(f"M{sx * 50 - 26},-70 L{sx * 50 - 26},-6 Q{sx * 50},4 {sx * 50 + 26},-6 L{sx * 50 + 26},-70 Z", color, D, 6))
        for k in (-1, 0, 1):
            o.append(ellipse(sx * 50 + k * 13, -8, 6, 5, L))
    o.append(circle(0, -248, 72, color, D, 6))
    o.append(eye_dot(-30, -262, 10, look) + eye_dot(30, -262, 10, look))
    o.append(outlined_stroke("M0,-232 C0,-190 18,-168 48,-176 C62,-180 66,-198 58,-206", color, D, 30))
    o.append(stroke_path("M4,-214 l14,2 M8,-196 l14,-2", D, 3))
    o.append(mouth(expr, -34, -206, 13, D))
    o.append(blush(-52, -224, 11) + blush(52, -224, 11))
    # bow tie
    o.append(path("M-30,-168 L0,-156 L-30,-142 Z M30,-168 L0,-156 L30,-142 Z", "#3F7FD1", "#244E85", 4)
             + circle(0, -156, 7, "#3F7FD1", "#244E85", 4))
    return "".join(o)


def bear(color="#A8754A", expr="open", look=(0, 0), tie="#E8505B"):
    D, L = shade(color, -0.48), shade(color, 0.45)
    o = [ellipse(-40, -16, 38, 22, color, D, 6) + ellipse(40, -16, 38, 22, color, D, 6)]
    o.append(ellipse(0, -110, 82, 96, color, D, 6))
    o.append(ellipse(0, -96, 52, 60, L))
    o.append(path("M-12,-176 L12,-176 L18,-100 L0,-82 L-18,-100 Z", tie, shade(tie, -0.4), 4))
    o.append(outlined_stroke("M-70,-150 L-84,-80", color, D, 30) + circle(-86, -72, 18, color, D, 5))
    o.append(outlined_stroke("M68,-150 L112,-200", color, D, 30) + circle(116, -206, 18, color, D, 5))
    o.append(circle(-50, -282, 23, color, D, 6) + circle(-50, -282, 12, L))
    o.append(circle(50, -282, 23, color, D, 6) + circle(50, -282, 12, L))
    o.append(circle(0, -236, 66, color, D, 6))
    o.append(ellipse(0, -212, 32, 24, L))
    o.append(eye_dot(-26, -248, 9, look) + eye_dot(26, -248, 9, look))
    o.append(ellipse(0, -224, 11, 8, INK))
    o.append(mouth(expr, 0, -206, 13, D))
    o.append(blush(-44, -222, 10) + blush(44, -222, 10))
    return "".join(o)


def giraffe(color="#F2C14E", spot="#C9822F", expr="open", look=(0, 0)):
    D = shade(color, -0.5)
    o = []
    for x in (-52, 52):
        o.append(path(f"M{x - 11},-170 L{x - 11},-8 Q{x},2 {x + 11},-8 L{x + 11},-170 Z", shade(color, -0.08), D, 5))
        o.append(ellipse(x, -6, 13, 7, D))
    o.append(ellipse(0, -186, 78, 56, color, D, 6))
    for x in (-24, 24):
        o.append(path(f"M{x - 12},-170 L{x - 12},-8 Q{x},2 {x + 12},-8 L{x + 12},-170 Z", color, D, 5))
        o.append(ellipse(x, -6, 14, 7, D))
    o.append(path("M-22,-210 L-22,-372 L22,-372 L22,-210 Z", color, D, 6))
    clip = uid("gc")
    o.append(f'<defs><clipPath id="{clip}"><ellipse cx="0" cy="-186" rx="78" ry="56"/>'
             f'<rect x="-22" y="-372" width="44" height="170"/></clipPath></defs>')
    sp = "".join(path(f"M{x - 12},{y} q12,-14 24,-2 q6,14 -8,18 q-16,2 -16,-16 Z", spot)
                 for x, y in [(-50, -200), (-14, -214), (24, -196), (52, -186), (-30, -176), (6, -170),
                              (-6, -250), (8, -290), (-10, -330), (6, -360)])
    o.append(f'<g clip-path="url(#{clip})">{sp}</g>')
    o.append(path("M-22,-210 L-22,-372 M22,-372 L22,-210", "none", D, 6))
    for sx in (-1, 1):
        o.append(stroke_path(f"M{sx * 16},-420 L{sx * 20},-452", D, 7) + circle(sx * 20, -456, 9, spot, D, 4))
        o.append(ellipse(sx * 50, -410, 24, 11, color, D, 5, rot=sx * 18))
    o.append(ellipse(0, -398, 42, 46, color, D, 6))
    o.append(ellipse(0, -366, 34, 24, shade(color, 0.45), D, 5))
    o.append(circle(-10, -370, 3, D) + circle(10, -370, 3, D))
    o.append(eye_dot(-18, -408, 8, look) + eye_dot(18, -408, 8, look))
    o.append(stroke_path("M-28,-424 q8,-6 16,-2 M28,-424 q-8,-6 -16,-2", D, 4))
    o.append(mouth(expr, 0, -356, 10, D))
    o.append(blush(-34, -386, 8) + blush(34, -386, 8))
    # pearl necklace
    for k in range(-3, 4):
        o.append(circle(k * 7.5, -224 + abs(k) * -2, 5, "#fff", "#B9A8C9", 2))
    return "".join(o)


def owl(color="#8E6FB5", face="#F6E7C8", expr="open", look=(0, 0)):
    D = shade(color, -0.5)
    o = [path("M-58,-196 L-70,-238 L-30,-206 Z M58,-196 L70,-238 L30,-206 Z", color, D, 6)]
    o.append(ellipse(0, -108, 80, 104, color, D, 6))
    o.append(ellipse(0, -78, 48, 58, face))
    for k in range(3):
        for j in (-1, 0, 1):
            o.append(stroke_path(f"M{j * 22 - 7},{-104 + k * 22} q7,7 14,0", shade(face, -0.25), 4))
    o.append(ellipse(-78, -110, 22, 50, shade(color, -0.12), D, 6, rot=10)
             + ellipse(78, -110, 22, 50, shade(color, -0.12), D, 6, rot=-10))
    o.append(circle(-32, -158, 33, face, D, 5) + circle(32, -158, 33, face, D, 5))
    o.append(eye_dot(-32, -158, 15, look) + eye_dot(32, -158, 15, look))
    o.append(path("M-11,-138 L11,-138 L0,-118 Z", "#F2A541", "#B86F14", 4))
    for sx in (-1, 1):
        o.append(stroke_path(f"M{sx * 22},-6 l-8,8 M{sx * 22},-6 l0,10 M{sx * 22},-6 l8,8", "#E39433", 6))
    # half-moon glasses
    o.append(path("M-60,-160 Q-32,-128 -4,-160", "none", "#4A3A2A", 5) + path("M4,-160 Q32,-128 60,-160", "none", "#4A3A2A", 5))
    o.append(line(-60, -160, -4, -160, "#4A3A2A", 4) + line(4, -160, 60, -160, "#4A3A2A", 4))
    return "".join(o)


# ------------------------------------------------------------------- PROPS
def star4(x, y, r, color="#FFF6B0", opacity=1.0):
    k = r * 0.28
    d = (f"M{x},{y - r} Q{x + k},{y - k} {x + r},{y} Q{x + k},{y + k} {x},{y + r} "
         f"Q{x - k},{y + k} {x - r},{y} Q{x - k},{y - k} {x},{y - r} Z")
    return path(d, color, extra=f'opacity="{opacity}"')


def star5(x, y, r, color="#FFD54A", stroke="#D19A12", rot=0):
    pts = []
    for i in range(10):
        a = math.radians(-90 + i * 36 + rot)
        rr = r if i % 2 == 0 else r * 0.48
        pts.append(f"{x + rr * math.cos(a):.1f},{y + rr * math.sin(a):.1f}")
    return f'<polygon points="{" ".join(pts)}" fill="{color}" stroke="{stroke}" stroke-width="5" stroke-linejoin="round"/>'


def heart(x, y, s, color="#F25C8A", stroke=None):
    d = (f"M{x},{y + 0.9 * s} C{x - 1.4 * s},{y} {x - 1.0 * s},{y - 1.0 * s} {x},{y - 0.45 * s} "
         f"C{x + 1.0 * s},{y - 1.0 * s} {x + 1.4 * s},{y} {x},{y + 0.9 * s} Z")
    return path(d, color, stroke, 5)


def bolt(x, y, s, color="#FFD54A", stroke="#C98D10"):
    d = f"M{x + 0.2 * s},{y - s} L{x - 0.5 * s},{y + 0.1 * s} L{x},{y + 0.1 * s} L{x - 0.2 * s},{y + s} L{x + 0.5 * s},{y - 0.15 * s} L{x},{y - 0.15 * s} Z"
    return path(d, color, stroke, 5)


def cloud(x, y, s=1.0, color="#FFFFFF", opacity=1.0):
    parts = [(0, 0, 60), (55, -20, 50), (105, 5, 45), (-50, 10, 42), (40, 20, 50)]
    g = "".join(circle(x + dx * s, y + dy * s, r * s, color) for dx, dy, r in parts)
    return f'<g opacity="{opacity}">{g}</g>'


def sun(x, y, r=70):
    rays = "".join(line(x + math.cos(math.radians(a)) * (r + 18), y + math.sin(math.radians(a)) * (r + 18),
                        x + math.cos(math.radians(a)) * (r + 46), y + math.sin(math.radians(a)) * (r + 46),
                        "#FFD54A", 12) for a in range(0, 360, 30))
    return rays + circle(x, y, r, "#FFD54A") + circle(x, y, r * 0.8, "#FFE07A")


def tree(x, y, s=1.0, leaf="#5FAE58", trunk="#8A5A36"):
    D = shade(leaf, -0.35)
    g = (path("M-22,0 L-16,-150 L16,-150 L22,0 Z", trunk, shade(trunk, -0.4), 6)
         + circle(0, -210, 95, leaf, D, 6) + circle(-75, -160, 65, leaf, D, 6) + circle(75, -160, 65, leaf, D, 6)
         + circle(-75, -160, 59, leaf) + circle(0, -210, 89, leaf)
         + circle(-30, -240, 22, shade(leaf, 0.2)) + circle(40, -190, 16, shade(leaf, 0.2))
         + circle(-70, -170, 14, shade(leaf, 0.2)))
    return f'<g transform="translate({x},{y}) scale({s})">{g}</g>'


def bush(x, y, s=1.0, color="#4FA35A"):
    D = shade(color, -0.35)
    g = (circle(-50, -30, 45, color, D, 6) + circle(50, -30, 45, color, D, 6) + circle(0, -55, 55, color, D, 6)
         + circle(-50, -30, 39, color) + circle(50, -30, 39, color) + path("M-95,-10 L95,-10 L95,0 L-95,0 Z", color)
         + circle(-20, -70, 12, shade(color, 0.2)) + circle(40, -40, 9, shade(color, 0.2)))
    return f'<g transform="translate({x},{y}) scale({s})">{g}</g>'


def flower(x, y, s=1.0, petal="#FF8FB1", center="#FFD54A"):
    g = stroke_path("M0,0 L0,-40", "#3F8A4A", 6)
    for a in range(0, 360, 72):
        g += circle(math.cos(math.radians(a)) * 13, -48 + math.sin(math.radians(a)) * 13, 10, petal)
    g += circle(0, -48, 8, center)
    return f'<g transform="translate({x},{y}) scale({s})">{g}</g>'


def grass_tufts(y, color="#3F9A4E", n=14, seed=1, x0=0, x1=1920):
    import random
    rnd = random.Random(seed)
    o = ""
    for _ in range(n):
        x = rnd.uniform(x0, x1)
        yy = y + rnd.uniform(-20, 40)
        o += stroke_path(f"M{x - 12},{yy} q4,-22 0,-30 M{x},{yy} q0,-26 4,-38 M{x + 12},{yy} q-2,-20 6,-28", color, 5)
    return o


def rock(x, y, w, h, color="#9A9AA2", stroke=None):
    D = stroke or shade(color, -0.35)
    d = (f"M{x - w / 2},{y} C{x - w / 2},{y - h * 0.7} {x - w * 0.3},{y - h} {x - w * 0.05},{y - h} "
         f"C{x + w * 0.3},{y - h * 1.02} {x + w / 2},{y - h * 0.6} {x + w / 2},{y} Z")
    return (path(d, color, D, 6)
            + ellipse(x - w * 0.15, y - h * 0.68, w * 0.12, h * 0.1, shade(color, 0.25), rot=-20))


def leaf(x, y, length, angle, color="#3E9B57", vein=True):
    D = shade(color, -0.3)
    L = length
    d = f"M0,0 C{L * 0.3},{-L * 0.28} {L * 0.75},{-L * 0.25} {L},0 C{L * 0.75},{L * 0.25} {L * 0.3},{L * 0.28} 0,0 Z"
    v = stroke_path(f"M{L * 0.05},0 L{L * 0.85},0", D, 4) if vein else ""
    return f'<g transform="translate({x},{y}) rotate({angle})">{path(d, color, D, 5)}{v}</g>'


def lily_pad(x, y, rx, ry, color="#58B368"):
    D = shade(color, -0.35)
    d = (f"M{x},{y} L{x + rx * 0.9},{y - ry * 0.45} A{rx},{ry} 0 1 0 {x + rx * 0.98},{y + ry * 0.15} Z")
    return path(d, color, D, 6) + path(f"M{x},{y} L{x - rx * 0.6},{y - ry * 0.3} M{x},{y} L{x - rx * 0.5},{y + ry * 0.45}",
                                       "none", shade(color, -0.15), 4)


def speech_bubble(x, y, w, h, tail_to, content="", fill="#FFFFFF"):
    tx, ty = tail_to
    bx = x + w / 2
    d = (f"M{bx - 22},{y + h - 4} L{tx},{ty} L{bx + 22},{y + h - 4} Z")
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h / 2}" fill="{fill}" stroke="{INK}" stroke-width="5"/>'
            + path(d, fill, INK, 5)
            + f'<rect x="{bx - 20}" y="{y + h - 12}" width="40" height="14" fill="{fill}"/>' + content)


def thought_bubble(x, y, rx, ry, tail_to, content=""):
    tx, ty = tail_to
    o = ellipse(x, y, rx, ry, "#FFFFFF", INK, 5)
    for k, r in enumerate((16, 11, 7)):
        t = (k + 1) / 4
        o += circle(x + (tx - x) * (0.55 + t * 0.45), y + ry * 0.7 + (ty - y - ry * 0.7) * (0.3 + t * 0.7), r, "#fff", INK, 4)
    return o + content


def qmark(x, y, size, color="#7A4FA0"):
    return (f'<text x="{x}" y="{y}" font-family="DejaVu Sans" font-weight="bold" font-size="{size}" '
            f'fill="{color}" stroke="#fff" stroke-width="{size * 0.06}" paint-order="stroke" '
            f'text-anchor="middle">?</text>')


def raindrops(x0, y0, x1, y1, n=120, seed=3, color="#C9D6E8", opacity=0.75, length=40):
    import random
    rnd = random.Random(seed)
    o = ""
    for _ in range(n):
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        o += line(x, y, x - length * 0.25, y + length, color, 4, extra=f'opacity="{opacity}"')
    return o


def svg_doc(body, defs="", w=1920, h=1080):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<defs>{defs}</defs>{body}</svg>')


def vgrad(gid, top, bottom, x1=0, y1=0, x2=0, y2=1):
    return (f'<linearGradient id="{gid}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">'
            f'<stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient>')
