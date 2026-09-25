# The Art of Making Up My Mind: watercolour music video

A painterly, heavily stylised watercolour animation for the song *The Art of Making Up My Mind*,
which is Elizabeth Bennet's running argument with herself about Mr Darcy.

**Status: code version 4 ready for review.** Version 3 moved the story outdoors and into the
novel: real silhouettes with no faces, no figures flipping back and forth, and landscapes that
are always moving (wind, clouds, water, light, birds). Version 4 follows the notes on it: birds
and pencil lines pass behind the figures, arms stay close to the body, the heart and its
question mark are gone, and Darcy's coat tails hang against his legs. Once the review is signed
off, the same code will render the final video frame by frame.

![Concept still](concept/concept-still.png)

## Concept

- **Real silhouettes.** Every figure is one solid painted shape (hair, bonnet and ribbons
  included), like a Regency cut-paper silhouette laid in wet watercolour. No eyes, no lips, no
  jointed limbs, no outstretched arms. Figures come to life through the air around them: hems,
  coat tails and bonnet ribbons move in the wind, and birds fly behind them.
- **Painted on the page.** Each scene starts as bare paper and pencil, and the paint floods out
  from where the brush touches: a sunset from the sun, Darcy from his boots up, a gilt frame
  running round both ways from its bow.
- **Scenes from the book, and Lizzy out of doors.** The walk to Netherfield, "rocks and
  mountains", the proposal in the rain, Pemberley, Darcy's letter in the grove at Rosings, the
  picture gallery, Oakham Mount.
- **Two warring pigments.** Elizabeth is rose madder ("maybe I like him") and Darcy is indigo
  ("maybe I hate him"). The weather, the light and even his handwriting take their colour, and
  the two meet in violet on "the art of making up my mind".
- **Hand-lettered lyrics**, written on word by word in time with the vocal, in Pinyon Script
  (a Regency copperplate hand). *like*, *heart* and *feel* are painted in rose; *hate*, *worst*,
  *rude* and *wrong* in indigo; *mind* and *eyes* in violet. Lyrics can be switched off in the player.

## Scenes

| Time | Scene |
| --- | --- |
| 0:00 | Title: a drop of rose blooms on the bare sheet; light passes over as the title is inked in |
| 0:03 | Across the fields (ch. 7): she walks to Netherfield into the wind, clouds racing and dragging their shadows over the fields; she splashes through a puddle and the mud climbs her hem |
| 0:13 | On my mind: a sunset floods into her silhouette; tiny Darcy on the hill; a pool in the fields inside her glows with the sun's reflection, then a drop of his indigo falls in, ripples spread and it marbles through the rose |
| 0:29 | Staring: two silhouettes face to face, a line of light between their eyes |
| 0:36 | Rocks and mountains (ch. 27): on a gritstone edge the weather follows her heart: sun on "like", an indigo storm and rain on "hate", a rainbow on the second "like", violet dusk on "the art of making up my mind" |
| 0:56 | The storm (ch. 34): the proposal in the rain; lightning on "rude" and "mean"; his words ("your inferiority", "a degradation") are lifted out of the sky, then run down the page |
| 1:08 | Pemberley (ch. 43): golden hour, painted from his boots up as the camera tilts; on "strong", wind, sun rays and glitter on the lake |
| 1:14 | Blossom: an orchard in April; she looks up as the blossom bursts open through the branches above her |
| 1:21 | The sisters: four oval silhouette portraits swing on their nails to whisper, and swing hard on "wrong" |
| 1:25 | The gallery (ch. 43): his silhouette portrait; the gilt frame runs round from its bow; a sunbeam crosses the room |
| 1:31 | The letter (ch. 35-36): in the bluebell grove at Rosings his handwriting blows off the page, rose then indigo then rose; "Till this moment I never knew myself" |
| 1:52 | Oakham Mount: dusk and a murmuration of starlings that gathers, tears in two and rejoins; he is painted in beside her and the flock draws a heart |
| 2:14 | Dawn: they drift together in the mist until they stand face to face as the sun rises; their colours meet in violet and the paint fades back into the paper |

## How it's made

Everything is generated in code, with no image model. Each frame is painted by a small WebGL2
watercolour engine.

| File | Role |
| --- | --- |
| `index.html` | The review player: plays the song and paints the animation in sync; scrubber with song sections, scene list, lyrics toggle, quality and full screen. |
| `frame.html` | Renders any single moment (`frame.html?t=95`), for checks and for the final frame-by-frame video render. |
| `js/engine.js` | Watercolour renderer: procedural cold-press paper, and washes with edge darkening, granulation, flow, wet-in-wet and marbled mixing, dry brush, lifting and soft reveals, combined subtractively. Paint can flood through a shape from seed points, keep flowing while wet, sway, drip, and morph into another shape or its mirror image. Also a light layer (glows, rays, glints), figure groups (a figure reserves the paper beneath it), ink and graphite layers, wet-edged scene transitions where the old painting runs, and the lyric overlay. |
| `js/sdf.js`, `js/flood.js` | Turn any Canvas2D drawing into a signed distance field mask, and bake the flood field (how far paint travels inside the shape from its seed points). |
| `js/figures.js`, `js/people.js` | Elizabeth and Darcy profiles, full-figure shapes and poses, the four sisters, and props (Pemberley, the temple, oak). |
| `js/cast.js` | Bakes each figure, in a pose, into one solid silhouette (plus wind-blown bonnet ribbons and coat tails) and paints it on: flooding in, moving in the wind. |
| `js/film.js` | Scene schedule, transitions and the word-by-word lyric overlay. |
| `js/scenes/*.js` | One file per scene, each timed to the lyrics and beats. |
| `js/timing.js`, `timing/lyrics-timing.json` | Word-level lyric timings, song sections and the 264 detected beats (about 108 BPM, B♭ major, 2:31). |
| `lab/` | Test pages for the engine effects and the cast. |

To run locally, put the song at `audio/the-art-of-making-up-my-mind.mp3` (it is not committed), then:

```sh
python3 -m http.server 8765 --directory pride-and-prejudice-watercolour
# open http://localhost:8765/index.html  (or frame.html?t=95 for a single frame)
node pride-and-prejudice-watercolour/tools/render-still.mjs \
  "http://localhost:8765/frame.html?t=95&scale=2" still-4k.png 3840 2160 __done
```

To render the video, paint every frame to disk, then encode them with the song. The frame renderer
skips frames that already exist, so an interrupted render resumes, and several processes can share
the work by taking different frame ranges (`[first] [end]` after the fps):

```sh
node pride-and-prejudice-watercolour/tools/render-frames.mjs http://localhost:8765/frame.html frames 24
ffmpeg -framerate 24 -i frames/%05d.jpg -i pride-and-prejudice-watercolour/audio/the-art-of-making-up-my-mind.mp3 \
  -map 0:v -map 1:a -vf "scale=in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p" \
  -c:v libx264 -preset slow -crf 20 -tune film -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 192k -shortest -movflags +faststart the-art-of-making-up-my-mind.mp4
```

Without a GPU (headless Chromium then paints with SwiftShader on the CPU) a 1080p frame takes about
3 seconds, so the 3,632 frames take about three hours.

Fonts: Pinyon Script and IM Fell English are used under the SIL Open Font License (see `fonts/`).
