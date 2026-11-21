"""Python vs JavaScript parity: the browser must score every message exactly as the trainer does."""
import json, sys, os, base64, math, subprocess
import numpy as np, pandas as pd
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
sys.path.insert(0, os.path.join(root, 'train'))
from feat import feats
m = json.load(open(os.path.join(root, 'model.json')))
w = np.frombuffer(base64.b64decode(m['w']), dtype=np.int8).astype(float) * m['scale']
msgs = pd.read_csv(os.path.join(root, 'eval', 'india120.csv')).message.tolist()
py = [1 / (1 + math.exp(-(m['bias'] + sum(w[i] * v for i, v in feats(t).items())))) for t in msgs]
js = json.loads(subprocess.run(['node', os.path.join(here, 'parity_test.js')], input=json.dumps(msgs),
                               capture_output=True, text=True, check=True).stdout)
d = max(abs(a - b) for a, b in zip(py, js))
print(f'{len(msgs)} messages, max |python - js| = {d:.6f}')
sys.exit(0 if d < 1e-6 else 1)
