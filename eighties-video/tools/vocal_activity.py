import numpy as np, librosa
v, sr = librosa.load('sep/htdemucs/song/vocals.wav', sr=22050, mono=True)
hop=220  # 10ms
rms = librosa.feature.rms(y=v, frame_length=1024, hop_length=hop)[0]
t = np.arange(len(rms))*hop/sr
thr = 0.02
act = rms>thr
# find phrases: active regions merged with gaps < 0.25s
segs=[]; start=None; last=None
for i,a in enumerate(act):
    if a:
        if start is None: start=t[i]
        last=t[i]
    else:
        if start is not None and t[i]-last>0.35:
            segs.append((start,last)); start=None
if start is not None: segs.append((start,last))
segs=[s for s in segs if s[1]-s[0]>0.15]
for s in segs: print(f"{s[0]:7.2f} - {s[1]:7.2f}  ({s[1]-s[0]:.2f}s)")
np.save('vox_rms.npy', rms)
