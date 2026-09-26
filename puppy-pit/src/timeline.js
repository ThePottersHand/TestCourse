// The cut. All times in FILM seconds; the voice starts at PRE.
// Cuts sit in the pauses of the recording; actions land on words.
import { LINES, AUDIO_DURATION } from './data/timing.js';

export const PRE = 3.0;                 // picture before the first word
export const F = a => +(a + PRE).toFixed(3);
export const FPS = 24;

// film time of a word (first match in line i). which: 's' | 'e'
export function W(i, word, which = 's', nth = 0) {
  const hits = LINES[i].w.filter(x => x[0] === word);
  const x = hits[nth] ?? hits[0];
  if (!x) throw new Error(`"${word}" not in line ${i}`);
  return F(which === 's' ? x[1] : x[2]);
}
export const Ls = i => F(LINES[i].s);
export const Le = i => F(LINES[i].e);

// [id, module, export, audio-time cut-in, options]
const CUT = [
  ['open', 'present', 'open', -PRE, { fadeIn: 0.01 }],
  ['abyss', 'topdown', 'abyss', 5.3],
  ['reveal', 'topdown', 'reveal', 10.75],
  ['signMed', 'signs', 'signMed', 18.45],
  ['signClose', 'signs', 'signClose', 22.9],
  ['reading', 'reading', 'reading', 27.35],
  ['smell', 'smell', 'smell', 35.55, { fadeIn: 0.5 }],
  ['noRescue', 'inpit', 'noRescue', 44.35],
  ['coat', 'inpit', 'coat', 53.75],
  ['shoe', 'inpit', 'shoe', 56.35],
  ['onHead', 'inpit', 'onHead', 58.8],
  ['help', 'lowgarden', 'help', 63.9],
  ['colinOver', 'colin', 'colinOver', 66.55],
  ['reply', 'inpit', 'reply', 71.4],
  ['colinSee', 'colin', 'colinSee', 75.15],
  ['notRope', 'inpit', 'notRope', 80.45],
  ['twenty', 'inpit', 'twenty', 83.3],
  ['rescue', 'rescue', 'rescue', 93.45],
  ['wisdom', 'inpit', 'wisdom', 103.7],
  ['lifted', 'inpit', 'lifted', 110.85],
  ['portrait', 'portrait', 'portrait', 112.3],
  ['unharmed', 'topdown', 'unharmed', 119.9],
  ['kept', 'harold', 'kept', 121.9],
  ['harold', 'harold', 'haroldClose', 124.0],
  ['object', 'portrait', 'object', 126.3],
  ['accepted', 'harold', 'accepted', 127.85],
  ['visit', 'present', 'visit', 131.9, { mix: 0.8 }],
  ['watch', 'topdown', 'watch', 138.45],
  ['remember', 'topdown', 'remember', 141.2],
  ['notAffection', 'present', 'notAffection', 148.2],
  ['recognition', 'topdown', 'recognition', 149.7],
  ['endcard', 'titles', 'endcard', 153.4, { fadeIn: 0.01 }],
];
export const END = F(160.0);

export const SHOTS = CUT.map(([id, mod, fn, a, opt = {}], i) => ({
  id, mod, fn, start: i === 0 ? 0 : F(a), end: i < CUT.length - 1 ? F(CUT[i + 1][3]) : END, ...opt,
}));
export const DURATION = END;
export const AUDIO_LEN = AUDIO_DURATION;
export { LINES };
