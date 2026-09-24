"""Measure the song's beat grid (tempo + phase) from percussive onsets.

usage: python beat_grid.py song.wav
The result (176.0 BPM, beat 0 at 0.2443 s) is hard-coded in src/core.js as RV.BEAT / RV.BEAT0.
"""
import sys
import numpy as np
import librosa

y, sr = librosa.load(sys.argv[1], sr=22050, mono=True)
_, perc = librosa.effects.hpss(y)
hop = 128
env = librosa.onset.onset_strength(y=perc, sr=sr, hop_length=hop)
tt = librosa.times_like(env, sr=sr, hop_length=hop)

# the onset autocorrelation peaks at 0.341 s (quarter note) and 1.364 s (bar)
def score(period, phase, a=0.0, b=None):
    b = b or tt[-1]
    ts = np.arange(phase, b, period)
    ts = ts[ts >= a]
    return np.interp(ts, tt, env).mean()

best = max(((score(p, ph), p, ph) for p in np.linspace(0.3395, 0.3425, 61)
            for ph in np.linspace(0, p, 120, endpoint=False)))
_, period, phase = best
print(f"tempo {60 / period:.2f} BPM, period {period:.4f} s, beat0 {phase:.4f} s")
# check the phase holds across the song
for a in range(0, int(tt[-1]) - 15, 15):
    phases = np.linspace(0, period, 120, endpoint=False)
    local = phases[int(np.argmax([score(period, p, a, a + 15) for p in phases]))]
    drift = ((local - phase + period / 2) % period) - period / 2
    print(f"  {a:4d}s  drift {drift * 1000:+5.0f} ms")
