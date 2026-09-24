# The Art of Making Up My Mind: watercolour music video

A painterly, heavily stylised watercolour animation for the song *The Art of Making Up My Mind*,
which is Elizabeth Bennet's running argument with herself about Mr Darcy.

**Status: concept still, awaiting sign-off.** The animated code version comes next, then the final video.

![Concept still](concept/concept-still.png)

## Concept

- **Regency silhouettes painted in wash.** Profile silhouettes were the portrait form of Austen's era,
  and the single's cover art is also a silhouette. Here they are painted as wet watercolour instead of cut paper.
- **Two warring pigments.** Elizabeth is rose madder ("maybe I like him") and Darcy is indigo
  ("maybe I hate him"). Where the two meet they bleed into violet. The teal sky and cream clouds
  come from the cover art.
- **The art of making up my mind.** The still shows the Pemberley picture gallery (ch. 43), where
  Elizabeth studies Darcy's portrait and starts to change her mind. The flower in her hair sheds
  petals (loves me, loves me not), alternating rose and indigo.
- **Hand-lettered lyrics** in Pinyon Script (a Regency copperplate hand). *like* is painted in rose
  and *hate* in indigo.

## How it's made

Everything is generated in code. There is no image model, and the still is painted by the same
engine the animation will use.

| File | Role |
| --- | --- |
| `js/engine.js` | WebGL2 watercolour renderer: procedural cold-press paper, and washes with edge darkening, granulation, flow, wet-in-wet mixing, dry brush, lifting and soft reveals. Washes combine subtractively (Beer–Lambert). Also handles ink and graphite layers. |
| `js/sdf.js` | Turns any Canvas2D drawing into a signed distance field mask, so washes can grow, soften and pool at their edges. |
| `js/geom.js` | Splines, curls, ringlets, tapered locks, affine helpers and a seeded RNG. |
| `js/figures.js` | Elizabeth and Darcy profile silhouettes, hair, ribbon, cravat, eyes and petals. |
| `js/scene-portrait.js` | The concept-still scene (chorus key frame). |
| `timing/lyrics-timing.json` | Word-level lyric timings and song sections, aligned from the audio (108 BPM, B♭ major, 2:31). |
| `lab/` | Development pages for checking figures and paint behaviour. |

Render the still:

```sh
python3 -m http.server 8765 --directory pride-and-prejudice-watercolour &
node pride-and-prejudice-watercolour/tools/render-still.mjs \
  "http://localhost:8765/concept.html?scale=2" still-4k.png 3840 2160 __done
```

The song audio is not committed to this repository.

Fonts: Pinyon Script and IM Fell English are used under the SIL Open Font License (see `fonts/`).
