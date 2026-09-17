from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"


def make_icon(size: int, filename: str, safe_area: float) -> None:
    icon = Image.new("RGBA", (size, size), "#d7eefc")
    draw = ImageDraw.Draw(icon)
    draw.ellipse(
        (size * 0.06, size * 0.06, size * 0.94, size * 0.94),
        fill="#f4dfaa",
    )
    center = size / 2
    width = size * safe_area
    height = width * 0.62
    left = center - width / 2
    top = center - height / 2 + size * 0.035
    right = center + width / 2
    bottom = center + height / 2 + size * 0.035
    outline = max(2, round(size * 0.018))

    draw.rounded_rectangle((left, top, center, bottom), radius=outline * 2, fill="#542619", outline="#35150f", width=outline)
    draw.rounded_rectangle((center, top, right, bottom), radius=outline * 2, fill="#542619", outline="#35150f", width=outline)
    inset = size * 0.035
    draw.polygon(
        [(left + inset, top + inset), (center - outline, top + inset * 1.6), (center - outline, bottom - inset), (left + inset, bottom - inset * 1.4)],
        fill="#fff0c3",
        outline="#c58a36",
    )
    draw.polygon(
        [(center + outline, top + inset * 1.6), (right - inset, top + inset), (right - inset, bottom - inset * 1.4), (center + outline, bottom - inset)],
        fill="#fff0c3",
        outline="#c58a36",
    )
    draw.line((center, top + inset, center, bottom - inset), fill="#d5a13b", width=outline)
    # A centered W remains readable even at home-screen icon size.
    try:
        from PIL import ImageFont
        font = ImageFont.truetype("arialbd.ttf", round(size * 0.25))
    except OSError:
        font = None
    draw.text((center, center + size * 0.015), "W", fill="#d49d2f", font=font, anchor="mm", stroke_width=max(1, outline // 3), stroke_fill="#6f3b1e")
    icon.convert("RGB").save(PUBLIC / filename, quality=95)


if __name__ == "__main__":
    PUBLIC.mkdir(parents=True, exist_ok=True)
    make_icon(192, "pwa-icon-192.png", 0.82)
    make_icon(512, "pwa-icon-512.png", 0.82)
    make_icon(512, "pwa-icon-maskable-512.png", 0.68)
    make_icon(180, "apple-touch-icon.png", 0.78)
