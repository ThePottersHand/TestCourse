import numpy as np
from beat_this.inference import File2Beats
f2b = File2Beats(checkpoint_path="final0", device="cpu", dbn=False)
beats, downbeats = f2b('song.wav')
np.save('bt_beats.npy', beats); np.save('bt_downbeats.npy', downbeats)
print(len(beats), len(downbeats))
print('beats', np.round(beats[:20],3))
print('downbeats', np.round(downbeats[:12],3))
ib = np.diff(beats)
print('ibi med', np.median(ib), 60/np.median(ib))
# beats per bar consistency
bi = np.searchsorted(beats, downbeats-0.02)
print('beats between downbeats', np.unique(np.diff(bi), return_counts=True))
