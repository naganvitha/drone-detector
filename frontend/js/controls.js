function setMode(m){mode=m;bg=null;hist=[];HV=[];FACE={t:0,box:null};TRK={box:null,n:0,miss:0,t:0,z:0};SC={wins:[],best:null,t:0};$('bd').classList.toggle('on',m==='demo');$('bc').classList.toggle('on',m==='cam');$('bi').classList.toggle('on',m==='img');$('dc').style.display=m==='demo'?'grid':'none';$('cc').style.display=m==='demo'?'none':'grid'}
$('bi').onclick=()=>$('fi').click();
$('fi').onchange=e=>{const f=e.target.files[0];if(!f)return;const im=new Image();im.onload=()=>{imgEl=im;$('err').textContent='';setMode('img')};im.onerror=()=>{$('err').textContent='Could not read that image.'};im.src=URL.createObjectURL(f);e.target.value=''};
$('bd').onclick=()=>{$('err').textContent='';setMode('demo')};
$('bc').onclick=async()=>{
 $('err').textContent='';
 try{
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('This browser or frame does not allow camera access.');
  stream=stream||await navigator.mediaDevices.getUserMedia({video:{facingMode:fm},audio:false});
  if(!vid){vid=document.createElement('video');vid.muted=true;vid.playsInline=true}
  vid.srcObject=stream;await vid.play();setMode('cam');
 }catch(e){$('err').textContent='Camera unavailable: '+(e.message||e.name)+'. If this page is embedded, open it in its own browser tab and allow camera access. The demo scene still works.';setMode('demo')}
};
