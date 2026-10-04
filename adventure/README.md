# The Starfall Expedition

A walking choose-your-own-adventure for kids, played on a phone. Zib the alien has crash-landed nearby, and the Star Rangers walk about 2 km around the neighbourhood to find five star shards before Captain Gloop the space pirate does.

- **GPS navigation**: distance, a compass arrow and a "warmer or colder" signal to each checkpoint, with automatic arrival within about 20 m.
- **AR scanner**: the camera view with a shard, Gloop or the starship floating in one direction. Turn around to find it, then tap to catch it.
- **Branching paths**: two forks (Glowing Trail or Slime Trail, then Comet Path or Moon Path), giving four routes and two endings.
- **Puzzles by age**: every challenge has Easy, Medium and Hard versions. Rangers take turns, and each gets their own level.
- **Bonus missions**: photo hunts, spotting even house numbers, street signs, a colour checklist, a 20-second freeze, and a kindness mission.
- **Sound effects**: Zib chirps and Gloop gloops when they talk. You'll hear a scanner hum and sonar pings, a sparkle when a shard is caught, a fanfare on arrival and a rocket launch at the end. While walking, a beacon beeps faster as the Rangers get closer, so they can listen instead of watching the screen. Everything is generated in the browser, so there are no audio files. The speaker button mutes it all.
- **Score**: points for shards, puzzles, bonus missions and safe walking (judged by the grown-up). There are no points for speed. You get a rank, badges, a photo log and a certificate at the end.

## Playing

Open `https://thepottershand.github.io/TestCourse/adventure/` on the phone. It needs HTTPS for GPS, the compass and the camera, and GitHub Pages provides that.

1. **Grown-up setup**: place 9 checkpoints on safe spots. You can tap the map, use "Use my location" while scouting the route, or type coordinates. "Draft a 2 km loop" gives you a starting shape, but you must then drag every pin onto a safe spot you know.
2. Add a clue for each spot ("the red postbox by the bakery"). You can also add your own question for any spot.
3. **Practice at home** mode runs the whole story with no GPS, so you can preview it.
4. Start a mission, enter the Rangers' names and ages, and go.

Everything (route, score and photos) is stored on the phone only. Nothing is sent to a server.

## Changing the story

All the text, puzzles and answers are in `story.js`. Comments at the top explain the format. The game engine is `app.js`.
