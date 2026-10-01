"""Measure the song's beat grid (tempo + phase) from the kick drum in the instrumental stem.

usage: python beat_grid.py no_vocals.wav
The song is a slow hip-hop groove at 77.5 BPM: a kick or snare every 0.774 s, with syncopated kicks in
between. The drums play from 13.2 s to 31.6 s and again from 41 s. src/core.js hard-codes RV.BEAT =
0.3870 (the eighth note) and RV.BEAT0 = 0.4257 (a kick).
"""
import sys
import numpy as np
import librosa

y, sr = librosa.load(sys.argv[1], sr=22050, mono=True)
hop = 128
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
low = S[(freqs > 30) & (freqs < 150)].sum(0)
env = np.maximum(0, np.diff(low, prepend=low[0]))
tt = librosa.times_like(env, sr=sr, hop_length=hop)


def score(period, phase, a=13.0, b=31.6):
    ts = np.arange(phase, b, period)
    ts = ts[ts >= a]
    return np.interp(ts, tt, env).mean()


best = max((score(p, ph), p, ph) for p in np.linspace(0.72, 0.82, 201)
           for ph in np.linspace(0, p, 100, endpoint=False))
_, period, phase = best
print(f"kick every {period:.4f} s ({60 / period:.1f} BPM), first kick phase {phase:.4f} s")
for a in np.arange(13.0, 29.0, 3.0):
    phases = np.linspace(0, period, 100, endpoint=False)
    local = phases[int(np.argmax([score(period, p, a, a + 2.5) for p in phases]))]
    drift = ((local - phase + period / 2) % period) - period / 2
    print(f"  {a:5.1f}s  drift {drift * 1000:+5.0f} ms")
