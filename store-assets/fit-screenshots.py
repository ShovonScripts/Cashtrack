"""Fit phone screenshots into 1080x1920 (9:16) for Google Play.

Put the raw screenshots in store-assets/raw, then run:
    python store-assets/fit-screenshots.py
Results go to store-assets/screenshots. The same files work for the phone,
7-inch and 10-inch tablet slots.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).parent
W, H = 1080, 1920
TOP, BOTTOM, RADIUS = (40, 10, 110), (0, 40, 170), 48

def background():
    bg = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(bg)
    for y in range(H):
        t = y / (H - 1)
        d.line([(0, y), (W, y)], fill=tuple(int(TOP[i] * (1 - t) + BOTTOM[i] * t) for i in range(3)))
    return bg.convert('RGBA')

out = HERE / 'screenshots'
out.mkdir(exist_ok=True)
files = sorted(p for p in (HERE / 'raw').iterdir() if p.suffix.lower() in {'.png', '.jpg', '.jpeg'})
for n, path in enumerate(files, 1):
    shot = Image.open(path).convert('RGBA')
    scale = min((W - 120) / shot.width, (H - 120) / shot.height)
    shot = shot.resize((round(shot.width * scale), round(shot.height * scale)), Image.LANCZOS)
    mask = Image.new('L', shot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *shot.size), RADIUS, fill=255)
    x, y = (W - shot.width) // 2, (H - shot.height) // 2
    canvas = background()
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((x, y + 16, x + shot.width, y + shot.height + 16), RADIUS, fill=(0, 0, 30, 150))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(24)))
    canvas.paste(shot, (x, y), mask)
    target = out / f'{n:02d}-{path.stem}.png'
    canvas.convert('RGB').save(target, optimize=True)
    print(target.name)
print(f'{len(files)} screenshot(s) ready in {out}')
