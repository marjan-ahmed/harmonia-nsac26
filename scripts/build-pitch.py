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
    add_text(slide, 0.75, 0.55, 8, 0.35, [{"text": "THE PROBLEM", "size": 14, "color": MUTED}])
    add_text(
        slide,
        0.75,
        1.15,
        11.8,
        2.2,
        [{"text": "The fire calendar breaks when the satellite changes.", "size": 40, "color": INK}],
    )
    add_text(
        slide,
        0.75,
        3.6,
        11.5,
        2.6,
        [
            {"text": "Emergency teams use hotspot history to see a normal month.", "size": 22, "color": INK},
            {"text": "MODIS and VIIRS do not count the same way.", "size": 22, "color": INK, "before": 12},
            {"text": "MODIS is leaving service. Without one scale, that history drops out.", "size": 22, "color": MUTED, "before": 12},
        ],
    )
    footer(slide, 2)
    notes(slide, "This is the challenge. The problem is the splice, not that fires are bad.")

    # 3. Solution
    slide = blank(prs)
    add_text(slide, 0.75, 0.55, 8, 0.35, [{"text": "THE SOLUTION", "size": 14, "color": MUTED}])
    add_text(
        slide,
        0.75,
        1.15,
        11.8,
        1.8,
        [{"text": "One calendar. The sensor no longer matters.", "size": 40, "color": INK}],
    )
    add_text(
        slide,
        0.75,
        3.4,
        11.5,
        2.8,
        [
            {"text": "Each VIIRS count is put back on the MODIS scale.", "size": 22, "color": INK},
            {"text": "Pick Argentina, La Rioja, or Chilecito. Then pick a day.", "size": 22, "color": INK, "before": 12},
            {"text": "See that date in every other year, and whether it is outside the record.", "size": 22, "color": MUTED, "before": 12},
        ],
    )
    footer(slide, 3)
    notes(slide, "One sentence. Then open the app and pick a place and a day.")

    # 4. Proof
    slide = blank(prs)
    add_text(slide, 0.75, 0.45, 8, 0.3, [{"text": "AUGUST 2020", "size": 14, "color": MUTED}])
    add_text(
        slide,
        0.75,
        0.85,
        12,
        1.15,
        [{"text": "The national spike is not the local fire.", "size": 34, "color": INK}],
    )
    add_card(slide, 0.75, 2.35, 5.7, 4.0)
    add_card(slide, 6.85, 2.35, 5.7, 4.0)
    add_text(slide, 1.1, 2.55, 5, 0.35, [{"text": "Argentina", "size": 16, "color": MUTED}])
    add_text(slide, 1.1, 3.0, 5, 1.15, [{"text": "3.23×", "size": 56, "color": COPPER}])
    add_text(
        slide,
        1.1,
        4.55,
        5,
        1.3,
        [
            {"text": "37,479 harmonized", "size": 20, "color": INK},
            {"text": "Outside normal", "size": 18, "color": COPPER, "before": 6},
        ],
    )
    add_text(slide, 7.2, 2.55, 5, 0.35, [{"text": "Chilecito", "size": 16, "color": MUTED}])
    add_text(slide, 7.2, 3.0, 5, 1.15, [{"text": "0.60×", "size": 56, "color": INK}])
    add_text(
        slide,
        7.2,
        4.55,
        5,
        1.3,
        [
            {"text": "2 harmonized", "size": 20, "color": INK},
            {"text": "Inside normal. Same month.", "size": 18, "color": MUTED, "before": 6},
        ],
    )
    footer(slide, 4)
    notes(slide, "Pause here. Argentina is outside normal. Chilecito, the same month, is not.")

    # 5. How + NASA data
    slide = blank(prs)
    add_text(slide, 0.7, 0.42, 6, 0.3, [{"text": "HOW IT WORKS", "size": 14, "color": MUTED}])
    add_text(
        slide,
        0.7,
        0.85,
        6.1,
        1.3,
        [{"text": "NASA FIRMS, on one scale.", "size": 32, "color": INK}],
    )
    add_text(
        slide,
        0.7,
        2.4,
        5.9,
        4.0,
        [
            {"text": "MODIS C6.1 Terra and Aqua", "size": 18, "color": INK},
            {"text": "VIIRS S-NPP Collection 2", "size": 18, "color": INK, "before": 8},
            {"text": "20 January 2012 to 31 December 2025", "size": 18, "color": INK, "before": 8},
            {"text": "Harmonized = VIIRS ÷ month ratio", "size": 18, "color": INK, "before": 14},
            {"text": "Overall median 3.507. In-sample error 6.0%.", "size": 16, "color": MUTED, "before": 8},
        ],
    )
    slide.shapes.add_picture(
        str(ROOT / "public" / "pitch-app.png"),
        Inches(6.9),
        Inches(1.55),
        Inches(5.7),
        Inches(3.56),
    )
    footer(slide, 5)
    notes(slide, "Point at the calendar. If asked about 2001, the extract starts 20 January 2012.")

    # 6. Who
    slide = blank(prs)
    add_text(slide, 0.75, 0.7, 8, 0.35, [{"text": "WHO IT HELPS", "size": 14, "color": MUTED}])
    add_text(
        slide,
        0.75,
        1.4,
        11.5,
        2.2,
        [{"text": "Is this day, in this place, outside the record?", "size": 36, "color": INK}],
    )
    add_text(
        slide,
        0.75,
        4.0,
        11,
        2.0,
        [
            {
                "text": "That is the question a fire manager asks. The answer stays on one scale when the sensor changes.",
                "size": 22,
                "color": MUTED,
            },
            {"text": "Fire managers first. Then scientists and land managers.", "size": 20, "color": INK, "before": 16},
        ],
    )
    footer(slide, 6)
    notes(slide, "One user. One place. One day.")

    # 7. Impact
    slide = blank(prs)
    add_text(slide, 0.75, 0.55, 8, 0.35, [{"text": "WHY IT MATTERS", "size": 14, "color": MUTED}])
    add_text(
        slide,
        0.75,
        1.2,
        12,
        1.8,
        [{"text": "The calendar survives the satellite.", "size": 40, "color": INK}],
    )
    add_text(
        slide,
        0.75,
        3.5,
        11.2,
        2.4,
        [
            {
                "text": "When MODIS is gone, a manager in Chilecito can still tell a national spike from a quiet local month.",
                "size": 24,
                "color": INK,
            },
            {
                "text": "The history of when burning happens stays on one page.",
                "size": 22,
                "color": MUTED,
                "before": 16,
            },
        ],
    )
    footer(slide, 7)
    notes(slide, "End on the person. If asked: not burned area, not a live fire, not official borders. The map is the month.")

    if len(prs.slides) != 7:
        raise SystemExit(f"expected 7 slides, got {len(prs.slides)}")
    prs.save(OUT)
    print(OUT, OUT.stat().st_size)


if __name__ == "__main__":
    build()
