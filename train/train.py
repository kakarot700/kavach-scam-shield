import pandas as pd,numpy as np,json,base64,random
from scipy.sparse import csr_matrix
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report,roc_auc_score,f1_score
from feat import feats,norm,D
rows=[]
i=pd.read_csv('data/imc25.csv',low_memory=False)
i=i[i.language.isin(['English','Hindi'])]
for t,c in zip(i.text,i.original_network_country): rows.append((t,1,'imc25-'+('IND' if c=='IND' else 'world')))
u=pd.read_csv('data/SMSSpamCollection',sep='\t',header=None,names=['l','t'],quoting=3)
for t in u[u.l=='ham'].t: rows.append((t,0,'uci-ham'))
g=pd.read_csv('data/g10k.csv',low_memory=False)
for t in g[g.is_phishing_original==False].sms_text: rows.append((t,0,'india-ham'))
df=pd.DataFrame(rows,columns=['t','y','src']).dropna()
df['n']=df.t.map(norm); df=df.drop_duplicates('n')
print(df.groupby(['src','y']).size())
random.seed(7); keys=sorted(df.n.unique()); 
rng=np.random.RandomState(7); df['fold']=rng.rand(len(df))
tr=df[df.fold>=0.2]; te=df[df.fold<0.2]
def X(ts):
    ind,ptr,dat=[],[0],[]
    for t in ts:
        f=feats(t); ind+=list(f); dat+=list(f.values()); ptr.append(len(ind))
    return csr_matrix((dat,ind,ptr),shape=(len(ts),D))
Xtr=X(tr.t.tolist()); Xte=X(te.t.tolist())
best=None
for C in [1,4,16]:
    m=LogisticRegression(C=C,max_iter=3000,class_weight='balanced',solver='liblinear').fit(Xtr,tr.y)
    p=m.predict_proba(Xte)[:,1]; f=f1_score(te.y,p>0.5)
    print('C',C,'f1',round(f,4),'auc',round(roc_auc_score(te.y,p),4))
    if not best or f>best[0]: best=(f,C,m)
f,C,m=best; p=m.predict_proba(Xte)[:,1]
print(classification_report(te.y,p>0.5,digits=4))
for s in te.src.unique():
    k=te.src==s; print(s,'n',k.sum(),'acc',round(((p[k.values]>0.5)==te.y[k].values).mean(),4))
# OOD: indian multilingual 120 never trained on
o=pd.read_csv('data/india120.csv'); po=m.predict_proba(X(o.message.tolist()))[:,1]; yo=(o.label=='scam').astype(int)
print('OOD india120 acc',round(((po>0.5)==yo).mean(),4),'auc',round(roc_auc_score(yo,po),4))
for lang in o.language.unique():
    k=(o.language==lang).values; print('  ',lang,round(((po[k]>0.5)==yo[k]).mean(),4))
# abstain band
for lo,hi in [(0.3,0.7),(0.2,0.8)]:
    k=(p<lo)|(p>hi); print('abstain',lo,hi,'coverage',round(k.mean(),4),'acc_on_covered',round(((p[k]>0.5)==te.y.values[k]).mean(),4))
m2=LogisticRegression(C=C,max_iter=3000,class_weight='balanced',solver='liblinear').fit(X(df.t.tolist()),df.y)
w=m2.coef_[0]; sc=np.abs(w).max()/127; q=np.round(w/sc).astype(np.int8)
json.dump({'v':1,'dim':D,'bias':float(m2.intercept_[0]),'scale':float(sc),'w':base64.b64encode(q.tobytes()).decode()},open('out/model.json','w'))
json.dump({'C':C,'f1':f,'n_train':len(df)},open('out/meta.json','w'))
import pickle;pickle.dump(m2,open('m2.pkl','wb'))
print('model bytes',len(open('out/model.json').read()))
