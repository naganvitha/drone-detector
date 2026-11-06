/* ---------------- sources ---------------- */
function drawDemo(t){
 const L=+$('sL').value,F=+$('sF').value,s=+$('sS').value;
 const g=cx.createLinearGradient(0,0,0,H);
 g.addColorStop(0,`rgb(${60*L+5|0},${110*L+8|0},${190*L+15|0})`);g.addColorStop(1,`rgb(${190*L+8|0},${215*L+10|0},${240*L+15|0})`);
 cx.fillStyle=g;cx.fillRect(0,0,W,H);
 cx.fillStyle=`rgba(255,255,255,${.55*L})`;
 [[120,80,70,18],[420,150,90,22],[540,60,60,14]].forEach(([x,y,a,b],i)=>{cx.beginPath();cx.ellipse((x+t*0.004*(i+1))%(W+200)-100,y,a,b,0,0,7);cx.fill()});
 const x=W/2+W*.36*Math.sin(t*.0009),y=H*.42+45*Math.sin(t*.0017),c=`rgb(${25*L+8|0},${28*L+8|0},${34*L+10|0})`;
 cx.fillStyle=c;cx.strokeStyle=c;cx.lineWidth=Math.max(1,s/5);
 cx.fillRect(x-s*.45,y-s*.2,s*.9,s*.4);
 for(const [dx,dy] of[[-1,-1],[1,-1],[-1,1],[1,1]]){cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+dx*s,y+dy*s*.5);cx.stroke();cx.beginPath();cx.ellipse(x+dx*s,y+dy*s*.5,s*.5,s*.1,0,0,7);cx.fill()}
 if(F>0){cx.fillStyle=`rgba(${190*L+20|0},${195*L+20|0},${200*L+22|0},${F*.85})`;cx.fillRect(0,0,W,H)}
}
function drawImgSrc(){
 cx.fillStyle='#808080';cx.fillRect(0,0,W,H);if(!imgEl)return;
 const r=Math.min(W/imgEl.width,H/imgEl.height),dw=imgEl.width*r,dh=imgEl.height*r;cx.drawImage(imgEl,(W-dw)/2,(H-dh)/2,dw,dh)}
function drawCam(){
 const vw=vid.videoWidth,vh=vid.videoHeight;if(!vw)return;
 const r=Math.max(W/vw,H/vh),dw=vw*r,dh=vh*r;if(fm==='user'){cx.save();cx.translate(W,0);cx.scale(-1,1)}cx.drawImage(vid,(W-dw)/2,(H-dh)/2,dw,dh);if(fm==='user')cx.restore();
}
