import re
F=re.ASCII
S=[
('urgency',r'\b(immediately|urgent|right now|today itself|within 24 hours?|last chance|final warning|expires? today|aaj hi|turant|abhi|jaldi|foran)\b|\u0924\u0941\u0930\u0902\u0924|\u0906\u091c \u0939\u0940|\u0905\u092d\u0940|\u091c\u0932\u094d\u0926'),
('threat',r'\b(block(ed|ing)?|suspend(ed)?|deactivat(e|ed)|disconnect(ed)?|terminated?|frozen|legal action|arrest(ed)?|penalty|court case|fir)\b|\bband ho|\bkat jayega|\bgiraftar|\u092c\u0902\u0926|\u0915\u091f \u091c\u093e\u092f\u0947\u0917\u093e|\u0917\u093f\u0930\u092b\u094d\u0924\u093e\u0930'),
('money',r'\b(pay|payment|fee|fees|charges?|processing|clearance|customs duty|transfer|deposit|send money|bhejo|paisa bhej)\b|\u092a\u0948\u0938\u0947|\u092d\u0941\u0917\u0924\u093e\u0928|\u0936\u0941\u0932\u094d\u0915'),
('prize',r'\b(won|winner|lottery|lucky (draw|winner)|prize|jackpot|crore|lakh|reward points?|cashback of)\b|\bjeeta|\binaam|\u0907\u0928\u093e\u092e|\u0932\u0949\u091f\u0930\u0940|\u091c\u0940\u0924\u093e'),
('kyc',r'\b(kyc|re-?kyc|verify|verification|update your (account|details|pan|aadhaar)|re-?activate|pan card|aadhaar)\b|\u0915\u0947\u0935\u093e\u0908\u0938\u0940|\u0938\u0924\u094d\u092f\u093e\u092a\u0928'),
('otp',r'\b(otp|one[- ]time password|pin|cvv|password|passcode|share the code|tell me the code)\b|\u0913\u091f\u0940\u092a\u0940|\u092a\u093f\u0928'),
('apk',r'\.apk\b|\b(install (this|the) app|download (this|the) app|anydesk|teamviewer|quick ?support|screen shar)'),
('authority',r'\b(cbi|police|inspector|officer|income tax|it department|customs|court|trai|rbi|sebi|narcotics|enforcement directorate|cyber cell)\b|\u092a\u0941\u0932\u093f\u0938|\u0938\u0940\u092c\u0940\u0906\u0908'),
('job',r'\b(work from home|part[- ]time job|earn (daily|per day|from home)|no experience|daily income|telegram|whatsapp me|join (our )?(group|channel))\b|\u0918\u0930 \u0938\u0947 \u0915\u093e\u092e'),
('generic',r'\b(dear (customer|user|sir/madam|valued customer|member|winner)|dear all)\b'),
('link',r'(https?://[^\s]+|www\.[^\s]+|\b[a-z0-9-]+(\.[a-z0-9-]+)*\.(xyz|top|online|site|link|cc|vip|shop|club|live|tk|ml|gq|cf|info|icu|buzz)\b)'),
]
R=[(n,re.compile(p,F)) for n,p in S]
NAMES=[n for n,_ in S]
def sigs(t):
    t=str(t).lower()
    return [1.0 if r.search(t) else 0.0 for _,r in R]
