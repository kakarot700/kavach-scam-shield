#!/bin/sh
# Runs the UI cases in headless Chrome against the real page and prints each verdict.
cd "$(dirname "$0")/.."
sed 's#<script src="app.js"></script>#<script src="app.js"></script><script src="tests/ui_test.js"></script>#' index.html > _ui_test.html
google-chrome --headless=new --no-sandbox --disable-gpu --virtual-time-budget=5000 --dump-dom "file://$PWD/_ui_test.html" 2>/dev/null \
 | python3 -c "
import sys,re,json,html
m=re.search(r'<pre id=\"testout\">(.*?)</pre>',sys.stdin.read(),re.S)
R=json.loads(html.unescape(m.group(1)));bad=0;exact=0
for r in R:
    y=r['y']
    if y is None: ok=r['band'] is None; print('empty input ->', 'message shown' if ok else 'FAIL'); bad+=not ok; continue
    wrong=(y==0 and r['band']=='scam') or (y==1 and r['band']=='safe')
    ex=(y==0 and r['band']=='safe') or (y==1 and r['band']=='scam'); exact+=ex; bad+=wrong
    print('WRONG' if wrong else ('exact' if ex else 'not sure'), r['lg'], 'label', y, r['band'], r['score'], 'upi' if r['upi'] else '')
n=len([r for r in R if r['y'] is not None])
print(f'{n} messages: {n-bad} not wrong, {exact} exact, {bad} wrong'); sys.exit(1 if bad else 0)
"
rc=$?; rm -f _ui_test.html; exit $rc
