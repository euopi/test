"""Render every page's SVG to PNG and assemble Cami_the_Chameleon.pptx."""
import os
import sys

import cairosvg
from lxml import etree
from PIL import ImageFont
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

from scenes import PAGES

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, "images")
OUT = os.path.join(HERE, "Cami_the_Chameleon.pptx")
os.makedirs(IMG, exist_ok=True)

TEXT = [
    None,
    "Cami the Chameleon can change her colors to be whatever she likes!",
    "Everyone tells Cami that changing her colors is her superpower.",
    "With the frogs, Cami is green...",
    "...with the monkeys, she's brown...",
    "...with the dogs, she's golden...",
    "...and with her friends, she can't keep track of her colors!",
    "But wait!",
    "What color is Cami? The question makes her stomach turn and twist.",
    "Cami thinks long and hard in the mirror, but she can't remember her colors!",
    "Cami starts to turn grey like the rocks. Her friends walk right past her.",
    "Cami is nowhere to be found.",
    'Then, a tiny voice. "Cami? Is that you?" It\'s Grandma.',
    "Grandma gives Cami some tea. Cami tells her she's gone grey.",
    "Grandma tells Cami all the things that make her special!",
    "Cami goes and draws all the things that she, and only she, loves.",
    "By the end of the day, Cami's color has come back. She looks in the mirror and finds a sparkly pink hue.",
    "Cami starts wearing it everywhere and never changes it. It's what she wants!",
    "Her friends are just happy to have found her again.",
    None,
]

FONT = "Calibri"
INK = RGBColor(0x3B, 0x2F, 0x4A)
SIZE = 38
SLIDE_W, SLIDE_H = Inches(13.333), Inches(7.5)
BOX_X, BOX_W = Inches(0.55), Inches(12.233)
PAD_X, PAD_Y = Inches(0.3), Inches(0.14)
MEASURE = ImageFont.truetype("/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf", SIZE * 10)


def count_lines(text, width_pt):
    words, lines, cur = text.split(), 1, ""
    for w in words:
        trial = (cur + " " + w).strip()
        if MEASURE.getlength(trial) / 10 > width_pt and cur:
            lines, cur = lines + 1, w
        else:
            cur = trial
    return lines


def set_alpha(fill_elm_parent, alpha_pct):
    srgb = fill_elm_parent.find(".//" + qn("a:srgbClr"))
    a = etree.SubElement(srgb, qn("a:alpha"))
    a.set("val", str(int(alpha_pct * 1000)))


def add_run(p, text, size, color=INK, bold=False, italic=False, font=FONT):
    r = p.add_run()
    r.text = text
    f = r.font
    f.size, f.bold, f.italic, f.name = Pt(size), bold, italic, font
    f.color.rgb = color
    return r


def story_box(slide, text):
    inner_w_pt = (BOX_W - 2 * PAD_X) / 12700
    n = count_lines(text, inner_w_pt * 0.97)
    line_h = Pt(SIZE * 1.2)
    h = int(n * line_h + 2 * PAD_Y + Inches(0.12))
    y = SLIDE_H - Inches(0.3) - h
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, BOX_X, y, BOX_W, h)
    shp.name = "Story text"
    shp.adjustments[0] = 0.22 if n < 3 else 0.16
    shp.fill.solid()
    shp.fill.fore_color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    set_alpha(shp.fill._xPr.find(qn("a:solidFill")), 94)
    shp.line.color.rgb = RGBColor(0xF2, 0x7B, 0xB8)
    shp.line.width = Pt(3)
    shp.shadow.inherit = False
    tf = shp.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    tf.margin_left = tf.margin_right = PAD_X
    tf.margin_top = tf.margin_bottom = PAD_Y
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.line_spacing = 1.0
    add_run(p, text, SIZE)
    return n


def text_box(slide, x, y, w, h, name):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tb.name = name
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.TOP
    return tf


TITLE_COLORS = ["D9383B", "E07B12", "C99A06", "2E9A48", "2B7FC4", "7A4FB8", "D2468F"]


def cover_text(slide):
    tf = text_box(slide, Inches(0.6), Inches(0.35), Inches(12.133), Inches(1.45), "Title")
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    k = 0
    for ch in "Cami the Chameleon":
        if ch == " ":
            add_run(p, ch, 80, bold=True)
            continue
        c = TITLE_COLORS[k % len(TITLE_COLORS)]
        add_run(p, ch, 80, RGBColor.from_string(c), bold=True)
        k += 1
    tf2 = text_box(slide, Inches(0.6), Inches(1.75), Inches(12.133), Inches(0.6), "Author")
    p2 = tf2.paragraphs[0]
    p2.alignment = PP_ALIGN.CENTER
    add_run(p2, "Written by Yassine Khelil-Cherfi", 30, italic=True)


def end_text(slide):
    tf = text_box(slide, Inches(0.6), Inches(0.75), Inches(12.133), Inches(1.6), "The End")
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    add_run(p, "The End", 110, RGBColor(0x8E, 0x2F, 0x6E), bold=True)


def render(only=None):
    for i, fn in enumerate(PAGES):
        if only and i not in only:
            continue
        svg = fn()
        cairosvg.svg2png(bytestring=svg.encode(), write_to=os.path.join(IMG, f"page{i:02d}.png"),
                         output_width=2560, output_height=1440)
        print("rendered", i, fn.__name__)


def build():
    prs = Presentation()
    prs.slide_width, prs.slide_height = SLIDE_W, SLIDE_H
    blank = prs.slide_layouts[6]
    prs.core_properties.title = "Cami the Chameleon"
    prs.core_properties.author = "Yassine Khelil-Cherfi"
    for i, fn in enumerate(PAGES):
        s = prs.slides.add_slide(blank)
        pic = s.shapes.add_picture(os.path.join(IMG, f"page{i:02d}.png"), 0, 0, SLIDE_W, SLIDE_H)
        pic.name = "Illustration"
        pic._element.nvPicPr.cNvPr.set("descr", f"Illustration for page {i}" if 0 < i < 19 else
                                       ("Cover illustration of Cami the chameleon" if i == 0 else "Cami and Grandma at sunset"))
        if i == 0:
            cover_text(s)
        elif TEXT[i]:
            n = story_box(s, TEXT[i])
            print(f"slide {i + 1}: {n} line(s)")
        else:
            end_text(s)
    prs.save(OUT)
    print("saved", OUT)


if __name__ == "__main__":
    only = {int(a) for a in sys.argv[1:]} or None
    render(only)
    build()
