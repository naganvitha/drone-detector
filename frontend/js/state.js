const $=id=>document.getElementById(id),W=640,H=360,w=160,h=90;
const cv=$('cv'),cx=cv.getContext('2d'),sm=document.createElement('canvas');sm.width=w;sm.height=h;
const sx=sm.getContext('2d',{willReadFrequently:true});
const sig=z=>1/(1+Math.exp(-z)),logit=p=>{p=Math.min(1-1e-6,Math.max(1e-6,p));return Math.log(p/(1-p))};
let fm='user',mode='demo',vid=null,stream=null,bg=null,hist=[],last=performance.now(),fc=0,fpsT=last;
/* ---- drone scanner model: base weights + small per-browser adaptation learned from the Teach buttons ---- */
const MB=Float32Array.from(MODEL.w);let MD={w:Float32Array.from(MB),b:MODEL.b},UB=0,NS=0,imgEl=null;
try{const s=JSON.parse(localStorage.getItem('droneDelta')||'null');if(s&&s.d&&s.d.length===1568){for(let i=0;i<1568;i++)MD.w[i]=MB[i]+s.d[i];UB=s.b||0;MD.b=MODEL.b+UB;NS=s.n||0}}catch(e){}
function saveDelta(){try{const d=new Array(1568);for(let i=0;i<1568;i++)d[i]=Math.round((MD.w[i]-MB[i])*1e4)/1e4;localStorage.setItem('droneDelta',JSON.stringify({d,b:UB,n:NS}))}catch(e){}}
function resetDelta(){MD={w:Float32Array.from(MB),b:MODEL.b};UB=0;NS=0;try{localStorage.removeItem('droneDelta')}catch(e){}}
const thrZ=()=>+$('sT').value;
