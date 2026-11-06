/* ---------------- reliability ----------------
   Each adverse condition raises the temperature T; calibrated = sigmoid(logit(conf)/T).
   Replace PEN with temperatures fitted on your own dataset. */
const PEN={lowLight:.9,hazy:.9,small:.8,unstable:.7,jitter:.5};
function reliability(scene,det){
 const f=[];let T=1;
 if(scene.mean<.3){T+=PEN.lowLight;f.push('Low light')}
 if(scene.cvar<.1){T+=PEN.hazy;f.push('Hazy, low contrast')}
 const recent=hist.slice(-20);
 if(det){
  if(det.area<20){T+=PEN.small;f.push('Small or distant target')}
  if(det.f&&det.f.ring>.12){T+=.6;f.push('Cluttered background')}
  const dets=recent.filter(r=>r.conf!=null);
  if(recent.length>=10&&dets.length/recent.length<.6){T+=PEN.unstable;f.push('Unstable detection')}
  if(dets.length>=5){const m=dets.reduce((s,r)=>s+r.conf,0)/dets.length,sd=Math.sqrt(dets.reduce((s,r)=>s+(r.conf-m)**2,0)/dets.length);if(sd>.15){T+=PEN.jitter;f.push('Confidence fluctuating')}}
 }
 return{T,f,cal:det?sig(logit(det.conf)/T):null};
}
function verdict(det,cal,f){
 if(!det)return f.length?['wr','Nothing detected, but be careful','Conditions here ('+f.join(', ').toLowerCase()+') can hide a drone. Absence of a detection is not proof of absence.']:['','No drone detected','Conditions look good, so a missed drone is less likely.'];
 if(cal>=.8&&f.length===0)return['ok','Confidence is reliable','Conditions are good and the score is consistent. You can act on this detection.'];
 if(cal>=.5&&f.length<=1)return['wr','Use caution','The score is likely higher than the true chance of a drone because of: '+f.join(', ').toLowerCase()+'. Confirm with a second source.'];
 return['bad','Confidence is not reliable','The detector is probably overconfident here ('+(f.join(', ').toLowerCase()||'weak signal')+'). Treat this as unconfirmed and have a person check.'];
}
