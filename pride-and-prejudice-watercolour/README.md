# The Art of Making Up My Mind: watercolour music video

A painterly, heavily stylised watercolour animation for the song *The Art of Making Up My Mind*,
which is Elizabeth Bennet's running argument with herself about Mr Darcy.

**Status: code version ready for review.** Once the review is signed off, the same code will
render the final video frame by frame.

![Concept still](concept/concept-still.png)

## Concept

- **Regency silhouettes painted in wash.** Profile silhouettes were the portrait form of Austen's
  era, and the single's cover art is also a silhouette. Here they are painted as wet watercolour.
  The full figures are jointed like cut-paper puppets (Lotte Reiniger style).
- **Two warring pigments.** Elizabeth is rose madder ("maybe I like him") and Darcy is indigo
  ("maybe I hate him"). The page floods with one colour or the other on each "maybe", and the two
  meet in violet on "the art of making up my mind".
- **Hand-lettered lyrics**, written on word by word in time with the vocal, in Pinyon Script
  (a Regency copperplate hand). *like*, *heart* and *feel* are painted in rose; *hate*, *worst*,
  *rude* and *wrong* in indigo; *mind* and *eyes* in violet. Lyrics can be switched off in the player.

## Scenes

| Time | Scene |
| --- | --- |
| 0:00 | Title: a drop of rose blooms and the title is inked in |
| 0:03 | The Assembly Rooms: "I swear that boy is just the worst"; she fans herself, he stands aloof |
| 0:13 | On my mind: a tiny Darcy on a hilltop inside her silhouette; a heart, then an indigo drop |
| 0:29 | Face to face: "staring at my eyes"; chorus 1 floods the page rose and indigo |
| 0:56 | Rude and mean: he turns his back; "tolerable, but not handsome enough" is written and struck out |
| 1:08 | Tall and strong: Pemberley's lawn; he stretches, the oak shakes |
| 1:14 | A certain way: the blush spreads, roses open on the beat |
| 1:21 | The sisters: Jane, Mary, Kitty and Lydia disapprove |
| 1:25 | The portrait: Pemberley's gallery (the concept still); petals fly toward his painted eyes |
| 1:52 | The dance: rose and indigo trade places across the ballroom |
| 2:09 | Mind made up: a violet heart blooms between them |
| 2:14 | Dawn: they walk out together and the paint settles |

## How it's made

Everything is generated in code, with no image model. Each frame is painted by a small WebGL2
watercolour engine.

| File | Role |
| --- | --- |
| `index.html` | The review player: plays the song and paints the animation in sync; scrubber with song sections, scene list, lyrics toggle, quality and full screen. |
| `frame.html` | Renders any single moment (`frame.html?t=95`), for checks and for the final frame-by-frame video render. |
| `js/engine.js` | Watercolour renderer: procedural cold-press paper, and washes with edge darkening, granulation, flow, wet-in-wet mixing, dry brush, lifting and soft reveals, combined subtractively. Also handles figure groups (a figure reserves the paper beneath it), ink and graphite layers, wet-edged scene transitions and the lyric overlay. |
| `js/sdf.js` | Turns any Canvas2D drawing into a signed distance field mask. |
| `js/figures.js`, `js/people.js` | Elizabeth and Darcy busts, jointed full-figure puppets with poses (stand, fan, walk, dance, bow), the four sisters, and props (Pemberley, oak, chandeliers, roses). |
| `js/film.js` | Scene schedule, transitions and the word-by-word lyric overlay. |
| `js/scenes/*.js` | One file per scene, each timed to the lyrics and beats. |
| `js/timing.js`, `timing/lyrics-timing.json` | Word-level lyric timings, song sections and the 264 detected beats (about 108 BPM, B♭ major, 2:31). |
| `lab/` | Flat-colour pages for checking silhouettes and poses. |

To run locally, put the song at `audio/the-art-of-making-up-my-mind.mp3` (it is not committed), then:

```sh
python3 -m http.server 8765 --directory pride-and-prejudice-watercolour
# open http://localhost:8765/index.html  (or frame.html?t=95 for a single frame)
node pride-and-prejudice-watercolour/tools/render-still.mjs \
  "http://localhost:8765/frame.html?t=95&scale=2" still-4k.png 3840 2160 __done
```

Fonts: Pinyon Script and IM Fell English are used under the SIL Open Font License (see `fonts/`).
