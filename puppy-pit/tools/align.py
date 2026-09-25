"""Align the known script to Whisper word timestamps -> timing/lines.json.

Each script line gets start/end times (seconds) from the matched Whisper words,
plus per-word timings so shots can cut on specific words.
"""
import json, re, difflib, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCRIPT = [
    "I was seventy-two when I fell into the puppy pit.",
    "Not a metaphorical pit.",
    "Not a difficult period in my life.",
    "An actual hole in the ground, containing puppies.",
    "There were nine of them, all golden and enthusiastic,",
    "and I had been warned about the hole by a laminated sign which said:",
    "PLEASE DO NOT FALL INTO THE PUPPY PIT.",
    "I thought, “Well, that seems oddly specific.”",
    "Then I stepped backward.",
    "The first thing I noticed was the smell.",
    "Warm biscuits, wet towels,",
    "and the faint electrical scent of a household appliance being licked.",
    "The second thing I noticed was that the puppies had no interest in rescuing me.",
    "They regarded my arrival as an entertainment package.",
    "One climbed into my coat.",
    "Another removed my left shoe.",
    "A third sat on my head and began barking directly into the future.",
    "I shouted for help.",
    "My neighbor, Colin, looked over the fence and said, “Are you all right?”",
    "I said, “No, Colin. I’m in a puppy pit.”",
    "He said, “Yes, I can see that.”",
    "Then he went inside to get his phone.",
    "Not a rope.",
    "Not a ladder.",
    "His phone.",
    "For twenty minutes I remained down there,",
    "trying to maintain dignity while being climbed by creatures with the confidence of small landlords.",
    "Eventually, Colin returned with a ladder, a blanket, and his daughter,",
    "who said I was “the funniest thing she’d ever seen.”",
    "I told her that, at my age, comedy was mostly a matter of losing balance in public.",
    "They lifted me out.",
    "I was missing one shoe, three buttons,",
    "and every shred of authority I had built over seventy-two years.",
    "The puppies were unharmed.",
    "Colin’s daughter kept one.",
    "She named it Harold.",
    "I objected, but the puppy had already accepted the position.",
    "I still visit them sometimes.",
    "I stand beside the sign now, very carefully,",
    "and watch the puppies playing below.",
    "They remember me.",
    "Whenever I arrive, they look up with that same bright expression.",
    "Not affection.",
    "Recognition.",
]

def norm(w):
    w = w.lower().replace("’", "'")
    w = w.replace("seventy-two", "seventytwo").replace("i'd", "i had")
    return re.sub(r"[^a-z0-9' ]", "", w)

def tokens(text):
    out = []
    for w in norm(text).split():
        out.extend(w.split())
    return out

whisper = json.load(open(ROOT / "timing/whisper_words.json"))
wwords = []
for seg in whisper:
    for w in seg["words"]:
        for t in tokens(w["w"]):
            wwords.append({"t": t, "s": w["s"], "e": w["e"]})

script_toks, owner = [], []
for li, line in enumerate(SCRIPT):
    for t in tokens(line):
        script_toks.append(t); owner.append(li)

sm = difflib.SequenceMatcher(a=script_toks, b=[w["t"] for w in wwords], autojunk=False)
match = [None] * len(script_toks)
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        match[a + k] = b + k

# interpolate unmatched script tokens from neighbours
def time_of(i, which):
    j = match[i]
    if j is not None:
        return wwords[j][which]
    # nearest matched neighbours
    lo = next((k for k in range(i, -1, -1) if match[k] is not None), None)
    hi = next((k for k in range(i, len(match)) if match[k] is not None), None)
    if lo is None: return wwords[match[hi]]["s"]
    if hi is None: return wwords[match[lo]]["e"]
    return (wwords[match[lo]]["e"] + wwords[match[hi]]["s"]) / 2

lines = []
for li, line in enumerate(SCRIPT):
    idx = [i for i, o in enumerate(owner) if o == li]
    words = [{"w": script_toks[i], "s": round(time_of(i, "s"), 3), "e": round(time_of(i, "e"), 3),
              "matched": match[i] is not None} for i in idx]
    lines.append({"i": li, "text": line, "start": words[0]["s"], "end": words[-1]["e"], "words": words})

json.dump(lines, open(ROOT / "timing/lines.json", "w"), indent=1)
for l in lines:
    miss = [w["w"] for w in l["words"] if not w["matched"]]
    print(f'{l["i"]:2d} {l["start"]:7.2f} {l["end"]:7.2f}  {l["text"]}' + (f'   [unmatched: {miss}]' if miss else ''))
