import json, numpy as np
rms = np.load('vox_rms.npy'); hop_t = 220/22050
t = np.arange(len(rms))*hop_t
sm = np.convolve(rms, np.ones(3)/3, 'same')
lines = json.load(open('lyrics_timed.json'))
def onset_near(ts, lo=-0.55, hi=0.25):
    # find times where rms crosses up through thr after being low for >=0.12s
    m = (t >= ts+lo) & (t <= ts+hi)
    idx = np.where(m)[0]
    best = None
    for i in idx:
        if i < 15: continue
        thr = 0.035
        if sm[i] >= thr and sm[i-1] < thr and sm[i-13:i-1].max() < thr*1.2:
            if best is None or abs(t[i]-ts) < abs(best-ts): best = t[i]
    return best
prev_last = -1
for L in lines:
    if 'section' in L: continue
    s = L['start']; o = onset_near(s)
    if o is not None and o < prev_last + 0.25: o = None
    prev_last = L['words'][-1]['s']
    if o is not None and abs(o - s) > 0.06:
        print(f"{L['text'][:40]:40s} start {s:.2f} -> onset {o:.2f} (d={o-s:+.2f})")
        if o < s:
            L['words'][0]['s'] = round(o, 3); L['start'] = round(o, 3)
        elif o > s and o < L['words'][1]['s'] - 0.05 if len(L['words'])>1 else True:
            L['words'][0]['s'] = round(o, 3); L['start'] = round(o, 3)
json.dump(lines, open('lyrics_timed2.json', 'w'), indent=1)
