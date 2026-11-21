/* KAVACH feature extractor — JS port of the Python trainer (train/feat.py).
   Hashed word + bigram + char 3-5gram features, L2-normalised, 2^18 buckets.
   Runs identically in the browser and in Node. */
(function (root) {
  const D = 1 << 18;
  const RULES = [
    [/<url>/g, ' zurlz '],
    [/<phone_number>/g, ' znumz '],
    [/<[a-z_]+>/g, ' '],
    [/(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|in|net|org|xyz|top|online|info|co|ly|me|io|site|link|cc|vip|shop|club|app|live|cn|ru|tk|ml|gq|cf)\b(\/[^\s]*)?)/g, ' zurlz '],
    [/\b[0-9]{1,2}[-/.][0-9a-z]{2,3}[-/.][0-9]{2,4}\b/g, ' '],
    [/(rs\.?|inr|\u20b9)\s?[0-9][0-9,]*(\.[0-9]+)?/g, ' zmoneyz '],
    [/\b(xx+|\*+)[0-9]{2,6}\b/g, ' zmaskz '],
    [/\+?[0-9][0-9x\- ]{7,}[0-9x]/g, ' znumz '],
    [/[0-9]+/g, '0']
  ];
  const TOK = /[a-z0-9\u0900-\u097f]+/g;
  const DEV = {'\u0966':'0','\u0967':'1','\u0968':'2','\u0969':'3','\u096a':'4','\u096b':'5','\u096c':'6','\u096d':'7','\u096e':'8','\u096f':'9'};

  function norm(t) {
    t = String(t).normalize('NFKC').toLowerCase();
    t = t.replace(/[\ud800-\udfff]/g, '');
    t = t.replace(/[\u0966-\u096f]/g, c => DEV[c]);
    for (const r of RULES) t = t.replace(r[0], r[1]);
    return t;
  }
  function h(s) {
    let x = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 0x01000193) >>> 0;
    return x % D;
  }
  function feats(text) {
    const toks = norm(text).match(TOK) || [];
    const f = new Map();
    const add = k => { const i = h(k); f.set(i, (f.get(i) || 0) + 1); };
    let prev = null;
    for (const t of toks) {
      add('w' + t);
      if (prev) add('b' + prev + '_' + t);
      prev = t;
      if (t.length <= 25) {
        const s = '^' + t + '$';
        for (const n of [3, 4, 5]) for (let j = 0; j + n <= s.length; j++) add('c' + s.substr(j, n));
      }
    }
    let ss = 0;
    for (const [k, v] of f) { const lv = Math.log1p(v); f.set(k, lv); ss += lv * lv; }
    const z = Math.sqrt(ss) || 1;
    const o = new Map();
    for (const [k, v] of f) o.set(k, v / z);
    return o;
  }
  function b64ToInt8(b64) {
    const bin = (typeof atob === 'function') ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const a = new Int8Array(bin.length);
    for (let i = 0; i < bin.length; i++) a[i] = (bin.charCodeAt(i) << 24) >> 24;
    return a;
  }
  function loadModel(o) { return { dim: o.dim, bias: o.bias, scale: o.scale, w: b64ToInt8(o.w) }; }
  function score(m, text) {
    const f = feats(text);
    let z = m.bias;
    for (const [i, v] of f) z += m.w[i] * v * m.scale;
    return 1 / (1 + Math.exp(-z));
  }
  const api = { norm, feats, h, loadModel, score, D };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.KAVACH_FEAT = api;
})(typeof window !== 'undefined' ? window : globalThis);
