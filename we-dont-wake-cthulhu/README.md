# We Don't Wake Cthulhu — animated music video

A chibi-style animation that plays in sync with the song. Our hero preps a summoning (polished altar, seven black candles, a very long scroll), gets talked out of it by a tiny alarm clock, and lets a sleepy little Cthulhu keep dreaming while everyone dances in the kitchen. He sings along: his mouth follows the vocal word timings.

## Watch it

Open `index.html` in a browser and press **Play with sound**. The page needs `we-dont-wake-cthulhu.mp3` beside it. It loads two Google Fonts (Fredoka, Mochiy Pop One) when online and falls back to rounded system fonts offline.

| Key | Action |
| --- | --- |
| Space | Play / pause |
| ← / → | Skip 5 seconds |
| C | Lyrics on / off |
| F | Full screen |

The chips under the player jump to each part of the song.

## How it stays in sync

The animation is drawn on a 1920×1080 canvas, and every frame is a pure function of the song's current time. There is no animation state, so seeking and frame-by-frame export always match.

- `js/data.js` holds timing measured from the recording: 392 beat times (about 132.5 BPM) and the start time of every sung word. Characters bounce, squash and switch poses on those beats, and each shot cuts on the word it illustrates.
- `js/kit.js`: easing, beat helpers, shapes, particles.
- `js/cast.js`: the characters (our hero, his friends, Cthulhu, Tikk the alarm clock, the moon, the spellbook, Aunt Mabel, the mail carrier, the tailor cat, sea critters), cel-shaded with colour-matched line art.
- `js/sets.js`: locations and props (the cliff house and sunken temple cross-section, the ritual room, the kitchen, the café).
- `js/scenes-a.js`, `js/scenes-b.js`: one function per shot.
- `js/timeline.js`: the shot list, transitions, karaoke captions, and the finishing pass (soft bloom around lights, a colour grade per location, vignette).
- `js/player.js`: audio clock, controls, and the `?render` export mode.

## Render an MP4

Requires Node 18+, ffmpeg on your PATH, and Playwright's Chromium:

```sh
npm install playwright
npx playwright install chromium
node tools/render-video.mjs --out we-dont-wake-cthulhu.mp4
```

The script renders each frame at 1920×1080 (30 fps by default), then muxes the frames with the song using H.264 and AAC. Options: `--fps`, `--crf` (quality, default 20), `--workers` (parallel browser pages), `--ffmpeg PATH`.
