# KAVACH (कवच): scam messages, explained before you tap

KAVACH checks an SMS, WhatsApp message or UPI payment link and tells you, in English, हिंदी or Hinglish, whether it looks like a scam, **why**, and what to do. It runs entirely in your browser: no server, no network calls, no storage. Nothing you paste ever leaves the device.

**Live demo:** https://kakarot700.github.io/kavach-scam-shield/

## The problem
Indians lose large sums every year to "digital arrest", fake KYC, parcel-customs, part-time-job and UPI collect-request scams. Most arrive as a message in Hindi, English or a mix of both, and the people most at risk (parents, first-time smartphone users) are the least likely to paste a private message into a cloud chatbot. A checker that works offline, in their language, and explains its reasoning fills that gap.

## What it does
- **Scores the message** with an on-device model (about 350 KB) and puts it in one of three bands: *Looks genuine*, *Not sure, treat with care*, *Likely a scam*.
- **Shows the words that moved the score**, highlighted in the message itself, plus named signals: urgency, threats, authority impersonation (CBI, police, RBI), KYC/OTP requests, prizes, job offers, APK/screen-sharing apps, suspicious links.
- **Decodes UPI links** (`upi://pay?...`): payee, amount, note, and a plain-language warning when it is a *collect* request (approving it takes money **out**) or when the amount in the link differs from the one in the text.
- **Tells you what to do next**: don't share OTPs, call the bank on the number on your card, report at 1930 / cybercrime.gov.in.
- Fully trilingual UI (English / हिंदी / Hinglish) and a one-click *Play demo*.

## How the AI works
1. **Features:** text is normalised (URLs, phone numbers, amounts, masked account numbers and Devanagari digits mapped to tokens), then hashed word, word-bigram and character 3-5-gram features into 2^18 buckets. Character n-grams let one model read Devanagari, Latin-script Hinglish and English together.
2. **Model:** L2-regularised logistic regression trained on public smishing and genuine-SMS corpora (English, Hindi, and Hindi machine-translated SMS), weights quantised to int8 and shipped as `model.json`.
3. **Explainability:** the model is linear, so each word's exact contribution to the score is shown, not a post-hoc guess.
4. **Safety layer (deterministic, `train/sig.py` and `app.js`):**
   - a *floor*: a known scam signal combined with pressure lifts a "genuine" score to at least "not sure";
   - a *cap*: a message with nothing to act on (no link, number, UPI ID or app) is held at "not sure" instead of "likely scam", which cuts false alarms on genuine messages.
   - an *advisory* rule: a safety warning ("never share your OTP", "RBI never asks", "beware", "share na karein", "साझा न करें") with nothing to act on outside official sites (rbi.org.in, gov.in, dicgc.org.in, npci.org.in ...) and helplines (1930, 14448) is held at "not sure" at most. A warning that also asks you to reply, send or click, or carries any other link, number or UPI ID, is judged as usual.
5. **Abstention by design:** the middle band lets the tool say "not sure" rather than confidently mislabel. A scam called "genuine" is the worst error, so the bands are tuned to keep that rare.

The JavaScript feature code is a line-for-line port of the Python trainer; `tests/parity_test.py` checks they give identical scores.

## Measured results
Shipped configuration = model + floor + cap. "Not wrong" = a scam was not called genuine and a genuine message was not called a scam ("not sure" counts as not wrong).

| Test set | Messages | Not wrong | Genuine flagged as scam | Scam firmly flagged | Scam called genuine |
|---|---|---|---|---|---|
| Held-out 20% of the training corpora (never trained on) | 6,158 | 97.8% | 1.0% | 69.4% | 2.0%-3.2%* |
| Held-out split of a second public spam/smishing corpus | 1,200 | 98.8% | 0.5% | 59.8% | 2.0% |
| 120 Indian Hindi / English / Hinglish messages (separate dataset, never trained on) | 120 | 100% | 0% | 20% | 0% |
| UI cases through the real page in headless Chrome | 17 | 17/17 | 0 | 12/17 exact | 0 |

\* 3.2% on the held-out corpora, 2.0% on the second corpus. Model alone (before the safety layer) on the held-out set: accuracy 95.0%, ROC-AUC 0.988. All numbers are in `eval/`.

**Advisory rule check (added 21 Nov 2026):** on a rebuilt 80/20 split of the same corpora, scams in "likely scam" 70.7% → 70.5%, scams called safe 3.1% → 3.1%, genuine called scam 0.9% → 0.9%. On 7,396 genuine Indian SMS, genuine called scam 2.1% → 2.0%. On 10 real RBI and bank awareness messages, 2 were called scam before and 0 after. The 120 Indian messages are unchanged.

**Limitations, stated plainly:** on the Indian Hindi/Hinglish set the tool is cautious: it made no wrong calls, but only 1 in 5 scams lands in "likely scam"; most land in "not sure". Hindi training data is scarce and partly machine-translated, and that evaluation set is small and partly synthetic. The cap also holds back some real scams whose links were stripped in the source data. KAVACH is an aid to judgement, not a guarantee, and it does not check whether a link or number is live.

## Responsible use
- **Privacy:** no `fetch`, XHR, beacons, WebSockets, cookies or browser storage anywhere in the app (`tests/no_network.sh` checks this).
- **Fails safe:** uncertainty is shown as uncertainty, never as reassurance.
- **No personal data** was used for training: only public research datasets.

## Run it
```sh
git clone https://github.com/kakarot700/kavach-scam-shield && cd kavach-scam-shield
python3 -m http.server 8000   # then open http://localhost:8000 (or open index.html directly)
```

## Test it
```sh
python3 tests/parity_test.py   # Python trainer vs browser: identical scores (needs node, numpy, pandas)
sh tests/run_ui_test.sh        # 17 messages + empty input through the real page in headless Chrome
sh tests/no_network.sh         # no network or storage APIs in the app
```

## Training
`train/feat.py` is the shared feature extractor and `train/train.py` the training recipe (data loading, hashed features, logistic regression, int8 export). The shipped `model.json` used the same recipe with two more public sources added to the training data: the Hindi column of the multilingual SMS collection and a second public spam/smishing corpus. Sources:
- Smishing Dataset IMC'25: https://github.com/reportsmishing/Smishing-Dataset-IMC25
- UCI SMS Spam Collection: https://archive.ics.uci.edu/dataset/228/sms+spam+collection
- SMS Spam Multilingual Collection (Hindi column): https://huggingface.co/datasets/dbarbedillo/SMS_Spam_Multilingual_Collection_Dataset
- Indian Multilingual Scam Message Dataset (evaluation only, never trained on): https://huggingface.co/datasets/karanverma19/Indian_Multilingual_Scam_Message_Dataset

## Project layout
```
index.html  app.js      UI, explanations, UPI decoder, safety layer
feat.js     model.json  feature extractor + quantised model (model.js = same model as a script)
train/      feat.py train.py sig.py
tests/      parity_test.py/.js, ui_test.js, run_ui_test.sh, no_network.sh
eval/       eval_v5.json (banded metrics), model_eval_raw.json, india120.csv
```

## AI disclosure
This project was built with substantial help from AI tools (code generation, data preparation, evaluation scripts and documentation drafting), directed and reviewed by the author. All metrics above come from the evaluation files in this repository.

## License
MIT
