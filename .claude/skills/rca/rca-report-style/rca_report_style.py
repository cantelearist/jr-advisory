"""
RCA Report Style — ReportLab PDF generator for James Roman Advisory.

Usage:
    from rca_report_style import RCAReport
    report = RCAReport(title="...", doc_type="...", client="...", output_path="...")
    report.add_section(...)
    report.add_verdict(...)
    report.build()

Fonts: place CG-*.ttf files in the same directory as this module under rca_fonts/.
Falls back to Helvetica family if fonts are missing.
"""

import os
import warnings
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

# ---------------------------------------------------------------------------
# Colour palette
# ---------------------------------------------------------------------------

MIDNIGHT = colors.HexColor("#0D0D0D")
IVORY = colors.HexColor("#F5F2EC")
CHARCOAL = colors.HexColor("#2C2C2C")
GOLD = colors.HexColor("#C9A84C")
SLATE = colors.HexColor("#6B7280")
CREAM = colors.HexColor("#FAF8F4")

RED_FLAG_COLOR = colors.HexColor("#B91C1C")
AMBER = colors.HexColor("#D97706")
GREEN = colors.HexColor("#15803D")
BLUE_MUTED = colors.HexColor("#3B5FA0")

VERDICT_COLORS = {
    "CLEAR": GREEN,
    "RECOMMEND": GREEN,
    "PROCEED WITH CONDITIONS": AMBER,
    "RECOMMEND WITH CONDITIONS": AMBER,
    "ELEVATED RISK": AMBER,
    "REQUEST CLARIFICATION FIRST": BLUE_MUTED,
    "DO NOT ENGAGE": RED_FLAG_COLOR,
    "DO NOT RECOMMEND": RED_FLAG_COLOR,
}

SEVERITY_COLORS = {
    "critical": RED_FLAG_COLOR,
    "high": RED_FLAG_COLOR,
    "medium": AMBER,
    "low": SLATE,
}

# ---------------------------------------------------------------------------
# Font registration
# ---------------------------------------------------------------------------

FONTS_DIR = Path(__file__).parent / "rca_fonts"
FONT_MAP = {
    "CG-Regular": "CG-Regular.ttf",
    "CG-Medium": "CG-Medium.ttf",
    "CG-SemiBold": "CG-SemiBold.ttf",
    "CG-Bold": "CG-Bold.ttf",
    "CG-Italic": "CG-Italic.ttf",
}
FALLBACK = {
    "CG-Regular": "Helvetica",
    "CG-Medium": "Helvetica",
    "CG-SemiBold": "Helvetica-Bold",
    "CG-Bold": "Helvetica-Bold",
    "CG-Italic": "Helvetica-Oblique",
}

_fonts_loaded = False


def _register_fonts() -> dict[str, str]:
    """Register CG fonts; return name→registered-name mapping."""
    global _fonts_loaded
    name_map: dict[str, str] = {}

    for logical_name, filename in FONT_MAP.items():
        path = FONTS_DIR / filename
        if path.exists():
            try:
                pdfmetrics.registerFont(TTFont(logical_name, str(path)))
                name_map[logical_name] = logical_name
            except Exception as exc:
                warnings.warn(f"Failed to register font {filename}: {exc}. Using fallback.")
                name_map[logical_name] = FALLBACK[logical_name]
        else:
            name_map[logical_name] = FALLBACK[logical_name]

    if all(v == FALLBACK[k] for k, v in name_map.items()):
        warnings.warn(
            "CG fonts not found in rca_fonts/. Using Helvetica fallback. "
            "Install fonts: unzip ~/Downloads/rca_fonts.zip -d "
            "~/.claude/skills/rca/rca-report-style/rca_fonts/"
        )

    _fonts_loaded = True
    return name_map


# ---------------------------------------------------------------------------
# Data containers
# ---------------------------------------------------------------------------

@dataclass
class RCASection:
    number: int | str
    title: str
    body: str
    red_flags: list[tuple[str, str, str]] = field(default_factory=list)
    strengths: list[tuple[str, str]] = field(default_factory=list)
    sources: list[tuple[str, str, str]] = field(default_factory=list)
    table_data: Optional[list[list[str]]] = None
    table_headers: Optional[list[str]] = None


@dataclass
class RCAVerdict:
    rating: str
    confidence: str
    red_flag_count: int = 0
    conditions: list[str] = field(default_factory=list)
    next_steps: list[str] = field(default_factory=list)
    notes: str = ""


# ---------------------------------------------------------------------------
# Page canvas callbacks
# ---------------------------------------------------------------------------

def _cover_page_canvas(canvas, doc):
    canvas.saveState()
    w, h = LETTER

    canvas.setFillColor(MIDNIGHT)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)

    gold_y_top = h * 0.80
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(1)
    canvas.line(inch, gold_y_top, w - inch, gold_y_top)

    canvas.setFillColor(IVORY)
    canvas.setFont(doc._rca_fonts["CG-Medium"], 10)
    canvas.drawString(inch, gold_y_top + 18, "JAMES ROMAN ADVISORY")

    canvas.setFillColor(GOLD)
    canvas.setFont(doc._rca_fonts["CG-Medium"], 9)
    canvas.drawString(inch, gold_y_top + 6, getattr(doc, "_rca_doc_type", "Report").upper())

    title = getattr(doc, "_rca_title", "")
    canvas.setFillColor(IVORY)
    canvas.setFont(doc._rca_fonts["CG-Bold"], 28)
    text_obj = canvas.beginText(inch, gold_y_top - 48)
    text_obj.setFont(doc._rca_fonts["CG-Bold"], 28)
    text_obj.setFillColor(IVORY)
    for line in simpleSplit(title, doc._rca_fonts["CG-Bold"], 28, w - 2 * inch):
        text_obj.textLine(line)
    canvas.drawText(text_obj)

    subtitle = getattr(doc, "_rca_subtitle", "")
    if subtitle:
        canvas.setFillColor(IVORY)
        canvas.setFont(doc._rca_fonts["CG-Regular"], 14)
        canvas.drawString(inch, gold_y_top - 96, subtitle)

    gold_y_bot = h * 0.22
    canvas.line(inch, gold_y_bot, w - inch, gold_y_bot)

    canvas.setFillColor(IVORY)
    canvas.setFont(doc._rca_fonts["CG-Regular"], 8)
    client = getattr(doc, "_rca_client", "")
    report_date = getattr(doc, "_rca_date", str(date.today()))
    canvas.drawString(inch, gold_y_bot - 14, f"Prepared for: {client}")
    canvas.drawString(inch, gold_y_bot - 26, f"Date: {report_date}")
    canvas.drawString(inch, gold_y_bot - 38, "Classification: CONFIDENTIAL")

    canvas.drawRightString(w - inch, gold_y_bot - 14, "James Roman Advisory")
    canvas.drawRightString(w - inch, gold_y_bot - 26, "Los Angeles, California")
    canvas.drawRightString(w - inch, gold_y_bot - 38, "www.jamesroman.la")

    canvas.restoreState()


def _body_page_canvas(canvas, doc):
    canvas.saveState()
    w, h = LETTER

    canvas.setFillColor(SLATE)
    canvas.setFont(doc._rca_fonts["CG-Regular"], 8)
    firm = "James Roman Advisory"
    canvas.drawString(inch, h - 0.5 * inch, firm)
    title = getattr(doc, "_rca_title", "")
    canvas.drawRightString(w - inch, h - 0.5 * inch, title[:60] + ("…" if len(title) > 60 else ""))

    canvas.drawString(inch, 0.4 * inch, "CONFIDENTIAL")
    canvas.drawCentredString(w / 2, 0.4 * inch, str(canvas.getPageNumber()))
    report_date = getattr(doc, "_rca_date", str(date.today()))
    canvas.drawRightString(w - inch, 0.4 * inch, report_date)

    canvas.restoreState()


# ---------------------------------------------------------------------------
# Main class
# ---------------------------------------------------------------------------

class RCAReport:
    """
    Builder for JR Advisory branded PDF reports.

    Example
    -------
    report = RCAReport(
        title="Counterparty Vetting: Acme Environmental LLC",
        doc_type="Due Diligence Report",
        client="Confidential Client",
        output_path="~/Desktop/report.pdf",
    )
    report.add_section(
        number=1,
        title="Ring 1 — Legal Identity",
        body="...",
        red_flags=[("RF-DOC", "medium", "DBA not registered")],
        sources=[("CA SOS", "T1", "2026-06-14")],
    )
    report.add_verdict(rating="PROCEED WITH CONDITIONS", confidence="Medium")
    report.build()
    """

    def __init__(
        self,
        title: str,
        doc_type: str = "Advisory Report",
        subtitle: str = "",
        client: str = "",
        output_path: str = "~/Desktop/rca_report.pdf",
        report_date: Optional[str] = None,
    ):
        self.title = title
        self.doc_type = doc_type
        self.subtitle = subtitle
        self.client = client
        self.output_path = str(Path(output_path).expanduser())
        self.report_date = report_date or str(date.today())
        self._sections: list[RCASection] = []
        self._verdict: Optional[RCAVerdict] = None
        self._fonts = _register_fonts()

    def add_section(
        self,
        number: int | str,
        title: str,
        body: str,
        red_flags: Optional[list[tuple[str, str, str]]] = None,
        strengths: Optional[list[tuple[str, str]]] = None,
        sources: Optional[list[tuple[str, str, str]]] = None,
        table_data: Optional[list[list[str]]] = None,
        table_headers: Optional[list[str]] = None,
    ) -> "RCAReport":
        self._sections.append(
            RCASection(
                number=number,
                title=title,
                body=body,
                red_flags=red_flags or [],
                strengths=strengths or [],
                sources=sources or [],
                table_data=table_data,
                table_headers=table_headers,
            )
        )
        return self

    def add_verdict(
        self,
        rating: str,
        confidence: str,
        red_flag_count: int = 0,
        conditions: Optional[list[str]] = None,
        next_steps: Optional[list[str]] = None,
        notes: str = "",
    ) -> "RCAReport":
        self._verdict = RCAVerdict(
            rating=rating,
            confidence=confidence,
            red_flag_count=red_flag_count,
            conditions=conditions or [],
            next_steps=next_steps or [],
            notes=notes,
        )
        return self

    # ------------------------------------------------------------------
    # Style helpers
    # ------------------------------------------------------------------

    def _styles(self) -> dict[str, ParagraphStyle]:
        f = self._fonts
        base = getSampleStyleSheet()
        return {
            "body": ParagraphStyle(
                "body",
                fontName=f["CG-Regular"],
                fontSize=10,
                leading=14,
                textColor=CHARCOAL,
                spaceAfter=6,
            ),
            "section_heading": ParagraphStyle(
                "section_heading",
                fontName=f["CG-SemiBold"],
                fontSize=16,
                leading=20,
                textColor=CHARCOAL,
                spaceBefore=12,
                spaceAfter=6,
            ),
            "subheading": ParagraphStyle(
                "subheading",
                fontName=f["CG-Medium"],
                fontSize=12,
                leading=16,
                textColor=CHARCOAL,
                spaceBefore=8,
                spaceAfter=4,
            ),
            "caption": ParagraphStyle(
                "caption",
                fontName=f["CG-Regular"],
                fontSize=8,
                leading=11,
                textColor=SLATE,
                spaceAfter=4,
            ),
            "citation": ParagraphStyle(
                "citation",
                fontName=f["CG-Italic"],
                fontSize=9,
                leading=12,
                textColor=SLATE,
                spaceAfter=2,
            ),
            "verdict_label": ParagraphStyle(
                "verdict_label",
                fontName=f["CG-Bold"],
                fontSize=14,
                leading=18,
                textColor=CHARCOAL,
            ),
        }

    # ------------------------------------------------------------------
    # Flowable builders
    # ------------------------------------------------------------------

    def _gold_rule(self) -> HRFlowable:
        return HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceAfter=6, spaceBefore=6)

    def _section_flowables(self, section: RCASection, styles: dict) -> list:
        story = []
        story.append(self._gold_rule())
        heading = f"{section.number}. {section.title}" if isinstance(section.number, int) else f"{section.number} — {section.title}"
        story.append(Paragraph(heading, styles["section_heading"]))
        story.append(Spacer(1, 4))

        for para in section.body.split("\n\n"):
            para = para.strip()
            if para:
                story.append(Paragraph(para, styles["body"]))

        if section.table_data and section.table_headers:
            story.extend(self._table_flowable(section.table_headers, section.table_data))

        for rf_code, severity, description in section.red_flags:
            story.extend(self._callout_flowable(rf_code, description, "red_flag", severity, styles))

        for strength, relevance in section.strengths:
            story.extend(self._callout_flowable("✓", strength, "strength", "", styles, note=relevance))

        if section.sources:
            story.append(Spacer(1, 4))
            story.append(Paragraph("Sources:", styles["caption"]))
            for src_name, tier, src_date in section.sources:
                story.append(Paragraph(f"• {src_name} [{tier}] — retrieved {src_date}", styles["citation"]))

        return story

    def _callout_flowable(
        self,
        code: str,
        text: str,
        style: str,
        severity: str,
        styles: dict,
        note: str = "",
    ) -> list:
        if style == "red_flag":
            c = SEVERITY_COLORS.get(severity.lower(), AMBER)
        elif style == "strength":
            c = GREEN
        else:
            c = BLUE_MUTED

        tint = colors.Color(c.red, c.green, c.blue, alpha=0.1)
        label = f"<b>[{code}]</b> {text}"
        if note:
            label += f"<br/><i>{note}</i>"

        data = [[Paragraph(label, ParagraphStyle("callout", fontName=self._fonts["CG-Regular"], fontSize=9, leading=13, textColor=CHARCOAL))]]
        t = Table(data, colWidths=["100%"])
        t.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 1, c),
            ("BACKGROUND", (0, 0), (-1, -1), tint),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        return [Spacer(1, 4), t, Spacer(1, 4)]

    def _table_flowable(self, headers: list[str], rows: list[list[str]]) -> list:
        f = self._fonts
        header_style = ParagraphStyle("th", fontName=f["CG-Medium"], fontSize=9, leading=12, textColor=IVORY)
        cell_style = ParagraphStyle("td", fontName=f["CG-Regular"], fontSize=9, leading=12, textColor=CHARCOAL)

        data = [[Paragraph(h, header_style) for h in headers]]
        for i, row in enumerate(rows):
            data.append([Paragraph(str(c), cell_style) for c in row])

        col_w = (LETTER[0] - 2 * inch) / len(headers)
        t = Table(data, colWidths=[col_w] * len(headers))

        ts = TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), CHARCOAL),
            ("TEXTCOLOR", (0, 0), (-1, 0), IVORY),
            ("LINEBELOW", (0, 0), (-1, 0), 1, GOLD),
            ("LINEBELOW", (0, 1), (-1, -1), 0.25, SLATE),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
        for i in range(1, len(data)):
            bg = CREAM if i % 2 == 0 else colors.white
            ts.add("BACKGROUND", (0, i), (-1, i), bg)

        t.setStyle(ts)
        return [Spacer(1, 6), t, Spacer(1, 6)]

    def _verdict_flowable(self, verdict: RCAVerdict, styles: dict) -> list:
        story = [self._gold_rule()]
        story.append(Paragraph("Summary & Verdict", styles["section_heading"]))
        story.append(Spacer(1, 6))

        c = VERDICT_COLORS.get(verdict.rating.upper(), SLATE)
        tint = colors.Color(c.red, c.green, c.blue, alpha=0.1)

        f = self._fonts
        lines = [
            Paragraph(f"<b>{verdict.rating}</b>", ParagraphStyle("vr", fontName=f["CG-Bold"], fontSize=14, leading=18, textColor=c)),
            Paragraph(f"Confidence: <b>{verdict.confidence}</b>   Red flags: <b>{verdict.red_flag_count}</b>",
                      ParagraphStyle("vi", fontName=f["CG-Regular"], fontSize=10, leading=14, textColor=CHARCOAL)),
        ]
        if verdict.notes:
            lines.append(Paragraph(verdict.notes, styles["body"]))

        data = [[cell] for cell in lines]
        t = Table([[line] for line in lines], colWidths=["100%"])
        t.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 1.5, c),
            ("BACKGROUND", (0, 0), (-1, -1), tint),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(t)
        story.append(Spacer(1, 8))

        if verdict.conditions:
            story.append(Paragraph("Conditions:", styles["subheading"]))
            for i, cond in enumerate(verdict.conditions, 1):
                story.append(Paragraph(f"{i}. {cond}", styles["body"]))

        if verdict.next_steps:
            story.append(Spacer(1, 4))
            story.append(Paragraph("Next Steps:", styles["subheading"]))
            for i, step in enumerate(verdict.next_steps, 1):
                story.append(Paragraph(f"{i}. {step}", styles["body"]))

        story.append(Spacer(1, 12))
        story.append(Paragraph(
            "Evidence Doctrine v1.0 · ~/.claude/skills/rca/rca-evidence-doctrine/",
            styles["citation"],
        ))
        return story

    # ------------------------------------------------------------------
    # Build
    # ------------------------------------------------------------------

    def build(self) -> str:
        """Generate the PDF and return the output path."""
        os.makedirs(os.path.dirname(self.output_path) or ".", exist_ok=True)

        doc = BaseDocTemplate(
            self.output_path,
            pagesize=LETTER,
            leftMargin=inch,
            rightMargin=inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
        )

        doc._rca_fonts = self._fonts
        doc._rca_title = self.title
        doc._rca_doc_type = self.doc_type
        doc._rca_subtitle = self.subtitle
        doc._rca_client = self.client
        doc._rca_date = self.report_date

        cover_frame = Frame(0, 0, LETTER[0], LETTER[1], leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        body_frame = Frame(
            inch, 0.75 * inch,
            LETTER[0] - 2 * inch,
            LETTER[1] - 1.5 * inch,
        )

        doc.addPageTemplates([
            PageTemplate(id="Cover", frames=[cover_frame], onPage=_cover_page_canvas),
            PageTemplate(id="Body", frames=[body_frame], onPage=_body_page_canvas),
        ])

        styles = self._styles()
        story = [NextPageTemplate("Body"), PageBreak()]

        for section in self._sections:
            story.extend(self._section_flowables(section, styles))

        if self._verdict:
            story.extend(self._verdict_flowable(self._verdict, styles))

        doc.build(story)
        return self.output_path
