/* KAVACH — on-device scam shield. No network calls, no storage, no telemetry. */
(function () {
  const F = window.KAVACH_FEAT;
  const MODEL = F.loadModel(window.KAVACH_MODEL);

  const T = {
    en: {
      verdict_scam: 'Likely a scam', verdict_maybe: 'Not sure — treat with care', verdict_safe: 'Looks genuine',
      risk: 'Scam risk', why: 'What pushed the score up', signals: 'Signals in this message',
      upi: 'Where this UPI link sends money', payee: 'Payee', amount: 'Amount', note: 'Note',
      collect: 'This is a collect request: approving it takes money OUT of your account.',
      pay: 'This is a payment request: money leaves your account if you pay it.',
      mismatch: 'The amount in the link does not match the amount in the message.',
      todo: 'What to do', none: 'Nothing in this message matched a known scam pattern.',
      offline: 'Runs fully offline. Nothing you paste leaves this device.',
      empty: 'Paste a message first.', demo: 'Play demo', check: 'Check message',
      loo: 'Words that moved the score most', model: 'on-device model', band: 'abstain band 0.30–0.70', ruleNote: 'Raised to “not sure” by a safety rule: a known scam signal plus pressure.', advNote: 'Held at “not sure”: reads as a safety warning (never share, beware) with nothing to act on outside official sites or helplines.', capNote: 'Held at “not sure”: no link, number, UPI or app to act on in this message.'
    },
    hi: {
      verdict_scam: 'संभवतः ठगी है', verdict_maybe: 'पक्का नहीं — सावधानी रखें', verdict_safe: 'असली लगता है',
      risk: 'ठगी का खतरा', why: 'स्कोर बढ़ाने वाली बातें', signals: 'इस संदेश में संकेत',
      upi: 'यह UPI लिंक पैसा कहाँ भेजता है', payee: 'पाने वाला', amount: 'रकम', note: 'टिप्पणी',
      collect: 'यह कलेक्ट रिक्वेस्ट है: मंज़ूर करने पर आपके खाते से पैसा निकलेगा।',
      pay: 'यह भुगतान रिक्वेस्ट है: भुगतान करने पर पैसा आपके खाते से जाएगा।',
      mismatch: 'लिंक की रकम संदेश की रकम से मेल नहीं खाती।',
      todo: 'क्या करें', none: 'इस संदेश में कोई जाना-पहचाना ठगी पैटर्न नहीं मिला।',
      offline: 'पूरी तरह ऑफ़लाइन चलता है। आपका संदेश इस डिवाइस से बाहर नहीं जाता।',
      empty: 'पहले संदेश पेस्ट करें।', demo: 'डेमो चलाएँ', check: 'संदेश जाँचें',
      loo: 'सबसे ज़्यादा असर डालने वाले शब्द', model: 'ऑन-डिवाइस मॉडल', band: 'अनिश्चित दायरा 0.30–0.70', ruleNote: 'सुरक्षा नियम से “अनिश्चित” तक बढ़ाया गया: स्कैम संकेत और दबाव दोनों मिले।', advNote: 'सुरक्षा चेतावनी जैसा संदेश (कभी साझा न करें, सावधान), सरकारी साइट/हेल्पलाइन के अलावा कुछ करने को नहीं कहता: “पक्का नहीं” पर रोका गया।', capNote: '“अनिश्चित” पर रोका गया: इस संदेश में कोई लिंक, नंबर, UPI या ऐप नहीं है।'
    },
    hi_lat: {
      verdict_scam: 'Lagta hai thagi hai', verdict_maybe: 'Pakka nahi — dhyan rakhein', verdict_safe: 'Asli lagta hai',
      risk: 'Thagi ka khatra', why: 'Score badhane wali baatein', signals: 'Is message mein sanket',
      upi: 'Yeh UPI link paisa kahan bhejta hai', payee: 'Paane wala', amount: 'Rakam', note: 'Note',
      collect: 'Yeh collect request hai: manzoor karne par aapke account se paisa nikalega.',
      pay: 'Yeh payment request hai: pay karne par paisa aapke account se jayega.',
      mismatch: 'Link ki rakam message ki rakam se match nahi karti.',
      todo: 'Kya karein', none: 'Is message mein koi jana-pehchana thagi pattern nahi mila.',
      offline: 'Poora offline chalta hai. Aapka message is device se bahar nahi jata.',
      empty: 'Pehle message paste karein.', demo: 'Demo chalao', check: 'Message jaanchein',
      loo: 'Sabse zyada asar dalne wale shabd', model: 'on-device model', band: 'abstain band 0.30–0.70', ruleNote: 'Safety rule ne “pakka nahi” tak badhaya: scam signal aur dabav dono mile.', advNote: 'Safety warning jaisa message (share na karein, savdhan), official site/helpline ke alawa kuch karne ko nahi kehta: “pakka nahi” par roka gaya.', capNote: '“Pakka nahi” par roka: is message mein koi link, number, UPI ya app nahi.'
    }
  };

  // Signal groups. Each is a plain-language reason plus the phrases that matched.
  const SIGNALS = [
    { id: 'urgency', en: 'Creates urgency', hi: 'जल्दबाज़ी पैदा करता है', hl: 'Jaldbaazi paida karta hai',
      re: /\b(immediately|urgent|right now|today itself|within 24 hours?|last chance|final warning|expires? today|aaj hi|turant|abhi|jaldi|foran)\b|\u0924\u0941\u0930\u0902\u0924|\u0906\u091c \u0939\u0940|\u0905\u092d\u0940|\u091c\u0932\u094d\u0926/gi },
    { id: 'threat', en: 'Threatens to block, disconnect or arrest', hi: 'ब्लॉक, कटौती या गिरफ़्तारी की धमकी', hl: 'Block, katauti ya giraftari ki dhamki',
      re: /\b(block(ed|ing)?|suspend(ed)?|deactivat(e|ed)|disconnect(ed)?|terminated?|frozen|legal action|arrest(ed)?|penalty|court case|fir)\b|\bband ho|\bkat jayega|\bgiraftar|\u092c\u0902\u0926|\u0915\u091f \u091c\u093e\u092f\u0947\u0917\u093e|\u0917\u093f\u0930\u092b\u094d\u0924\u093e\u0930/gi },
    { id: 'money', en: 'Asks for a payment or a fee', hi: 'भुगतान या फ़ीस माँगता है', hl: 'Payment ya fees maangta hai',
      re: /\b(pay|payment|fee|fees|charges?|processing|clearance|customs duty|transfer|deposit|send money|bhejo|paisa bhej)\b|\u092a\u0948\u0938\u0947|\u092d\u0941\u0917\u0924\u093e\u0928|\u0936\u0941\u0932\u094d\u0915/gi },
    { id: 'prize', en: 'Promises a prize, lottery or windfall', hi: 'इनाम, लॉटरी या मुनाफ़े का लालच', hl: 'Inaam, lottery ya munafe ka lalach',
      re: /\b(won|winner|lottery|lucky (draw|winner)|prize|jackpot|crore|lakh|reward points?|cashback of)\b|\bjeeta|\binaam|\u0907\u0928\u093e\u092e|\u0932\u0949\u091f\u0930\u0940|\u091c\u0940\u0924\u093e/gi },
    { id: 'kyc', en: 'Pushes a KYC, verification or account update', hi: 'केवाईसी या वेरिफ़िकेशन का दबाव', hl: 'KYC ya verification ka dabav',
      re: /\b(kyc|re-?kyc|verify|verification|update your (account|details|pan|aadhaar)|re-?activate|pan card|aadhaar)\b|\u0915\u0947\u0935\u093e\u0908\u0938\u0940|\u0938\u0924\u094d\u092f\u093e\u092a\u0928/gi },
    { id: 'otp', en: 'Asks for an OTP, PIN, CVV or password', hi: 'ओटीपी, पिन, सीवीवी या पासवर्ड माँगता है', hl: 'OTP, PIN, CVV ya password maangta hai',
      re: /\b(otp|one[- ]time password|pin|cvv|password|passcode|share the code|tell me the code)\b|\u0913\u091f\u0940\u092a\u0940|\u092a\u093f\u0928/gi },
    { id: 'apk', en: 'Asks you to install an app or file', hi: 'ऐप या फ़ाइल इंस्टॉल करने को कहता है', hl: 'App ya file install karne ko kehta hai',
      re: /\.apk\b|\b(install (this|the) app|download (this|the) app|anydesk|teamviewer|quick ?support|screen shar)/gi },
    { id: 'authority', en: 'Claims to be police, CBI, customs, bank or a regulator', hi: 'पुलिस, सीबीआई, कस्टम, बैंक या नियामक होने का दावा', hl: 'Police, CBI, customs, bank ya regulator hone ka dava',
      re: /\b(cbi|police|inspector|officer|income tax|it department|customs|court|trai|rbi|sebi|narcotics|enforcement directorate|cyber cell)\b|\u092a\u0941\u0932\u093f\u0938|\u0938\u0940\u092c\u0940\u0906\u0908/gi },
    { id: 'job', en: 'Offers easy money or a work-from-home job', hi: 'आसान कमाई या घर से काम का लालच', hl: 'Aasan kamai ya ghar se kaam ka lalach',
      re: /\b(work from home|part[- ]time job|earn (daily|per day|from home)|no experience|daily income|telegram|whatsapp me|join (our )?(group|channel))\b|\u0918\u0930 \u0938\u0947 \u0915\u093e\u092e/gi },
    { id: 'generic', en: 'Generic greeting, not addressed to you by name', hi: 'सामान्य संबोधन, आपके नाम से नहीं', hl: 'Aam sambodhan, aapke naam se nahi',
      re: /\b(dear (customer|user|sir\/madam|valued customer|member|winner)|dear all)\b/gi },
    { id: 'link', en: 'Contains a link', hi: 'इसमें एक लिंक है', hl: 'Isme ek link hai',
      re: /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9-]+(\.[a-z0-9-]+)*\.(xyz|top|online|site|link|cc|vip|shop|club|live|tk|ml|gq|cf|info|icu|buzz)\b)/gi }
  ];

  const TODO = {
    en: [
      'Do not tap the link, call the number or install anything from this message.',
      'Check the claim in the bank or company\u2019s own app, never through a link in a message.',
      'Never share an OTP, PIN or CVV. No bank, police or company will ever ask for one.',
      'Report it free on cybercrime.gov.in or call 1930, and forward the SMS to 1909.'
    ],
    hi: [
      'लिंक पर टैप न करें, संदेश में दिए नंबर पर कॉल न करें, कोई ऐप इंस्टॉल न करें।',
      'दावा बैंक या कंपनी के अपने ऐप में जाँचें, संदेश के लिंक से कभी नहीं।',
      'ओटीपी, पिन या सीवीवी कभी साझा न करें। कोई बैंक, पुलिस या कंपनी कभी नहीं माँगती।',
      'cybercrime.gov.in पर मुफ़्त शिकायत करें या 1930 पर कॉल करें, और एसएमएस 1909 पर भेजें।'
    ],
    hi_lat: [
      'Link par tap na karein, message ke number par call na karein, koi app install na karein.',
      'Dava bank ya company ke apne app mein jaanchein, message ke link se kabhi nahi.',
      'OTP, PIN ya CVV kabhi share na karein. Koi bank, police ya company kabhi nahi maangti.',
      'cybercrime.gov.in par muft shikayat karein ya 1930 par call karein, aur SMS 1909 par bhejein.'
    ]
  };

  const SAMPLES = [
    { lang: 'en', text: 'Dear customer, your SBI account will be blocked today as KYC is pending. Update immediately at http://sbi-kyc-verify.xyz/up or your account will be suspended.' },
    { lang: 'hi', text: '\u0938\u0930 \u092f\u0939 \u0938\u0940\u092c\u0940\u0906\u0908 \u0938\u0947 \u0939\u0948\u0964 \u0906\u092a\u0915\u0947 \u0928\u093e\u092e \u092a\u0930 \u092e\u0941\u0915\u0926\u092e\u093e \u0926\u0930\u094d\u091c \u0939\u0948\u0964 \u0905\u092d\u0940 \u0935\u0940\u0921\u093f\u092f\u094b \u0915\u0949\u0932 \u092a\u0930 \u0906\u0913 \u0935\u0930\u0928\u093e \u0917\u093f\u0930\u092b\u094d\u0924\u093e\u0930 \u0939\u094b \u091c\u093e\u092f\u0947\u0917\u093e\u0964 \u0938\u0947\u091f\u0932\u092e\u0947\u0902\u091f \u0915\u0947 \u0932\u093f\u090f 9876543210 \u092a\u0930 \u0938\u0902\u092a\u0930\u094d\u0915 \u0915\u0930\u0947\u0902\u0964' },
    { lang: 'hi_lat', text: 'Aapka Flipkart parcel customs mein ruka hai. Rs.499 clearance fee bhejo is UPI par: upi://pay?pa=parcel.clearance99@okaxis&pn=Customs%20Clearance&am=499&cu=INR&tn=Parcel%20release' },
    { lang: 'en', text: 'Your OTP for login is 482913. Valid for 10 minutes. Do not share it with anyone, not even bank staff.' }
  ];

  // A message with no way to act on it (link, number, UPI, app) is never called a likely scam.
  const VECTOR = /(https?:\/\/|www\.|bit\.ly|t\.me\/|upi:\/\/|\.apk\b|\+91|\b\d{10}\b|\b1800[\s-]?\d|[a-z0-9._-]+@[a-z0-9-]+\.[a-z]{2,}|<(url|phone_number|email_address)>|\b[a-z0-9-]+\.(com|in|xyz|top|online|site|link|cc|vip|shop|club|live|tk|ml|gq|cf|info|icu|buzz|ly|me)\b|\b(call|contact|reply|click|tap here|whatsapp|video call|press \d|send|bhej\w*|number (pe|par)|download|install|log ?on|login|visit|email)\b|कॉल|संपर्क|सम्पर्क|भेज|लिंक|क्लिक)/i;
  // advisory framing: warnings like "never share your OTP" with nothing to act on outside official sites/helplines
  const OFFICIAL=/(?<![a-z0-9.@-])(?:https?:\/\/)?(?:www\.)?((?:[a-z0-9-]+\.)*(?:rbi\.org\.in|gov\.in|nic\.in|dicgc\.org\.in|npci\.org\.in|cert-in\.org\.in))(?![a-z0-9.-]*[a-z0-9-])(?:\/[^\s]*)?/gi;
  const HELPLINE=/\b(1930|14448|1909|155260)\b/g;
  const HARD=/(https?:\/\/|www\.|bit\.ly|t\.me\/|upi:\/\/|\.apk\b|\+91|\b\d{10}\b|\b1800[\s-]?\d|[a-z0-9._-]+@[a-z0-9-]+\.[a-z]{2,}|\b[a-z0-9._-]{2,}@[a-z]{2,}\b|<(url|phone_number|email_address)>|\b[a-z0-9-]+\.(com|in|net|org|xyz|top|online|site|link|cc|vip|shop|club|live|tk|ml|gq|cf|info|icu|buzz|ly|me|io|app)\b)/i;
  const ADVISORY=/\b(never (share|ask|asks|call|calls|disclose|give|reveal|send|seek|seeks)|(do not|don't|dont|doesn't|does not|will not|won't|never) (share|ask|disclose|reveal|give|fall|click|respond|trust|seek)|beware|be (alert|cautious|careful|aware|vigilant)|stay (alert|safe|vigilant)|satark|savdhan|saavdhan|share na kar\w*|kabhi nahi|nahi maang\w*)\b|साझा न कर|कभी नहीं|सावधान|सतर्क/i;
  const ASK=/\b(reply|send|share|tell|provide|enter|click|tap|download|install|video call|press \d|bhej\w*|batao|bataiye|update (your|now|immediately|kyc|details|account))\b|भेजें|भेजो|बताएं|बताइए/gi;
  const NEG=/\b(not|never|n't|na|mat|nahi|nahin|no|avoid|without)\b[^.!?\n]{0,60}$|(न|मत|नहीं)[^।.!?\n]{0,40}$/i;
  const POST=/^[^.!?\n]{0,25}\b(na|mat|nahi|nahin)\b|^[^।.!?\n]{0,25}(न |मत|नहीं)/i;
  function positiveAsk(text){ASK.lastIndex=0;let m;while((m=ASK.exec(text))){const before=text.slice(Math.max(0,m.index-40),m.index);const after=text.slice(m.index+m[0].length,m.index+m[0].length+40);if(!NEG.test(before)&&!POST.test(after))return m[0];}return '';}

  let lang = 'en';
  const $ = s => document.querySelector(s);
  const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; };

  /* ---------- UPI decoding ---------- */
  function decodeUpi(text) {
    const out = [];
    const re = /upi:\/\/[^\s"'<>]+/gi;
    let m;
    while ((m = re.exec(text))) {
      const raw = m[0];
      const q = raw.split('?')[1] || '';
      const p = {};
      for (const kv of q.split('&')) {
        const i = kv.indexOf('=');
        if (i < 0) continue;
        p[decodeURIComponent(kv.slice(0, i)).toLowerCase()] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' '));
      }
      out.push({ raw, pa: p.pa || '', pn: p.pn || '', am: p.am || '', cu: p.cu || '', tn: p.tn || p.txnnote || '', mode: p.mode || '', mc: p.mc || '' });
    }
    if (!out.length) {
      const v = text.match(/\b[a-z0-9._-]{2,}@(ok(?:hdfc|icici|sbi|axis|kotak)|ybl|paytm|apl|ibl|axl|upi)\b/gi);
      if (v) out.push({ raw: v[0], pa: v[0], pn: '', am: '', cu: '', tn: '', mode: '', mc: '' });
    }
    return out;
  }

  /* ---------- leave-one-out word attribution ---------- */
  function attribute(text, full) {
    const toks = [];
    const re = /\S+/g;
    let m;
    while ((m = re.exec(text))) toks.push({ w: m[0], i: m.index, j: m.index + m[0].length });
    const scored = toks.map(t => {
      const without = text.slice(0, t.i) + ' ' + text.slice(t.j);
      return { ...t, delta: full - F.score(MODEL, without) };
    });
    return scored.sort((a, b) => b.delta - a.delta);
  }

  /* ---------- render ---------- */
  function analyse() {
    const text = $('#msg').value.trim();
    const res = $('#result');
    res.innerHTML = '';
    if (!text) { res.appendChild(el('p', 'muted', T[lang].empty)); res.hidden = false; return; }

    const p0 = F.score(MODEL, text);
    const hitIds = SIGNALS.filter(s => { s.re.lastIndex = 0; const r = s.re.test(text); s.re.lastIndex = 0; return r; }).map(s => s.id);
    const STRONG = ['kyc', 'otp', 'threat', 'authority', 'prize', 'apk', 'job'], PRESS = ['urgency', 'link', 'threat', 'money'];
    const ruleHit = hitIds.some(i => STRONG.includes(i)) && hitIds.filter(i => STRONG.includes(i) || PRESS.includes(i)).length >= 2;
    let p = p0, adj = '';
    const st = text.replace(OFFICIAL, ' ').replace(HELPLINE, ' ');
    const advisory = ADVISORY.test(text) && !HARD.test(st) && !positiveAsk(text);
    const officialOnly = st !== text && !HARD.test(st);
    if (advisory) { if (p > 0.69) { p = 0.69; adj = 'advNote'; } }
    else {
      if (ruleHit && p < 0.5) { p = 0.5; adj = 'ruleNote'; }
      if ((!VECTOR.test(st) || officialOnly) && p >= 0.7) { p = 0.69; adj = 'capNote'; }
    }
    const band = p >= 0.7 ? 'scam' : p >= 0.3 ? 'maybe' : 'safe';
    const t = T[lang];

    const head = el('div', 'verdict ' + band);
    head.appendChild(el('span', 'dot'));
    head.appendChild(el('strong', null, t['verdict_' + band]));
    head.appendChild(el('span', 'score', Math.round(p * 100) + '/100'));
    res.appendChild(head);

    const bar = el('div', 'bar');
    const fill = el('div', 'fill ' + band);
    fill.style.width = Math.max(2, Math.round(p * 100)) + '%';
    bar.appendChild(fill);
    res.appendChild(bar);
    res.appendChild(el('p', 'muted small', t.risk + ' \u00b7 ' + t.model + ' \u00b7 ' + t.band));
    if (adj) res.appendChild(el('p', 'muted small ' + (adj === 'ruleNote' ? 'rule' : 'cap'), t[adj]));

    // highlighted message
    const att = attribute(text, p0);
    const hot = new Set(att.filter(a => a.delta > 0.015).slice(0, 12).map(a => a.i));
    const box = el('div', 'msg');
    let cursor = 0;
    const spans = att.slice().sort((a, b) => a.i - b.i);
    for (const s of spans) {
      if (s.i > cursor) box.appendChild(document.createTextNode(text.slice(cursor, s.i)));
      const w = el('span', hot.has(s.i) ? 'flag' : null, s.w);
      if (hot.has(s.i)) w.title = '+' + (s.delta * 100).toFixed(0);
      box.appendChild(w);
      cursor = s.j;
    }
    if (cursor < text.length) box.appendChild(document.createTextNode(text.slice(cursor)));
    res.appendChild(box);

    // signals
    const hits = [];
    for (const s of SIGNALS) {
      s.re.lastIndex = 0;
      const found = text.match(s.re);
      if (found) hits.push({ s, found: [...new Set(found.map(x => x.trim()))].slice(0, 3) });
    }
    if (hits.length) {
      res.appendChild(el('h3', null, t.signals));
      const ul = el('ul', 'signals');
      for (const h of hits) {
        const li = el('li');
        li.appendChild(el('b', null, h.s[lang === 'hi' ? 'hi' : lang === 'hi_lat' ? 'hl' : 'en']));
        li.appendChild(el('span', 'quote', ' \u201c' + h.found.join('\u201d, \u201c') + '\u201d'));
        ul.appendChild(li);
      }
      res.appendChild(ul);
    } else {
      res.appendChild(el('p', 'muted', t.none));
    }

    // UPI
    const upis = decodeUpi(text);
    if (upis.length) {
      res.appendChild(el('h3', null, t.upi));
      for (const u of upis) {
        const card = el('div', 'upi');
        const rows = [
          [t.payee, u.pn ? u.pn + ' (' + u.pa + ')' : u.pa],
          [t.amount, u.am ? '\u20b9' + u.am + ' ' + (u.cu || '') : '\u2014'],
          [t.note, u.tn || '\u2014']
        ];
        for (const [k, v] of rows) {
          const r = el('div', 'row');
          r.appendChild(el('span', 'k', k));
          r.appendChild(el('span', 'v', v));
          card.appendChild(r);
        }
        const isCollect = /collect/i.test(u.mode) || /collect/i.test(u.tn);
        card.appendChild(el('p', 'warn', isCollect ? t.collect : t.pay));
        const amInText = text.match(/(?:rs\.?|inr|\u20b9)\s?([0-9][0-9,]*)/i);
        if (u.am && amInText && amInText[1].replace(/,/g, '') !== u.am.replace(/\.00$/, '')) {
          card.appendChild(el('p', 'warn', t.mismatch + ' (' + amInText[1] + ' vs ' + u.am + ')'));
        }
        res.appendChild(card);
      }
    }

    // what to do
    if (band !== 'safe') {
      res.appendChild(el('h3', null, t.todo));
      const ol = el('ol', 'todo');
      for (const line of TODO[lang]) ol.appendChild(el('li', null, line));
      res.appendChild(ol);
    }

    // top words
    const top = att.filter(a => a.delta > 0.005).slice(0, 6);
    if (top.length) {
      res.appendChild(el('h3', null, t.loo));
      const chips = el('div', 'chips');
      for (const a of top) chips.appendChild(el('span', 'chip', (a.w.length > 30 ? a.w.slice(0, 28) + '\u2026' : a.w) + ' +' + (a.delta * 100).toFixed(0)));
      res.appendChild(chips);
    }

    res.hidden = false;
  }

  /* ---------- demo ---------- */
  let demoing = false;
  async function demo() {
    if (demoing) return;
    demoing = true;
    const btn = $('#demo');
    btn.disabled = true;
    for (const s of SAMPLES) {
      setLang(s.lang);
      $('#msg').value = '';
      const cap = $('#caption');
      cap.textContent = s.lang === 'hi' ? '\u0939\u093f\u0902\u0926\u0940 \u0938\u0902\u0926\u0947\u0936' : s.lang === 'hi_lat' ? 'Hinglish message' : 'English message';
      cap.hidden = false;
      for (let i = 0; i < s.text.length; i += 3) {
        $('#msg').value = s.text.slice(0, i + 3);
        await sleep(8);
      }
      $('#msg').value = s.text;
      await sleep(250);
      analyse();
      await sleep(2600);
    }
    cap.hidden = true;
    btn.disabled = false;
    demoing = false;
  }
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function setLang(l) {
    lang = l;
    document.documentElement.lang = l === 'hi' ? 'hi' : 'en';
    for (const b of document.querySelectorAll('[data-lang]')) b.classList.toggle('on', b.dataset.lang === l);
    $('#offline').textContent = T[l].offline;
    $('#check').textContent = T[l].check;
    $('#demo').textContent = T[l].demo;
    if ($('#msg').value.trim()) analyse();
  }

  window.addEventListener('DOMContentLoaded', () => {
    for (const b of document.querySelectorAll('[data-lang]')) b.addEventListener('click', () => setLang(b.dataset.lang));
    $('#check').addEventListener('click', analyse);
    $('#demo').addEventListener('click', demo);
    $('#msg').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) analyse(); });
    for (const b of document.querySelectorAll('[data-sample]')) {
      b.addEventListener('click', () => {
        const s = SAMPLES[+b.dataset.sample];
        setLang(s.lang);
        $('#msg').value = s.text;
        analyse();
      });
    }
    setLang('en');
  });
})();
