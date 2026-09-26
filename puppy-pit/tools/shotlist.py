"""Print the shot list with film timecodes (reads src/timeline.js via node)."""
import json, subprocess, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
js = "import('./src/timeline.js').then(m => console.log(JSON.stringify(m.SHOTS.map(s => [s.id, s.start, s.end]))))"
out = subprocess.run(["node", "--input-type=module", "-e", js], cwd=ROOT, capture_output=True, text=True)
shots = json.loads(out.stdout)
tc = lambda t: f"{int(t // 60):01d}:{t % 60:05.2f}"
for sid, a, b in shots:
    print(f"{tc(a):>8} – {tc(b):>8}  {sid}")
