"""Tile PNG/JPG frames into one contact sheet: contact.py out.png a.png b.png ... [--cols 2 --w 800]"""
import sys
from PIL import Image, ImageDraw, ImageFont
args = sys.argv[1:]
cols, w = 2, 800
if '--cols' in args: i = args.index('--cols'); cols = int(args[i + 1]); del args[i:i + 2]
if '--w' in args: i = args.index('--w'); w = int(args[i + 1]); del args[i:i + 2]
out, files = args[0], args[1:]
h = int(w * 9 / 16)
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + 24)), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for k, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    x, y = (k % cols) * w, (k // cols) * (h + 24)
    sheet.paste(im, (x, y + 24))
    d.text((x + 6, y + 5), f.split('/')[-1], fill=(230, 230, 230))
sheet.save(out)
