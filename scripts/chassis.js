/* Parametric, lit 3D chassis. DOM remains responsible for text, video and input. */
(() => {
  'use strict';
  const shell=document.querySelector('.equipment');
  const canvas=document.createElement('canvas');
  canvas.className='chassis-scene'; canvas.setAttribute('aria-hidden','true'); shell.prepend(canvas);
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
  const ctx=gl?null:canvas.getContext('2d');
  if(!gl&&!ctx){canvas.remove();return;}
  const vertex=`attribute vec3 position;attribute vec3 normal;attribute vec3 color;attribute float finish;
  uniform vec2 viewport;varying vec3 N;varying vec3 P;varying vec3 C;varying float F;
  void main(){P=position;N=normal;C=color;F=finish;
  vec2 p=position.xy+vec2(.08,-.32)*position.z;
  gl_Position=vec4(p.x/viewport.x*2.-1.,1.-p.y/viewport.y*2.,-position.z/100.,1.);}`;
  const fragment=`precision highp float;varying vec3 N;varying vec3 P;varying vec3 C;varying float F;uniform vec2 dimensions;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  void main(){vec3 n=normalize(N);vec3 view=normalize(vec3(-.08,.32,1.));
  vec3 l=normalize(vec3(-.6,-.85,1.1)); vec3 r=normalize(vec3(.9,-.25,.55));
  float diffuse=max(dot(n,l),0.);float rim=max(dot(n,r),0.);
  float spec=pow(max(dot(n,normalize(l+view)),0.),mix(22.,85.,F));
  float spec2=pow(max(dot(n,normalize(r+view)),0.),46.);
  float grain=(hash(floor(P.xy*2.2))-.5)*.019+(hash(floor(P.xy*7.))-.5)*.011;
  float vertical=clamp(P.y/dimensions.y,0.,1.);
  vec3 light=C*(.62+diffuse*.56+rim*.13)+grain;
  light+=vec3(.78,.84,.94)*spec*(.12+F*.42);
  light+=vec3(1.,.77,.53)*spec2*(.08+F*.3);
  float fres=pow(1.-max(dot(n,view),0.),3.);
  light+=fres*vec3(.13,.14,.17)*(F+.25);
  float bevel=1.-abs(n.z);
  light+=bevel*(.10+max(-n.y,0.)*.26+max(-n.x,0.)*.15)*vec3(.78,.84,.94);
  light+=bevel*max(n.x,0.)*.13*vec3(1.,.78,.56);
  float wash=.93+.14*exp(-length(P.xy/dimensions-vec2(.12,.05))*2.5);
  // Broad cool key and warm edge reflection, restrained on the flat face.
  light+=vec3(.025,.035,.055)*exp(-pow((P.x/dimensions.x-.10)*4.,2.));
  light+=vec3(.055,.036,.024)*exp(-pow((P.x/dimensions.x-.98)*8.,2.));
  light*=wash*(1.-vertical*.12);
  gl_FragColor=vec4(light,1.);}`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  let program,viewport,dimensions;
  if(gl){
  try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Unable to link chassis renderer');}
  catch(e){console.warn(String(e));canvas.remove();return;}
  gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const [name,size,offset] of [['position',3,0],['normal',3,12],['color',3,24],['finish',1,36]]){
    const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,40,offset);
  }
  viewport=gl.getUniformLocation(program,'viewport'); dimensions=gl.getUniformLocation(program,'dimensions');
  }
  let vertices=[], pressed=null;
  function triangle(a,b,c,color,finish=0){
    const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);
    let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const len=Math.hypot(...n)||1;n=n.map(v=>v/len); if(n[2]<0)n=n.map(v=>-v);
    for(const p of [a,b,c])vertices.push(...p,...n,...color,finish);
  }
  function quad(a,b,c,d,color,finish=0){triangle(a,b,c,color,finish);triangle(a,c,d,color,finish);}
  function outline(rect,z){const {x,y,w,h,r}=rect;const pts=[];const rad=Math.min(r,w/2,h/2);
    for(const [cx,cy,start] of [[x+w-rad,y+rad,-90],[x+w-rad,y+h-rad,0],[x+rad,y+h-rad,90],[x+rad,y+rad,180]])
      for(let i=0;i<=12;i++){const angle=(start+i*7.5)*Math.PI/180;pts.push([cx+Math.cos(angle)*rad,cy+Math.sin(angle)*rad,z]);}
    return pts;
  }
  const inset=(q,d)=>({x:q.x+d,y:q.y+d,w:q.w-2*d,h:q.h-2*d,r:Math.max(1,q.r-d)});
  function ring(a,za,b,zb,color,finish=0){const aa=outline(a,za),bb=outline(b,zb);for(let i=0;i<aa.length;i++){const j=(i+1)%aa.length;quad(aa[i],aa[j],bb[j],bb[i],color,finish);}}
  function fill(rect,z,color,finish=0){const points=outline(rect,z),center=[rect.x+rect.w/2,rect.y+rect.h/2,z];for(let i=0;i<points.length;i++)triangle(center,points[i],points[(i+1)%points.length],color,finish);}
  function interval(q,y){if(y<q.y||y>q.y+q.h)return null;const r=Math.min(q.r,q.w/2,q.h/2);const dy=y<q.y+r?q.y+r-y:y>q.y+q.h-r?y-(q.y+q.h-r):0;const dx=r-Math.sqrt(Math.max(0,r*r-dy*dy));return [q.x+dx,q.x+q.w-dx];}
  function plate(rect,holes,z,color){
    const stops=new Set([rect.y,rect.y+rect.h]);for(let y=rect.y;y<rect.y+rect.h;y+=2)stops.add(y);
    holes.forEach(q=>{stops.add(q.y);stops.add(q.y+q.h)});const ys=[...stops].filter(y=>y>=rect.y&&y<=rect.y+rect.h).sort((a,b)=>a-b);
    for(let k=0;k<ys.length-1;k++){const y0=ys[k],y1=ys[k+1],ym=(y0+y1)/2;const active=holes.filter(q=>interval(q,ym)).sort((a,b)=>a.x-b.x);
      const bounds=y=>{const out=interval(rect,y);if(!out)return [];return [out[0],...active.flatMap(q=>interval(q,Math.max(q.y,Math.min(q.y+q.h,y)))),out[1]]};
      const aa=bounds(y0),bb=bounds(y1);for(let i=0;i<aa.length-1;i+=2)quad([aa[i],y0,z],[aa[i+1],y0,z],[bb[i+1],y1,z],[bb[i],y1,z],color);
    }
  }
  const graphite=[.105,.111,.124],edge=[.23,.24,.26],rubber=[.025,.03,.037];
  function recess(q,depth,kind){
    ring(q,0,inset(q,2),-1,[.32,.31,.34],.35);
    ring(inset(q,2),-1,inset(q,4),-3,[.055,.06,.07],.35);
    ring(inset(q,4),-3,inset(q,6),-depth,rubber,.1);
    fill(inset(q,6),-depth,[.035,.043,.052]);
    if(kind==='screen')ring(inset(q,6),-depth,inset(q,8),-depth+1,[.09,.10,.12],.4);
  }
  function button(q,brass=false,down=false){const height=down?1:3;const color=brass?[.50,.29,.15]:[.14,.16,.19];
    fill(inset(q,-3),-.5,rubber);ring(inset(q,-2),0,q,1,[.055,.062,.075]);
    ring(q,1,inset(q,2),height,brass?[.85,.57,.32]:[.35,.36,.40],.65);
    fill(inset(q,2),height,color,brass?.8:.15);
  }
  function render(){
    if(!shell.isConnected)return;
    const bounds=shell.getBoundingClientRect(),W=bounds.width,H=bounds.height;
    if(!W||!H)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.style.width=W+'px';canvas.style.height=(H+24)+'px';
    canvas.width=Math.round(W*dpr);canvas.height=Math.round((H+24)*dpr);
    if(gl){gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(viewport,W,H+24);gl.uniform2f(dimensions,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);}
    vertices=[];
    const rect=(selector,r=6)=>{const b=shell.querySelector(selector).getBoundingClientRect();return {x:b.left-bounds.left,y:b.top-bounds.top,w:b.width,h:b.height,r};};
    const outside={x:2,y:0,w:W-4,h:H,r:W<600?24:31};
    ring(inset(outside,2),-16,outside,-8,[.055,.065,.08],.35);
    // A rolled edge with eight changing normals catches the soft key light.
    // Concentric geometry stays continuous at every responsive size.
    for(let i=0;i<8;i++){
      const a=i/8*Math.PI/2,b=(i+1)/8*Math.PI/2;
      ring(inset(outside,1+10*(1-Math.cos(a))),-8+8*Math.sin(a),
           inset(outside,1+10*(1-Math.cos(b))),-8+8*Math.sin(b),edge,.52);
    }
    ring(inset(outside,11),0,inset(outside,12),0,graphite,.1);
    const face=inset(outside,12),module=rect('.cartridge-module');
    const cheek=parseFloat(getComputedStyle(shell.querySelector('.cartridge-module')).getPropertyValue('--cheek'));
    const tray={x:module.x+cheek-3,y:module.y+7,w:module.w-cheek*2+6,h:module.h-27,r:6};
    const screen=rect('.bezel',W<600?22:26);
    const nav=rect('.navigation-keys',10);const controls=rect('.control-deck');
    if(!nav.w){nav.x=controls.x+58;nav.y=controls.y+8;nav.w=controls.w-108;nav.h=controls.h-16;}
    const holes=[tray,screen];
    plate(face,holes,0,graphite);
    recess(tray,15,'tray');recess(screen,14,'screen');
    const lip={x:tray.x+1,y:tray.y+tray.h-1,w:tray.w-2,h:9,r:2};
    ring(lip,-1,inset(lip,1),2,[.27,.26,.30],.35);fill(inset(lip,1),2,[.13,.14,.16]);
    for(const s of ['#shelf-prev','#shelf-next'])button(rect(s,6),false,pressed===s);

    if(gl){gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,vertices.length/10);}
    else softwareRender(dpr,H);
  }
  // The same 3D mesh has a CPU renderer for browsers without a WebGL context.
  const unit=v=>{const l=Math.hypot(...v);return v.map(x=>x/l)},dot=(a,b)=>a.reduce((t,x,i)=>t+x*b[i],0);
  const light=unit([-.6,-.85,1.1]),rimLight=unit([.9,-.25,.55]),view=unit([-.08,.32,1]);
  const half=unit(light.map((x,i)=>x+view[i])),halfRim=unit(rimLight.map((x,i)=>x+view[i]));
  const grain=document.createElement('canvas');grain.width=128;grain.height=128;
  const g=grain.getContext('2d'),pixels=g.createImageData(128,128);let seed=4397;
  for(let i=0;i<pixels.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const c=seed>>>24;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=c;pixels.data[i+3]=255;}g.putImageData(pixels,0,0);
  function softwareRender(dpr,H){
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,canvas.width/dpr,canvas.height/dpr);
    const faces=[];for(let i=0;i<vertices.length;i+=30){const v=vertices.slice(i,i+30);faces.push({v,z:(v[2]+v[12]+v[22])/3});}faces.sort((a,b)=>a.z-b.z);
    for(const {v} of faces){const n=v.slice(3,6),F=v[9],base=v.slice(6,9);const diffuse=Math.max(dot(n,light),0),rim=Math.max(dot(n,rimLight),0);
      const spec=Math.pow(Math.max(dot(n,half),0),22+(85-22)*F),spec2=Math.pow(Math.max(dot(n,halfRim),0),46),fres=Math.pow(1-Math.max(dot(n,view),0),3);
      const y=(v[1]+v[11]+v[21])/3,x=(v[0]+v[10]+v[20])/3;const bevel=1-Math.abs(n[2]);const wash=.93+.14*Math.exp(-Math.hypot(x/(canvas.width/dpr)-.12,y/H-.05)*2.5);const col=base.map((c,i)=>(c*(.62+diffuse*.56+rim*.13)+[.78,.84,.94][i]*spec*(.12+F*.42)+[1,.77,.53][i]*spec2*(.08+F*.3)+fres*[.13,.14,.17][i]*(F+.25)+bevel*(.10+Math.max(-n[1],0)*.26+Math.max(-n[0],0)*.15)*[.78,.84,.94][i]+bevel*Math.max(n[0],0)*.13*[1,.78,.56][i])*wash*(1-Math.max(0,Math.min(1,y/H))*.12));
      ctx.fillStyle=ctx.strokeStyle='rgb('+col.map(c=>Math.round(Math.max(0,Math.min(1,c))*255)).join(',')+')';ctx.beginPath();
      for(let j=0;j<3;j++){const k=j*10,x=v[k]+v[k+2]*.08,y=v[k+1]-v[k+2]*.32;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.lineWidth=.4;ctx.stroke();
    }
    ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.035;ctx.fillStyle=ctx.createPattern(grain,'repeat');ctx.fillRect(0,0,canvas.width/dpr,canvas.height/dpr);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  let frame=0;function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(render);}
  const observer=new ResizeObserver(schedule);observer.observe(shell);observer.observe(shell.querySelector('.control-deck'));
  window.addEventListener('resize',schedule,{passive:true});
  const keyIds=new Set(['shelf-prev','shelf-next','profile-shortcut','contact-shortcut','eject']);
  function press(e){const key=e.target.closest('button');if(key&&!key.disabled&&keyIds.has(key.id)){pressed='#'+key.id;schedule();}}
  function release(){if(pressed){pressed=null;schedule();}}
  shell.addEventListener('pointerdown',press);window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('blur',release);
  shell.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter')press(e)});shell.addEventListener('keyup',release);

  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();shell.classList.remove('has-3d-chassis');});
  canvas.addEventListener('webglcontextrestored',()=>location.reload());
  shell.classList.add('has-3d-chassis');schedule();
})();
