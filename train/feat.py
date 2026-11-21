import re,unicodedata,math
D=1<<18
R=[(re.compile(r'<url>'),' zurlz '),(re.compile(r'<phone_number>'),' znumz '),(re.compile(r'<[a-z_]+>'),' '),
(re.compile(r'(https?://[^\s]+|www\.[^\s]+|\b[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|in|net|org|xyz|top|online|info|co|ly|me|io|site|link|cc|vip|shop|club|app|live|cn|ru|tk|ml|gq|cf)\b(/[^\s]*)?)'),' zurlz '),
(re.compile(r'\b[0-9]{1,2}[-/.][0-9a-z]{2,3}[-/.][0-9]{2,4}\b'),' '),
(re.compile(r'(rs\.?|inr|₹)\s?[0-9][0-9,]*(\.[0-9]+)?'),' zmoneyz '),
(re.compile(r'\b(xx+|\*+)[0-9]{2,6}\b'),' zmaskz '),
(re.compile(r'\+?[0-9][0-9x\- ]{7,}[0-9x]'),' znumz '),
(re.compile(r'[0-9]+'),'0')]
TOK=re.compile(r'[a-z0-9\u0900-\u097f]+')
DEV=str.maketrans('०१२३४५६७८९','0123456789')
def norm(t):
    t=unicodedata.normalize('NFKC',str(t)).lower()
    t=re.sub(r'[^\u0000-\uffff]','',t).translate(DEV)
    for p,s in R: t=p.sub(s,t)
    return t
def h(s):
    x=0x811c9dc5
    for c in s: x=((x^ord(c))*0x01000193)&0xffffffff
    return x%D
def feats(text):
    toks=TOK.findall(norm(text)); f={}
    def add(k): i=h(k); f[i]=f.get(i,0)+1
    prev=None
    for t in toks:
        add('w'+t)
        if prev: add('b'+prev+'_'+t)
        prev=t
        if len(t)<=25:
            s='^'+t+'$'
            for n in (3,4,5):
                for j in range(len(s)-n+1): add('c'+s[j:j+n])
    f={k:math.log1p(v) for k,v in f.items()}
    z=math.sqrt(sum(v*v for v in f.values())) or 1
    return {k:v/z for k,v in f.items()}
