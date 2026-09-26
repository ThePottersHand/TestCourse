# The Puppy Pit — animated short

Animation for the monologue *The Puppy Pit* (152.6 s voice track, `audio/the_puppy_pit.mp3`).

Style: grounded British picture-book realism. Muted, overcast palette with gouache and paper
texture, and still, deadpan compositions. The golden puppies carry the only saturated colour.
Two lighting worlds: the overcast day it happened (then dusk for the rescue), and the golden
evening of the present day, which bookends the film.

## Layout
- `src/` — the film, drawn as SVG in headless Chromium
  - `lib/` hand-cut edges, gouache filters, camera projection, animation helpers, palette
  - `chars/` narrator (profile, front and back rigs), puppies (side/front/top views), Colin, his
    daughter; `limbs.js` gives two-point arms for poses where hands must land exactly (hauling)
  - `props/` sign, shoe, ladder, rope cordon, blanket · `env/` garden kit (fence, lawn, pit, houses)
  - `shots/` one module per sequence; `timeline.js` is the cut (every cut/action keyed to words)
  - `film.html?shot=<id>&dt=<sec>` renders any frame; `?review=1` burns in timecode
- `tools/`
  - `render.py` — parallel frame render + encode with the voice (offset by the 3 s pre-roll)
  - `snap.py` — single frame · `contact.py` — contact sheets · `shotlist.py` — shot timecodes
  - `align.py` / `make_timing.py` — script ↔ Whisper word timing → `src/data/timing.js`
- `timing/` — Whisper word timestamps and per-line timing
- `concepts/` — the two approved concept frames

## Render
```
python3 -m http.server 8765 --directory src &
python3 tools/render.py --scale 0.6667 --review --name puppy_pit_review.mp4   # 720p + timecode
python3 tools/render.py --scale 1 --png --crf 16 --name puppy_pit_1080p.mp4   # master
python3 tools/render.py --shots reading,smell --no-encode                    # re-render shots
```
Outputs land in `out/` (git-ignored).

## Staging rules worth keeping
- The literal pit is never seen before the line that reveals it: the film opens on him alone
  on a lawn, the hole appears on "An actual hole in the ground", the puppies on "puppies".
- The sign faces the pit (you can only read it with your back to the hole). `signMatrix()` in
  `shots/common.js` places it from its real position and facing for each camera.
- Anything in the pit is nearer the camera than the far wall, so the far rim's grass fringe is
  drawn behind the characters; people beyond the rim are clipped at the rim line instead.

## Notes
- The recording ends on "Recognition." — the last line of the text, "They're waiting for the
  sequel.", is set as the end card. A short stray sound at 151 s (after the last word) is faded out.
