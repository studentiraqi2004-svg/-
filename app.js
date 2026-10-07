import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

const resultEl=document.querySelector('#result'), expressionEl=document.querySelector('#expression'), keypad=document.querySelector('#keypad'), historyEl=document.querySelector('#history'), opCountEl=document.querySelector('#opCount'), memoryEl=document.querySelector('#memoryValue');
let current='0', expression='', justEvaluated=false, operations=0, history=[];

function format(n){if(!Number.isFinite(n))return 'Error';const s=String(Math.round(n*1e10)/1e10);return s.length>13?Number(n).toExponential(6):s}
function render(){resultEl.textContent=current;expressionEl.textContent=expression||'Ready';resultEl.classList.remove('pop');requestAnimationFrame(()=>resultEl.classList.add('pop'));memoryEl.textContent=current}
function append(v){if(justEvaluated&&!'+-*/'.includes(v)){current='0';expression='';justEvaluated=false}if(v==='.'&&current.includes('.'))return;if(current==='0'&&v!=='.')current=v;else current+=v;render()}
function op(v){if(expression&&'+-*/'.includes(expression.at(-1))){expression=expression.slice(0,-1)+v}else{expression=(expression?expression+current:current)+v}current='0';justEvaluated=false;render()}
function calculate(){let exp=expression+current;if(!exp)return;try{if(!/^[0-9+\-*/.() ]+$/.test(exp))throw Error();const value=Function('"use strict";return ('+exp+')')();if(!Number.isFinite(value))throw Error();const answer=format(value);history.unshift({exp:exp.replaceAll('*','×').replaceAll('/','÷'),answer});history=history.slice(0,8);operations++;opCountEl.textContent=String(operations).padStart(2,'0');current=answer;expression=exp+' =';justEvaluated=true;renderHistory();render()}catch{current='Error';expression='Invalid expression';justEvaluated=true;render()}}
function clearAll(){current='0';expression='';justEvaluated=false;render()}
function back(){if(justEvaluated)return clearAll();current=current.length>1?current.slice(0,-1):'0';render()}
function percent(){const n=parseFloat(current);if(!Number.isNaN(n)){current=format(n/100);render()}}
keypad.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.action,v=b.dataset.value;if(a==='clear')clearAll();else if(a==='backspace')back();else if(a==='percent')percent();else if(a==='equals')calculate();else if(v&&'+-*/'.includes(v))op(v);else if(v)append(v);pulse(v||a)});
document.addEventListener('keydown',e=>{const k=e.key;if(/[0-9.]/.test(k))append(k);else if('+-*/'.includes(k))op(k);else if(k==='Enter'||k==='=')calculate();else if(k==='Backspace')back();else if(k==='Escape')clearAll();else if(k==='%')percent()});
function pulse(v){window.dispatchEvent(new CustomEvent('calc-pulse',{detail:v}))}
function renderHistory(){historyEl.innerHTML=history.length?history.map((h,i)=>`<div class="history-item" data-i="${i}"><span class="calc">${h.exp}</span><span class="answer">= ${h.answer}</span></div>`).join(''):'<div class="empty">Your calculations will appear here.</div>'}
historyEl.addEventListener('click',e=>{const item=e.target.closest('.history-item');if(!item)return;current=history[item.dataset.i].answer;expression='';justEvaluated=true;render()});
document.querySelector('#clearHistory').onclick=()=>{history=[];renderHistory()};

const scene=document.querySelector('#scene'), renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(scene.clientWidth,scene.clientHeight);scene.appendChild(renderer.domElement);
const camera=new THREE.PerspectiveCamera(45,scene.clientWidth/scene.clientHeight,.1,100);camera.position.set(0,0,6);
const group=new THREE.Group();sceneObj();function sceneObj(){
 const geo=new THREE.IcosahedronGeometry(1.35,2), mat=new THREE.MeshPhysicalMaterial({color:0xffa500,metalness:.65,roughness:.2,emissive:0x351800,emissiveIntensity:.45,wireframe:false});
 const mesh=new THREE.Mesh(geo,mat);group.add(mesh);
 const wire=new THREE.Mesh(new THREE.IcosahedronGeometry(1.5,2),new THREE.MeshBasicMaterial({color:0xff7a00,wireframe:true,transparent:true,opacity:.16}));group.add(wire);
 for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.75+i*.18,.008,8,100),new THREE.MeshBasicMaterial({color:0xffb000,transparent:true,opacity:.28}));ring.rotation.set(.6+i*.35,.3+i*.5,i);group.add(ring)}
 sceneObj.lights=true
}
sceneObj.lights&&(()=>{scene.add(group);const l1=new THREE.PointLight(0xffa000,12,20),l2=new THREE.PointLight(0xff4d00,8,20);l1.position.set(3,2,4);l2.position.set(-3,-2,2);scene.add(l1,l2)})();
let target=0;
window.addEventListener('calc-pulse',()=>{target=1.1});
function animate(t){requestAnimationFrame(animate);group.rotation.y=t*.00025;group.rotation.x=Math.sin(t*.00035)*.18;group.position.y=Math.sin(t*.001)*.08;group.scale.lerp(new THREE.Vector3(1+target*.12,1+target*.12,1+target*.12),.12);target*=.91;renderer.render(scene,camera)}animate(0);
new ResizeObserver(()=>{renderer.setSize(scene.clientWidth,scene.clientHeight);camera.aspect=scene.clientWidth/scene.clientHeight;camera.updateProjectionMatrix()}).observe(scene);
renderHistory();render();