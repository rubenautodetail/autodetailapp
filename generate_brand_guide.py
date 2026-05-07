#!/usr/bin/env python3
"""Generate Rubens Auto Detail / Detailing on Demand Brand Guidelines PDF."""

from fpdf import FPDF
import os

BASE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(BASE, "frontend", "public", "dtailwash_logo_final.png")
OUTPUT = os.path.join(BASE, "Detailing_on_Demand_Brand_Guidelines.pdf")


class BrandGuidePDF(FPDF):
    def __init__(self):
        super().__init__("P", "mm", "A4")
        self.set_auto_page_break(auto=True, margin=20)
        # Colors
        self.NAVY = (19, 24, 53)
        self.NAVY_CARD = (26, 33, 66)
        self.NAVY_DIV = (44, 53, 94)
        self.GOLD = (208, 176, 120)
        self.GOLD_LIGHT = (238, 220, 168)
        self.GOLD_DARK = (181, 148, 88)
        self.WHITE = (255, 255, 255)
        self.LIGHT_BG = (245, 246, 248)
        self.TEXT_SEC = (110, 110, 115)
        self.SUCCESS = (52, 199, 89)
        self.ERROR = (255, 59, 48)
        self.BLUE_ACCENT = (39, 64, 161)

    def _nav_bg(self):
        self.set_fill_color(*self.NAVY)
        self.rect(0, 0, 210, 297, "F")

    def _draw_swatch(self, x, y, color, label, hex_code, w=35, h=35):
        """Draw a color swatch with label."""
        self.set_fill_color(*color)
        self.rect(x, y, w, h, "F")
        # Border
        self.set_draw_color(200, 200, 200)
        self.rect(x, y, w, h, "D")
        # Label
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(50, 50, 50)
        self.set_xy(x, y + h + 2)
        self.cell(w, 4, label, align="C")
        # Hex
        self.set_font("Helvetica", "", 7)
        self.set_text_color(120, 120, 120)
        self.set_xy(x, y + h + 6)
        self.cell(w, 4, hex_code, align="C")

    def _draw_swatch_dark(self, x, y, color, label, hex_code, w=35, h=35):
        """Draw swatch on dark background."""
        self.set_fill_color(*color)
        self.rect(x, y, w, h, "F")
        self.set_draw_color(60, 70, 110)
        self.rect(x, y, w, h, "D")
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(200, 210, 230)
        self.set_xy(x, y + h + 2)
        self.cell(w, 4, label, align="C")
        self.set_font("Helvetica", "", 7)
        self.set_text_color(165, 176, 209)
        self.set_xy(x, y + h + 6)
        self.cell(w, 4, hex_code, align="C")

    def _section_title(self, text, y=None):
        if y:
            self.set_y(y)
        self.set_font("Helvetica", "B", 18)
        self.set_text_color(50, 50, 50)
        self.cell(0, 10, text, new_x="LMARGIN", new_y="NEXT")
        # Gold underline
        self.set_fill_color(*self.GOLD)
        self.rect(self.l_margin, self.get_y(), 50, 1.5, "F")
        self.ln(6)

    def _section_title_dark(self, text, y=None):
        if y:
            self.set_y(y)
        self.set_font("Helvetica", "B", 18)
        self.set_text_color(*self.WHITE)
        self.cell(0, 10, text, new_x="LMARGIN", new_y="NEXT")
        self.set_fill_color(*self.GOLD)
        self.rect(self.l_margin, self.get_y(), 50, 1.5, "F")
        self.ln(6)

    # ── PAGE 1: COVER ──────────────────────────────────────────────
    def page_cover(self):
        self.add_page()
        self._nav_bg()

        # Gold accent line top
        self.set_fill_color(*self.GOLD)
        self.rect(0, 0, 210, 3, "F")

        # Logo
        if os.path.exists(LOGO):
            self.image(LOGO, x=35, y=55, w=140)

        # Title
        self.set_y(130)
        self.set_font("Helvetica", "B", 32)
        self.set_text_color(*self.GOLD)
        self.cell(0, 14, "Brand Guidelines", align="C", new_x="LMARGIN", new_y="NEXT")

        self.ln(4)
        self.set_font("Helvetica", "", 14)
        self.set_text_color(165, 176, 209)
        self.cell(0, 8, "Premium Mobile Car Detailing", align="C", new_x="LMARGIN", new_y="NEXT")

        # Divider
        self.ln(10)
        self.set_fill_color(*self.GOLD)
        self.rect(75, self.get_y(), 60, 0.5, "F")

        # Version
        self.set_y(250)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(94, 105, 143)
        self.cell(0, 6, "Version 1.0  |  April 2026", align="C", new_x="LMARGIN", new_y="NEXT")
        self.cell(0, 6, "dtailwash.com", align="C", new_x="LMARGIN", new_y="NEXT")

        # Gold accent line bottom
        self.set_fill_color(*self.GOLD)
        self.rect(0, 294, 210, 3, "F")

    # ── PAGE 2: TABLE OF CONTENTS ──────────────────────────────────
    def page_toc(self):
        self.add_page()
        self.set_font("Helvetica", "B", 24)
        self.set_text_color(*self.NAVY)
        self.cell(0, 14, "Table of Contents", new_x="LMARGIN", new_y="NEXT")
        self.set_fill_color(*self.GOLD)
        self.rect(self.l_margin, self.get_y(), 50, 1.5, "F")
        self.ln(12)

        items = [
            ("01", "Brand Overview"),
            ("02", "Logo Usage"),
            ("03", "Color Palette - Dark Mode"),
            ("04", "Color Palette - Light Mode & Status"),
            ("05", "Typography"),
            ("06", "Gradients & Effects"),
            ("07", "UI Components"),
            ("08", "Page Inventory"),
        ]
        for num, title in items:
            self.set_font("Helvetica", "B", 13)
            self.set_text_color(*self.GOLD_DARK)
            self.cell(18, 12, num)
            self.set_font("Helvetica", "", 13)
            self.set_text_color(60, 60, 60)
            self.cell(0, 12, title, new_x="LMARGIN", new_y="NEXT")
            # Subtle line
            self.set_draw_color(230, 230, 230)
            self.line(self.l_margin, self.get_y(), 200, self.get_y())
            self.ln(1)

    # ── PAGE 3: BRAND OVERVIEW ─────────────────────────────────────
    def page_brand_overview(self):
        self.add_page()
        self._section_title("01  Brand Overview")

        self.set_font("Helvetica", "", 11)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 6, (
            "Detailing on Demand is a premium mobile car detailing marketplace "
            "connecting customers with professional mobile detailers. The brand "
            "conveys luxury, trust, and convenience through a refined design language "
            "we call \"LuxeDetail\" -combining deep navy backgrounds with champagne "
            "gold accents."
        ))
        self.ln(6)

        # Key attributes
        attrs = [
            ("Brand Name", "Detailing on Demand"),
            ("Domain", "dtailwash.com"),
            ("Tagline", "Premium Mobile Car Detailing"),
            ("Hero Copy", "Experience Perfection"),
            ("Languages", "English (en) & Spanish (es)"),
            ("Design Theme", "LuxeDetail -Deep Navy & Champagne Gold"),
            ("Target Audience", "Vehicle owners seeking premium mobile detailing"),
        ]
        self.set_fill_color(*self.LIGHT_BG)
        self.rect(self.l_margin, self.get_y(), 180, len(attrs) * 10 + 6, "F")
        self.ln(3)
        for label, val in attrs:
            self.set_x(self.l_margin + 5)
            self.set_font("Helvetica", "B", 10)
            self.set_text_color(*self.NAVY)
            self.cell(50, 10, label)
            self.set_font("Helvetica", "", 10)
            self.set_text_color(80, 80, 80)
            self.cell(0, 10, val, new_x="LMARGIN", new_y="NEXT")

        self.ln(8)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(*self.NAVY)
        self.cell(0, 8, "Brand Personality", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

        traits = ["Premium & Luxurious", "Trustworthy & Professional", "Modern & Clean", "Convenient & Accessible"]
        for t in traits:
            self.set_x(self.l_margin + 3)
            self.set_font("Helvetica", "", 10)
            self.set_text_color(*self.GOLD_DARK)
            self.cell(5, 7, ">")  # Bullet
            self.set_text_color(60, 60, 60)
            self.cell(0, 7, f"  {t}", new_x="LMARGIN", new_y="NEXT")

    # ── PAGE 4: LOGO USAGE ─────────────────────────────────────────
    def page_logo(self):
        self.add_page()
        self._section_title("02  Logo Usage")

        self.set_font("Helvetica", "", 11)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 6, (
            "The primary logo is a horizontal wordmark. It should always be "
            "displayed with adequate clear space and never be distorted, recolored "
            "beyond approved variations, or placed on busy backgrounds without "
            "sufficient contrast."
        ))
        self.ln(6)

        # Logo on dark bg
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*self.NAVY)
        self.cell(0, 6, "Primary - Dark Background", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)
        y_start = self.get_y()
        box_h = 40
        self.set_fill_color(*self.NAVY)
        self.rect(self.l_margin, y_start, 180, box_h, "F")
        if os.path.exists(LOGO):
            logo_h = box_h - 12
            self.image(LOGO, x=50, y=y_start + 6, h=logo_h)
        self.set_y(y_start + box_h + 6)

        # Logo on light bg
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*self.NAVY)
        self.cell(0, 6, "Secondary - Light Background", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)
        y_start = self.get_y()
        self.set_fill_color(*self.LIGHT_BG)
        self.rect(self.l_margin, y_start, 180, box_h, "F")
        self.set_draw_color(220, 220, 220)
        self.rect(self.l_margin, y_start, 180, box_h, "D")
        if os.path.exists(LOGO):
            self.image(LOGO, x=50, y=y_start + 6, h=logo_h)
        self.set_y(y_start + box_h + 6)

        # Specs
        self.ln(6)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*self.NAVY)
        self.cell(0, 6, "Logo Specifications", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)
        specs = [
            ("File", "dtailwash_logo_final.png"),
            ("Hero Size", "486 x 130 px  (w-auto h-20 sm:h-32)"),
            ("Secondary Size", "365 x 97 px  (w-auto h-16 sm:h-20, opacity 70%)"),
            ("Clear Space", "Minimum 20px on all sides"),
            ("Drop Shadow", "Applied via drop-shadow-md on hero placement"),
        ]
        for label, val in specs:
            self.set_x(self.l_margin + 3)
            self.set_font("Helvetica", "B", 9)
            self.set_text_color(80, 80, 80)
            self.cell(40, 7, label)
            self.set_font("Helvetica", "", 9)
            self.cell(0, 7, val, new_x="LMARGIN", new_y="NEXT")

    # ── PAGE 5: DARK PALETTE ───────────────────────────────────────
    def page_dark_palette(self):
        self.add_page()
        self._nav_bg()
        self._section_title_dark("03  Color Palette -Dark Mode")

        self.set_font("Helvetica", "", 10)
        self.set_text_color(165, 176, 209)
        self.multi_cell(0, 5, (
            "The dark mode palette is the primary brand expression. Deep navy tones "
            "create depth while champagne gold provides premium accent highlights."
        ))
        self.ln(8)

        # Primary Navy Tones
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*self.GOLD)
        self.cell(0, 7, "Navy Foundation", new_x="LMARGIN", new_y="NEXT")
        self.ln(3)
        x0 = self.l_margin
        y0 = self.get_y()
        navies = [
            (self.NAVY, "Deep Navy", "#131835"),
            (self.NAVY_CARD, "Card BG", "#1A2142"),
            (self.NAVY_DIV, "Divider", "#2C355E"),
            ((13, 18, 41), "Mobile Nav", "#0D1229"),
        ]
        for i, (c, label, hx) in enumerate(navies):
            self._draw_swatch_dark(x0 + i * 42, y0, c, label, hx, 38, 38)

        self.set_y(y0 + 52)

        # Gold Tones
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*self.GOLD)
        self.cell(0, 7, "Gold Accents", new_x="LMARGIN", new_y="NEXT")
        self.ln(3)
        y0 = self.get_y()
        golds = [
            (self.GOLD, "Champagne", "#D0B078"),
            (self.GOLD_LIGHT, "Gold Light", "#EEDCA8"),
            (self.GOLD_DARK, "Gold Dark", "#B59458"),
            ((196, 164, 103), "Gold Alt", "#C4A467"),
        ]
        for i, (c, label, hx) in enumerate(golds):
            self._draw_swatch_dark(x0 + i * 42, y0, c, label, hx, 38, 38)

        self.set_y(y0 + 52)

        # Accent & Text Colors
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*self.GOLD)
        self.cell(0, 7, "Accent & Text", new_x="LMARGIN", new_y="NEXT")
        self.ln(3)
        y0 = self.get_y()
        accents = [
            (self.BLUE_ACCENT, "Blue Accent", "#2740A1"),
            ((165, 176, 209), "Text Secondary", "#A5B0D1"),
            ((94, 105, 143), "Text Muted", "#5E698F"),
            ((255, 255, 255), "White", "#FFFFFF"),
        ]
        for i, (c, label, hx) in enumerate(accents):
            self._draw_swatch_dark(x0 + i * 42, y0, c, label, hx, 38, 38)

    # ── PAGE 6: LIGHT PALETTE + STATUS ─────────────────────────────
    def page_light_palette(self):
        self.add_page()
        self._section_title("04  Color Palette -Light Mode & Status")

        self.set_font("Helvetica", "", 10)
        self.set_text_color(80, 80, 80)
        self.multi_cell(0, 5, (
            "Light mode uses clean whites and subtle grays, with the same navy and "
            "gold accents maintaining brand consistency across themes."
        ))
        self.ln(8)

        # Light Mode
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*self.NAVY)
        self.cell(0, 7, "Light Mode Foundation", new_x="LMARGIN", new_y="NEXT")
        self.ln(3)
        x0 = self.l_margin
        y0 = self.get_y()
        lights = [
            (self.LIGHT_BG, "Background", "#F5F6F8"),
            (self.WHITE, "Card", "#FFFFFF"),
            (self.NAVY, "Text Primary", "#131835"),
            (self.TEXT_SEC, "Text Secondary", "#6E6E73"),
            ((229, 229, 234), "Divider", "#E5E5EA"),
        ]
        for i, (c, label, hx) in enumerate(lights):
            self._draw_swatch(x0 + i * 36, y0, c, label, hx, 33, 33)

        self.set_y(y0 + 48)

        # Status Colors
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*self.NAVY)
        self.cell(0, 7, "Status Colors", new_x="LMARGIN", new_y="NEXT")
        self.ln(3)
        y0 = self.get_y()
        statuses = [
            (self.SUCCESS, "Success", "#34C759"),
            ((48, 209, 88), "Success Dark", "#30D158"),
            (self.ERROR, "Error", "#FF3B30"),
            ((255, 69, 58), "Error Dark", "#FF453A"),
        ]
        for i, (c, label, hx) in enumerate(statuses):
            self._draw_swatch(x0 + i * 42, y0, c, label, hx, 38, 38)

        self.set_y(y0 + 55)

        # Usage Note
        self.set_fill_color(250, 248, 242)
        self.set_draw_color(*self.GOLD)
        box_y = self.get_y()
        self.rect(self.l_margin, box_y, 180, 30, "FD")
        self.set_xy(self.l_margin + 5, box_y + 3)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*self.GOLD_DARK)
        self.cell(0, 5, "Usage Note", new_x="LMARGIN", new_y="NEXT")
        self.set_x(self.l_margin + 5)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(80, 80, 80)
        self.multi_cell(170, 5, (
            "Dark mode is the primary brand expression used across the main site. "
            "Light mode is used for admin panels, forms, and content-heavy pages. "
            "Always maintain proper contrast ratios (WCAG AA minimum)."
        ))

    # ── PAGE 7: TYPOGRAPHY ─────────────────────────────────────────
    def page_typography(self):
        self.add_page()
        self._section_title("05  Typography")

        self.set_font("Helvetica", "", 10)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 5, (
            "Typography pairs elegant serif headings with clean sans-serif body text. "
            "This combination reinforces the premium-yet-approachable brand personality."
        ))
        self.ln(8)

        # Display Font
        self.set_fill_color(*self.NAVY)
        box_y = self.get_y()
        self.rect(self.l_margin, box_y, 180, 52, "F")
        self.set_xy(self.l_margin + 8, box_y + 5)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*self.GOLD)
        self.cell(0, 5, "DISPLAY FONT -HEADINGS", new_x="LMARGIN", new_y="NEXT")
        self.set_x(self.l_margin + 8)
        self.set_font("Times", "B", 28)
        self.set_text_color(*self.WHITE)
        self.cell(0, 14, "Playfair Display", new_x="LMARGIN", new_y="NEXT")
        self.set_x(self.l_margin + 8)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(165, 176, 209)
        self.cell(0, 5, "Google Fonts  |  Weight: 400-900  |  Letter-spacing: -0.02em", new_x="LMARGIN", new_y="NEXT")
        self.set_x(self.l_margin + 8)
        self.set_font("Times", "", 11)
        self.set_text_color(200, 210, 230)
        self.cell(0, 5, "ABCDEFGHIJKLMNOPQRSTUVWXYZ  abcdefghijklmnopqrstuvwxyz  0123456789", new_x="LMARGIN", new_y="NEXT")

        self.set_y(box_y + 58)

        # Body Font
        self.set_fill_color(*self.LIGHT_BG)
        box_y = self.get_y()
        self.rect(self.l_margin, box_y, 180, 52, "F")
        self.set_xy(self.l_margin + 8, box_y + 5)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*self.NAVY)
        self.cell(0, 5, "BODY FONT -UI & PARAGRAPHS", new_x="LMARGIN", new_y="NEXT")
        self.set_x(self.l_margin + 8)
        self.set_font("Helvetica", "", 28)
        self.set_text_color(*self.NAVY)
        self.cell(0, 14, "Inter", new_x="LMARGIN", new_y="NEXT")
        self.set_x(self.l_margin + 8)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(120, 120, 120)
        self.cell(0, 5, "Google Fonts  |  Weight: 100-900  |  Variable font  |  CSS var: --font-inter", new_x="LMARGIN", new_y="NEXT")
        self.set_x(self.l_margin + 8)
        self.set_font("Helvetica", "", 11)
        self.set_text_color(80, 80, 80)
        self.cell(0, 5, "ABCDEFGHIJKLMNOPQRSTUVWXYZ  abcdefghijklmnopqrstuvwxyz  0123456789", new_x="LMARGIN", new_y="NEXT")

        self.set_y(box_y + 60)

        # Type Scale
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*self.NAVY)
        self.cell(0, 7, "Type Scale (Recommended)", new_x="LMARGIN", new_y="NEXT")
        self.ln(3)

        scales = [
            ("H1 -Hero", "Playfair Display", "32px / Bold", "-0.02em"),
            ("H2 -Section", "Playfair Display", "24px / Bold", "-0.02em"),
            ("H3 -Card Title", "Inter", "18px / SemiBold", "normal"),
            ("Body", "Inter", "14-16px / Regular", "normal"),
            ("Caption", "Inter", "12px / Regular", "normal"),
            ("Button", "Inter", "14px / SemiBold (600)", "normal"),
            ("Badge", "Inter", "12px / Bold / Uppercase", "tracking-wider"),
        ]
        # Table header
        self.set_fill_color(*self.NAVY)
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(*self.WHITE)
        self.cell(45, 7, "  Element", fill=True)
        self.cell(45, 7, "  Font", fill=True)
        self.cell(50, 7, "  Size / Weight", fill=True)
        self.cell(40, 7, "  Spacing", fill=True, new_x="LMARGIN", new_y="NEXT")

        for i, (el, font, size, sp) in enumerate(scales):
            bg = self.LIGHT_BG if i % 2 == 0 else self.WHITE
            self.set_fill_color(*bg)
            self.set_font("Helvetica", "B", 8)
            self.set_text_color(60, 60, 60)
            self.cell(45, 7, f"  {el}", fill=True)
            self.set_font("Helvetica", "", 8)
            self.cell(45, 7, f"  {font}", fill=True)
            self.cell(50, 7, f"  {size}", fill=True)
            self.cell(40, 7, f"  {sp}", fill=True, new_x="LMARGIN", new_y="NEXT")

    # ── PAGE 8: GRADIENTS & EFFECTS ────────────────────────────────
    def page_gradients(self):
        self.add_page()
        self._nav_bg()
        self._section_title_dark("06  Gradients & Effects")

        self.set_font("Helvetica", "", 10)
        self.set_text_color(165, 176, 209)
        self.multi_cell(0, 5, (
            "Gradients and effects add depth and premium feel. These are used "
            "sparingly on interactive elements and key brand moments."
        ))
        self.ln(8)

        # Gold Text Gradient (simulated)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*self.GOLD)
        self.cell(0, 6, "Gold Text Gradient", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)
        y0 = self.get_y()
        # Simulate gradient with strips
        w = 180
        steps = 60
        for i in range(steps):
            t = i / (steps - 1)
            if t < 0.5:
                tt = t * 2
                r = int(196 + (238 - 196) * tt)
                g = int(164 + (220 - 164) * tt)
                b = int(103 + (168 - 103) * tt)
            else:
                tt = (t - 0.5) * 2
                r = int(238 + (208 - 238) * tt)
                g = int(220 + (176 - 220) * tt)
                b = int(168 + (120 - 168) * tt)
            self.set_fill_color(r, g, b)
            self.rect(self.l_margin + i * (w / steps), y0, w / steps + 0.5, 20, "F")
        self.set_xy(self.l_margin + 5, y0 + 4)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*self.NAVY)
        self.cell(0, 5, "CSS: linear-gradient(to right, #C4A467, #EEDCA8, #D0B078)", new_x="LMARGIN", new_y="NEXT")
        self.set_x(self.l_margin + 5)
        self.cell(0, 5, "Usage: .text-gold-gradient (heading accents, premium labels)", new_x="LMARGIN", new_y="NEXT")

        self.set_y(y0 + 28)

        # Button Gradient
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*self.GOLD)
        self.cell(0, 6, "Button Primary Gradient", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)
        y0 = self.get_y()
        for i in range(steps):
            t = i / (steps - 1)
            if t < 0.5:
                tt = t * 2
                r = int(181 + (208 - 181) * tt)
                g = int(148 + (176 - 148) * tt)
                b = int(88 + (120 - 88) * tt)
            else:
                tt = (t - 0.5) * 2
                r = int(208 + (181 - 208) * tt)
                g = int(176 + (148 - 176) * tt)
                b = int(120 + (88 - 120) * tt)
            self.set_fill_color(r, g, b)
            self.rect(self.l_margin + i * (w / steps), y0, w / steps + 0.5, 20, "F")
        self.set_xy(self.l_margin + 5, y0 + 4)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*self.NAVY)
        self.cell(0, 5, "CSS: linear-gradient(135deg, #B59458 0%, #D0B078 50%, #B59458 100%)", new_x="LMARGIN", new_y="NEXT")
        self.set_x(self.l_margin + 5)
        self.cell(0, 5, "Usage: .btn-primary (CTA buttons, booking actions)", new_x="LMARGIN", new_y="NEXT")

        self.set_y(y0 + 28)

        # Glow Effects
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*self.GOLD)
        self.cell(0, 6, "Glow & Shadow Effects", new_x="LMARGIN", new_y="NEXT")
        self.ln(4)

        effects = [
            ("Gold Glow (hover)", "rgba(208, 176, 120, 0.25)", "Buttons on hover, active selections"),
            ("Card Shadow (light)", "0 4px 20px rgba(19,24,53,0.05)", "Cards in light mode"),
            ("Card Shadow (dark)", "0 4px 24px rgba(0,0,0,0.2)", "Cards in dark mode"),
            ("Glass Surface", "rgba(255,255,255,0.03)", "Glassmorphism overlays"),
            ("Backdrop Blur", "backdrop-blur-xl", "Mobile nav, modals"),
        ]
        for name, val, usage in effects:
            self.set_x(self.l_margin + 3)
            self.set_font("Helvetica", "B", 9)
            self.set_text_color(*self.GOLD_LIGHT)
            self.cell(55, 6, name)
            self.set_font("Helvetica", "", 8)
            self.set_text_color(165, 176, 209)
            self.cell(0, 6, f"{val}  - {usage}", new_x="LMARGIN", new_y="NEXT")
            self.ln(1)

    # ── PAGE 9: UI COMPONENTS ──────────────────────────────────────
    def page_components(self):
        self.add_page()
        self._section_title("07  UI Components")

        components = [
            ("Buttons (.btn-primary)", [
                "Shape: Pill (rounded-full)",
                "Background: Gold gradient (135deg, #B59458 -> #D0B078 -> #B59458)",
                "Text: #131835 (deep navy), SemiBold 600",
                "Hover: translateY(-1px) + gold glow shadow",
                "Transition: all 0.3s ease",
                "Padding: px-6 py-3 (approx 24px 12px)",
            ]),
            ("Cards", [
                "Border Radius: 24px (rounded-[24px])",
                "Background: var(--card) -white (light) / #1A2142 (dark)",
                "Border: 1px solid var(--divider)",
                "Shadow: var(--shadow-card) -theme-aware",
            ]),
            ("Glass Card (.glass-card)", [
                "Background: rgba(255,255,255,0.03)",
                "Backdrop: blur(12px)",
                "Border: 1px solid rgba(255,255,255,0.06)",
                "Shadow: 0 8px 32px rgba(0,0,0,0.12)",
            ]),
            ("Badges / Tags", [
                "Background: var(--accent-gold) #D0B078",
                "Text: #131835, Bold, Uppercase",
                "Size: text-xs, px-3 py-1",
                "Shape: rounded-full",
                "Letter Spacing: tracking-wider",
            ]),
            ("Toggle / Switch", [
                "Active: bg-green-500, border-green-400",
                "Inactive: bg-[#2A3155], border-[#3D4F7C]",
                "Border: 2px solid",
                "Transition: duration-200 ease-in-out",
            ]),
            ("Mobile Bottom Nav", [
                "Background: #0D1229/90 + backdrop-blur-xl",
                "Border: border-t border-white/[0.06]",
                "Divider: gradient from-transparent via-accent-gold/40 to-transparent",
            ]),
        ]

        for name, props in components:
            self.set_font("Helvetica", "B", 11)
            self.set_text_color(*self.NAVY)
            self.cell(0, 8, name, new_x="LMARGIN", new_y="NEXT")
            for p in props:
                self.set_x(self.l_margin + 5)
                self.set_font("Helvetica", "", 9)
                self.set_text_color(80, 80, 80)
                self.cell(3, 5, "-")
                self.cell(0, 5, f"  {p}", new_x="LMARGIN", new_y="NEXT")
            self.ln(3)

    # ── PAGE 10: PAGE INVENTORY ────────────────────────────────────
    def page_inventory(self):
        self.add_page()
        self._section_title("08  Page Inventory")

        self.set_font("Helvetica", "", 10)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 5, (
            "All pages use the /[lang]/ prefix for bilingual routing (en/es). "
            "Below is the complete page inventory organized by user role."
        ))
        self.ln(6)

        groups = [
            ("Public Pages", [
                ("/[lang]/ -Home (hero, services, CTA)",),
                ("/[lang]/services -Service catalog",),
                ("/[lang]/about -About us",),
                ("/[lang]/contact -Contact form",),
                ("/[lang]/faq -Frequently asked questions",),
                ("/[lang]/blog -Blog (HyGraph CMS)",),
                ("/[lang]/contractors -Contractor directory",),
            ]),
            ("Customer Flow", [
                ("/[lang]/login -Customer login",),
                ("/[lang]/register -Customer registration",),
                ("/[lang]/booking/* -6-step booking wizard",),
                ("/[lang]/dashboard -Customer dashboard",),
                ("/[lang]/dashboard/orders -Order history",),
            ]),
            ("Contractor Portal", [
                ("/[lang]/contractor/login -Contractor login",),
                ("/[lang]/contractors/apply -Application form",),
                ("/[lang]/contractor/dashboard -Contractor dashboard",),
                ("/[lang]/contractor/bookings -Manage bookings",),
                ("/[lang]/contractor/profile -Profile settings",),
            ]),
            ("Admin Panel", [
                ("/[lang]/admin/login -Admin login",),
                ("/[lang]/admin/dashboard -Stats overview",),
                ("/[lang]/admin/bookings -Booking management",),
                ("/[lang]/admin/contractors -Contractor management",),
                ("/[lang]/admin/services -Service management",),
            ]),
        ]

        for group_name, pages in groups:
            self.set_font("Helvetica", "B", 10)
            self.set_text_color(*self.GOLD_DARK)
            self.cell(0, 7, group_name, new_x="LMARGIN", new_y="NEXT")
            self.ln(1)
            for (page,) in pages:
                parts = page.split(" -")
                self.set_x(self.l_margin + 3)
                self.set_font("Courier", "", 8)
                self.set_text_color(*self.NAVY)
                self.cell(70, 5, parts[0])
                if len(parts) > 1:
                    self.set_font("Helvetica", "", 8)
                    self.set_text_color(120, 120, 120)
                    self.cell(0, 5, parts[1])
                self.ln(5)
            self.ln(3)

    def generate(self):
        self.page_cover()
        self.page_toc()
        self.page_brand_overview()
        self.page_logo()
        self.page_dark_palette()
        self.page_light_palette()
        self.page_typography()
        self.page_gradients()
        self.page_components()
        self.page_inventory()
        self.output(OUTPUT)
        print(f"PDF generated: {OUTPUT}")


if __name__ == "__main__":
    pdf = BrandGuidePDF()
    pdf.generate()
