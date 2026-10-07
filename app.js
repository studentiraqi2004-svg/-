import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

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

/* ===== REAL-TIME 3D ENGINE ===== */
const sceneEl=document.querySelector('#scene');
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(42,1,.1,100);
camera.position.set(0,0,7.2);

const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setClearColor(0x000000,0);
sceneEl.appendChild(renderer.domElement);

const world=new THREE.Group();
scene.add(world);

const keyLight=new THREE.PointLight(0xffb000,35,18);
keyLight.position.set(3.5,2.8,4.5);
scene.add(keyLight);
const rimLight=new THREE.PointLight(0xff4d00,24,15);
rimLight.position.set(-4,-2,3);
scene.add(rimLight);
scene.add(new THREE.AmbientLight(0xffffff,.65));

/* central faceted crystal */
const crystal=new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.42,2),
  new THREE.MeshPhysicalMaterial({
    color:0xff9d16,metalness:.72,roughness:.16,
    emissive:0x5a2100,emissiveIntensity:.8,
    clearcoat:1,clearcoatRoughness:.15
  })
);
world.add(crystal);

/* glowing wire shell */
const shell=new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.62,2),
  new THREE.MeshBasicMaterial({color:0xffc04a,wireframe:true,transparent:true,opacity:.22})
);
world.add(shell);

/* orbital rings */
const rings=[];
for(let i=0;i<3;i++){
  const ring=new THREE.Mesh(
    new THREE.TorusGeometry(1.85+i*.22,.014,12,160),
    new THREE.MeshBasicMaterial({color:i===1?0xff6b00:0xffb000,transparent:true,opacity:.55})
  );
  ring.rotation.set(.65+i*.48,.2+i*.55,i*.9);
  world.add(ring);rings.push(ring);
}

/* floating particles */
const particleCount=260;
const positions=new Float32Array(particleCount*3);
for(let i=0;i<particleCount;i++){
  const radius=2.2+Math.random()*2.8;
  const a=Math.random()*Math.PI*2;
  const z=(Math.random()-.5)*4.5;
  positions[i*3]=Math.cos(a)*radius;
  positions[i*3+1]=Math.sin(a)*radius;
  positions[i*3+2]=z;
}
const particleGeo=new THREE.BufferGeometry();
particleGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
const particles=new THREE.Points(
  particleGeo,
  new THREE.PointsMaterial({color:0xffb52e,size:.028,transparent:true,opacity:.7,sizeAttenuation:true})
);
scene.add(particles);

let targetPulse=0;
let mouseX=0,mouseY=0;
sceneEl.addEventListener('pointermove',e=>{
  const r=sceneEl.getBoundingClientRect();
  mouseX=((e.clientX-r.left)/r.width-.5)*2;
  mouseY=((e.clientY-r.top)/r.height-.5)*2;
});
window.addEventListener('calc-pulse',()=>{targetPulse=1});

function resize(){
  const w=Math.max(1,sceneEl.clientWidth),h=Math.max(1,sceneEl.clientHeight);
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(sceneEl);
resize();

const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const t=clock.getElapsedTime();
  crystal.rotation.x=t*.28+mouseY*.16;
  crystal.rotation.y=t*.42+mouseX*.2;
  shell.rotation.x=-t*.18;
  shell.rotation.y=-t*.25;
  rings.forEach((r,i)=>{
    r.rotation.z+=.0025*(i+1);
    r.rotation.x+=.0008*(i+1);
  });
  particles.rotation.y=t*.035;
  particles.rotation.x=Math.sin(t*.12)*.08;
  world.position.x+=(mouseX*.22-world.position.x)*.045;
  world.position.y+=(-mouseY*.18-world.position.y)*.045;
  const pulse=1+targetPulse*.16;
  const s=world.scale.x+(pulse-world.scale.x)*.12;
  world.scale.setScalar(s);
  targetPulse*=.91;
  renderer.render(scene,camera);
}
animate();
renderHistory();render();
