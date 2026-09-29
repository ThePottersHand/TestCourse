"""Measure the song's beat grid (tempo + phase) from the kick drum in the instrumental stem.

usage: python beat_grid.py no_vocals.wav
The song is a 212 BPM punk two-step: one kick every 0.283 s, steady from ~2 s to 15.5 s (the intro
and the held "beeeeennnnn" have no steady beat). src/core.js hard-codes RV.BEAT = 0.2830 and puts
RV.BEAT0 on the kick grid so the half-note "down" lands on the four big "Ben"s of the second chorus.
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


def score(period, phase, a=2.0, b=15.5):
    ts = np.arange(phase, b, period)
    ts = ts[ts >= a]
    return np.interp(ts, tt, env).mean()


best = max((score(p, ph), p, ph) for p in np.linspace(0.27, 0.30, 121)
           for ph in np.linspace(0, p, 100, endpoint=False))
_, period, phase = best
print(f"kick every {period:.4f} s ({60 / period:.1f} BPM), first kick phase {phase:.4f} s")
for a in np.arange(2.0, 15.0, 2.0):
    phases = np.linspace(0, period, 100, endpoint=False)
    local = phases[int(np.argmax([score(period, p, a, a + 2.5) for p in phases]))]
    drift = ((local - phase + period / 2) % period) - period / 2
    print(f"  {a:5.1f}s  drift {drift * 1000:+5.0f} ms")
