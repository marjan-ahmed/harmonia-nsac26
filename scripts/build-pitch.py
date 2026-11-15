"""Seven-slide Harmonia deck for Allama Ikbar. NASA Space Apps allows seven, including first and last."""

from pathlib import Path

from PIL import Image, ImageDraw
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

ROOT = Path("/workspace")
OUT = ROOT / "public" / "Harmonia-Allama-Ikbar.pptx"
TEAM = ROOT / "public" / "team"

INK = RGBColor(0x1D, 0x1D, 0x1F)
MUTED = RGBColor(0x6E, 0x6E, 0x73)
COPPER = RGBColor(0xC4, 0x5C, 0x26)
RAISED = RGBColor(0xF2, 0xF2, 0xF4)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
FONT = "Calibri"


def circle(src: Path, dest: Path, size: int = 640) -> None:
    image = Image.open(src).convert("RGBA")
    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = int(height * 0.06) if height > width * 1.15 else max(0, (height - side) // 2)
    if top + side > height:
        top = height - side
    image = image.crop((left, top, left + side, top + side)).resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((2, 2, size - 3, size - 3), fill=255)
    image.putalpha(mask)
    image.save(dest)


def set_run(run, text, size, color, bold=False):
    run.text = text
    run.font.name = FONT
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.italic = False


def add_text(slide, left, top, width, height, lines, align=PP_ALIGN.LEFT):
    shape = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    frame = shape.text_frame
    frame.word_wrap = True
    frame.auto_size = None
    frame.margin_left = Emu(0)
    frame.margin_right = Emu(0)
    frame.margin_top = Emu(0)
    frame.margin_bottom = Emu(0)
    for index, line in enumerate(lines):
        paragraph = frame.paragraphs[0] if index == 0 else frame.add_paragraph()
        paragraph.alignment = align
        paragraph.space_before = Pt(line.get("before", 0))
        paragraph.space_after = Pt(line.get("after", 0))
        set_run(paragraph.add_run(), line["text"], line["size"], line["color"], line.get("bold", False))
    return shape


def add_card(slide, left, top, width, height):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height)
    )
    shape.adjustments[0] = 0.08
    shape.fill.solid()
    shape.fill.fore_color.rgb = RAISED
    shape.line.fill.background()
    return shape


def footer(slide, number, total=7):
    add_text(
        slide,
        0.7,
        7.05,
        8,
        0.3,
        [{"text": "Allama Ikbar  ·  Harmonia", "size": 12, "color": MUTED}],
    )
    add_text(
        slide,
        10.5,
        7.05,
        2.1,
        0.3,
        [{"text": f"{number}  /  {total}", "size": 12, "color": MUTED}],
        align=PP_ALIGN.RIGHT,
    )


def notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text


def blank(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = WHITE
    # Drop the unused date/footer placeholders if the blank layout has none.
    sp_tree = slide.shapes._spTree
    for child in list(sp_tree):
        if child.tag == qn("p:nvGrpSpPr"):
            continue
    return slide


def build():
    TEAM.mkdir(parents=True, exist_ok=True)
    circle(TEAM / "marjan.jpg", TEAM / "marjan-circle.png")
    circle(TEAM / "sufyan.jpg", TEAM / "sufyan-circle.png")

    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    prs.core_properties.title = "Harmonia"
    prs.core_properties.author = "Allama Ikbar"
    prs.core_properties.subject = "NASA Space Apps 2026 — Harmonization of MODIS and VIIRS Hot Spots"
    prs.core_properties.category = "NASA Space Apps Challenge 2026"

    # 1. Title
    slide = blank(prs)
    add_text(slide, 0.75, 0.48, 8, 0.35, [{"text": "NASA SPACE APPS 2026", "size": 14, "color": MUTED}])
    add_text(slide, 0.75, 0.95, 8, 1.15, [{"text": "Harmonia", "size": 60, "color": INK}])
    add_text(
        slide,
        0.75,
        2.15,
        7.2,
        0.7,
        [{"text": "One scale for fire, after MODIS retires.", "size": 22, "color": MUTED}],
    )
    add_text(slide, 0.75, 3.15, 6, 0.4, [{"text": "Allama Ikbar", "size": 20, "color": INK}])
    slide.shapes.add_picture(str(TEAM / "marjan-circle.png"), Inches(0.75), Inches(3.75), Inches(1.45), Inches(1.45))
    slide.shapes.add_picture(str(TEAM / "sufyan-circle.png"), Inches(3.15), Inches(3.75), Inches(1.45), Inches(1.45))
    add_text(
        slide,
        0.55,
        5.28,
        2.0,
        0.85,
        [
            {"text": "Muhammad Marjan Ahmed", "size": 13, "color": INK},
            {"text": "Team lead", "size": 12, "color": MUTED, "before": 2},
        ],
        align=PP_ALIGN.CENTER,
    )
    add_text(
        slide,
        2.95,
        5.28,
        2.0,
        0.7,
        [{"text": "Muhammad Sufyan Ahmed", "size": 13, "color": INK}],
        align=PP_ALIGN.CENTER,
    )
    add_text(
        slide,
        0.75,
        6.35,
        8,
        0.4,
        [{"text": "Challenge: Harmonization of MODIS and VIIRS Hot Spots", "size": 16, "color": MUTED}],
    )
    footer(slide, 1)
    notes(slide, "Say Allama Ikbar and the challenge first. Do not open with the ratio.")

    # 2. Problem
    slide = blank(prs)
    add_text(slide, 0.75, 0.55, 8, 0.35, [{"text": "THE BREAK", "size": 14, "color": MUTED}])
    add_text(
        slide,
        0.75,
        1.15,
        11.5,
        1.6,
        [{"text": "The record is split in two.", "size": 44, "color": INK}],
    )
    add_card(slide, 0.75, 3.2, 5.6, 2.9)
    add_card(slide, 6.95, 3.2, 5.6, 2.9)
    add_text(
        slide,
        1.05,
        3.5,
        5.0,
        2.3,
        [
            {"text": "MODIS", "size": 28, "color": INK},
            {"text": "Counted fires one way", "size": 20, "color": MUTED, "before": 10},
            {"text": "for two decades.", "size": 20, "color": MUTED, "before": 2},
        ],
    )
    add_text(
        slide,
        7.25,
        3.5,
        5.0,
        2.3,
        [
            {"text": "VIIRS", "size": 28, "color": INK},
            {"text": "Counts more of them.", "size": 20, "color": MUTED, "before": 10},
            {"text": "The two numbers are not the same.", "size": 20, "color": MUTED, "before": 2},
        ],
    )
    footer(slide, 2)
    notes(slide, "The problem is the splice, not that fires are bad.")

    # 3. Decision
    slide = blank(prs)
    add_text(slide, 0.75, 0.5, 8, 0.35, [{"text": "AUGUST 2020", "size": 14, "color": MUTED}])
    add_text(
        slide,
        0.75,
        1.0,
        12,
        1.3,
        [{"text": "The national spike is not the local fire.", "size": 36, "color": INK}],
    )
    add_card(slide, 0.75, 2.7, 5.7, 3.7)
    add_card(slide, 6.85, 2.7, 5.7, 3.7)
    add_text(slide, 1.1, 2.95, 5, 0.4, [{"text": "Argentina", "size": 16, "color": MUTED}])
    add_text(slide, 1.1, 3.4, 5, 1.2, [{"text": "3.23×", "size": 60, "color": COPPER}])
    add_text(
        slide,
        1.1,
        5.0,
        5,
        1.0,
        [
            {"text": "37,479 harmonized", "size": 20, "color": INK},
            {"text": "Outside normal", "size": 18, "color": COPPER, "before": 6},
        ],
    )
    add_text(slide, 7.2, 2.95, 5, 0.4, [{"text": "Chilecito", "size": 16, "color": MUTED}])
    add_text(slide, 7.2, 3.4, 5, 1.2, [{"text": "0.60×", "size": 60, "color": INK}])
    add_text(
        slide,
        7.2,
        5.0,
        5,
        1.0,
        [
            {"text": "2 harmonized", "size": 20, "color": INK},
            {"text": "Inside normal", "size": 18, "color": MUTED, "before": 6},
        ],
    )
    footer(slide, 3)
    notes(slide, "Pause here. Argentina is outside normal. Chilecito, the same month, is not.")

    # 4. Method
    slide = blank(prs)
    add_text(slide, 0.75, 0.5, 8, 0.35, [{"text": "NASA DATA", "size": 14, "color": MUTED}])
    add_text(
        slide,
        0.75,
        1.0,
        12,
        1.15,
        [{"text": "VIIRS, put back on the MODIS scale.", "size": 36, "color": INK}],
    )
    add_text(
        slide,
        0.75,
        2.5,
        6.3,
        4.0,
        [
            {"text": "MODIS Collection 6.1  ·  Terra and Aqua", "size": 20, "color": INK},
            {"text": "VIIRS S-NPP Collection 2", "size": 20, "color": INK, "before": 8},
            {"text": "NASA FIRMS active-fire detections", "size": 20, "color": INK, "before": 8},
            {"text": "Argentina, 20 January 2012 to 31 December 2025", "size": 20, "color": INK, "before": 8},
            {"text": "All confidence levels and type codes, as delivered.", "size": 18, "color": MUTED, "before": 14},
        ],
    )
    add_card(slide, 7.3, 2.45, 5.25, 3.9)
    add_text(
        slide,
        7.55,
        2.7,
        4.8,
        3.4,
        [
            {"text": "Harmonized", "size": 14, "color": MUTED},
            {"text": "VIIRS  ÷  month ratio", "size": 26, "color": INK, "before": 8},
            {"text": "Overall median  3.507", "size": 18, "color": INK, "before": 16},
            {"text": "In-sample error  6.0%", "size": 18, "color": INK, "before": 6},
            {"text": "Same months. Not an independent test.", "size": 16, "color": MUTED, "before": 10},
        ],
    )
    footer(slide, 4)
    notes(slide, "If asked about 2001, say the extract starts 20 January 2012. Do not invent those years.")

    # 5. Product
    slide = blank(prs)
    add_text(slide, 0.75, 0.5, 6, 0.35, [{"text": "THE TOOL", "size": 14, "color": MUTED}])
    add_text(
        slide,
        0.75,
        1.05,
        6.2,
        1.8,
        [{"text": "Open a month. Read the flag.", "size": 36, "color": INK}],
    )
    add_text(
        slide,
        0.75,
        3.15,
        5.8,
        3.2,
        [
            {"text": "A burning calendar, 2012–2025.", "size": 20, "color": INK},
            {"text": "A map of 0.05° bins.", "size": 20, "color": INK, "before": 10},
            {"text": "The season against the record.", "size": 20, "color": INK, "before": 10},
            {"text": "Argentina, La Rioja, and Chilecito.", "size": 20, "color": INK, "before": 10},
        ],
    )
    slide.shapes.add_picture(
        str(ROOT / "public" / "pitch-app.png"),
        Inches(6.9),
        Inches(1.7),
        Inches(5.7),
        Inches(3.56),
    )
    footer(slide, 5)
    notes(slide, "If you are in the room, leave this slide and open the live app.")

    # 6. Decision question
    slide = blank(prs)
    add_text(slide, 0.75, 0.7, 8, 0.35, [{"text": "WHO DECIDES", "size": 14, "color": MUTED}])
    add_text(
        slide,
        0.75,
        1.4,
        11.5,
        2.2,
        [{"text": "Is this month outside the record?", "size": 44, "color": INK}],
    )
    add_text(
        slide,
        0.75,
        3.9,
        10.5,
        2.0,
        [
            {
                "text": "That is the only question. Harmonia answers it on one scale, so the answer still holds when the sensor changes.",
                "size": 22,
                "color": MUTED,
            },
            {"text": "Fire managers first. Then scientists and land managers.", "size": 20, "color": INK, "before": 16},
        ],
    )
    footer(slide, 6)
    notes(slide, "One user. One question.")

    # 7. Limits
    slide = blank(prs)
    add_text(slide, 0.75, 0.5, 8, 0.35, [{"text": "STILL OPEN", "size": 14, "color": MUTED}])
    add_text(
        slide,
        0.75,
        1.05,
        12,
        1.5,
        [{"text": "The overlap is honest.", "size": 44, "color": INK}],
    )
    add_text(
        slide,
        0.75,
        2.9,
        11,
        3.2,
        [
            {"text": "Not burned area.", "size": 24, "color": INK},
            {"text": "Not an official provincial boundary.", "size": 24, "color": INK, "before": 10},
            {"text": "Not 2001–2011. Those years are not in this extract.", "size": 24, "color": INK, "before": 10},
            {
                "text": "The long record is the next file, not a claim in this build.",
                "size": 20,
                "color": MUTED,
                "before": 22,
            },
        ],
    )
    footer(slide, 7)
    notes(slide, "Do not promise the missing years as if they are already in the app.")

    if len(prs.slides) != 7:
        raise SystemExit(f"expected 7 slides, got {len(prs.slides)}")
    prs.save(OUT)
    print(OUT, OUT.stat().st_size)


if __name__ == "__main__":
    build()
