/* ---------------- UI ---------------- */
let lastUI=0,lastChips='';
function paint(res){
 const {scene}=res,cand=res.det,ign=cand&&cand.rej?cand.rej:null,bdet=ign?null:cand,now=performance.now(),fn=faceNow();
 if(cand&&teach&&now<teach.until&&now-lastLearn>120)learn(cand);
 if(teach&&now<teach.until)learnScan();
 /* two sources: (1) whole-frame scanner with location persistence, (2) the older moving-blob path (6 of last 10 frames, never while a face is in view) */
 const thr=mode==='demo'?.5:sig(thrZ());HV.push(!!(bdet&&bdet.conf>=thr));if(HV.length>10)HV.shift();
 const blobHit=!fn&&HV.filter(Boolean).length>=6,sd=scanDet(now),scanHit=!!sd,sb=SC.best&&now-SC.t<900&&SC.best.z>=thrZ()-1.5?SC.best:null;
 const det=scanHit?sd:(bdet||(sb?{conf:sig(sb.z),area:sb.w*sb.h/4,f:{ring:0},box:[sb.x*2,sb.y*2,sb.w*2,sb.h*2]}:null)),hit=scanHit||blobHit;
 const r=reliability(scene,det);
 hist.push({conf:det?det.conf:null,cal:r.cal});if(hist.length>160)hist.shift();
 if(ign&&!scanHit){cx.strokeStyle='#94a3b8';cx.setLineDash([5,4]);cx.lineWidth=2;cx.strokeRect(cand.box[0]-4,cand.box[1]-4,cand.box[2]+8,cand.box[3]+8);cx.setLineDash([])}
 if(fn&&FACE.box){cx.strokeStyle='#22c55e';cx.lineWidth=2;cx.strokeRect(...FACE.box);cx.fillStyle='#22c55e';cx.font='12px system-ui';cx.fillText('face',FACE.box[0]+3,FACE.box[1]+13)}
 if(!hit&&sb){cx.strokeStyle='#fbbf24';cx.setLineDash([4,4]);cx.lineWidth=1.5;cx.strokeRect(sb.x*2,sb.y*2,sb.w*2,sb.h*2);cx.setLineDash([]);cx.fillStyle='#fbbf24';cx.font='12px system-ui';cx.fillText('candidate '+(sig(sb.z)*100|0)+'%',sb.x*2+3,sb.y*2+13)}
 if(hit&&det){cx.strokeStyle='#f43f5e';cx.lineWidth=3;const[b0,b1,b2,b3]=det.box,p=scanHit?0:6;cx.strokeRect(b0-p,b1-p,b2+2*p,b3+2*p);cx.fillStyle='#f43f5e';cx.font='bold 13px system-ui';cx.fillText('drone '+(det.conf*100|0)+'%',b0+4,Math.max(14,b1-p-5))}
 if(now-lastUI<150)return;lastUI=now; /* DOM updates ~7x/s instead of 60x/s: this was a big part of the flicker */
 $('status').textContent=hit?'Drone detected':'No drone detected';$('status').style.color=hit?'var(--bad)':'var(--ink)';
 $('raw').textContent=det?(det.conf*100).toFixed(1)+'%':'–';$('rb').style.width=det?det.conf*100+'%':'0';
 $('cal').textContent=r.cal!=null?(r.cal*100).toFixed(1)+'%':'–';$('cb').style.width=r.cal!=null?r.cal*100+'%':'0';
 let cls,t,m;
 if(fn&&!hit){cls='ok';t='No drone detected';m='A face is in view, so moving objects near it are ignored. The rest of the frame is still searched.'}
 else if(ign&&!hit){cls='';t='Ignored a moving object';m=ign+'. It is not counted as a drone. If that is wrong, press “Drone (3 s)” while it is in view to teach the detector.'}
 else [cls,t,m]=verdict(hit?det:null,r.cal,r.f);
 const vd=$('vd');vd.className='v '+cls;$('vt').textContent=t;$('vm').textContent=m;
 const chips=[`Light ${(scene.mean*100).toFixed(0)}%`,`Contrast ${(scene.cvar*100).toFixed(0)}%`];if(det)chips.push(`Target ${det.area|0} px`);if(fn)chips.push('Face in view');if(mode==='cam'||mode==='img')chips.push(`Scan ${scanMs|0} ms`);
 const hh=chips.map(c=>`<span class="chip">${c}</span>`).join('')+(ign&&!fn?[ign]:[]).concat(r.f).map(c=>`<span class="chip f">${c}</span>`).join('');
 if(hh!==lastChips){lastChips=hh;$('chips').innerHTML=hh}
 spark();
}
function spark(){
 const c=$('sp'),x=c.getContext('2d'),W2=c.width,H2=c.height;x.clearRect(0,0,W2,H2);
 const st=getComputedStyle(document.documentElement),ln=st.getPropertyValue('--ln'),ac=st.getPropertyValue('--ac'),wr=st.getPropertyValue('--wr');
 x.strokeStyle=ln;x.lineWidth=1;x.strokeRect(.5,.5,W2-1,H2-1);
 [['conf',ac,[]],['cal',wr,[4,3]]].forEach(([k,col,dash])=>{x.beginPath();x.strokeStyle=col;x.setLineDash(dash);x.lineWidth=2;let pen=false;
  hist.forEach((r,i)=>{const v=r[k];if(v==null){pen=false;return}const px=i/160*W2,py=H2-4-v*(H2-8);pen?x.lineTo(px,py):x.moveTo(px,py);pen=true});x.stroke()});x.setLineDash([]);
}
function loop(now){
 requestAnimationFrame(loop);
 if(mode==='demo')drawDemo(now);else if(mode==='img')drawImgSrc();else if(vid&&vid.videoWidth)drawCam();else return;
 scanFace(now);scanDrone(now);paint(detect());
 fc++;if(now-fpsT>1000){$('fps').textContent=fc+' fps';fc=0;fpsT=now}
}
