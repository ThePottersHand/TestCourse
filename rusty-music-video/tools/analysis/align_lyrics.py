"""Align the song's lyric sheet to Whisper word timestamps.

Inputs : whisper JSON from the isolated vocal stem (primary) and from the full mix (fallback).
Output : lyrics.json -> [{section, text, t0, t1, words: [[t0, t1, word], ...]}]

The lyric sheet below follows what is actually sung (e.g. how many times the
chorus repeats), using the words from the original lyrics.
"""
import json, re, sys, difflib

VOCALS_JSON, MIX_JSON, OUT = sys.argv[1], sys.argv[2], sys.argv[3]

R = "Rusty the dog"
SHEET = [
    ("verse1", [
        "Oh Rusty the dog he went missing one night",
        "And we searched all the neighbourhood through",
        "Then we found Rusty in a large metal box",
        "Which appeared in a field out of the blue",
        "We said 'Rusty what's this?'",
        "and he wagged his tail and he said",
        "'It's a spacetime machine",
        "I'm about to go off on an adventure",
        "Would you like to come with me?'",
        "Well how could we say no",
        "We climbed on board the spaceship",
        "And Rusty turned on the lights",
        "He said 'If you look to your left",
        "You will see the time",
        "If you look to your right",
        "You will see space'",
        "I said 'Rusty how is this possible?'",
        "He said 'I don't know but this is ace'",
    ]),
    ("chorus1", ["Oh " + R] + [R] * 7),
    ("verse2", [
        "Rusty the dog then said 'Hold on tight",
        "This thing's gonna start to move",
        "I've got my little doggy seatbelt on",
        "But you'll have to make do'",
        "So we sat on the floor",
        "And held onto the walls",
        "And he pressed a big red button",
        "The room began to spin around and around",
        "And the whole ship began to shudder",
        "And the last thing I remember is Rusty saying",
        "'I wonder where we're going'",
        "And then we all blacked out",
        "And when we woke up",
        "Rusty said 'I've got good news and bad news'",
        "We said 'Give us the good news first'",
        "He said 'The good news is we're in 1972",
        "The bad news is we are not in space'",
        "We said 'Where are we then?'",
        "He said 'Look outside'",
        "We said 'There's nothing there'",
        "He said 'It's 'cause we're underground'",
    ]),
    ("chorus2", [R] * 9),
    ("verse3", [
        "Well we said 'Rusty get us out of here'",
        "He said 'I'm trying my best",
        "I was trying to aim for outer space",
        "But it looks like I aimed for the west'",
        "I said...",
        "'Rusty, this is not what we signed up for",
        "We're stuck in a hole from the past",
        "With no stars and no planets, just dirt and some worms",
        "This adventure's a bit of a blast'",
        "He said 'Don't worry, I've got a plan",
        "We'll dig our way out through the ground",
        "But first let's see what's down here in '72",
        "Maybe we'll find some lost treasure around'",
        "So we grabbed some old shovels that Rusty had packed",
        "And we started to tunnel and dig",
        "But instead of the surface, we hit a big room",
        "Full of disco balls, lights, and a gig",
    ]),
    ("chorus3", ["Oh " + R] + [R] * 5),
    ("bridge", [
        "There were people in flares, dancing wild in the night",
        "To the beat of some funky old tune",
        "Rusty jumped on the floor, started howling along",
        "And we joined in, under the moon",
        "But the moon was just painted on velvet and stars",
        "It was a bunker for secret dance raves",
        "We boogied till dawn, then Rusty yelled 'Time!'",
        "We hopped back in the ship for more waves",
    ]),
    ("verse4", [
        "The machine whirred to life",
        "We punched in 'home sweet home'",
        "And it spun us through tunnels of light",
        "We landed back safe in our own little yard",
        "On a Tuesday, just after midnight",
        "Rusty looked at us all with his big puppy eyes",
        "And he said 'Wasn't that just the best?'",
        "We nodded and laughed, gave him scratches and hugs",
        "'Yeah Rusty, forget all the rest'",
        "From that day on, we'd check the old metal box",
        "For a sign of another wild ride",
        "But Rusty just sleeps by the fire with a grin",
        "Dreaming of spacetime inside",
    ]),
    ("chorus4", ["Oh " + R] + [R] * 5),
    ("outro", ["Oh " + R] * 3 + [R]),
]


def norm(w):
    w = w.lower().replace("’", "'")
    w = re.sub(r"[^a-z0-9']", "", w)
    return w.strip("'")


def hyp_words(path, lo=0, hi=1e9):
    out = []
    for seg in json.load(open(path)):
        for w in seg["words"]:
            n = norm(w["w"])
            if n and lo <= w["s"] < hi:
                out.append((n, w["s"], w["e"]))
    return out


# the vocal stem is cleaner everywhere except the last chorus/outro, where the mix caught more
hyp = hyp_words(VOCALS_JSON, 0, 339.0) + hyp_words(MIX_JSON, 339.0, 400)
hyp.sort(key=lambda x: x[1])

ref = []  # (norm, line_index, word_index)
lines = []
for sec, ls in SHEET:
    for text in ls:
        words = text.split()
        li = len(lines)
        lines.append({"section": sec, "text": text, "words": words})
        for wi, w in enumerate(words):
            ref.append((norm(w), li, wi))


def sim(a, b):
    if a == b:
        return 1.0
    return difflib.SequenceMatcher(None, a, b).ratio()


n, m = len(ref), len(hyp)
GAP = -0.55
score = [[0.0] * (m + 1) for _ in range(n + 1)]
back = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    score[i][0] = i * GAP; back[i][0] = 1
for j in range(1, m + 1):
    score[0][j] = j * GAP * 0.5; back[0][j] = 2
for i in range(1, n + 1):
    ri = ref[i - 1][0]
    for j in range(1, m + 1):
        s = sim(ri, hyp[j - 1][0])
        diag = score[i - 1][j - 1] + (2.0 * s if s >= 0.55 else -1.0)
        up = score[i - 1][j] + GAP          # ref word unmatched
        left = score[i][j - 1] + GAP * 0.5  # extra hyp word
        best = max(diag, up, left)
        score[i][j] = best
        back[i][j] = 0 if best == diag else (1 if best == up else 2)

match = [None] * n
i, j = n, m
while i > 0 and j > 0:
    b = back[i][j]
    if b == 0:
        if sim(ref[i - 1][0], hyp[j - 1][0]) >= 0.55:
            match[i - 1] = j - 1
        i -= 1; j -= 1
    elif b == 1:
        i -= 1
    else:
        j -= 1

# word times, interpolating unmatched words between matched anchors
times = [None] * n
for k in range(n):
    if match[k] is not None:
        _, s, e = hyp[match[k]]
        times[k] = [s, e]
k = 0
while k < n:
    if times[k] is None:
        a = k - 1
        b = k
        while b < n and times[b] is None:
            b += 1
        start = times[a][1] if a >= 0 else (times[b][0] - 0.3 * (b - k) if b < n else 0)
        end = times[b][0] if b < n else start + 0.3 * (b - k)
        # don't stretch interpolated words across long instrumental gaps
        cnt = b - k
        span = end - start
        per = min(span / cnt, 0.45) if cnt else 0
        if a >= 0 and ref[a][1] == ref[k][1]:
            base = start
        else:
            base = end - per * cnt
        for q in range(cnt):
            times[k + q] = [base + q * per, base + (q + 1) * per]
        k = b
    else:
        k += 1

for k, (_, li, wi) in enumerate(ref):
    lines[li].setdefault("wt", []).append(times[k])

out = []
unmatched_report = []
for li, L in enumerate(lines):
    ws = [[round(a, 3), round(b, 3), w] for (a, b), w in zip(L["wt"], L["words"])]
    # enforce monotonic, minimum word length
    for q in range(1, len(ws)):
        if ws[q][0] < ws[q - 1][0]:
            ws[q][0] = ws[q - 1][0]
        if ws[q][1] < ws[q][0] + 0.08:
            ws[q][1] = round(ws[q][0] + 0.08, 3)
    out.append({"section": L["section"], "text": L["text"], "t0": ws[0][0], "t1": ws[-1][1], "words": ws})

# report matching quality per line
idx = 0
for li, L in enumerate(lines):
    cnt = len(L["words"])
    matched = sum(1 for q in range(idx, idx + cnt) if match[q] is not None)
    idx += cnt
    flag = "" if matched >= cnt * 0.6 else "   <-- low match"
    print(f"{out[li]['t0']:7.2f}-{out[li]['t1']:7.2f} [{matched}/{cnt}] {L['text']}{flag}")

json.dump(out, open(OUT, "w"), indent=1)
