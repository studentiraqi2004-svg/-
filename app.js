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
async function start3D(){
  const sceneEl=document.querySelector('#scene');
  if(!sceneEl) return;
  try{
    // Dynamic import prevents a CDN/WebGL problem from breaking the calculator.
    const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js');
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(38,1,.1,100);
    camera.position.set(0,0,7.5);

    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.setClearColor(0x000000,0);
    sceneEl.replaceChildren(renderer.domElement);

    const world=new THREE.Group();
    scene.add(world);

    scene.add(new THREE.AmbientLight(0xffffff,1.1));
    const key=new THREE.PointLight(0xffb000,45,20);
    key.position.set(3,3,5); scene.add(key);
    const rim=new THREE.PointLight(0xff4b00,30,18);
    rim.position.set(-4,-2,3); scene.add(rim);

    const crystal=new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.45,2),
      new THREE.MeshStandardMaterial({
        color:0xff9d16,metalness:.75,roughness:.18,
        emissive:0x7a2600,emissiveIntensity:1.1
      })
    );
    world.add(crystal);

    const shell=new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.72,2),
      new THREE.MeshBasicMaterial({color:0xffc04a,wireframe:true,transparent:true,opacity:.42})
    );
    world.add(shell);

    const rings=[];
    for(let i=0;i<3;i++){
      const ring=new THREE.Mesh(
        new THREE.TorusGeometry(1.95+i*.24,.018,12,180),
        new THREE.MeshBasicMaterial({color:i===1?0xff6500:0xffbd32,transparent:true,opacity:.8})
      );
      ring.rotation.set(.7+i*.45,.25+i*.5,i*.8);
      world.add(ring); rings.push(ring);
    }

    const count=420;
    const pos=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const radius=2.15+Math.random()*3.0, a=Math.random()*Math.PI*2;
      pos[i*3]=Math.cos(a)*radius;
      pos[i*3+1]=Math.sin(a)*radius;
      pos[i*3+2]=(Math.random()-.5)*5;
    }
    const pg=new THREE.BufferGeometry();
    pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const particles=new THREE.Points(pg,new THREE.PointsMaterial({
      color:0xffb52e,size:.035,transparent:true,opacity:.9,sizeAttenuation:true
    }));
    scene.add(particles);

    let mx=0,my=0,pulse=0;
    sceneEl.addEventListener('pointermove',e=>{
      const r=sceneEl.getBoundingClientRect();
      mx=((e.clientX-r.left)/r.width-.5)*2;
      my=((e.clientY-r.top)/r.height-.5)*2;
    });
    window.addEventListener('calc-pulse',()=>pulse=1);

    function resize(){
      const w=Math.max(1,sceneEl.clientWidth),h=Math.max(1,sceneEl.clientHeight);
      renderer.setSize(w,h,false);
      camera.aspect=w/h; camera.updateProjectionMatrix();
    }
    const ro=new ResizeObserver(resize); ro.observe(sceneEl); resize();

    const clock=new THREE.Clock();
    function animate(){
      requestAnimationFrame(animate);
      const t=clock.getElapsedTime();
      crystal.rotation.x=t*.3+my*.18;
      crystal.rotation.y=t*.48+mx*.22;
      shell.rotation.x=-t*.2; shell.rotation.y=-t*.28;
      rings.forEach((r,i)=>{r.rotation.z+=.003*(i+1); r.rotation.x+=.001*(i+1)});
      particles.rotation.y=t*.04;
      world.position.x+=(mx*.25-world.position.x)*.05;
      world.position.y+=(-my*.2-world.position.y)*.05;
      const s=1+pulse*.2;
      world.scale.x+=(s-world.scale.x)*.14;
      world.scale.y+=(s-world.scale.y)*.14;
      world.scale.z+=(s-world.scale.z)*.14;
      pulse*=.9;
      renderer.render(scene,camera);
    }
    animate();
  }catch(err){
    // Guaranteed visual fallback if WebGL/CDN is unavailable.
    sceneEl.innerHTML='<div class="orb-fallback"><div class="orb-core"></div><div class="orb-ring r1"></div><div class="orb-ring r2"></div><div class="orb-ring r3"></div></div>';
  }
}
start3D();
