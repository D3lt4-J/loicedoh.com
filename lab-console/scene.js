import * as T from './vendor/three.js';
import {SoftwareRenderer} from './software.js';
const stage=document.querySelector('#stage'),canvas=document.querySelector('#scene'),content=document.querySelector('#content');
let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});}catch(e){renderer=new SoftwareRenderer(canvas);document.querySelector('header p').append(' · aperçu CPU');}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.localClippingEnabled=true;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.outputColorSpace=T.SRGBColorSpace;
const scene=new T.Scene(),camera=new T.OrthographicCamera(-7,7,6,-6,.1,100);camera.position.set(0,2.5,27);camera.lookAt(0,0,0);
const root=new T.Group();scene.add(root);
// Large studio cards become an environment reflected in bevelled materials.
const envScene=new T.Scene();envScene.background=new T.Color('#252936');
function softbox(w,h,x,y,z,color,intensity){const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(intensity),side:T.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);envScene.add(m);}
softbox(10,17,-8,7,9,'#c5d9ff',4);softbox(4,13,9,3,6,'#e9c4a3',3);softbox(11,2,0,10,2,'#ffffff',5);softbox(6,12,0,-2,-8,'#414556',.5);
if(!renderer.cpu){const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(envScene,.045).texture;pmrem.dispose();}
const ambient=new T.HemisphereLight('#bfcce3','#171318',.5);scene.add(ambient);
const key=new T.DirectionalLight('#d4e0ff',3.4);key.position.set(-7,9,12);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-9,right:9,top:8,bottom:-8,near:.1,far:40});key.shadow.bias=-.0006;key.shadow.normalBias=.012;key.shadow.radius=4;scene.add(key);
const fill=new T.DirectionalLight('#ffd8b5',1.15);fill.position.set(9,4,5);scene.add(fill);
const violet=new T.PointLight('#aa72ff',2.0,3,2);root.add(violet);
function noiseTexture(){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),im=ctx.createImageData(256,256);let seed=27;for(let i=0;i<im.data.length;i+=4){seed=(1664525*seed+1013904223)>>>0;const v=110+(seed>>>27);im.data.set([v,v,v,255],i);}ctx.putImageData(im,0,0);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(8,8);return t;}
const noise=noiseTexture();
const graphite=new T.MeshStandardMaterial({color:'#33343a',metalness:.72,roughness:.37,bumpMap:noise,bumpScale:.012,envMapIntensity:1.05});
const edge=new T.MeshStandardMaterial({color:'#65626b',metalness:.9,roughness:.27,bumpMap:noise,bumpScale:.006});
const black=new T.MeshStandardMaterial({color:'#090c11',roughness:.43,metalness:.3});
const rubber=new T.MeshStandardMaterial({color:'#080a0e',roughness:.82,metalness:.03});
const plastic=new T.MeshStandardMaterial({color:'#20232a',roughness:.32,metalness:.48,bumpMap:noise,bumpScale:.006});
const copper=new T.MeshStandardMaterial({color:'#ad6541',roughness:.28,metalness:.8});
function rr(x,y,w,h,r){const s=new T.Shape();s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function meshShape(shape,depth,mat,bevel=.04,z=0){const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSegments:5,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:16});const m=new T.Mesh(g,mat);m.position.z=z;m.castShadow=true;m.receiveShadow=true;return m;}
function slab(x,y,w,h,r,depth,mat,z=0,bevel=.04){const m=meshShape(rr(x,y,w,h,r),depth,mat,bevel,z);root.add(m);return m;}
function frame(x,y,w,h,r,thickness,depth,mat,z){const s=rr(x,y,w,h,r);s.holes.push(new T.Path(rr(x+thickness,y+thickness,w-thickness*2,h-thickness*2,Math.max(.04,r-thickness)).getPoints().reverse()));return meshShape(s,depth,mat,.025,z);}
const loader=new T.TextureLoader();const assets=['../assets/logo.png','../assets/featured/seekers.jpg','../assets/portfolio/page-5-0.png','../assets/featured/jam-in.png'];
const textures=assets.map(a=>{const t=loader.load(a,()=>requestRender());t.colorSpace=T.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;});
let W=12,H=9.4,mobile=false,selected=1,current=1,rail=0,railTarget=0,tech=false,lang='fr',last=0;
let cards=[],leds=[],lightBars=[],pickMeshes=[],shellParts=[],ui={},raycaster=new T.Raycaster(),pointer=new T.Vector2(),dirty=true;
function remember(o){shellParts.push(o);return o;}
function build(){for(const o of shellParts)root.remove(o);for(const c of cards)root.remove(c.group);shellParts=[];cards=[];leds=[];lightBars=[];pickMeshes=[];W=mobile?3.7:12;H=mobile?10.4:9.4;const left=-W/2,bottom=-H/2,top=H/2;const margin=mobile?.18:.27,cheek=mobile?.55:1.02;const tray={x:left+cheek,y:top-1.63,w:W-cheek*2,h:1.49};const screen={x:left+margin,y:bottom+.29,w:W-margin*2,h:H-2.6};
// Back casing is one closed volume; the front is a plate with two cut-outs.
remember(slab(left+.015,bottom-.015,W-.03,H-.02,.36,.58,black,-.64,.09));
const face=rr(left,bottom,W,H,.34);face.holes.push(new T.Path(rr(tray.x,tray.y,tray.w,tray.h,.1).getPoints().reverse()));face.holes.push(new T.Path(rr(screen.x,screen.y,screen.w,screen.h,.26).getPoints().reverse()));
remember(meshShape(face,.14,graphite,.07,.3));root.add(shellParts.at(-1));
const outer=frame(left+.055,bottom+.055,W-.11,H-.11,.29,.055,.04,edge,.45);root.add(outer);remember(outer);
// Black rear wall, bottom and side walls of the open cartridge bay.
remember(slab(tray.x-.02,tray.y-.02,tray.w+.04,tray.h+.04,.09,.06,rubber,-.43,.025));
const lining=frame(tray.x-.018,tray.y-.018,tray.w+.036,tray.h+.036,.1,.065,.64,black,-.35);root.add(lining);remember(lining);
// Deep screen gasket and polished inner edge.
const gasket=frame(screen.x-.03,screen.y-.03,screen.w+.06,screen.h+.06,.28,.12,.23,rubber,.12);root.add(gasket);remember(gasket);
const rim=frame(screen.x+.08,screen.y+.08,screen.w-.16,screen.h-.16,.19,.024,.015,edge,.29);root.add(rim);remember(rim);
const sill=slab(tray.x-.03,tray.y-.07,tray.w+.06,.13,.035,.18,plastic,.34,.025);remember(sill);
// Real buttons in recessed seats, with a continuous navigation panel.
const deckY=tray.y-.62,deckX=mobile?left+.25:left+cheek-.08,deckW=mobile?W-.95:W-cheek-1.0;
remember(slab(deckX-.06,deckY-.07,deckW+.12,.53,.1,.04,rubber,.44,.025));remember(slab(deckX,deckY,deckW,.39,.07,.04,plastic,.47,.025));
const prev={x:left+cheek*.46,y:tray.y+.58,w:mobile?.31:.49,h:.61};const next={x:-prev.x,y:prev.y,w:prev.w,h:prev.h};
for(const b of [prev,next]){remember(slab(b.x-b.w/2-.045,b.y-b.h/2-.04,b.w+.09,b.h+.08,.09,.035,rubber,.43,.02));remember(slab(b.x-b.w/2,b.y-b.h/2,b.w,b.h,.065,.08,plastic,.47,.035));}
const ejectX=left+W-.55;remember(slab(ejectX-.19,deckY+.005,.38,.38,.19,.04,rubber,.45,.02));remember(slab(ejectX-.155,deckY+.04,.31,.31,.155,.09,copper,.48,.02));
// A rounded rocker sits within the navigation panel.
const rockerX=deckX+deckW-(mobile?.92:1.31);remember(slab(rockerX,deckY+.045,mobile?.83:1.18,.29,.145,.035,rubber,.51,.015));remember(slab(rockerX+.025,deckY+.063,mobile?.38:.54,.25,.125,.04,plastic,.55,.012));
const cw=mobile?2.03:2.6,ch=1.44,spacing=mobile?2.48:3.05;
for(let i=0;i<4;i++){
const group=new T.Group();root.add(group);const body=meshShape(rr(-cw/2,0,cw,ch,.095),.27,plastic,.045,-.05);group.add(body);body.userData.index=i;pickMeshes.push(body);
const border=frame(-cw/2+.10,.08,cw-.20,ch-.12,.045,.025,.018,edge,.257);group.add(border);
// One UV island folds from the vertical label onto the shallow top plane.
const x=cw/2-.14,y0=.17,y1=ch-.08,z=.282,zt=.07;
const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-x,y0,z,x,y0,z,x,y1,z,-x,y1,z,-x,y1,z,x,y1,z,x,y1+.035,zt,-x,y1+.035,zt],3));g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,.95,0,.95,0,.95,1,.95,1,1,0,1],2));g.setIndex([0,1,2,0,2,3,4,5,6,4,6,7]);g.computeVertexNormals();
const label=new T.Mesh(g,new T.MeshStandardMaterial({map:textures[i],roughness:.46,metalness:.08,color:i===0?'#c9c7d2':'#ffffff'}));group.add(label);label.userData.index=i;pickMeshes.push(label);
const led=new T.Mesh(new T.BoxGeometry(cw+.08,.015,.045),new T.MeshStandardMaterial({color:'#ba88ff',emissive:'#bb82ff',emissiveIntensity:renderer.cpu?.5:3.5,roughness:.3}));led.position.set(0,tray.y+.015,.58);root.add(led);remember(led);leds.push(led);
group.traverse(o=>{if(o.isMesh){o.userData.clipRange=[tray.x,tray.x+tray.w];o.material=o.material.clone();o.material.clippingPlanes=[new T.Plane(new T.Vector3(1,0,0),-tray.x),new T.Plane(new T.Vector3(-1,0,0),tray.x+tray.w)];}});
cards.push({group,index:i,x:(i-1)*spacing,y:tray.y+.20,target:tray.y+.20,spacing});group.position.set((i-1)*spacing,tray.y+.20,-.02);
}
ui={tray,screen:{x:screen.x+.15,y:screen.y+.15,w:screen.w-.3,h:screen.h-.3},deck:{x:deckX+.07,y:deckY+.02,w:W-(deckX-left)-.3,h:.35},prev,next};
railTarget=(1-current)*spacing;rail=railTarget;updateSelected();requestRender();}
function project(x,y,z=.53){const p=new T.Vector3(x,y,z).applyMatrix4(root.matrixWorld).project(camera);return {x:(p.x*.5+.5)*stage.clientWidth,y:(-.5*p.y+.5)*stage.clientHeight};}
function place(el,q,z=.53){const a=project(q.x,q.y+q.h,z),b=project(q.x+q.w,q.y,z);Object.assign(el.style,{left:a.x+'px',top:a.y+'px',width:(b.x-a.x)+'px',height:(b.y-a.y)+'px'});}
function updateUI(){root.updateMatrixWorld(true);place(content,ui.screen,.30);place(document.querySelector('#keys'),ui.deck,.65);for(const [id,b] of [['left',ui.prev],['right',ui.next]])place(document.getElementById(id),{x:b.x-b.w/2,y:b.y-b.h/2,w:b.w,h:b.h},.65);content.style.opacity=tech?'0':'1';document.querySelector('#keys').style.opacity=tech?'0':'1';}
function updateSelected(){cards.forEach((c,i)=>{c.target=ui.tray.y+(i===selected?-.14:.035);leds[i].visible=i===selected;});document.querySelectorAll('[data-index]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.index===selected)));document.querySelector('#status').textContent=['Profil','Seekers','Lucky Luke','Jam-In'][current]+(selected===null?' · cartouche éjectée':' · cartouche insérée');violet.visible=selected!==null;requestRender();}
function select(i){if(i<0||i>3)return;current=i;selected=selected===i?null:i;railTarget=(1-i)*cards[0].spacing;updateSelected();}
function resize(){const width=stage.clientWidth;mobile=width<600;stage.style.height=mobile?'1030px':Math.round(Math.min(width*.87,1100))+'px';const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);const vh=mobile?11.8:10.7,vw=vh*w/h;camera.left=-vw/2;camera.right=vw/2;camera.top=vh/2;camera.bottom=-vh/2;camera.updateProjectionMatrix();build();}
let raf=0;function requestRender(){dirty=true;if(!raf)raf=requestAnimationFrame(draw);}
function draw(t){raf=0;const dt=Math.min((t-last)/1000,.05)||.016;last=t;let moving=false;const mix=1-Math.exp(-dt*10);rail+=(railTarget-rail)*mix;for(const c of cards){c.group.position.x=c.x+rail;c.group.position.y+=(c.target-c.group.position.y)*mix;if(Math.abs(c.target-c.group.position.y)>.001)moving=true;leds[c.index].position.x=c.group.position.x;}
if(Math.abs(railTarget-rail)>.001)moving=true;const target=tech?-.32:0;root.rotation.y+=(target-root.rotation.y)*mix;if(Math.abs(target-root.rotation.y)>.001)moving=true;const active=selected===null?cards[current]:cards[selected];violet.position.set(active.group.position.x,ui.tray.y+.04,.67);updateUI();renderer.render(scene,camera);if(moving)requestRender();}
canvas.addEventListener('pointerup',e=>{const b=canvas.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(pickMeshes);if(hits.length){const p=hits[0].point;const local=root.worldToLocal(p.clone());if(local.x>ui.tray.x&&local.x<ui.tray.x+ui.tray.w&&local.y>ui.tray.y)select(hits[0].object.userData.index);}});
document.querySelectorAll('[data-index]').forEach(b=>b.onclick=()=>select(+b.dataset.index));document.querySelector('#left').onclick=()=>{const i=Math.max(0,current-1);if(i!==current)select(i)};document.querySelector('#right').onclick=()=>{const i=Math.min(3,current+1);if(i!==current)select(i)};document.querySelector('.eject').onclick=()=>{selected=null;updateSelected()};document.querySelector('.profile').onclick=()=>select(0);document.querySelector('.contact').onclick=()=>{document.querySelector('#status').textContent='Contact · commande de maquette';};document.querySelector('.language').onclick=e=>{lang=lang==='fr'?'en':'fr';e.currentTarget.textContent=lang==='fr'?'[FR] EN':'FR [EN]'};document.querySelector('#view').onclick=e=>{tech=!tech;e.currentTarget.setAttribute('aria-pressed',String(tech));e.currentTarget.textContent=tech?'Vue frontale':'Vue technique';requestRender();};window.addEventListener('resize',resize);resize();
