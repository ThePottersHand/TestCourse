import numpy as np, librosa, scipy.signal as ss
FPS=60
sr=44100
mix,_ = librosa.load('song.wav', sr=sr, mono=True)
inst,_ = librosa.load('sep/htdemucs/song/no_vocals.wav', sr=sr, mono=True)
vox,_ = librosa.load('sep/htdemucs/song/vocals.wav', sr=sr, mono=True)
dur = len(mix)/sr
N = int(np.ceil(dur*FPS))
hop = sr//FPS  # 735
nfft=4096
def stft(y):
    return np.abs(librosa.stft(y, n_fft=nfft, hop_length=hop, center=True))[:, :N]
Si = stft(inst); Sm = stft(mix)
freqs = librosa.fft_frequencies(sr=sr, n_fft=nfft)
def band(S, lo, hi): return S[(freqs>=lo)&(freqs<hi)]
def flux(S, lo, hi):
    b = np.log1p(50*band(S,lo,hi))
    f = np.maximum(0, np.diff(b, axis=1, prepend=b[:, :1])).mean(0)
    return f
kf = flux(Si, 35, 130); sf = flux(Si, 1500, 5000); hf = flux(Si, 7000, 16000)
def norm(x, p=99.5):
    return np.clip(x/ (np.percentile(x,p)+1e-9), 0, 1)
kf=norm(kf); sf=norm(sf); hf=norm(hf)
# peak pick events
def events(f, thr, mindist):
    pk,_ = ss.find_peaks(f, height=thr, distance=mindist)
    return pk, f[pk]
kp, kv = events(kf, 0.35, int(0.18*FPS))
sp, sv = events(sf, 0.35, int(0.18*FPS))
print('kicks', len(kp), 'snares', len(sp))
# envelopes: attack instant, decay
def env(f, tau):
    out=np.zeros_like(f); a=np.exp(-1/(tau*FPS)); v=0
    for i,x in enumerate(f):
        v=max(x, v*a); out[i]=v
    return out
kick=env(kf, 0.12); snare=env(sf, 0.10); hat=env(hf,0.05)
bassE = np.sqrt((band(Si,30,180)**2).mean(0)); bassE=norm(ss.savgol_filter(bassE, 9, 2).clip(0))
# vocal rms
vr = librosa.feature.rms(y=vox, frame_length=2048, hop_length=hop)[0][:N]; vr=norm(vr, 99)
mr = librosa.feature.rms(y=mix, frame_length=2048, hop_length=hop)[0][:N]; mr=norm(mr, 99.5)
# 16 log bands of mix
edges = np.geomspace(40, 16000, 17)
bands=[]
for i in range(16):
    b = band(Sm, edges[i], edges[i+1])
    e = 20*np.log10(np.sqrt((b**2).mean(0))+1e-6)
    bands.append(e)
bands=np.array(bands)
bands = np.clip((bands - (bands.max(1,keepdims=True)-50))/50, 0, 1)
def pad(x):
    x=np.asarray(x)
    if len(x)<N: x=np.concatenate([x, np.zeros(N-len(x))])
    return x[:N]
feat = np.stack([pad(kick),pad(snare),pad(hat),pad(bassE),pad(vr),pad(mr)] + [pad(b) for b in bands], 1)
q = np.clip(np.round(feat*255),0,255).astype(np.uint8)
np.save('feat_u8.npy', q)
np.save('kick_events.npy', np.stack([kp/FPS, kv],1)); np.save('snare_events.npy', np.stack([sp/FPS, sv],1))
print(q.shape, dur)
# print snare events near breakdown region to see claps
print('snares 167-183:', np.round(sp[(sp/FPS>167)&(sp/FPS<183)]/FPS,2))
print('kicks 0-20:', np.round(kp[(kp/FPS<20)]/FPS,2))
