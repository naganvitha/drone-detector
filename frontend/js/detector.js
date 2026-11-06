/* ---------------- detector (placeholder: replace with your model) ----------------
   Must return {conf, box:[x,y,w,h] in 640x360 pixels} or null, plus scene stats. */
let lastDet=performance.now(),HV=[],FACE={t:0,box:null};
const cc=document.createElement('canvas');cc.width=cc.height=64;const cx2=cc.getContext('2d',{willReadFrequently:true});
const fsc=document.createElement('canvas');fsc.width=320;fsc.height=180;const fx=fsc.getContext('2d',{willReadFrequently:true});let lastFace=0;
const faceNow=()=>performance.now()-FACE.t<1500;
function scanFace(now){ /* real face detector, ~4x/second; a face counts as present for 1.5 s after the last hit so brief misses don't flicker */
 if(mode!=='cam'||now-lastFace<250)return;lastFace=now;fx.drawImage(cv,0,0,320,180);
 const d=fx.getImageData(0,0,320,180).data,g=new Uint8Array(57600);for(let i=0;i<57600;i++)g[i]=.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2];
 const r=faceDetect(g,320,180,3,40);if(r.length){r.sort((a,b)=>b[2]-a[2]);const[x,y,s]=r[0];FACE={t:now,box:[x*2,y*2,s*2,s*2]}}}
/* ---- whole-frame drone scanner: finds a drone ANYWHERE in the frame, moving or still (e.g. a picture held up to the camera) ---- */
let lastScan=0,scanMs=60,lastLS=0,SC={wins:[],best:null,t:0},MTRK=[],nextTrackId=1;
const iouB=(a,b)=>{const ix=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)),iy=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)),i=ix*iy;return i/(a.w*a.h+b.w*b.h-i+1e-9)};
function scanDrone(now){
 if((mode!=='cam'&&mode!=='img')||now-lastScan<Math.max(200,scanMs*4))return;lastScan=now;
 fx.drawImage(cv,0,0,320,180);const d=fx.getImageData(0,0,320,180).data,g=new Float32Array(57600);
 for(let i=0;i<57600;i++)g[i]=(.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2])/255;
 const t=thrZ(),wins=nms(scanFrame(g,320,180,MD,teach&&now<teach.until?-6:t-2.5),6,.3);
 scanMs=performance.now()-now;SC.wins=wins;SC.t=now;
 /* Ignore candidate windows that substantially overlap a detected face. */
 const fb=faceNow()&&FACE.box?FACE.box:null,candidates=[];
 for(const w of wins){
  if(fb){const[fx0,fy0,fw,fh]=fb,X=w.x*2,Y=w.y*2,WW=w.w*2,HH=w.h*2,ix=Math.max(0,Math.min(X+WW,fx0+fw)-Math.max(X,fx0)),iy=Math.max(0,Math.min(Y+HH,fy0+fh)-Math.max(Y,fy0)),i=ix*iy,
    inside=fx0+fw/2>X&&fx0+fw/2<X+WW&&fy0+fh/2>Y&&fy0+fh/2<Y+HH;
   if(i/(WW*HH+fw*fh-i)>.15||(inside&&WW*HH<5*fw*fh))continue}
  if(w.z>=t)candidates.push(w);
 }
 SC.best=candidates[0]||wins[0]||null;
 /* Associate each current candidate with a different recent track using IoU. These are
    short-lived display tracks, not permanent drone identities or re-identification. */
 const matched=new Set();
 for(const w of candidates){
  const b={x:w.x,y:w.y,w:w.w,h:w.h};let match=null,bestOverlap=.3;
  for(const tr of MTRK){if(matched.has(tr.id))continue;const overlap=iouB(b,tr.box);if(overlap>bestOverlap){bestOverlap=overlap;match=tr}}
  if(match){matched.add(match.id);for(const key of ['x','y','w','h'])match.box[key]=match.box[key]*.5+b[key]*.5;match.n++;match.miss=0;match.t=now;match.z=w.z}
  else{const tr={id:nextTrackId++,box:b,n:1,miss:0,t:now,z:w.z};MTRK.push(tr);matched.add(tr.id)}
 }
 for(const tr of MTRK)if(!matched.has(tr.id)){tr.miss++;tr.n=0;}
 MTRK=MTRK.filter(tr=>tr.miss<=2&&now-tr.t<1200);
}
function scanDets(now){
 return MTRK.filter(tr=>tr.n>=3&&now-tr.t<=900).sort((a,b)=>b.z-a.z).slice(0,6).map(tr=>{const b=tr.box;return{conf:sig(tr.z),area:b.w*b.h/4,f:{ring:0},box:[b.x*2,b.y*2,b.w*2,b.h*2],scan:true,trackId:tr.id}});
}
function learnScan(){ /* Teach buttons also adapt the scanner: online logistic update on the scanned windows */
 if(SC.t===lastLS||!SC.wins.length)return;lastLS=SC.t;
 const ws=teach.l?(SC.best?[SC.best]:[]):SC.wins.filter(w=>w.z>=thrZ()-2.5);
 for(const w of ws){const f=windowFeat(w);let z=MD.b;for(let i=0;i<1568;i++)z+=MD.w[i]*f[i];
  const p=sig(z);if(Math.abs(teach.l-p)<.1)continue;const g=(teach.l-p)*.04;
  for(let i=0;i<1568;i++)MD.w[i]+=g*f[i];UB+=g*.5;MD.b=MODEL.b+UB;NS++}
 saveDelta();tl()}
function detect(){
 const tn=performance.now(),dt=Math.min(.2,(tn-lastDet)/1000);lastDet=tn;
 sx.drawImage(cv,0,0,w,h);const d=sx.getImageData(0,0,w,h).data,n=w*h,g=new Float32Array(n);let sum=0;
 for(let i=0;i<n;i++){g[i]=(.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2])/255;sum+=g[i]}
 const mean=sum/n;let v=0;for(let i=0;i<n;i++)v+=(g[i]-mean)**2;const cvar=Math.sqrt(v/n)/(mean+.05);
 const scene={mean,cvar};
 if(!bg){bg=Float32Array.from(g);return{scene,det:null}}
 const diff=new Float32Array(n),mask=new Uint8Array(n),al=1-Math.exp(-dt/1.5);let mc=0;
 for(let i=0;i<n;i++){diff[i]=Math.abs(g[i]-bg[i]);if(diff[i]>.07){mask[i]=1;mc++}bg[i]+=(g[i]-bg[i])*al}
 if(mc>.3*n){bg=Float32Array.from(g);return{scene,det:null}} /* exposure jump or camera shake: re-learn background instead of flashing a huge box */
 let best=null;const seen=new Uint8Array(n);
 for(let i=0;i<n;i++){if(!mask[i]||seen[i])continue;
  const st=[i];seen[i]=1;let a=0,sd=0,x0=w,y0=h,x1=0,y1=0;
  while(st.length){const p=st.pop(),px=p%w,py=(p/w)|0;a++;sd+=diff[p];
   if(px<x0)x0=px;if(px>x1)x1=px;if(py<y0)y0=py;if(py>y1)y1=py;
   for(const q of[p-1,p+1,p-w,p+w]){if(q<0||q>=n||seen[q]||!mask[q])continue;if((q===p-1&&px===0)||(q===p+1&&px===w-1))continue;seen[q]=1;st.push(q)}}
  if(!best||a>best.a)best={a,c:sd/a,x0,y0,x1,y1}}
 if(!best||best.a<3)return{scene,det:null};
 const k=W/w,bx=best.x0*k,by=best.y0*k,bw=(best.x1-best.x0+1)*k,bh=(best.y1-best.y0+1)*k;
 /* trained drone classifier on the padded crop around the moving blob */
 const pad=.25,sx0=Math.max(0,bx-bw*pad),sy0=Math.max(0,by-bh*pad),sw=Math.min(W-sx0,bw*(1+2*pad)),sh=Math.min(H-sy0,bh*(1+2*pad));
 cx2.drawImage(cv,sx0,sy0,sw,sh,0,0,64,64);const q=cx2.getImageData(0,0,64,64).data,gg=new Float32Array(4096);
 for(let i=0;i<4096;i++)gg[i]=(.299*q[i*4]+.587*q[i*4+1]+.114*q[i*4+2])/255;
 const conf=mode==='demo'?sig(9*(best.c-.12)+.9*Math.log(best.a/8)):sig(cropScore(gg,64,64,MD).z); /* demo scene is synthetic, so it keeps the old motion score */
 const f=features(d,g,best),kn=knn(vec(f));let rej=null;
 if(faceNow())rej='Face in view';
 else if(FACE.box&&performance.now()-FACE.t<4000&&(()=>{const[fx0,fy0,fs]=FACE.box,cxm=bx+bw/2,cym=by+bh/2;return cxm>fx0-1.5*fs&&cxm<fx0+2.5*fs&&cym>fy0-.6*fs&&cym<fy0+5*fs})())rej='Part of the person in view';
 else if(kn<0)rej='Matches a “not a drone” example';
 else if(kn===0){if(f.skin>.25&&f.frac>.02)rej='Looks like a person or face';else if(f.frac>.15)rej='Too large to be a distant drone'}
 return{scene,det:{conf,area:best.a,f,rej,box:[bx,by,bw,bh]}};
}
