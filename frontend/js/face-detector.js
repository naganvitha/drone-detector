/* Viola-Jones face detector (OpenCV frontal-face cascade, image pyramid, 24px window). g: Uint8 gray W*H -> [[x,y,size,neighbors],...] */
let _FC=null;
function faceDetect(g,W,H,minN=3,minS=36){
 const F=CASC.f,S=CASC.s,raw=[];
 if(!_FC){const fo=[0],fw=[],fr=[];F.forEach(f=>{for(let j=0;j<f.length;j+=5)fr.push(f[j],f[j+1],f[j+2],f[j+3]),fw.push(f[j+4]);fo.push(fw.length)});
  _FC={fo,fw:Float64Array.from(fw),fr:Int32Array.from(fr),st:S.map(([t,wk])=>({t,n:wk.length/4,wk:Float64Array.from(wk)}))}}
 const {fo,fw,fr,st}=_FC;
 for(let f=minS/24;24*f<=Math.min(W,H);f*=1.2){
  const w=Math.floor(W/f),h=Math.floor(H/f),W1=w+1,I=new Float64Array(W1*(h+1)),Q=new Float64Array(W1*(h+1)),off=new Int32Array(fr.length);
  for(let y=0;y<h;y++){let r=0,q=0;const sy=Math.min(H-2,Math.floor(y*f));for(let x=0;x<w;x++){const sx=Math.min(W-2,Math.floor(x*f)),p=sy*W+sx,v=(g[p]+g[p+1]+g[p+W]+g[p+W+1])>>2;r+=v;q+=v*v;const i=(y+1)*W1+x+1;I[i]=I[i-W1]+r;Q[i]=Q[i-W1]+q}}
  for(let k=0;k<fr.length;k+=4){const rx=fr[k],ry=fr[k+1],rw=fr[k+2],rh=fr[k+3];off[k]=ry*W1+rx;off[k+1]=ry*W1+rx+rw;off[k+2]=(ry+rh)*W1+rx;off[k+3]=(ry+rh)*W1+rx+rw}
  const n0=W1+1,n1=W1+23,n2=23*W1+1,n3=23*W1+23;
  for(let y=0;y+24<=h;y+=2)for(let x=0;x+24<=w;x+=2){
   const b=y*W1+x,sm=I[b+n3]-I[b+n1]-I[b+n2]+I[b+n0],sq=Q[b+n3]-Q[b+n1]-Q[b+n2]+Q[b+n0],vr=sq/484-(sm/484)**2;
   if(vr<25)continue;const nf=Math.sqrt(vr)*576;let ok=true;
   for(let si=0;si<st.length&&ok;si++){const {wk,n,t}=st[si];let sum=0;
    for(let k=0;k<n;k++){const fi=wk[k*4];let v=0;
     for(let r=fo[fi];r<fo[fi+1];r++){const o=r*4;v+=fw[r]*(I[b+off[o+3]]-I[b+off[o+1]]-I[b+off[o+2]]+I[b+off[o]])}
     sum+=v<wk[k*4+1]*nf?wk[k*4+2]:wk[k*4+3]}
    if(sum<t)ok=false}
   if(ok)raw.push([x*f,y*f,24*f])}}
 const cl=[];for(const r of raw){let hit=null;for(const c of cl){const d=.25*c.s;if(Math.abs(r[0]-c.x)<d&&Math.abs(r[1]-c.y)<d&&Math.abs(r[2]-c.s)<d*1.5){hit=c;break}}
  if(hit){hit.x=(hit.x*hit.n+r[0])/(hit.n+1);hit.y=(hit.y*hit.n+r[1])/(hit.n+1);hit.s=(hit.s*hit.n+r[2])/(hit.n+1);hit.n++}else cl.push({x:r[0],y:r[1],s:r[2],n:1})}
 return cl.filter(c=>c.n>=minN).map(c=>[c.x,c.y,c.s,c.n])}

