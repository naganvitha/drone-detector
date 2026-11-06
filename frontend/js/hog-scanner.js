/* Dense-HOG drone scanner. Mirrors dronecore.py exactly (cell 6px, 8 bins, 2x2-cell L2 blocks, 48px window). */
const DC={CELL:6,NB:8,WIN:48,NBLK:7,EPS:.5,ASP:[1,1.4,1.8],SXS:[1,1.35,1.9,2.7,3.8,5.4]};
/* area-average resize (== cv2.INTER_AREA for downscaling). g: Float32Array W*H -> Float32Array w*h */
function areaResize(g,W,H,w,h){
 if(w===W&&h===H)return g;
 const sx=W/w,sy=H/h,tmp=new Float32Array(w*H),out=new Float32Array(w*h);
 for(let x=0;x<w;x++){const a=x*sx,b=a+sx,i0=Math.floor(a),i1=Math.min(W,Math.ceil(b-1e-9));
  for(let y=0;y<H;y++){let s=0;for(let i=i0;i<i1;i++){const wt=Math.min(b,i+1)-Math.max(a,i);s+=g[y*W+i]*wt}tmp[y*w+x]=s/sx}}
 for(let y=0;y<h;y++){const a=y*sy,b=a+sy,j0=Math.floor(a),j1=Math.min(H,Math.ceil(b-1e-9));
  for(let x=0;x<w;x++){let s=0;for(let j=j0;j<j1;j++){const wt=Math.min(b,j+1)-Math.max(a,j);s+=tmp[j*w+x]*wt}out[y*w+x]=s/sy}}
 return out}
/* block-normalised HOG grid of a level image (edge-padded gradients). returns {B,nbx,nby} with B[(by*nbx+bx)*32+k] */
function levelBlocks(L,w,h){
 const {CELL,NB,EPS}=DC,ncx=Math.floor(w/CELL),ncy=Math.floor(h/CELL),cells=new Float32Array(ncx*ncy*NB),PI=Math.PI;
 const at=(x,y)=>L[Math.min(h-1,Math.max(0,y))*w+Math.min(w-1,Math.max(0,x))];
 for(let y=0;y<ncy*CELL;y++)for(let x=0;x<ncx*CELL;x++){
  const gx=at(x+1,y)-at(x-1,y),gy=at(x,y+1)-at(x,y-1);const m=Math.hypot(gx,gy);if(m===0)continue;
  let a=Math.atan2(gy,gx);a=((a%PI)+PI)%PI;const b=Math.floor(a/PI*NB)%NB;cells[((y/CELL|0)*ncx+(x/CELL|0))*NB+b]+=m}
 const nbx=ncx-1,nby=ncy-1,B=new Float32Array(Math.max(0,nbx*nby)*32);
 for(let by=0;by<nby;by++)for(let bx=0;bx<nbx;bx++){const o=(by*nbx+bx)*32;let n=EPS*EPS;
  const cs=[(by*ncx+bx)*NB,(by*ncx+bx+1)*NB,((by+1)*ncx+bx)*NB,((by+1)*ncx+bx+1)*NB];
  for(let c=0;c<4;c++)for(let k=0;k<NB;k++){const v=cells[cs[c]+k];B[o+c*NB+k]=v;n+=v*v}
  n=Math.sqrt(n);for(let k=0;k<32;k++)B[o+k]/=n}
 return{B,nbx,nby}}
/* score every window on one level; model.w is [7][7][32] flattened */
function scoreLevel(lv,model,sx,sy,out,minZ){
 const {B,nbx,nby}=lv,N=DC.NBLK,ny=nby-N+1,nx=nbx-N+1;if(ny<=0||nx<=0)return;const w=model.w;
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){let z=model.b;
  for(let j=0;j<N;j++){let bo=((y+j)*nbx+x)*32,wo=j*N*32;for(let k=0;k<N*32;k++)z+=B[bo+k]*w[wo+k]}
  if(z>=minZ)out.push({z,x:x*DC.CELL*sx,y:y*DC.CELL*sy,w:48*sx,h:48*sy,f:null,L:lv,bx:x,by:y})}}
/* whole-frame scan. g: Float32Array 0..1 (W*H). returns windows with z>=minZ (unsorted) */
function scanFrame(g,W,H,model,minZ=-1e9){
 const out=[];
 for(const a of DC.ASP)for(const sx of DC.SXS){const sy=sx/a;if(sy<1||48*sy>H||48*sx>W)continue;
  const lw=Math.round(W/sx),lh=Math.round(H/sy);if(lw<48||lh<48)continue;
  const lv=levelBlocks(areaResize(g,W,H,lw,lh),lw,lh);scoreLevel(lv,model,sx,sy,out,minZ)}
 return out}
/* feature vector (1568) of a scanned window, for online learning */
function windowFeat(win){const {B,nbx}=win.L,N=DC.NBLK,f=new Float32Array(N*N*32);
 for(let j=0;j<N;j++)f.set(B.subarray(((win.by+j)*nbx+win.bx)*32,((win.by+j)*nbx+win.bx+N)*32),j*N*32);return f}
/* score a free-standing crop (e.g. a moving blob): g is gray 0..1 of size cw*ch, squashed to 48x48 with 1px edge context */
function cropScore(g,cw,ch,model){
 const p=areaResizeAny(g,cw,ch,48,48),lv=levelBlocks(p,48,48);const f=new Float32Array(1568);
 const N=DC.NBLK;for(let j=0;j<N;j++)f.set(lv.B.subarray(j*lv.nbx*32,j*lv.nbx*32+N*32),j*N*32);
 let z=model.b;for(let i=0;i<1568;i++)z+=f[i]*model.w[i];return{z,f}}
function areaResizeAny(g,W,H,w,h){ /* up- or down-scale via bilinear when enlarging */
 if(w<=W&&h<=H)return areaResize(g,W,H,w,h);const o=new Float32Array(w*h);
 for(let y=0;y<h;y++){const fy=Math.max(0,Math.min(H-1,(y+.5)*H/h-.5)),y0=fy|0,y1=Math.min(H-1,y0+1),ty=fy-y0;
  for(let x=0;x<w;x++){const fx=Math.max(0,Math.min(W-1,(x+.5)*W/w-.5)),x0=fx|0,x1=Math.min(W-1,x0+1),tx=fx-x0;
   o[y*w+x]=(g[y0*W+x0]*(1-tx)+g[y0*W+x1]*tx)*(1-ty)+(g[y1*W+x0]*(1-tx)+g[y1*W+x1]*tx)*ty}}return o}
/* non-max suppression, best first */
function nms(ws,n=3,thr=.3){ws.sort((a,b)=>b.z-a.z);const keep=[];
 for(const w of ws){if(keep.length>=n)break;let ok=true;for(const k of keep){const ix=Math.max(0,Math.min(w.x+w.w,k.x+k.w)-Math.max(w.x,k.x)),iy=Math.max(0,Math.min(w.y+w.h,k.y+k.h)-Math.max(w.y,k.y)),i=ix*iy;if(i/(w.w*w.h+k.w*k.h-i)>thr){ok=false;break}}if(ok)keep.push(w)}return keep}
