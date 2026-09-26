# Turn the Eighties Up — music video

A full-length (3:46) music video for *Turn the Eighties Up*, generated entirely in code and rendered live in the
browser with WebGL2. Every visual is procedural: shaders, neon/pencil line art that morphs between drawings,
SDF typography, particles and a post-processing chain (bloom, video feedback, VHS/CRT). It is choreographed to the
song's tracked beats and to word-level lyric timings.

## Watch it

- **Quickest:** open `index.html` in Chrome, Edge, Firefox or Safari. Loading it from a file works; the song
  then plays through an `<audio>` element.
- **Best sync:** serve the folder so the song is decoded with WebAudio (sample-accurate clock):
  ```sh
  cd eighties-video && python3 -m http.server 8000
  # open http://localhost:8000
  ```

Controls: `Space` play/pause · `←`/`→` seek 5 s · `C` lyric captions · `F` fullscreen · `H` hide controls ·
`D` debug readout. Click or drag the timeline to scrub; section markers show verse/chorus/bridge.

Lyrics are carried by the big kinetic type (chorus slams, call-and-response, title cards). Line-by-line captions
along the bottom of the frame are off by default. Turn them on with `C` or the **CC** button, or open the page with
`#cc` in the URL. Add `#t52` to start at 0:52; the two combine as `#t52-cc`.
Rendering resolution adapts to keep playback smooth on slower GPUs. If the viewer prefers reduced motion,
flashes and camera shake are toned down.

## Encode to MP4

```sh
npm i -D playwright && npx playwright install chromium   # once
node tools/render.js --gpu --out turn-the-eighties-up.mp4               # 1920x1080, 30 fps
node tools/render.js --gpu --fps 60 --crf 14 --out ttu-60fps.mp4         # smoother / higher quality
node tools/render.js --start 51.7 --end 73.2 --out chorus.mp4            # a section only
node tools/render.js --gpu --captions --out ttu-captions.mp4             # with lyric captions burned in
```

Frames are rendered in order, one at a time, and piped to `ffmpeg` (must be on `PATH`, or pass `--ffmpeg`).
Drop `--gpu` to render on the CPU (SwiftShader). That works on any machine but takes a few seconds per 1080p frame.

## Storyboard

| Time | Lyric | Visual | 80s reference |
|---|---|---|---|
| 0:00 | *(intro)* | VCR `PLAY ▶` and a CRT powering on. A neon cassette draws itself and writes its own label, then the camera dives through the tape window into the sunset grid, where a chrome title lands. | MTV-era VHS; outrun chrome logos; *Tron* |
| 0:17 | *(into verse)* | The neon title outline morphs into a pencil sketch as the colour drains away. | a-ha, *Take On Me* |
| 0:18 | Verse 1 | A sketchbook world with boiling pencil lines. Each drawing flows into the next: BMX pile, gap-toothed kid, arcade cabinet (Pac-Man glowing in neon on its CRT), coins and credits, a handwritten mixtape, a finger on RECORD with live VU needles, posters peeling, and a phone cord stretching down a perspective hallway. | *Take On Me* rotoscope, comic captions |
| 0:45 | Pre-chorus | Through the door into a sketched town that turns to night. Streetlights ignite, BMX riders pass, and a bike crosses the moon. | *E.T.* |
| 0:51 | Chorus 1 | Neon explosion. Chrome word slams, a volume knob cranking up, big-hair neon strands, stage beams, a barrel roll on "roll", a chalk town where the windows turn neon, a Memphis colour flood, and pop-art "HEY!" bursts. | Outrun, Memphis design, laser shows |
| 1:09 | "Rewind my life" | The video literally rewinds: VHS visual search back through the earlier scenes, with a `◀◀ REW` OSD and tape counter. | VHS |
| 1:13 | Post-chorus | Oh-oh-oh rings; the neon title writes itself; time-travel lightning. | *Back to the Future* |
| 1:21 | Verse 2 | A wedge car leaves fire trails at 88 MPH, moonwalking sneakers light the floor tiles, lace mandalas and purple rain with a purple guitar, a vanity-mirror superstar burst, fluoro stripes giving way to stonewash, a giant teased fringe, and Polaroids developing. | *Back to the Future*, *Billie Jean*, *Like a Virgin*, *Purple Rain*, aerobics videos |
| 1:49 | Pre-chorus 2 | A Rubik's Cube twisting on every beat. A sticker gets "cheated" off, then the cube explodes. | Rubik's Cube craze |
| 1:55 | Chorus 2 | The same choreography inside a Tron grid tunnel. | *Tron* |
| 2:18 | Bridge | Pull back into a wood-grain CRT TV: blue `BE KIND, REWIND` screen, three rented VHS boxes and a beanbag, tracking lines over the opening scene, a dolly into the 14" screen's worlds, fading Polaroids, the mixtape playing the song as a waveform, a 1-2-3-4 count-in, and back on that street. | Video-rental nights |
| 2:46 | Breakdown | A clapping crowd with arms up; call-and-response text with stutter edits; wireframe boxes. Then the tape comes loose and a pencil winds it back. | Queen, *Radio Ga Ga*; *Max Headroom* |
| 3:02 | Final chorus | Everything at once: every object from the video orbits the title, fireworks, and a rewind through the whole video. | — |
| 3:24 | Outro | The knob goes to **11** on "never loud enough", a last title slam, a pull back into the TV, the CRT switches off, then `STOP`. | *This Is Spinal Tap* |

## How it's built

```
index.html            page, start screen, player controls
js/core.js            WebGL2 helpers, math, easing, noise
js/track.js           audio features / beats / lyrics lookups, playback clock (WebAudio or <audio>)
js/render.js          render targets, layer queue, feedback, bloom, final grade (VHS, CRT, CRT power on/off)
js/strokes.js         instanced neon/graphite line renderer and the line-art morph engine
js/text.js            SDF glyph atlases built at load, styled text (chrome, neon, hot, pencil), glyph outlines
js/shapes.js          procedural line-art library (bikes, cassette, arcade, TV, guitar, knob, ...)
js/backgrounds.js     fragment-shader worlds (outrun, paper, street, tiles, lace, tunnel, crowd, TV room, ...)
js/fx.js              analytic GPU particles, box meshes (Rubik's Cube, VHS boxes), textured cards (Polaroids)
js/director.js        scene API, timing helpers, word-synced lyric typography, rewind time-warp
js/shots.js           the choreography, one function per section
js/track-data.js      generated: beats, downbeats, sections, word timings, 60 fps audio features
js/fonts-data.js      generated: embedded fonts
tools/render.js       offline frame-by-frame renderer, piped to ffmpeg
tools/*.py            audio analysis pipeline (see below)
```

Every scene is drawn as a function of song time. Only the video-feedback trails carry history from earlier frames.
That is what lets the "rewind" replay earlier scenes backwards, and why offline rendering matches live playback.

### Audio analysis pipeline (already run; output is in `js/track-data.js`)

1. `demucs --two-stems=vocals` separates the vocals from the band.
2. `tools/track_beats.py` tracks beats and downbeats with *beat_this*. The tempo drifts from about 145 to 149 BPM,
   so everything is synced to the tracked beats rather than a fixed grid.
3. `tools/extract_features.py` computes 60 fps kick, snare, hi-hat, bass, vocal and loudness envelopes, 16 spectrum
   bands, and kick/snare onset events.
4. `tools/transcribe_vocals.py`, then `tools/align_lyrics.py` (stable-ts forced alignment), then
   `tools/refine_alignment_mms.py` (MMS CTC aligner), then `tools/merge_alignments.py`, then
   `tools/snap_line_onsets.py` produce word-level lyric timings.
5. `tools/build_track_data.py` packs everything into `js/track-data.js`.

## Credits

Song: *Turn the Eighties Up* by thepottershand. Fonts (embedded, see `fonts/LICENSES.md`): Monoton, Russo One,
Mr Dafoe, Press Start 2P, VT323, Bangers and Architects Daughter (SIL Open Font License), and Permanent Marker
(Apache 2.0). All visuals are original procedural homages; no footage or logos are used.
