"""Contact sheets from rendered frames: N samples per shot, several shots per sheet.
usage: review_sheets.py outdir [--per 4] [--shots-per-sheet 6] [--only id,id]"""
import sys, json, subprocess, pathlib
from PIL import Image, ImageDraw
ROOT = pathlib.Path(__file__).resolve().parent.parent
args = sys.argv[1:]
outdir = pathlib.Path(args[0]); outdir.mkdir(parents=True, exist_ok=True)
per = int(args[args.index('--per') + 1]) if '--per' in args else 4
sps = int(args[args.index('--shots-per-sheet') + 1]) if '--shots-per-sheet' in args else 6
only = args[args.index('--only') + 1].split(',') if '--only' in args else None
js = "import('./src/timeline.js').then(m => console.log(JSON.stringify(m.SHOTS.map(s => [s.id, s.start, s.end]))))"
shots = json.loads(subprocess.run(["node", "--input-type=module", "-e", js], cwd=ROOT, capture_output=True, text=True).stdout)
if only: shots = [s for s in shots if s[0] in only]
W = 400; H = 225
frames = ROOT / "out/frames"
for si in range(0, len(shots), sps):
    group = shots[si:si + sps]
    sheet = Image.new('RGB', (per * W, len(group) * (H + 18)), (16, 16, 16))
    d = ImageDraw.Draw(sheet)
    for r, (sid, a, b) in enumerate(group):
        for c in range(per):
            t = a + (b - a) * (c + 0.5) / per
            n = int(t * 24)
            f = frames / f"f{n:05d}.jpg"
            if not f.exists(): continue
            im = Image.open(f).convert('RGB').resize((W, H))
            sheet.paste(im, (c * W, r * (H + 18) + 18))
            d.text((c * W + 4, r * (H + 18) + 3), f"{sid} {t:.2f}s", fill=(220, 220, 220))
    sheet.save(outdir / f"review_{si // sps:02d}.png")
    print(outdir / f"review_{si // sps:02d}.png")
