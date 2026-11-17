"""One function per page. Each returns a complete 1920x1080 SVG document."""
import math
import random

from art import *

W, H = 1920, 1080
RAINBOW = ["#F25C5C", "#F7A541", "#F7D046", "#5DC26A", "#4FA3E8", "#9B6BD6"]
PATCHY = ["#5DC26A", "#F27BB8", "#9C6B3F", "#4FA3E8", "#E3A845", "#9B6BD6"]


def sky(top, bottom, gid=None):
    gid = gid or uid("sky")
    return vgrad(gid, top, bottom), f'<rect width="{W}" height="{H}" fill="url(#{gid})"/>'


def hill(y, color, amp=40, phase=0, stroke=None):
    pts = [f"M0,{y}"]
    for i in range(1, 9):
        x = i * W / 8
        cy = y + math.sin(i * 1.3 + phase) * amp
        pts.append(f"Q{x - W / 16},{cy - amp} {x},{cy}")
    pts.append(f"L{W},{H} L0,{H} Z")
    return path(" ".join(pts), color, stroke, 6 if stroke else 0)


def confetti(n, seed, x0=0, x1=W, y0=0, y1=700):
    rnd = random.Random(seed)
    o = ""
    for _ in range(n):
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        c = rnd.choice(RAINBOW + [PINK])
        if rnd.random() < 0.5:
            o += f'<rect x="{x}" y="{y}" width="16" height="9" rx="3" fill="{c}" transform="rotate({rnd.uniform(0, 180)} {x} {y})"/>'
        else:
            o += circle(x, y, 6, c)
    return o


def paint_blob(x, y, r, color):
    d = (f"M{x - r},{y} C{x - r},{y - r * 1.2} {x + r * 0.2},{y - r * 1.25} {x + r * 0.9},{y - r * 0.5} "
         f"C{x + r * 1.3},{y + r * 0.1} {x + r * 0.6},{y + r} {x},{y + r * 0.95} C{x - r * 0.7},{y + r * 0.9} {x - r},{y + r * 0.5} {x - r},{y} Z")
    return path(d, color, shade(color, -0.35), 5) + circle(x - r * 0.35, y - r * 0.4, r * 0.2, "#fff", extra='opacity="0.6"')


def meadow(top="#BFE6FF", bottom="#EAF8FF", far="#9ED38A", near="#7CC36E", ground_y=640, sunpos=(1700, 150)):
    d, s = sky(top, bottom)
    b = s
    if sunpos:
        b += sun(*sunpos)
    b += cloud(320, 170, 1.0) + cloud(1180, 120, 0.8) + cloud(820, 250, 0.55, opacity=0.9)
    b += hill(ground_y - 90, far, 50, 0.3)
    b += hill(ground_y, near, 25, 1.7)
    return d, b


# ---------------------------------------------------------------------- pages
def cover():
    d, b = sky("#FFF4D6", "#CFEFF0")
    b += circle(960, 1150, 760, "#FFE9A8", extra='opacity="0.55"')
    # rainbow of colour dots arcing behind Cami
    for i, c in enumerate(RAINBOW + [PINK, "#9C6B3F", "#E3A845"]):
        a = math.radians(200 + i * 17.5)
        b += paint_blob(960 + 560 * math.cos(a), 900 + 430 * math.sin(a), 34, c)
    # hanging jungle leaves in the top corners
    for (x, y, l, a, c) in [(-20, 40, 260, 30, "#3E9B57"), (40, -10, 220, 60, "#57B26A"), (-30, 210, 200, 10, "#2F8A4C"),
                            (1940, 40, 260, 150, "#3E9B57"), (1880, -10, 220, 120, "#57B26A"), (1950, 210, 200, 170, "#2F8A4C")]:
        b += leaf(x, y, l, a, c)
    # branch
    b += path("M-20,905 C400,860 900,935 1300,880 C1600,840 1800,880 1940,870 L1940,925 C1800,935 1600,900 1300,940 "
              "C900,990 400,920 -20,965 Z", "#9A6640", "#5E3A20", 7)
    b += leaf(520, 905, 150, 110, "#4FA35A") + leaf(1400, 900, 170, 70, "#3E9B57") + leaf(1500, 885, 140, -30, "#57B26A")
    b += place(chameleon(CAMI_GREEN, "big", look=(0.4, 0.2)), 930, 895, 1.55, shadow=False)
    b += flower(240, 935, 1.2, "#F27BB8") + flower(1700, 900, 1.1, "#9B6BD6")
    return svg_doc(b, d)


def page1():
    d, b = meadow(ground_y=700)
    # big rainbow behind Cami
    for i, c in enumerate(RAINBOW):
        r = 560 - i * 34
        b += f'<path d="M{960 - r},740 A{r},{r} 0 0 1 {960 + r},740" fill="none" stroke="{c}" stroke-width="34"/>'
    b += cloud(420, 700, 1.1) + cloud(1500, 700, 1.1)
    b += hill(735, "#6DBB62", 18, 2.4)
    rnd = random.Random(7)
    for i, c in enumerate(RAINBOW + [PINK, "#9C6B3F"]):
        x = [180, 330, 1590, 1740, 260, 1660, 120, 1800][i]
        y = [330, 520, 330, 520, 690, 690, 600, 610][i]
        b += paint_blob(x, y, 38 + rnd.uniform(-6, 6), c)
    b += place(chameleon(CAMI_GREEN, "big", look=(0.2, -0.3), sparkles=True), 940, 760, 1.45)
    for (x, y, r) in [(700, 300, 26), (1240, 280, 22), (1300, 470, 16), (620, 480, 18)]:
        b += star4(x, y, r, "#FFFFFF")
    b += grass_tufts(790, "#4E9F4E", 16, seed=2)
    return svg_doc(b, d)


def page2():
    d, b = meadow("#CDE9FF", "#F2FAFF", "#A8D89A", "#86C878", ground_y=660, sunpos=None)
    b += tree(140, 620, 1.1) + tree(1800, 610, 1.0, "#6CB860")
    b += rock(960, 760, 240, 70, "#B9AFA3")
    # grown-ups crowding around, all talking to Cami
    b += place(giraffe(look=(0.6, 0.6)), 1500, 745, 1.15, shadow_w=110)
    b += place(elephant(look=(1, 0.5)), 470, 765, 1.05, shadow_w=120)
    b += place(bear(look=(-1, 0.5)), 1250, 775, 0.95, shadow_w=110)
    b += place(owl(look=(1, 0.4)), 720, 770, 0.85, shadow_w=90)
    b += place(chameleon(CAMI_GREEN, "big", look=(-0.2, -0.6)), 960, 705, 0.82, shadow=False)
    # speech bubbles with "superpower" pictures
    b += speech_bubble(300, 140, 200, 130, (430, 400), star5(400, 205, 46))
    b += speech_bubble(630, 290, 170, 110, (700, 520), bolt(715, 345, 38))
    b += speech_bubble(1010, 210, 200, 120, (1180, 470),
                       f'<g transform="translate(1110,270)">' + "".join(
                           f'<path d="M-62,32 A62,62 0 0 1 62,32" fill="none" stroke="{c}" stroke-width="10" transform="scale({1 - k * 0.17})"/>'
                           for k, c in enumerate(RAINBOW[:5])) + "</g>")
    b += speech_bubble(1590, 60, 200, 120, (1530, 300), star5(1650, 120, 36, rot=12) + star5(1730, 125, 26, "#F27BB8", "#B04480"))
    b += grass_tufts(830, "#5AAE5A", 14, seed=5)
    return svg_doc(b, d)


def pond_bg(water_y=560):
    d, b = sky("#BDE7F7", "#EFFBF6")
    b += cloud(260, 150, 0.9) + cloud(1500, 110, 1.0)
    b += hill(water_y - 120, "#8FCB7C", 40, 0.8)
    gid = uid("water")
    d += vgrad(gid, "#6CC3E0", "#3E8FC4")
    b += f'<rect x="0" y="{water_y}" width="{W}" height="{H - water_y}" fill="url(#{gid})"/>'
    b += path(f"M0,{water_y} Q480,{water_y - 22} 960,{water_y} T{W},{water_y} L{W},{water_y + 14} L0,{water_y + 14} Z", "#7BCB8A")
    for x in (80, 150, 1780, 1850, 1720):
        b += stroke_path(f"M{x},{water_y + 30} Q{x + 10},{water_y - 120} {x - 5},{water_y - 230}", "#4F9A4E", 9)
        b += ellipse(x - 4, water_y - 200, 13, 45, "#8A5A36", shade("#8A5A36", -0.4), 4)
    for (x, y) in [(400, 900), (1450, 960), (900, 1000), (300, 1040)]:
        b += ellipse(x, y, 120, 14, "#FFFFFF", extra='opacity="0.25"')
    return d, b


def page3():
    d, b = pond_bg()
    b += lily_pad(380, 760, 190, 60) + lily_pad(1000, 770, 230, 68, "#62BC6E") + lily_pad(1560, 740, 180, 56)
    b += lily_pad(700, 640, 120, 36, "#6CC27A") + lily_pad(1280, 640, 120, 36, "#6CC27A")
    b += flower(1660, 720, 0.9, "#FFB3D1") + flower(260, 740, 0.8, "#FFFFFF")
    b += place(frog(look=(1, 0)), 390, 740, 1.15, shadow=False)
    b += place(frog(look=(-1, 0)), 1560, 722, 1.1, shadow=False)
    b += place(frog("#7CCB5A", look=(0.5, 0.5)), 700, 630, 0.6, shadow=False)
    b += place(frog("#59B64F", look=(-0.5, 0.5)), 1280, 630, 0.6, shadow=False)
    b += place(chameleon(CAMI_GREEN, "big", look=(-0.2, 0)), 990, 755, 1.15, shadow=False)
    # dragonfly
    b += (ellipse(1150, 330, 40, 9, "#4FA3E8", "#2B6CA3", 4) + ellipse(1130, 312, 24, 10, "#DDF3FF", "#2B6CA3", 3, rot=-30)
          + ellipse(1160, 312, 24, 10, "#DDF3FF", "#2B6CA3", 3, rot=30) + circle(1192, 330, 10, "#4FA3E8", "#2B6CA3", 4))
    return svg_doc(b, d)


def jungle_bg():
    d, b = sky("#BFE8C8", "#E6F7DA")
    b += circle(960, 300, 420, "#F4FBD0", extra='opacity="0.6"')
    for x, w, c in [(120, 140, "#6B4A30"), (1700, 170, "#6B4A30"), (520, 90, "#7E5A3C"), (1350, 100, "#7E5A3C")]:
        b += path(f"M{x - w / 2},{H} L{x - w * 0.35},-20 L{x + w * 0.35},-20 L{x + w / 2},{H} Z", c, shade(c, -0.35), 6)
    rnd = random.Random(11)
    for _ in range(26):
        b += leaf(rnd.uniform(-50, W + 50), rnd.uniform(-60, 120), rnd.uniform(160, 260), rnd.uniform(40, 140),
                  rnd.choice(["#2F8A4C", "#3E9B57", "#57B26A", "#2A7A44"]))
    for x in (330, 820, 1120, 1560):
        b += stroke_path(f"M{x},-10 C{x + 40},140 {x - 40},260 {x + 10},{380 + (x % 7) * 20}", "#4E8F3A", 8)
        for k in range(4):
            b += leaf(x + (k % 2) * 10 - 5, 80 + k * 80, 50, 40 + (k % 2) * 100, "#5DB054", vein=False)
    b += path(f"M0,800 C500,760 1400,780 {W},760 L{W},{H} L0,{H} Z", "#5C9E45")
    for x in (60, 1860, 980):
        b += leaf(x, 840, 230, -70 if x < 900 else -110, "#2F8A4C") + leaf(x, 850, 200, -100 if x < 900 else -80, "#3E9B57")
    return d, b


def page4():
    d, b = jungle_bg()
    b += path("M-20,560 C400,520 900,590 1400,540 C1650,515 1800,540 1940,530 L1940,580 C1800,590 1650,565 1400,590 "
              "C900,640 400,570 -20,615 Z", "#8A5A36", "#523219", 7)
    b += leaf(700, 570, 120, 100, "#4FA35A") + leaf(1500, 545, 140, 60, "#3E9B57")
    b += place(monkey(look=(1, 0.5)), 520, 575, 0.95, shadow=False)
    b += place(monkey("#8B5E36", look=(-1, 0.5), wave=True), 1340, 568, 0.95, shadow=False)
    b += place(monkey("#A87447", look=(0, -0.6), expr="open"), 1650, 800, 0.85)
    b += place(chameleon("#9C6B3F", "big", look=(0.4, 0)), 930, 572, 1.05, shadow=False)
    # bananas
    for k in range(3):
        b += path(f"M{240 + k * 18},{760} q40,40 90,10 q-50,15 -90,-10 Z", "#F7D046", "#B88E10", 4)
    return svg_doc(b, d)


def yard_bg():
    d, b = meadow("#BFE6FF", "#F0FAFF", "#A6D98E", "#8CCB6E", ground_y=620, sunpos=(1720, 140))
    # picket fence
    for x in range(0, W + 60, 70):
        b += path(f"M{x},{560} L{x},{470} L{x + 22},{448} L{x + 44},{470} L{x + 44},{560} Z", "#FFFFFF", "#B9A89A", 4)
    b += f'<rect x="0" y="490" width="{W}" height="16" fill="#FFFFFF" stroke="#B9A89A" stroke-width="4"/>'
    b += hill(600, "#8CCB6E", 18, 0.4)
    # dog house
    b += path("M1460,620 L1460,470 L1580,380 L1700,470 L1700,620 Z", "#E8505B", "#8E2A33", 6)
    b += path("M1440,480 L1580,365 L1720,480", "none", "#6E3A78", 18)
    b += path("M1540,620 L1540,540 Q1580,500 1620,540 L1620,620 Z", "#5A3A2A")
    return d, b


def page5():
    d, b = yard_bg()
    b += place(dog(look=(0.6, 0.4), collar="#3F7FD1"), 420, 790, 1.2, shadow_w=110)
    b += place(dog("#D9973A", look=(-0.6, 0.4)), 1420, 790, 1.2, shadow_w=110)
    b += place(dog("#EDB85A", collar="#9B6BD6", look=(-0.3, 0.5)), 1150, 800, 0.72, shadow_w=90)
    b += place(chameleon(GOLD, "big", look=(0.3, 0)), 820, 790, 1.15)
    b += circle(1268, 772, 30, "#E8505B", "#8E2A33", 5) + stroke_path("M1242,760 Q1268,782 1294,760", "#fff", 5)
    b += grass_tufts(830, "#5AAE5A", 14, seed=8)
    b += flower(150, 680, 0.9, "#FF8FB1") + flower(1800, 690, 0.9, "#9B6BD6")
    return svg_doc(b, d)


def glitch_marks(cx, cy, seed):
    """Little coloured zig-zag sparks that flicker off Cami when her colours misfire."""
    o = ""
    spots = [(-330, -150, -150), (-250, -300, -120), (-60, -360, -95), (160, -360, -70), (290, -290, -40)]
    for i, (dx, dy, a) in enumerate(spots):
        c = PATCHY[i % len(PATCHY)]
        zz = f"M0,0 L18,-14 L30,8 L48,-10 L60,10 L78,-6"
        o += (f'<g transform="translate({cx + dx},{cy + dy}) rotate({a})">'
              + stroke_path(zz, "#FFFFFF", 18) + stroke_path(zz, c, 9) + "</g>")
    return o


def page6():
    d, b = meadow("#D3ECFF", "#F6FBFF", "#B4DE97", "#97CF78", ground_y=640, sunpos=(220, 150))
    b += tree(1780, 620, 0.95) + bush(160, 650, 1.0)
    b += place(frog(look=(1, -0.2), expr="open"), 270, 790, 1.0, shadow_w=100)
    b += place(bunny(look=(1, 0)), 480, 785, 1.0, shadow_w=70)
    b += place(monkey(look=(-1, 0), wave=True), 1400, 790, 0.95, shadow_w=80)
    b += place(dog("#EDB85A", collar="#9B6BD6", look=(-1, 0)), 1640, 790, 0.85, shadow_w=90)
    b += glitch_marks(980, 640, 4)
    b += place(chameleon(patches=PATCHY, expr="worried", look=(-0.6, -0.4), sweat=True), 940, 760, 1.25)
    b += qmark(1190, 250, 120, "#9B6BD6") + qmark(760, 230, 80, "#4FA3E8")
    return svg_doc(b, d)


def burst(cx, cy, c1, c2, n=24):
    o = f'<rect width="{W}" height="{H}" fill="{c1}"/>'
    for i in range(0, n, 2):
        a1, a2 = math.radians(i * 360 / n), math.radians((i + 1) * 360 / n)
        R = 2400
        o += f'<path d="M{cx},{cy} L{cx + R * math.cos(a1)},{cy + R * math.sin(a1)} L{cx + R * math.cos(a2)},{cy + R * math.sin(a2)} Z" fill="{c2}"/>'
    return o


def page7():
    b = burst(960, 430, "#FFD86B", "#FFC64A")
    b += circle(960, 430, 420, "#FFF3C4", extra='opacity="0.7"')
    b += place(chameleon(patches=PATCHY, expr="surprised", look=(0, -0.3)), 920, 720, 1.9, shadow=False)
    for (x, y, a) in [(470, 220, -30), (1480, 200, 30), (430, 520, -80), (1530, 520, 80)]:
        b += f'<g transform="translate({x},{y}) rotate({a})">' + stroke_path("M0,-40 L0,40", "#E8505B", 16) + "</g>"
    b += f'<g transform="translate(1340,220) rotate(12)"><rect x="-14" y="-90" width="28" height="110" rx="14" fill="#E8505B" stroke="{INK}" stroke-width="5"/>' \
         + circle(0, 52, 17, "#E8505B", INK, 5) + "</g>"
    return svg_doc(b, "")


def page8():
    gid = uid("bg")
    d = f'<radialGradient id="{gid}" cx="0.5" cy="0.45" r="0.75"><stop offset="0" stop-color="#E9DDF7"/><stop offset="1" stop-color="#A994CC"/></radialGradient>'
    b = f'<rect width="{W}" height="{H}" fill="url(#{gid})"/>'
    rnd = random.Random(21)
    for _ in range(9):
        x, y, r = rnd.uniform(100, 1820), rnd.uniform(80, 700), rnd.uniform(30, 60)
        b += stroke_path(f"M{x},{y} c{r},0 {r},{-r} 0,{-r} c{-r * 0.6},0 {-r * 0.6},{r * 0.6} 0,{r * 0.6}", "#FFFFFF", 6,
                         'opacity="0.55"')
    faded = [mix(c, "#B9B6C4", 0.45) for c in PATCHY]
    b += ellipse(960, 760, 360, 40, "#000", extra='opacity="0.12"')
    b += place(chameleon(patches=faded, expr="worried", look=(-0.3, 0.5), swirl=True, sweat=True), 930, 760, 1.6, shadow=False)
    b += qmark(420, 380, 220, "#7A4FA0") + qmark(1500, 330, 180, "#9B6BD6") + qmark(1650, 620, 110, "#B06BB8") + qmark(250, 650, 120, "#B06BB8")
    return svg_doc(b, d)


def room_bg(wall="#CFE3F5", floor="#C79A6B", stripes="#BCD6EE"):
    b = f'<rect width="{W}" height="{H}" fill="{wall}"/>'
    for x in range(0, W, 120):
        b += f'<rect x="{x}" y="0" width="60" height="700" fill="{stripes}" opacity="0.6"/>'
    b += f'<rect x="0" y="690" width="{W}" height="{H - 690}" fill="{floor}"/>'
    b += f'<rect x="0" y="680" width="{W}" height="22" fill="{shade(floor, -0.25)}"/>'
    for y in (780, 900, 1020):
        b += line(0, y, W, y, shade(floor, -0.15), 4)
    return b


def mirror(cx, cy, rx, ry, inner_svg, frame="#C9873A", glass="#E6F4FB"):
    clip = uid("mc")
    d = f'<clipPath id="{clip}"><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"/></clipPath>'
    o = (stroke_path(f"M{cx - rx * 0.6},{cy + ry} L{cx - rx * 0.8},{cy + ry + 230}", shade(frame, -0.3), 18)
         + stroke_path(f"M{cx + rx * 0.6},{cy + ry} L{cx + rx * 0.8},{cy + ry + 230}", shade(frame, -0.3), 18))
    o += ellipse(cx, cy, rx + 26, ry + 26, frame, shade(frame, -0.45), 6)
    o += ellipse(cx, cy, rx, ry, glass, shade(frame, -0.45), 5)
    o += f'<g clip-path="url(#{clip})">{inner_svg}' + \
         path(f"M{cx - rx},{cy - ry * 0.2} L{cx - rx * 0.2},{cy - ry} L{cx},{cy - ry} L{cx - rx},{cy + ry * 0.1} Z", "#FFFFFF",
              extra='opacity="0.45"') + "</g>"
    o += circle(cx, cy - ry - 26, 18, shade(frame, 0.2), shade(frame, -0.45), 5)
    return d, o


def page9():
    b = room_bg()
    b += f'<rect x="820" y="140" width="190" height="160" rx="14" fill="#FFFFFF" stroke="#8B5A2B" stroke-width="10"/>'
    b += sun(915, 220, 30)
    faded = [mix(c, "#C9C6D2", 0.5) for c in PATCHY]
    refl = place(chameleon(patches=faded, expr="think", look=(1, -0.2)), 1390, 680, 1.15, flip=True, shadow=False)
    d, m = mirror(1390, 450, 300, 330, f'<rect x="1000" y="0" width="800" height="900" fill="#DCEFF8"/>' + refl + qmark(1390, 260, 120, "#9B6BD6"))
    b += m
    b += place(chameleon(patches=faded, expr="think", look=(1, -0.2)), 640, 780, 1.25)
    b += thought_bubble(520, 230, 210, 120, (640, 470),
                        paint_blob(420, 230, 30, "#F27BB8") + paint_blob(510, 205, 30, "#4FA3E8") + paint_blob(610, 240, 30, "#5DC26A")
                        + qmark(520, 315, 70, INK))
    return svg_doc(b, d)


def page10():
    d, b = sky("#D7DDE6", "#EEF1F4")
    b += cloud(300, 160, 1.0, "#FFFFFF", 0.8) + cloud(1400, 120, 1.2, "#FFFFFF", 0.8)
    b += hill(560, "#B7C0B2", 40, 0.5)
    b += hill(660, "#A9B59F", 25, 2.1)
    for (x, y, w, h, c) in [(200, 760, 340, 220, "#9EA0A6"), (480, 790, 260, 150, "#A8A9AF"), (90, 800, 200, 110, "#B2B3B8"),
                            (700, 800, 180, 90, "#A3A4AA"), (1820, 790, 220, 130, "#9EA0A6")]:
        b += rock(x, y, w, h, c)
    b += place(chameleon("#A6A7AD", "grey", look=(1, 0)), 330, 588, 0.82, shadow=False)
    # friends walking past, looking ahead
    b += place(frog(look=(1, 0)), 1000, 785, 0.85, shadow_w=100)
    b += place(bunny(look=(1, 0)), 1200, 785, 0.9, shadow_w=70)
    b += place(monkey(look=(1, 0)), 1400, 790, 0.85, shadow_w=80)
    b += place(dog("#EDB85A", collar="#9B6BD6", look=(1, 0)), 1620, 790, 0.85, shadow_w=90)
    for x in (880, 1110, 1305, 1515):
        b += circle(x, 770, 16, "#FFFFFF", extra='opacity="0.75"') + circle(x - 26, 762, 11, "#FFFFFF", extra='opacity="0.6"') \
            + circle(x - 46, 754, 7, "#FFFFFF", extra='opacity="0.45"')
    return svg_doc(b, d)


def rain_bg(top="#5D6B80", bottom="#9AA6B6", heavy=True):
    d, b = sky(top, bottom)
    b += cloud(200, 90, 1.5, "#4A5568", 0.9) + cloud(800, 60, 1.7, "#4F5B6E", 0.9) + cloud(1500, 90, 1.6, "#4A5568", 0.9)
    b += hill(600, "#6E7C77", 30, 0.9)
    b += f'<rect x="0" y="690" width="{W}" height="{H - 690}" fill="#5F6B68"/>'
    for (x, y, rx) in [(400, 820, 200), (1300, 900, 260), (900, 780, 140), (1700, 800, 160)]:
        b += ellipse(x, y, rx, rx * 0.12, "#8A9AAF", extra='opacity="0.7"')
        b += ellipse(x, y, rx * 0.5, rx * 0.06, "none", "#C9D6E8", 3, extra='opacity="0.7"')
    return d, b


def page11():
    d, b = rain_bg()
    b += rock(1150, 760, 520, 300, "#7D8288") + rock(1450, 780, 260, 140, "#868A90") + rock(600, 770, 220, 110, "#80858B")
    b += place(chameleon("#8F9399", "grey", look=(-0.5, 0.5)), 1050, 503, 0.30, shadow=False)
    b += raindrops(0, -40, W, H, 260, seed=4, opacity=0.65)
    return svg_doc(b, d)


def umbrella(x, y, s=1.0, color="#F7A541"):
    D = shade(color, -0.45)
    g = path("M-220,0 A220,170 0 0 1 220,0 Q165,-22 110,0 Q55,-22 0,0 Q-55,-22 -110,0 Q-165,-22 -220,0 Z", color, D, 7)
    g += path("M0,-170 Q-50,-80 -110,0 M0,-170 Q50,-80 110,0", "none", D, 5)
    g += path("M0,-170 Q-90,-110 -165,-8 M0,-170 Q90,-110 165,-8", "none", shade(color, 0.3), 4)
    g += stroke_path("M0,-170 L0,-198", D, 10)
    return f'<g transform="translate({x},{y}) scale({s})">{g}</g>'


def page12():
    d, b = rain_bg("#7A879B", "#B9C3D0")
    b += rock(560, 770, 420, 230, "#7D8288") + rock(220, 790, 220, 120, "#868A90")
    b += place(chameleon("#8F9399", "grey", look=(1, -0.4)), 520, 545, 0.30, shadow=False)
    b += circle(1250, 520, 330, "#FFE8A8", extra='opacity="0.35"')
    b += raindrops(0, -40, W, H, 150, seed=6, opacity=0.55)
    b += place(chameleon(GRANDMA, "calm", look=(1, 0.6), grandma=True), 1300, 790, 1.15, flip=True)
    b += f'<g transform="rotate(-12 1330 600)">' + umbrella(1330, 330, 1.15, "#F7A541") \
        + stroke_path("M1330,330 L1330,600", "#6E3A20", 10) + "</g>"
    b += speech_bubble(760, 300, 170, 120, (1040, 610), qmark(845, 395, 90, "#7A4FA0"))
    return svg_doc(b, d)


def kitchen(cup_steam=True):
    b = f'<rect width="{W}" height="{H}" fill="#F7D9A8"/>'
    for x in range(0, W, 90):
        for y in range(0, 640, 90):
            b += circle(x + 45 + (y // 90 % 2) * 45, y + 45, 7, "#F2C98A")
    # window with rain outside
    b += f'<rect x="760" y="90" width="400" height="300" rx="20" fill="#8FA2B8" stroke="#8B5A2B" stroke-width="16"/>'
    b += raindrops(780, 100, 1140, 380, 40, seed=9, color="#D6E2F0", length=28)
    b += line(960, 98, 960, 382, "#8B5A2B", 12) + line(768, 240, 1152, 240, "#8B5A2B", 12)
    b += path("M730,80 Q820,240 760,400 L730,400 Z M1190,80 Q1100,240 1160,400 L1190,400 Z", "#E8505B", "#8E2A33", 5)
    # lamp glow and shelf
    b += circle(260, 120, 200, "#FFF6C8", extra='opacity="0.55"')
    b += path("M200,40 L320,40 L350,140 L170,140 Z", "#F7D046", "#B88E10", 6) + line(260, 0, 260, 40, INK, 6)
    b += f'<rect x="1450" y="200" width="360" height="22" fill="#A06A3E" stroke="#5E3A20" stroke-width="5"/>'
    for i, c in enumerate(["#4FA3E8", "#F27BB8", "#5DC26A"]):
        b += path(f"M{1490 + i * 110},200 l0,-60 q30,-20 60,0 l0,60 Z", c, shade(c, -0.4), 5)
    return b


def table_front(y=640):
    b = path(f"M-20,{y} L{W + 20},{y} L{W + 20},{H} L-20,{H} Z", "#FFFFFF")
    for x in range(-20, W + 20, 80):
        for k, yy in enumerate(range(y, H, 80)):
            if ((x + 20) // 80 + k) % 2 == 0:
                b += f'<rect x="{x}" y="{yy}" width="80" height="80" fill="#E8505B" opacity="0.85"/>'
    b += line(-20, y, W + 20, y, "#8E2A33", 8)
    return b


def teacup(x, y, s=1.0, color="#4FA3E8", steam=True):
    D = shade(color, -0.45)
    g = path("M-50,-70 L50,-70 Q48,-10 0,-6 Q-48,-10 -50,-70 Z", color, D, 6)
    g += path("M48,-58 q34,0 30,24 q-4,18 -34,10", "none", D, 8)
    g += ellipse(0, -2, 70, 12, "#FFFFFF", D, 5) + ellipse(0, -70, 50, 9, "#B5702F", D, 4)
    g += heart(0, -40, 12, "#FFFFFF")
    if steam:
        g += "".join(stroke_path(f"M{dx},-90 q-14,-20 0,-40 q14,-20 0,-40", "#FFFFFF", 6, 'opacity="0.85"') for dx in (-18, 18))
    return f'<g transform="translate({x},{y}) scale({s})">{g}</g>'


def teapot(x, y, s=1.0, color="#9B6BD6"):
    D = shade(color, -0.45)
    g = path("M-80,-60 Q-150,-90 -160,-150 Q-130,-110 -86,-100 Z", color, D, 6)
    g += path("M80,-120 q70,0 60,50 q-10,40 -60,30", "none", D, 12)
    g += ellipse(0, -80, 95, 80, color, D, 6)
    g += ellipse(0, -160, 50, 14, shade(color, -0.1), D, 5) + circle(0, -180, 12, shade(color, 0.3), D, 4)
    g += path("M-95,-80 Q0,-50 95,-80", "none", shade(color, 0.35), 8)
    for k in (-50, 0, 50):
        g += heart(k, -100, 10, "#FFFFFF")
    return f'<g transform="translate({x},{y}) scale({s})">{g}</g>'


def page13():
    b = kitchen()
    b += place(chameleon(GRANDMA, "calm", look=(1, 0.3), grandma=True), 1330, 700, 1.25, flip=True, shadow=False)
    b += place(chameleon("#A3A4AA", "sad", look=(0.5, 0.6)), 560, 690, 1.05, shadow=False)
    b += table_front(650)
    b += teacup(780, 720, 1.0, "#F27BB8") + teacup(1110, 720, 1.0, "#4FA3E8") + teapot(1500, 735, 0.95)
    return svg_doc(b, "")


def icon_bubble(x, y, r, inner):
    return circle(x, y, r, "#FFFFFF", INK, 5) + inner


def music_note(x, y, s=1.0, color="#9B6BD6"):
    return (ellipse(x - 14 * s, y + 24 * s, 16 * s, 12 * s, color, rot=-20) + line(x, y + 22 * s, x, y - 34 * s, color, 7 * s)
            + path(f"M{x},{y - 34 * s} q26,10 22,34 q-6,-16 -22,-18 Z", color))


def butterfly(x, y, s=1.0, c1="#F27BB8", c2="#9B6BD6"):
    g = (ellipse(-22, -14, 22, 18, c1, INK, 4) + ellipse(22, -14, 22, 18, c1, INK, 4)
         + ellipse(-16, 14, 15, 12, c2, INK, 4) + ellipse(16, 14, 15, 12, c2, INK, 4)
         + ellipse(0, 0, 6, 26, INK) + stroke_path("M-2,-24 q-8,-14 -16,-16 M2,-24 q8,-14 16,-16", INK, 3))
    return f'<g transform="translate({x},{y}) scale({s})">{g}</g>'


def paintbrush(x, y, s=1.0):
    g = (path("M-6,-50 L6,-50 L8,20 L-8,20 Z", "#C98A4A", "#6E4320", 4) + path("M-9,20 L9,20 L9,32 L-9,32 Z", "#B9B9C2", "#6E6E78", 3)
         + path("M-9,32 L9,32 Q12,52 0,64 Q-12,52 -9,32 Z", "#F27BB8", "#B04480", 4))
    return f'<g transform="translate({x},{y}) rotate(30) scale({s})">{g}</g>'


def page14():
    b = kitchen()
    b += place(chameleon(GRANDMA, "big", look=(1, 0), grandma=True), 1360, 700, 1.25, flip=True, shadow=False)
    b += place(chameleon("#ACA9B0", "calm", look=(0.6, -0.6)), 560, 690, 1.05, shadow=False)
    b += table_front(650)
    b += teacup(780, 720, 1.0, "#F27BB8", steam=False) + teacup(1110, 720, 1.0, "#4FA3E8", steam=False)
    # all the things that make Cami special
    items = [
        (960, 470, heart(960, 474, 34, "#F25C8A", "#A6234F")),
        (820, 340, star5(820, 342, 38)),
        (980, 260, music_note(984, 262, 1.1)),
        (1150, 330, paintbrush(1150, 320, 0.95)),
        (700, 180, butterfly(700, 182, 1.0)),
        (1190, 150, flower(1190, 185, 1.1, "#F27BB8")),
    ]
    for (x, y, g) in items:
        b += icon_bubble(x, y, 62, g)
    for (x, y, r) in [(1050, 520, 14), (1120, 560, 10), (870, 520, 8)]:
        b += circle(x, y, r, "#FFFFFF", INK, 4)
    return svg_doc(b, "")


def paper(x, y, w, h, rot, inner):
    return (f'<g transform="translate({x},{y}) rotate({rot})">'
            f'<rect x="{-w / 2 + 6}" y="{-h / 2 + 8}" width="{w}" height="{h}" rx="6" fill="#000" opacity="0.12"/>'
            f'<rect x="{-w / 2}" y="{-h / 2}" width="{w}" height="{h}" rx="6" fill="#FFFFFF" stroke="#C9C2D6" stroke-width="4"/>'
            f'{inner}</g>')


def strawberry(x, y, s=1.0):
    g = (path("M0,40 C-40,10 -40,-30 0,-30 C40,-30 40,10 0,40 Z", "#F25C5C", "#A6232F", 4)
         + path("M-20,-30 L0,-44 L20,-30 L0,-22 Z", "#5DC26A", "#2F7A3A", 3)
         + "".join(circle(dx, dy, 3, "#FFE07A") for dx, dy in [(-12, -8), (10, -6), (0, 10), (-6, 22), (14, 14)]))
    return f'<g transform="translate({x},{y}) scale({s})">{g}</g>'


def page15():
    b = room_bg("#F5E1F0", "#B98B66", "#EED2E7")
    # drawings pinned on the wall
    b += paper(260, 220, 220, 170, -6, sun(0, 0, 38))
    b += paper(560, 180, 200, 160, 4, butterfly(0, 0, 1.4))
    b += paper(1700, 210, 210, 170, 5, strawberry(0, 0, 1.3))
    b += paper(1420, 170, 190, 150, -5, music_note(0, 0, 1.4, "#4FA3E8"))
    for (x, y) in [(260, 140), (560, 104), (1700, 130), (1420, 98)]:
        b += circle(x, y, 9, "#E8505B", "#8E2A33", 3)
    b += ellipse(1020, 760, 640, 90, "#9B6BD6", extra='opacity="0.3"')
    # big drawing she's working on
    b += paper(1190, 650, 520, 230, 0, flower(-150, 70, 1.6, "#F27BB8") + heart(30, 0, 40, "#F25C8A") + star5(170, -10, 44)
               + butterfly(80, 70, 0.8, "#F7A541", "#4FA3E8"))
    b += place(chameleon(mix(GREY, PINK, 0.3), "happy", look=(0.6, 0.6), reach=True, crayon="#F27BB8"), 820, 770, 1.15, shadow_w=170)
    for i, c in enumerate(["#4FA3E8", "#5DC26A", "#F7D046", "#9B6BD6", "#F25C5C"]):
        b += (f'<g transform="translate({1520 + i * 44},{735 - (i % 2) * 14}) rotate({70 + i * 9})">'
              + path("M-9,-40 L9,-40 L9,24 L-9,24 Z", c, shade(c, -0.4), 4) + path("M-9,24 L9,24 L0,42 Z", c, shade(c, -0.4), 4) + "</g>")
    return svg_doc(b, "")


def page16():
    b = room_bg("#FDE3EF", "#C79A6B", "#F9D2E4")
    b += f'<rect x="160" y="140" width="300" height="240" rx="16" fill="#FFFFFF" stroke="#8B5A2B" stroke-width="10"/>'
    b += sun(310, 260, 45)
    refl = place(chameleon(PINK, "big", look=(1, -0.2), sparkles=True), 1390, 680, 1.15, flip=True, shadow=False)
    sparkle = "".join(star4(x, y, r, "#FFFFFF") for x, y, r in [(1240, 280, 22), (1540, 300, 16), (1500, 560, 20), (1260, 560, 12)])
    d, m = mirror(1390, 450, 300, 330, f'<rect x="1000" y="0" width="800" height="900" fill="#FFF0F7"/>' + refl + sparkle)
    b += m
    b += place(chameleon(PINK, "big", look=(1, -0.2), sparkles=True), 640, 780, 1.25)
    for (x, y, r, c) in [(420, 470, 30, "#FFE07A"), (860, 420, 24, "#FFFFFF"), (700, 330, 18, "#FFE07A"), (300, 640, 18, "#FFFFFF"),
                         (980, 600, 20, "#FFE07A"), (560, 420, 14, "#FFFFFF")]:
        b += star4(x, y, r, c)
    return svg_doc(b, d)


def page17():
    # three little scenes side by side: Cami stays pink in every one
    b = f'<rect width="{W}" height="{H}" fill="#FFFFFF"/>'
    d = ""
    panels = []
    pw = (W - 4 * 30) / 3
    for i in range(3):
        x0 = 30 + i * (pw + 30)
        clip = uid("pc")
        d += f'<clipPath id="{clip}"><rect x="{x0}" y="30" width="{pw}" height="{H - 60}" rx="36"/></clipPath>'
        panels.append((x0, clip))
    # pond
    x0, clip = panels[0]
    g = f'<rect x="0" y="0" width="{W}" height="{H}" fill="#BDE7F7"/>' + cloud(x0 + 160, 140, 0.7)
    g += f'<rect x="0" y="520" width="{W}" height="{H}" fill="#4FA0CF"/>'
    g += lily_pad(x0 + 300, 760, 210, 60)
    g += place(frog(look=(1, 0)), x0 + 130, 760, 0.85, shadow=False)
    g += place(chameleon(PINK, "big", look=(-0.6, 0)), x0 + 350, 750, 0.9, shadow=False)
    b += f'<g clip-path="url(#{clip})">{g}</g>'
    # jungle
    x0, clip = panels[1]
    g = f'<rect x="0" y="0" width="{W}" height="{H}" fill="#CFEFC9"/>'
    rnd = random.Random(3)
    for _ in range(10):
        g += leaf(x0 + rnd.uniform(-40, pw + 40), rnd.uniform(-40, 80), rnd.uniform(140, 200), rnd.uniform(50, 130),
                  rnd.choice(["#2F8A4C", "#3E9B57", "#57B26A"]))
    g += f'<rect x="0" y="720" width="{W}" height="{H}" fill="#5C9E45"/>'
    g += path(f"M{x0 - 20},560 C{x0 + 200},530 {x0 + 400},580 {x0 + pw + 20},540 L{x0 + pw + 20},590 C{x0 + 400},620 {x0 + 200},585 {x0 - 20},610 Z",
              "#8A5A36", "#523219", 6)
    g += place(monkey(look=(1, 0.5), wave=True), x0 + 160, 575, 0.85, shadow=False)
    g += place(chameleon(PINK, "big", look=(-0.6, 0)), x0 + 410, 565, 0.85, shadow=False)
    b += f'<g clip-path="url(#{clip})">{g}</g>'
    # yard
    x0, clip = panels[2]
    g = f'<rect x="0" y="0" width="{W}" height="{H}" fill="#C4E8FF"/>' + sun(x0 + pw - 110, 140, 50)
    g += f'<rect x="0" y="560" width="{W}" height="{H}" fill="#8CCB6E"/>'
    g += place(dog(look=(-1, 0.4)), x0 + 440, 780, 0.95, shadow_w=100)
    g += place(chameleon(PINK, "big", look=(0.6, 0)), x0 + 180, 780, 0.9)
    b += f'<g clip-path="url(#{clip})">{g}</g>'
    for x0, _ in panels:
        b += f'<rect x="{x0}" y="30" width="{pw}" height="{H - 60}" rx="36" fill="none" stroke="#F27BB8" stroke-width="10"/>'
    for (x, y) in [(640, 300), (1280, 300), (420, 430), (1050, 200), (1700, 440)]:
        b += star4(x, y, 18, "#FFFFFF")
    return svg_doc(b, d)


def page18():
    d, b = meadow("#BFE6FF", "#FFF4FA", "#A8DD8E", "#8ED07A", ground_y=640, sunpos=(1720, 150))
    b += tree(120, 620, 1.0) + tree(1820, 640, 0.9, "#6CB860")
    b += confetti(80, 12, 0, W, 20, 560)
    b += place(frog(look=(1, -0.3), expr="open"), 330, 790, 1.0, shadow_w=100)
    b += place(bunny(look=(1, 0)), 560, 780, 1.0, shadow_w=70)
    b += place(monkey(look=(-1, 0), wave=True), 1330, 790, 1.0, shadow_w=80)
    b += place(dog("#EDB85A", collar="#9B6BD6", look=(-1, 0)), 1570, 790, 0.95, shadow_w=90)
    b += place(chameleon(PINK, "big", look=(0, -0.3), sparkles=True), 940, 760, 1.2)
    for (x, y, s) in [(820, 290, 26), (1100, 260, 32), (960, 180, 22), (640, 400, 18), (1320, 420, 20)]:
        b += heart(x, y, s, "#F25C8A", "#A6234F")
    return svg_doc(b, d)


def the_end():
    d, b = sky("#FFC6A8", "#FFE9C9")
    b += circle(960, 760, 300, "#FFD27A", extra='opacity="0.8"') + circle(960, 760, 230, "#FFE3A0")
    b += hill(700, "#E7A8C8", 40, 0.2) + hill(800, "#B98ACB", 22, 1.4)
    b += confetti(40, 30, 0, W, 360, 700)
    b += place(chameleon(GRANDMA, "big", look=(-1, 0), grandma=True), 1230, 880, 1.15, flip=True, shadow_w=150)
    b += place(chameleon(PINK, "big", look=(1, -0.2), sparkles=True), 690, 880, 1.15, shadow_w=150)
    b += heart(960, 560, 40, "#F25C8A", "#A6234F")
    for (x, y, r) in [(300, 420, 24), (1620, 420, 24), (520, 560, 14), (1420, 560, 14)]:
        b += star4(x, y, r, "#FFFFFF")
    return svg_doc(b, d)


PAGES = [cover, page1, page2, page3, page4, page5, page6, page7, page8, page9, page10, page11,
         page12, page13, page14, page15, page16, page17, page18, the_end]
