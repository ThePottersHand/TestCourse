import whisper, json
model = whisper.load_model('small.en')
res = model.transcribe('sep/htdemucs/song/vocals.wav', language='en', word_timestamps=True, condition_on_previous_text=False, verbose=False)
json.dump(res, open('whisper_small.json','w'))
for s in res['segments']:
    print(f"{s['start']:7.2f}-{s['end']:7.2f} {s['text']}")
