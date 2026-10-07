const resultEl=document.querySelector('#result');
const expressionEl=document.querySelector('#expression');
const keypad=document.querySelector('#keypad');
const historyEl=document.querySelector('#history');
const opCountEl=document.querySelector('#opCount');
const memoryEl=document.querySelector('#memoryValue');

let current='0', expression='', justEvaluated=false, operations=0, history=[];

function format(n){
  if(!Number.isFinite(n)) return 'Error';
  const rounded=Math.round(n*1e10)/1e10;
  const s=String(rounded);
  return s.length>13 ? Number(n).toExponential(6) : s;
}
function render(){
  resultEl.textContent=current;
  expressionEl.textContent=expression||'Ready';
  memoryEl.textContent=current;
  resultEl.classList.remove('pop');
  requestAnimationFrame(()=>resultEl.classList.add('pop'));
}
function append(v){
  if(justEvaluated&&!'+-*/'.includes(v)){current='0';expression='';justEvaluated=false}
  if(v==='.'&&current.includes('.'))return;
  if(current==='0'&&v!=='.')current=v;else current+=v;
  render();
}
function op(v){
  if(expression&&'+-*/'.includes(expression.at(-1))) expression=expression.slice(0,-1)+v;
  else expression=(expression?expression+current:current)+v;
  current='0';justEvaluated=false;render();
}
function calculate(){
  const exp=expression+current;
  if(!exp)return;
  try{
    if(!/^[0-9+\-*/.() ]+$/.test(exp))throw Error();
    const value=Function('"use strict";return ('+exp+')')();
    if(!Number.isFinite(value))throw Error();
    const answer=format(value);
    history.unshift({exp:exp.replaceAll('*','×').replaceAll('/','÷'),answer});
    history=history.slice(0,8);
    operations++;
    opCountEl.textContent=String(operations).padStart(2,'0');
    current=answer;expression=exp+' =';justEvaluated=true;
    renderHistory();render();pulse('equals');
  }catch{
    current='Error';expression='Invalid expression';justEvaluated=true;render();pulse('error');
  }
}
function clearAll(){current='0';expression='';justEvaluated=false;render();pulse('clear')}
function back(){if(justEvaluated)return clearAll();current=current.length>1?current.slice(0,-1):'0';render();pulse('back')}
function percent(){const n=parseFloat(current);if(!Number.isNaN(n)){current=format(n/100);render();pulse('percent')}}
keypad.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const a=b.dataset.action,v=b.dataset.value;
  if(a==='clear')clearAll();
  else if(a==='backspace')back();
  else if(a==='percent')percent();
  else if(a==='equals')calculate();
  else if(v&&'+-*/'.includes(v))op(v);
  else if(v)append(v);
  if(a!=='equals')pulse(v||a);
});
document.addEventListener('keydown',e=>{
  const k=e.key;
  if(/[0-9.]/.test(k))append(k);
  else if('+-*/'.includes(k))op(k);
  else if(k==='Enter'||k==='=')calculate();
  else if(k==='Backspace')back();
  else if(k==='Escape')clearAll();
  else if(k==='%')percent();
});
function pulse(v){window.dispatchEvent(new CustomEvent('calc-pulse',{detail:v}))}
function renderHistory(){
  historyEl.innerHTML=history.length
    ?history.map((h,i)=>`<div class="history-item" data-i="${i}"><span class="calc">${h.exp}</span><span class="answer">= ${h.answer}</span></div>`).join('')
    :'<div class="empty">Your calculations will appear here.</div>';
}
historyEl.addEventListener('click',e=>{
  const item=e.target.closest('.history-item');if(!item)return;
  current=history[item.dataset.i].answer;expression='';justEvaluated=true;render();
});
document.querySelector('#clearHistory').onclick=()=>{history=[];renderHistory()};

/* ===== REALISTIC 3D CALCULATOR ===== */
async function start3D(){
 const el=document.querySelector('#scene'); if(!el)return;
 try{
  const T=await import('https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js');
  const s=new T.Scene(),cam=new T.PerspectiveCamera(35,1,.1,100); cam.position.set(0,0,8);
  const ren=new T.WebGLRenderer({antialias:true,alpha:true});
  ren.setPixelRatio(Math.min(devicePixelRatio,2)); ren.shadowMap.enabled=true;
  ren.toneMapping=T.ACESFilmicToneMapping; ren.toneMappingExposure=1.15; el.replaceChildren(ren.domElement);
  const g=new T.Group(); g.rotation.set(-.1,-.25,.02); s.add(g);
  s.add(new T.HemisphereLight(0xfff1d0,0x100d08,2));
  const l=new T.DirectionalLight(0xffc46b,5); l.position.set(4,5,7); l.castShadow=true; s.add(l);
  const glow=new T.PointLight(0xff6500,20,15); glow.position.set(-3,1,4); s.add(glow);

  const body=new T.Mesh(new T.BoxGeometry(3.4,4.5,.65),new T.MeshPhysicalMaterial({color:0x17181b,metalness:.9,roughness:.2,clearcoat:.8}));
  body.castShadow=true; g.add(body);
  const frame=new T.Mesh(new T.BoxGeometry(2.75,1.05,.18),new T.MeshStandardMaterial({color:0x050607,metalness:.5,roughness:.25}));
  frame.position.set(0,1.42,.42); g.add(frame);
  const screen=new T.Mesh(new T.BoxGeometry(2.5,.72,.04),new T.MeshPhysicalMaterial({color:0x07100c,emissive:0xff7200,emissiveIntensity:.5,roughness:.12}));
  screen.position.set(0,1.42,.53); g.add(screen);

  const keyMat=new T.MeshPhysicalMaterial({color:0x292b30,metalness:.65,roughness:.25,clearcoat:.5});
  const orange=new T.MeshPhysicalMaterial({color:0xff9000,metalness:.7,roughness:.2});
  for(let y=0;y<4;y++)for(let x=0;x<3;x++){
   const k=new T.Mesh(new T.BoxGeometry(.72,.48,.2),(x===2?orange:keyMat));
   k.position.set((x-1)*1.02,.62-y*.74,.5); k.castShadow=true; g.add(k);
  }
  const edge=new T.Mesh(new T.BoxGeometry(3.46,4.56,.69),new T.MeshBasicMaterial({color:0xff7b00,wireframe:true,transparent:true,opacity:.45}));
  g.add(edge);

  let mx=0,my=0,pulse=0;
  el.onpointermove=e=>{const r=el.getBoundingClientRect();mx=((e.clientX-r.left)/r.width-.5)*2;my=((e.clientY-r.top)/r.height-.5)*2};
  addEventListener('calc-pulse',()=>pulse=1);
  function resize(){const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight);ren.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
  new ResizeObserver(resize).observe(el); resize();
  function loop(){
   requestAnimationFrame(loop);
   g.rotation.y+=(-.25+mx*.16-g.rotation.y)*.04;
   g.rotation.x+=(-.1-my*.1-g.rotation.x)*.04;
   const z=1+pulse*.06; g.scale.lerp(new T.Vector3(z,z,z),.12); pulse*=.9;
   ren.render(s,cam);
  } loop();
 }catch(e){
  el.innerHTML='<div class="realistic-fallback"><div class="fallback-body"><div class="fallback-screen">88.8</div><div class="fallback-keys"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div></div>';
 }
}
start3D();