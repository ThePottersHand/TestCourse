"""Render the film (or a slice of it) to frames with headless Chromium, then
encode with the voice track.

  python3 tools/render.py --scale 0.6667 --review          # 720p review cut
  python3 tools/render.py --scale 1 --png                  # 1080p master frames
  python3 tools/render.py --shots reading,smell --no-encode  # re-render a few shots

Frames land in out/frames/ (one file per frame, so shots can be re-rendered
individually); the encoder always reads the full sequence.
Needs: `python3 -m http.server 8765 --directory src` running.
"""
import argparse, asyncio, json, math, os, pathlib, subprocess, sys, time
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
URL = "http://localhost:8765/film.html"


async def film_info(p):
    b = await p.chromium.launch(executable_path=CHROME)
    pg = await b.new_page(viewport={"width": 1920, "height": 1080})
    await pg.goto(URL)
    await pg.wait_for_function("window.__ready === true", timeout=60000)
    info = await pg.evaluate("window.FILM")
    await b.close()
    return info


async def worker(p, wid, frames, a, outdir, stats):
    b = await p.chromium.launch(executable_path=CHROME)
    pg = await b.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=a.scale)
    pg.on("pageerror", lambda e: print(f"[w{wid}] pageerror:", e, flush=True))
    await pg.goto(URL + ("?review=1" if a.review else ""))
    await pg.wait_for_function("window.__ready === true", timeout=60000)
    cdp = await pg.context.new_cdp_session(pg)
    fmt = {"format": "png"} if a.png else {"format": "jpeg", "quality": a.quality}
    ext = "png" if a.png else "jpg"
    import base64
    for n in frames:
        t = n / a.fps
        await pg.evaluate(f"window.seek({t:.6f})")
        shot = await cdp.send("Page.captureScreenshot", fmt)
        (outdir / f"f{n:05d}.{ext}").write_bytes(base64.b64decode(shot["data"]))
        stats["done"] += 1
    await b.close()


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scale", type=float, default=0.6667)
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--review", action="store_true")
    ap.add_argument("--png", action="store_true")
    ap.add_argument("--quality", type=int, default=92)
    ap.add_argument("--from", dest="t0", type=float, default=None)
    ap.add_argument("--to", dest="t1", type=float, default=None)
    ap.add_argument("--shots", default=None)
    ap.add_argument("--out", default=str(ROOT / "out"))
    ap.add_argument("--audio", default=str(ROOT / "audio/the_puppy_pit.mp3"))
    ap.add_argument("--name", default="puppy_pit_review.mp4")
    ap.add_argument("--no-encode", action="store_true")
    ap.add_argument("--crf", type=int, default=20)
    a = ap.parse_args()
    out = pathlib.Path(a.out); frames_dir = out / "frames"; frames_dir.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        info = await film_info(p)
        total = int(math.floor(info["DURATION"] * a.fps))
        want = set()
        if a.shots:
            ids = a.shots.split(",")
            for s in info["SHOTS"]:
                if s["id"] in ids:
                    want.update(range(int(math.floor(s["start"] * a.fps)), min(total, int(math.ceil(s["end"] * a.fps)))))
        else:
            f0 = 0 if a.t0 is None else int(a.t0 * a.fps)
            f1 = total if a.t1 is None else min(total, int(a.t1 * a.fps))
            want.update(range(f0, f1))
        frames = sorted(want)
        print(f"rendering {len(frames)} frames of {total} ({a.workers} workers, scale {a.scale})", flush=True)
        # contiguous blocks per worker keep each worker's shot cache warm
        k = math.ceil(len(frames) / a.workers)
        blocks = [frames[i * k:(i + 1) * k] for i in range(a.workers) if frames[i * k:(i + 1) * k]]
        stats = {"done": 0}
        t0 = time.time()

        async def progress():
            while stats["done"] < len(frames):
                await asyncio.sleep(20)
                el = time.time() - t0
                rate = stats["done"] / max(el, 1e-6)
                print(f"  {stats['done']}/{len(frames)}  {rate:.2f} f/s  eta {(len(frames) - stats['done']) / max(rate, 1e-6) / 60:.1f} min", flush=True)

        prog = asyncio.create_task(progress())
        await asyncio.gather(*[worker(p, i, blk, a, frames_dir, stats) for i, blk in enumerate(blocks)])
        prog.cancel()
        print(f"frames done in {(time.time() - t0) / 60:.1f} min", flush=True)

    if a.no_encode:
        return
    ext = "png" if a.png else "jpg"
    missing = [n for n in range(total) if not (frames_dir / f"f{n:05d}.{ext}").exists()]
    if missing:
        print(f"not encoding: {len(missing)} frames missing (first {missing[:5]})")
        return
    pre_ms = int(round(info["PRE"] * 1000))
    dur = total / a.fps
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(a.fps), "-i", str(frames_dir / f"f%05d.{ext}"),
           "-i", a.audio, "-filter_complex",
           f"[1:a]aresample=48000,afade=t=out:st=150.55:d=0.35,adelay={pre_ms}|{pre_ms},apad,atrim=0:{dur:.3f}[a]",
           "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", str(a.crf),
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "192k", str(out / a.name)]
    print(" ".join(cmd), flush=True)
    subprocess.run(cmd, check=True)
    print("wrote", out / a.name)

asyncio.run(main())
