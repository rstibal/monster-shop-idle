"""Draws the app icons in icons/ (run: python tools/make_icons.py; needs Pillow).

A little shop stall at night with a striped awning, a crescent moon, and two eyes glowing in the dark behind the counter.
Colors are the Haunted Mall skin's. Everything sits inside the middle 80% so Android can crop it to a circle (maskable).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

S = 1024                      # drawn big, then scaled down for smooth edges
BG, GLOW, DEEP, PANEL, EDGE = "#141a26", "#243049", "#0e131c", "#1d2536", "#3a4763"
MOON, STRIPE_A, STRIPE_B, TRIM, EYE = "#cfe3ff", "#cfe3ff", "#6fd1e0", "#7f9cc7", "#e6c07b"


def draw():
    img = Image.new("RGB", (S, S), BG)

    # soft light behind the stall
    glow = Image.new("L", (S, S), 0)
    ImageDraw.Draw(glow).ellipse((170, 180, 854, 820), fill=255)
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    img = Image.composite(Image.new("RGB", (S, S), GLOW), img, glow)
    d = ImageDraw.Draw(img)

    # crescent moon, top right
    moon = Image.new("L", (S, S), 0)
    md = ImageDraw.Draw(moon)
    md.ellipse((650, 150, 810, 310), fill=255)
    md.ellipse((610, 125, 760, 275), fill=0)
    img.paste(MOON, mask=moon)

    # stall: posts, dark window, counter
    left, right, top, bottom = 250, 774, 470, 790
    d.rectangle((left + 20, top, right - 20, bottom), fill=DEEP)
    d.rectangle((left, top, left + 34, bottom), fill=EDGE)
    d.rectangle((right - 34, top, right, bottom), fill=EDGE)

    # eyes glowing behind the counter
    for cx in (440, 584):
        eye = Image.new("L", (S, S), 0)
        ImageDraw.Draw(eye).ellipse((cx - 62, 560, cx + 62, 680), fill=150)
        eye = eye.filter(ImageFilter.GaussianBlur(28))
        img = Image.composite(Image.new("RGB", (S, S), EYE), img, eye)
    d = ImageDraw.Draw(img)
    for cx in (440, 584):
        d.ellipse((cx - 40, 585, cx + 40, 655), fill=EYE)
        d.ellipse((cx - 9, 590, cx + 9, 650), fill=DEEP)

    # counter
    d.rectangle((left - 20, 700, right + 20, 800), fill=PANEL)
    d.rectangle((left - 20, 700, right + 20, 716), fill=TRIM)

    # striped awning with a scalloped edge
    a_top, a_bot, n = 360, 470, 7
    w = (right + 30 - (left - 30)) / n
    for k in range(n):
        x0 = left - 30 + k * w
        c = STRIPE_A if k % 2 == 0 else STRIPE_B
        d.polygon([(x0 + 10, a_top), (x0 + w + 10, a_top), (x0 + w, a_bot), (x0, a_bot)], fill=c)
        d.ellipse((x0, a_bot - w / 2, x0 + w, a_bot + w / 2), fill=c)
    d.rectangle((left - 20, a_top - 24, right + 40, a_top + 4), fill=TRIM)
    return img


def main():
    out = Path(__file__).resolve().parent.parent / "icons"
    out.mkdir(exist_ok=True)
    big = draw()
    for name, size in [("icon-512.png", 512), ("icon-192.png", 192), ("apple-touch-icon.png", 180), ("favicon-32.png", 32)]:
        big.resize((size, size), Image.LANCZOS).save(out / name, optimize=True)
    print("wrote", out)


if __name__ == "__main__":
    main()
