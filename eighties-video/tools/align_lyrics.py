import stable_whisper, json
model = stable_whisper.load_model('small.en', device='cpu')
text = open('sung.txt').read()
res = model.align('sep/htdemucs/song/vocals.wav', text, language='en')
res.save_as_json('aligned_small.json')
for s in res.segments:
    print(f"{s.start:7.2f}-{s.end:7.2f} {s.text}")
