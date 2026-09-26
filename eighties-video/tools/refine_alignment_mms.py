import torch, torchaudio, json, numpy as np, librosa, re
from torchaudio.pipelines import MMS_FA as bundle
model = bundle.get_model(); model.eval()
tokenizer = bundle.get_tokenizer(); aligner = bundle.get_aligner()
DICT = bundle.get_dict()
wav, sr = librosa.load('sep/htdemucs/song/vocals.wav', sr=16000, mono=True)
r = json.load(open('aligned_small.json'))
words = []
for s in r['segments']:
    for w in s['words']:
        if w['word'].strip():
            words.append({'w': w['word'].strip(), 's': w['start'], 'e': w['end'], 'p': w.get('probability', 0)})
# fix known bad stable-ts words using whisper transcription values
fix = {('enough!', 212.34): (209.5, 211.0), ('up!', 221.08): (216.54, 217.24)}
for w in words:
    k = (w['w'], round(w['s'], 2))
    if k in fix: w['s'], w['e'] = fix[k]
SPOKEN = {'bmx': 'bee em ex', 'pac-man': 'pac man', 'front-yard': 'front yard', 'sun-bleached': 'sun bleached',
          'gap-toothed': 'gap toothed', 'fluoro': 'flooro'}
def norm(w):
    t = w.lower()
    t = re.sub(r"[^a-z\- ]", '', t)
    t = SPOKEN.get(t, t)
    t = t.replace('-', ' ')
    return t
# group into lines of the lyric sheet by gaps (use sung.txt lines split on punctuation boundaries is complex) -> use windows of ~8 words
out = []
i = 0
N = len(words)
while i < N:
    j = min(N, i + 8)
    # extend to not split in the middle of big gaps: fine
    seg = words[i:j]
    t0 = max(0, seg[0]['s'] - 0.6); t1 = min(len(wav)/16000, seg[-1]['e'] + 0.6)
    audio = torch.tensor(wav[int(t0*16000):int(t1*16000)])[None]
    toks = [norm(w['w']) for w in seg]
    flat = ' '.join(toks).split()
    with torch.inference_mode():
        em, _ = model(audio)
    tokens = tokenizer(flat)
    try:
        spans = aligner(em[0], tokens)
    except Exception as ex:
        print('fail', ex, flat); out += [dict(w) for w in seg]; i = j; continue
    ratio = audio.shape[1] / em.shape[1] / 16000
    # map spans (per spoken token-word) back to original words
    k = 0
    for w, t in zip(seg, toks):
        n = len(t.split())
        sp = spans[k:k+n]; k += n
        s = t0 + sp[0][0].start * ratio; e = t0 + sp[-1][-1].end * ratio
        score = float(np.mean([x.score for s_ in sp for x in s_]))
        out.append({'w': w['w'], 's': round(s, 3), 'e': round(e, 3), 'st_s': w['s'], 'st_e': w['e'], 'score': round(score, 3)})
    i = j
json.dump(out, open('words_mms.json', 'w'), indent=0)
for o in out:
    d = o['s'] - o['st_s']
    flag = '  <<<' if abs(d) > 0.25 else ''
    print(f"{o['w']:14s} mms {o['s']:7.2f}-{o['e']:7.2f}  st {o['st_s']:7.2f}-{o['st_e']:7.2f}  sc {o['score']:.2f}{flag}")
