/* ---- candidate features, rejection gates and teachable examples ---- */
function features(d,g,b){
 const bw=b.x1-b.x0+1,bh=b.y1-b.y0+1;let sk=0,n=0,R=0,G=0,B=0;
 for(let y=b.y0;y<=b.y1;y++)for(let x=b.x0;x<=b.x1;x++){const i=(y*w+x)*4,r=d[i],gg=d[i+1],bl=d[i+2];n++;R+=r;G+=gg;B+=bl;
  if(r>95&&gg>40&&bl>20&&Math.max(r,gg,bl)-Math.min(r,gg,bl)>15&&Math.abs(r-gg)>15&&r>gg&&r>bl)sk++}
 const p=6,X0=Math.max(0,b.x0-p),X1=Math.min(w-1,b.x1+p),Y0=Math.max(0,b.y0-p),Y1=Math.min(h-1,b.y1+p);let s=0,s2=0,m=0;
 for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++){if(x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1)continue;const v=g[y*w+x];s+=v;s2+=v*v;m++}
 return{frac:bw*bh/(w*h),skin:sk/n,ring:m?Math.sqrt(Math.max(0,s2/m-(s/m)**2)):0,asp:bw/bh,rgb:[R/n/255,G/n/255,B/n/255]};
}
function vec(f){const c=x=>Math.max(0,Math.min(1,x));return[c(f.frac*6),f.skin,c(f.ring*6),c(Math.log2(f.asp)/4+.5),...f.rgb]}
let SAMP=[],teach=null,lastLearn=0;try{SAMP=JSON.parse(localStorage.getItem('droneSamples')||'[]')}catch(e){}
function knn(v){const ds=SAMP.map(s=>({l:s.l,d:Math.hypot(...s.v.map((a,i)=>a-v[i]))})).filter(o=>o.d<.35).sort((a,b)=>a.d-b.d).slice(0,5);
 if(!ds.length)return 0;let sc=0;for(const o of ds)sc+=(o.l?1:-1)/(o.d+.05);return sc>0?1:-1}
function learn(det){lastLearn=performance.now();SAMP.push({l:teach.l,v:vec(det.f)});if(SAMP.length>300)SAMP.shift();
 try{localStorage.setItem('droneSamples',JSON.stringify(SAMP))}catch(e){}tl()}
function tl(){const p=SAMP.filter(s=>s.l).length;$('tl').textContent=`Learned ${p} drone and ${SAMP.length-p} not-drone examples`+(NS?` (scanner adapted with ${NS} examples).`:'.')+(teach&&performance.now()<teach.until?' Recording…':'')}
function start(l){teach={l,until:performance.now()+3000};tl();setTimeout(tl,3100)}
$('tn').onclick=()=>start(0);$('td').onclick=()=>start(1);
$('tc').onclick=()=>{resetDelta();SAMP=[];try{localStorage.removeItem('droneSamples')}catch(e){}tl()};tl();
['sL','sF','sS'].forEach(i=>$(i).oninput=()=>{bg=null;hist=[];HV=[]});
$('sT').oninput=()=>{$('sTv').textContent=(+$('sT').value).toFixed(1);TRK={box:null,n:0,miss:0,t:0,z:0}};
$('bf').onclick=()=>{fm=fm==='user'?'environment':'user';if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;$('bc').onclick()};
