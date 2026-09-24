"""Word-level transcription with faster-whisper.

usage: python transcribe.py <model> <audio.wav> <out.json>
e.g.   python transcribe.py large-v3-turbo vocals16.wav vocals_turbo.json
"""
import sys, json, time
from faster_whisper import WhisperModel

model_name, audio, out = sys.argv[1], sys.argv[2], sys.argv[3]
t0 = time.time()
model = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=4)
segments, info = model.transcribe(audio, language="en", word_timestamps=True,
                                  vad_filter=False, beam_size=5, condition_on_previous_text=False,
                                  initial_prompt="Rusty the dog, spacetime machine, 1972, disco.")
res = []
for s in segments:
    words = [dict(w=w.word, s=w.start, e=w.end, p=w.probability) for w in (s.words or [])]
    res.append(dict(start=s.start, end=s.end, text=s.text, words=words))
    print(f"[{s.start:7.2f} -> {s.end:7.2f}] {s.text}", flush=True)
json.dump(res, open(out, "w"), indent=1)
print("done in", round(time.time() - t0, 1), "s", flush=True)
