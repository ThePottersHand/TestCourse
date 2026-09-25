"""Render an HTML page (optionally at time t) to a PNG with headless Chromium.

usage: python3 tools/snap.py page.html out.png [--t SECONDS] [--w 1920 --h 1080] [--scale 1]
The page may define window.seek(t) (returning a Promise or value) and should set
window.__ready = true once fonts/assets are loaded.
"""
import argparse, asyncio, pathlib
from playwright.async_api import async_playwright

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("page"); ap.add_argument("out")
    ap.add_argument("--t", type=float, default=None)
    ap.add_argument("--w", type=int, default=1920); ap.add_argument("--h", type=int, default=1080)
    ap.add_argument("--scale", type=float, default=1)
    ap.add_argument("--query", default="")
    a = ap.parse_args()
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=["--disable-web-security", "--allow-file-access-from-files"])
        pg = await b.new_page(viewport={"width": a.w, "height": a.h}, device_scale_factor=a.scale)
        pg.on("console", lambda m: print("console:", m.text))
        pg.on("pageerror", lambda e: print("pageerror:", e))
        url = (a.page if a.page.startswith("http") else pathlib.Path(a.page).resolve().as_uri()) + (("?" + a.query) if a.query else "")
        await pg.goto(url)
        await pg.wait_for_function("window.__ready === true", timeout=20000)
        if a.t is not None:
            await pg.evaluate(f"window.seek({a.t})")
        await pg.screenshot(path=a.out)
        await b.close()

asyncio.run(main())
