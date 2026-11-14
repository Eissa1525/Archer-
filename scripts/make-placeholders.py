"""
Generates the ORIGINAL placeholder images shipped in public/img/ (no third-party content).
Each placeholder has the same file name and size as the photo it stands for, and says what
photo belongs there, so buyers know exactly what to shoot.

  python3 scripts/make-placeholders.py        (needs Pillow; DejaVu fonts if available)
"""
import math
import os
import sys
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/img'
BROWN, BROWN_SOFT, CREAM, ORANGE, YELLOW = (59, 18, 0), (90, 34, 7), (255, 240, 220), (255, 138, 0), (255, 197, 51)

# name: (size, kind, title, hint)
SPEC = {
    'hero-pizza': ((1000, 1000), 'round', 'HERO DISH 1', 'Round plate · shot from above\ntransparent background (cut-out)'),
    'hero-burger': ((1000, 767), 'free', 'HERO DISH 2', 'Burger or tall dish · side view\ntransparent background (cut-out)'),
    'hero-tacos': ((1000, 1000), 'round', 'HERO DISH 3', 'Round plate · shot from above\ntransparent background (cut-out)'),
    'about-spread': ((800, 1200), 'photo', 'ABOUT 1', 'Table spread · portrait'),
    'about-burger': ((1200, 997), 'photo', 'ABOUT 2', 'Signature dish · close-up'),
    'about-crowd': ((1200, 800), 'photo', 'ABOUT 3', 'Guests or team · landscape'),
    'about-fries': ((1200, 800), 'photo', 'ABOUT 4', 'Side dish · landscape'),
    'dish-wrap': ((820, 820), 'square', 'SPECIAL 1', 'Square · dish centred'),
    'dish-wings': ((820, 820), 'square', 'SPECIAL 2', 'Square · dish centred'),
    'dish-rings': ((820, 820), 'square', 'SPECIAL 3', 'Square · dish centred'),
    'dish-chicken': ((820, 820), 'square', 'SPECIAL 4', 'Square · dish centred'),
    'dish-hotdog': ((820, 820), 'square', 'SPECIAL 5', 'Square · dish centred'),
    'dish-smash': ((820, 820), 'square', 'SPECIAL 6', 'Square · dish centred'),
    'feature-burger': ((871, 1200), 'photo', 'FEATURE', 'Hero product · portrait'),
    'gallery-diner': ((960, 1200), 'photo', 'GALLERY 1', 'Dining room · portrait'),
    'gallery-tacos': ((1200, 779), 'photo', 'GALLERY 2', 'Food · landscape'),
    'gallery-truck': ((1200, 930), 'photo', 'GALLERY 3', 'Storefront or truck'),
    'gallery-steak': ((1200, 800), 'photo', 'GALLERY 4', 'Food · landscape'),
    'gallery-shawarma': ((583, 1200), 'photo', 'GALLERY 5', 'Kitchen action · tall'),
    'gallery-ribs': ((1200, 801), 'photo', 'GALLERY 6', 'Food · landscape'),
    'gallery-burgerfries': ((1200, 800), 'photo', 'GALLERY 7', 'Food · landscape'),
    'gallery-bar': ((1200, 900), 'photo', 'GALLERY 8', 'Bar or drinks'),
    'order-burger': ((1200, 800), 'photo', 'ORDER 1', 'Takeaway dish'),
    'order-pepperoni': ((1200, 795), 'photo', 'ORDER 2', 'Takeaway dish'),
    'order-shake': ((800, 1200), 'photo', 'ORDER 3', 'Drink · portrait'),
    'order-tacos': ((1200, 800), 'photo', 'ORDER 4', 'Takeaway dish'),
}


def font(size, bold=True):
    for path in (
        f"/usr/share/fonts/truetype/dejavu/DejaVuSans{'-Bold' if bold else ''}.ttf",
        f"/usr/share/fonts/truetype/liberation/LiberationSans-{'Bold' if bold else 'Regular'}.ttf",
        f"/Library/Fonts/Arial{' Bold' if bold else ''}.ttf",
        f"C:/Windows/Fonts/arial{'bd' if bold else ''}.ttf",
    ):
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def camera(d, cx, cy, s, colour):
    w, h = s * 1.6, s * 1.1
    d.rounded_rectangle([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], radius=s * 0.18, outline=colour, width=max(3, int(s * 0.09)))
    d.rounded_rectangle([cx - s * 0.32, cy - h / 2 - s * 0.22, cx + s * 0.32, cy - h / 2 + 2], radius=s * 0.08, outline=colour, width=max(3, int(s * 0.09)))
    r = s * 0.33
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=colour, width=max(3, int(s * 0.09)))


def text_block(d, cx, cy, w, title, hint, size_label, fg, sub, max_w=None):
    max_w = max_w or w * 0.8
    scale = 1.0
    while True:  # shrink until the widest line fits
        tf = font(max(12, int(w * 0.075 * scale)))
        hf = font(max(10, int(w * 0.034 * scale)), bold=False)
        lines = [(title, tf, fg)] + [(l, hf, sub) for l in hint.split('\n')] + [(size_label, hf, sub)]
        if max(d.textlength(t, font=f) for t, f, _ in lines) <= max_w or scale < 0.3:
            break
        scale *= 0.92
    heights = [d.textbbox((0, 0), t, font=f)[3] for t, f, _ in lines]
    total = sum(heights) + 10 * (len(lines) - 1)
    y = cy - total / 2
    for (t, f, c), h in zip(lines, heights):
        tw = d.textlength(t, font=f)
        d.text((cx - tw / 2, y), t, font=f, fill=c)
        y += h + 10


def make(name, size, kind, title, hint):
    W, H = size
    S = 2  # supersample for smooth edges
    w, h = W * S, H * S
    label = f'{W} × {H} px · public/img/{name}.webp'
    if kind in ('round', 'free'):
        im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        if kind == 'round':
            m = int(w * 0.02)
            d.ellipse([m, m, w - m, h - m], fill=CREAM + (255,))
            r2 = int(w * 0.08)
            d.ellipse([r2, r2, w - r2, h - r2], fill=BROWN_SOFT + (255,))
            # dashed inner circle
            cx, cy, rr = w / 2, h / 2, w * 0.36
            for a in range(0, 360, 8):
                a1, a2 = math.radians(a), math.radians(a + 4)
                d.line([(cx + rr * math.cos(a1), cy + rr * math.sin(a1)), (cx + rr * math.cos(a2), cy + rr * math.sin(a2))], fill=ORANGE + (255,), width=6)
        else:
            d.rounded_rectangle([w * 0.06, h * 0.08, w * 0.94, h * 0.92], radius=int(h * 0.3), fill=BROWN_SOFT + (255,), outline=CREAM + (255,), width=int(w * 0.02))
        camera(d, w / 2, h * 0.32, w * 0.07, YELLOW + (255,))
        text_block(d, w / 2, h * 0.6, w, title, hint, label, CREAM + (255,), (255, 225, 190, 255), max_w=w * (0.62 if kind == 'round' else 0.78))
    else:
        im = Image.new('RGB', (w, h), BROWN)
        d = ImageDraw.Draw(im)
        # soft diagonal stripes
        step = int(max(w, h) * 0.06)
        for x in range(-h, w, step):
            d.line([(x, 0), (x + h, h)], fill=(68, 22, 2), width=step // 3)
        inset = int(min(w, h) * 0.05)
        d.rounded_rectangle([inset, inset, w - inset, h - inset], radius=int(min(w, h) * 0.04), outline=ORANGE, width=max(4, int(min(w, h) * 0.008)))
        camera(d, w / 2, h * 0.38, min(w, h) * 0.08, YELLOW)
        text_block(d, w / 2, h * 0.62, max(min(w, h) * 1.15, w * 0.9), title, hint + '\nreplace with your own photo', label, CREAM, (255, 210, 160), max_w=w * 0.82)
    im = im.resize((W, H), Image.LANCZOS)
    im.save(os.path.join(OUT, f'{name}.webp'), 'WEBP', quality=82, method=6)


os.makedirs(OUT, exist_ok=True)
for n, (sz, kind, t, hnt) in SPEC.items():
    make(n, sz, kind, t, hnt)
print(f'{len(SPEC)} placeholders written to {OUT}')
