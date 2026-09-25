# The Puppy Pit — animated short

Animation for the monologue *The Puppy Pit* (152.6 s voice track).

Style: grounded British picture-book realism. Muted, overcast palette with gouache and paper
texture, and still, deadpan compositions. The golden puppies carry the only saturated colour.

## Layout
- `src/` — the film, drawn as SVG in the browser (cut-out rigs, environments, scenes)
  - `lib/` core helpers (hand-cut edges, gouache filters, camera projection), palette
  - `chars/` narrator, puppies, Colin · `props/` sign, shoe · `env/` garden kit
  - `scenes/` one module per shot · `frame.html?scene=<name>&t=<sec>` renders a frame
- `tools/` — `align.py` (script ↔ Whisper word timing), `snap.py` (headless frame render),
  `make_textures.py` (paper/grain textures)
- `timing/` — Whisper word timestamps and per-line timing of the script
- `concepts/` — concept frames

## Preview a frame
```
python3 -m http.server 8765 --directory src &
python3 tools/snap.py "http://localhost:8765/frame.html" out.png --query "scene=sign&t=1"
```
