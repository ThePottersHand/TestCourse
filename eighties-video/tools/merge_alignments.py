import json, numpy as np, re
W = json.load(open('words_mms.json'))
n = len(W)
S = []
for i, w in enumerate(W):
    st, ms, sc = w['st_s'], w['s'], w['score']
    zero = abs(w['st_e'] - w['st_s']) < 0.03
    if abs(st - ms) < 0.3:
        s = 0.5 * (st + ms)
    elif zero and sc >= 0.2:
        s = ms
    else:
        s = st
    S.append(s)
# monotonic fix (forward), keep gaps >= 0.04
for i in range(1, n):
    if S[i] < S[i-1] + 0.04:
        S[i] = S[i-1] + 0.04
# hand fixes (verified against whisper transcription)
fixes = {}
out = []
for i, w in enumerate(W):
    s = S[i]
    nxt = S[i+1] if i+1 < n else s + 1.0
    e = min(nxt, max(w['st_e'], s + 0.18))
    out.append({'w': w['w'], 's': round(s, 3), 'e': round(e, 3)})
# lines from lyric sheet
sheet = [l.strip() for l in open('lyrics_sheet.txt').read().split('\n') if l.strip()]
def toks(l): return [t for t in re.split(r"[\s—]+", l) if t]
j = 0
lines = []
for l in sheet:
    if l.startswith('['):
        lines.append({'section': l.strip('[]')}); continue
    k = len(toks(l))
    ws = out[j:j+k]; j += k
    lines.append({'text': l, 'start': ws[0]['s'], 'end': ws[-1]['e'], 'words': ws})
print('consumed', j, 'of', len(out))
json.dump(lines, open('lyrics_timed.json', 'w'), indent=1)
sec = None
for L in lines:
    if 'section' in L: print('==', L['section']); continue
    print(f"{L['start']:7.2f}-{L['end']:7.2f} {L['text']}  |  " + ' '.join(f"{w['w']}@{w['s']:.2f}" for w in L['words']))
