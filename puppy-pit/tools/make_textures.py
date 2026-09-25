"""Generate tileable paper / pigment textures used by the renderer (src/tex/*.png)."""
import numpy as np, pathlib
from PIL import Image
from scipy import ndimage as ndi

OUT = pathlib.Path(__file__).resolve().parent.parent / "src/tex"
rng = np.random.default_rng(7)
N = 1024

def tile_noise(n, sigma):
    """Gaussian-filtered white noise with wrap-around => seamless."""
    x = rng.standard_normal((n, n))
    y = ndi.gaussian_filter(x, sigma, mode="wrap")
    return (y - y.mean()) / (y.std() + 1e-9)

def fbm(n, sigmas, weights):
    return sum(w * tile_noise(n, s) for s, w in zip(sigmas, weights))

# --- paper: fine tooth + soft cloudy variation + a few fibres ------------------
tooth = fbm(N, [0.6, 1.2, 2.5], [0.5, 0.35, 0.25])
cloud = fbm(N, [40, 90], [0.6, 0.4])
fib = np.zeros((N, N))
for _ in range(900):
    x0, y0 = rng.integers(0, N, 2); ang = rng.uniform(0, np.pi); L = rng.integers(8, 40)
    t = np.linspace(0, 1, L * 2)
    xs = (x0 + np.cos(ang) * L * t).astype(int) % N; ys = (y0 + np.sin(ang) * L * t).astype(int) % N
    fib[ys, xs] += rng.uniform(0.3, 1.0)
fib = ndi.gaussian_filter(fib, 0.7, mode="wrap")
paper = 1.0 - 0.035 * tooth - 0.02 * cloud - 0.05 * fib / (fib.max() + 1e-9)
paper = np.clip(paper, 0, 1)
Image.fromarray((paper * 255).astype(np.uint8), "L").save(OUT / "paper.png")

# --- grain: per-frame film/paper grain tiles (several so we can cycle) -----------
for k in range(6):
    g = fbm(512, [0.5, 1.0], [0.7, 0.3])
    g = np.clip(128 + 26 * g, 0, 255).astype(np.uint8)
    Image.fromarray(g, "L").save(OUT / f"grain{k}.png")

# --- pigment mottle (mid grey, used with soft-light / multiply) ----------------
m = fbm(N, [6, 18, 45], [0.35, 0.4, 0.5])
m = np.clip(128 + 38 * m / np.abs(m).max() * 2.2, 0, 255).astype(np.uint8)
Image.fromarray(m, "L").save(OUT / "mottle.png")

# --- dry-brush streaks (horizontal-ish), for fence boards / walls --------------
s = rng.standard_normal((N, N))
s = ndi.gaussian_filter(s, (0.8, 22), mode="wrap")  # streaky along x
s = (s - s.mean()) / s.std()
s = np.clip(128 + 30 * s, 0, 255).astype(np.uint8)
Image.fromarray(s, "L").save(OUT / "streak.png")
print("textures written to", OUT)
