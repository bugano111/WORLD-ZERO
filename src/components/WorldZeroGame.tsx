import {useCallback,useEffect,useRef,useState,type PointerEvent as ReactPointerEvent,type ReactNode,type RefObject} from "react";
import * as THREE from "three";

type InputState={joystick:{x:number;y:number};camera:number};
type Kind="branch"|"stick"|"stone"|"leaf";
type Target={kind:Kind;object:THREE.Object3D;distance:number;tree?:THREE.Group};
const safelyCapturePointer=(e:HTMLElement,id:number)=>{try{e.setPointerCapture(id)}catch{}};

function World3D({input,onCounts,onTarget,gatherApi}:{input:RefObject<InputState>;onCounts:(v:{branches:number;sticks:number;stones:number;leaves:number})=>void;onTarget:(v<Kind|null)=>void;gatherApi:RefObject<()=>void>}){
 const mount=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const host=mount.current;if(!host)return;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x9fc9dc);scene.fog=new THREE.FogExp2(0xb8d1c2,.018);
  const camera=new THREE.PerspectiveCamera(58,1,.1,180);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  host.appendChild(renderer.domElement);

  const hemi=new THREE.HemisphereLight(0xcce7ff,0x52613b,1.7);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff0cf,3.2);sun.position.set(-22,32,18);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;scene.add(sun);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(150,24,16),new THREE.MeshBasicMaterial({color:0xa8d3e6,side:THREE.BackSide,fog:false}));scene.add(sky);
  const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(2.2,18,12),new THREE.MeshBasicMaterial({color:0xffe6a8,fog:false}));sunDisc.position.set(-45,48,-70);scene.add(sunDisc);
  const groundMat=new THREE.MeshStandardMaterial({color:0x5f8247,roughness:1,metalness:0});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(120,120,40,40),groundMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
  const pos=ground.geometry.attributes.position as THREE.BufferAttribute;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);
    const rolling=.55*Math.sin(x*.085)+.38*Math.cos(y*.095)+.22*Math.sin((x+y)*.16);
    const hill1=2.5*Math.exp(-((x+18)*(x+18)+(y+22)*(y+22))/180);
    const hill2=1.8*Math.exp(-((x-20)*(x-20)+(y+8)*(y+8))/130);
    const valley=-.75*Math.exp(-((x-2)*(x-2)+(y-5)*(y-5))/95);
    pos.setZ(i,rolling+hill1+hill2+valley);
  }
  ground.geometry.computeVertexNormals();scene.add(ground);

  const mountainMat=new THREE.MeshStandardMaterial({color:0x667866,roughness:1});
  for(const [x,z,s] of [[-35,-45,15],[2,-55,19],[34,-48,17]] as number[][]){const m=new THREE.Mesh(new THREE.ConeGeometry(s,s*1.25,7),mountainMat);m.position.set(x,s*.48,z);scene.add(m);}
  const player=new THREE.Group();
  const skin=new THREE.MeshStandardMaterial({color:0xc99470,roughness:.82}),shirt=new THREE.MeshStandardMaterial({color:0x9c4035,roughness:.9}),dark=new THREE.MeshStandardMaterial({color:0x26342d,roughness:.9});
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.30,.62,5,10),shirt);torso.position.y=1.12;torso.castShadow=true;player.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.25,20,16),skin);head.position.y=1.72;head.castShadow=true;player.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.255,18,10,0,Math.PI*2,0,Math.PI*.48),new THREE.MeshStandardMaterial({color:0x3b2a22,roughness:1}));hair.position.y=1.77;hair.castShadow=true;player.add(hair);
  for(const sx of [-.39,.39]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.48,4,8),skin);arm.position.set(sx,1.13,0);arm.rotation.z=sx<0?-.10:.10;arm.castShadow=true;player.add(arm);}
  for(const sx of [-.16,.16]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.52,4,8),dark);leg.position.set(sx,.45,0);leg.castShadow=true;player.add(leg);}
  scene.add(player);

  const obstacles:{p:THREE.Vector3;r:number}[]=[];const interactives:THREE.Object3D[]=[];
  const bark=new THREE.MeshStandardMaterial({color:0x5c3925,roughness:1}),leafMats=[0x315c35,0x3f7440,0x28512f].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.94}));
  const treePts=[[-8,-9],[-3,-12],[5,-10],[10,-6],[-11,0],[11,2],[-8,8],[7,9],[1,13],[-14,-14],[14,-14]] as number[][];
  treePts.forEach(([x,z],i)=>{
   const g=new THREE.Group();g.position.set(x,0,z);g.userData.tree=true;g.userData.branches=0;
   const h=5.4+(i%4)*.55;
   const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.38+(i%3)*.04,.68+(i%2)*.08,h,14),bark);trunk.position.y=h/2;trunk.castShadow=true;trunk.receiveShadow=true;g.add(trunk);
   g.rotation.y=(i*.71)%6.28;
   const branchGeo=new THREE.CylinderGeometry(.13,.22,2.5,8);
   for(const [rx,rz,ry,rzrot] of [[-.65,0,h*.68,-1.0],[.65,.25,h*.73,1.0],[-.28,-.2,h*.82,-.65],[.25,-.25,h*.88,.62]] as number[][]){
    const b=new THREE.Mesh(branchGeo,bark);b.position.set(rx,ry,rz);b.rotation.z=rzrot;b.rotation.x=rz*.35;b.castShadow=true;g.add(b);
    const twig=new THREE.Mesh(new THREE.CylinderGeometry(.045,.09,1.45,7),bark);twig.position.set(rx*1.75,ry+.55,rz*1.8);twig.rotation.z=rzrot*.8;twig.castShadow=true;g.add(twig);
   }
   const crownY=h+.15;
   [[0,0,1.55],[-1.15,.15,1.15],[1.15,.1,1.25],[0,.75,1.2],[0,-.75,1.25],[-.55,0,1.3],[.55,.15,1.3]].forEach((a,j)=>{
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(a[2]*(1+(i%3)*.05),2),leafMats[(i+j)%leafMats.length]);crown.position.set(a[0]*(1+(i%2)*.12),crownY+(j%2)*.48,a[1]);crown.scale.set(1+(j%3)*.10,.78+(j%2)*.13,1-(j%2)*.06);crown.rotation.set((j%2)*.12,(i+j)*.37,(j%3-1)*.08);crown.castShadow=true;crown.receiveShadow=true;g.add(crown);
   });
   g.userData.kind="branch";interactives.push(g);obstacles.push({p:new THREE.Vector3(x,0,z),r:.95});scene.add(g);
  });

  const saplingMat=new THREE.MeshStandardMaterial({color:0x35633a,roughness:1});
  for(let i=0;i<34;i++){
    const a=i*2.399,r=16+(i%9)*2.1,x=Math.cos(a)*r,z=Math.sin(a)*r-7;
    const sg=new THREE.Group();
    const st=new THREE.Mesh(new THREE.CylinderGeometry(.09,.16,2.4+(i%3)*.35,7),bark);st.position.y=1.2;st.castShadow=true;sg.add(st);
    const cr=new THREE.Mesh(new THREE.IcosahedronGeometry(.75+(i%4)*.08,1),saplingMat);cr.position.y=2.65+(i%3)*.18;cr.scale.y=1.3;cr.castShadow=true;sg.add(cr);
    sg.position.set(x,0,z);scene.add(sg);
  }

  const makePickup=(kind:Kind,x:number,z:number)=>{
   let mesh:THREE.Mesh;
   if(kind==="stone"){mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(.20,1),new THREE.MeshStandardMaterial({color:0x777b72,roughness:1}));mesh.position.y=.18;}
   else {mesh=new THREE.Mesh(new THREE.CylinderGeometry(.045,.065,.8,7),new THREE.MeshStandardMaterial({color:kind==="leaf"?0x477b3d:0x65442c,roughness:1}));mesh.rotation.z=Math.PI/2;mesh.position.y=.10;}
   mesh.position.x=x;mesh.position.z=z;mesh.castShadow=true;mesh.userData.kind=kind;interactives.push(mesh);scene.add(mesh);
  };
  [[-2.2,4.2],[2.8,5.4],[-6.2,7.1],[7.4,3.5],[1.2,-2.1]].forEach(p=>makePickup("stick",p[0],p[1]));
  [[-1.3,3.6],[3.8,4.4],[-4.7,6.3],[6.1,7.7]].forEach(p=>makePickup("stone",p[0],p[1]));
  [[-.4,2.4],[4.2,2.0],[-3.5,5.2]].forEach(p=>makePickup("leaf",p[0],p[1]));

  const rockMat=new THREE.MeshStandardMaterial({color:0x6d716a,roughness:1});
  [[-5,-3,.65],[6,-5,.9],[-9,5,.7],[4,7,.8],[10,10,1.0]].forEach(([x,z,s])=>{
    const r=new THREE.Mesh(new THREE.DodecahedronGeometry(s,1),rockMat);r.position.set(x,s*.45,z);r.scale.y=.72;r.rotation.set(.18,x*.13,.08);r.castShadow=true;r.receiveShadow=true;scene.add(r);obstacles.push({p:new THREE.Vector3(x,0,z),r:s*.75});
  });
  const cliffMat=new THREE.MeshStandardMaterial({color:0x676c65,roughness:.98});
  const cliffPositions=[[-18,0,-22,3.8],[-14,1,-24,3.1],[-10,.3,-25,2.6],[17,0,-17,3.4],[20,.2,-19,2.8]] as number[][];
  cliffPositions.forEach(([x,y,z,s],i)=>{const cr=new THREE.Mesh(new THREE.DodecahedronGeometry(s,1),cliffMat);cr.position.set(x,y+s*.48,z);cr.scale.set(1.25,.85,.9);cr.rotation.set(i*.13,i*.51,i*.07);cr.castShadow=true;cr.receiveShadow=true;scene.add(cr);});
  const logMat=new THREE.MeshStandardMaterial({color:0x513523,roughness:1});
  [[-6,6,.3],[8,7,-.22]].forEach(([x,z,rot])=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(.24,.3,3.2,10),logMat);l.position.set(x,.28,z);l.rotation.z=Math.PI/2;l.rotation.y=rot;l.castShadow=true;scene.add(l);});

  // Real 3D grass tufts
  const grassMat=new THREE.MeshStandardMaterial({color:0x466f3b,roughness:1,side:THREE.DoubleSide});
  for(let i=0;i<260;i++){const x=((i*37)%101)/101*58-29,z=((i*61)%97)/97*58-29;const blade=new THREE.Mesh(new THREE.ConeGeometry(.045,.34,3),grassMat);blade.position.set(x,.17,z);scene.add(blade);}

  const makeAnimal=(kind:"horse"|"goat"|"deer",x:number,z:number,scale:number)=>{
    const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);
    const col=kind==="horse"?0x6b4934:kind==="goat"?0xb7ad99:0x8a6546;
    const mat=new THREE.MeshStandardMaterial({color:col,roughness:.95});
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.38,1.05,5,10),mat);body.rotation.z=Math.PI/2;body.position.y=1.05;body.castShadow=true;g.add(body);
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(.18,.26,.75,9),mat);neck.position.set(.62,1.48,0);neck.rotation.z=-.42;neck.castShadow=true;g.add(neck);
    const head=new THREE.Mesh(new THREE.CapsuleGeometry(.19,.36,4,8),mat);head.position.set(.86,1.78,0);head.rotation.z=Math.PI/2;head.castShadow=true;g.add(head);
    for(const sx of [-.45,.45])for(const sz of [-.22,.22]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.07,.085,.9,7),mat);leg.position.set(sx,.48,sz);leg.castShadow=true;g.add(leg);}
    const tail=new THREE.Mesh(new THREE.CylinderGeometry(.035,.065,.55,6),mat);tail.position.set(-.9,1.25,0);tail.rotation.z=-.9;g.add(tail);
    if(kind!=="horse"){const hornMat=new THREE.MeshStandardMaterial({color:0x5e584c,roughness:1});for(const zz of [-.12,.12]){const horn=new THREE.Mesh(new THREE.ConeGeometry(.045,.32,7),hornMat);horn.position.set(.92,2.05,zz);horn.rotation.z=-.3;g.add(horn);}}
    g.userData.animal=kind;g.userData.phase=Math.random()*6.28;scene.add(g);return g;
  };
  const animals=[makeAnimal("horse",-12,-4,1.15),makeAnimal("goat",8,1,.72),makeAnimal("goat",10,3,.68),makeAnimal("deer",-6,-16,.82)];
  const plantMat=new THREE.MeshStandardMaterial({color:0x73924b,roughness:1,side:THREE.DoubleSide});
  for(let i=0;i<70;i++){const x=((i*47)%103)/103*48-24,z=((i*29)%89)/89*48-24;const p=new THREE.Mesh(new THREE.ConeGeometry(.08,.48,4),plantMat);p.position.set(x,.24,z);p.rotation.z=(i%3-1)*.12;scene.add(p);}
  let yaw=0,last=performance.now(),target:Target|null=null;const counts={branches:0,sticks:0,stones:0,leaves:0};
  const chooseTarget=()=>{
   let best:Target|null=null;
   for(const o of interactives){if(!o.parent)continue;const wp=new THREE.Vector3();o.getWorldPosition(wp);const d=Math.hypot(wp.x-player.position.x,wp.z-player.position.z);
    const kind=o.userData.kind as Kind;if(!kind)continue;const reach=kind==="branch"?1.48:1.05;
    if(d<=reach&&(!best||d<best.distance))best={kind,object:o,distance:d,tree:kind==="branch"?o as THREE.Group:undefined};
   }
   target=best;onTarget(best?.kind??null);
  };
  gatherApi.current=()=>{
   chooseTarget();if(!target)return;
   if(target.kind==="branch"){
    const t=target.tree!;const n=t.userData.branches||0;if(n<2){t.userData.branches=n+1;counts.branches++;}
    else {counts.leaves+=3;t.userData.branches=3;t.userData.kind=undefined;const ix=interactives.indexOf(t);if(ix>=0)interactives.splice(ix,1);}
   }else{
    const k=target.kind;if(k==="stick")counts.sticks++;else if(k==="stone")counts.stones++;else counts.leaves++;
    scene.remove(target.object);const ix=interactives.indexOf(target.object);if(ix>=0)interactives.splice(ix,1);
   }
   onCounts({...counts});chooseTarget();
  };

  const clock=(now:number)=>{
   const dt=Math.min(.033,(now-last)/1000);last=now;
   yaw+=input.current.camera*1.55*dt;
   const j=input.current.joystick,len=Math.min(1,Math.hypot(j.x,j.y));
   if(len>.02){const fx=Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=Math.sin(yaw);const dx=(rx*j.x+fx*(-j.y))*3.0*dt,dz=(rz*j.x+fz*(-j.y))*3.0*dt;
    const nx=player.position.x+dx,nz=player.position.z+dz;
    const blocked=(x:number,z:number)=>obstacles.some(o=>Math.hypot(x-o.p.x,z-o.p.z)<o.r+.32);
    if(!blocked(nx,nz)){player.position.x=nx;player.position.z=nz}else{if(!blocked(nx,player.position.z))player.position.x=nx;if(!blocked(player.position.x,nz))player.position.z=nz;}
   }
   player.rotation.y=yaw;chooseTarget();
   animals.forEach((a,i)=>{const ph=now*.00018+a.userData.phase;a.position.x+=Math.sin(ph+i)*dt*.18;a.position.z+=Math.cos(ph*.83+i)*dt*.15;a.rotation.y=Math.atan2(Math.sin(ph+i),Math.cos(ph*.83+i));});
   const behind=4.25,high=2.45;camera.position.set(player.position.x-Math.sin(yaw)*behind,high,player.position.z+Math.cos(yaw)*behind);
   camera.lookAt(player.position.x,1.15,player.position.z);
   renderer.render(scene,camera);requestAnimationFrame(clock);
  };
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};resize();addEventListener("resize",resize);
  const id=requestAnimationFrame(clock);
  return()=>{cancelAnimationFrame(id);removeEventListener("resize",resize);renderer.dispose();host.replaceChildren();gatherApi.current=()=>{}};
 },[input,onCounts,onTarget,gatherApi]);
 return <div ref={mount} className="wz-world-canvas" aria-label="WORLD ZERO 3D world"/>;
}

function Joystick({input}:{input:RefObject<InputState>}){
 const active=useRef<number|null>(null),knob=useRef<HTMLSpanElement>(null);
 const update=useCallback((e:ReactPointerEvent<HTMLDivElement>)=>{const r=e.currentTarget.getBoundingClientRect();let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,rad=r.width*.32,l=Math.hypot(x,y);if(l>rad){x=x/l*rad;y=y/l*rad}input.current.joystick={x:x/rad,y:y/rad};if(knob.current)knob.current.style.transform=`translate3d(${x}px,${y}px,0)`;},[input]);
 const stop=(e:ReactPointerEvent<HTMLDivElement>)=>{if(active.current!==e.pointerId)return;active.current=null;input.current.joystick={x:0,y:0};if(knob.current)knob.current.style.transform="translate3d(0,0,0)"};
 return <div className="wz-joystick" onPointerDown={e=>{active.current=e.pointerId;safelyCapturePointer(e.currentTarget,e.pointerId);update(e)}} onPointerMove={e=>active.current===e.pointerId&&update(e)} onPointerUp={stop} onPointerCancel={stop}><span className="wz-joystick-ring"/><span ref={knob} className="wz-joystick-knob"/></div>
}
function Cam({d,input,children}:{d:number;input:RefObject<InputState>;children:ReactNode}){return <button className="wz-camera-button" onPointerDown={e=>{safelyCapturePointer(e.currentTarget,e.pointerId);input.current.camera=d}} onPointerUp={()=>input.current.camera=0} onPointerCancel={()=>input.current.camera=0}>{children}</button>}

export function WorldZeroGame(){
 const input=useRef<InputState>({joystick:{x:0,y:0},camera:0}),gatherApi=useRef<()=>void>(()=>{});
 const [counts,setCounts]=useState({branches:0,sticks:0,stones:0,leaves:0});const [target,setTarget]=useState<Kind|null>(null);const [flash,setFlash]=useState("");
 const labels:Record<Kind,string>={branch:"ULOMIT VĚTEV",stick:"SEBRAT KLACEK",stone:"SEBRAT KÁMEN",leaf:"SEBRAT LISTÍ"};
 return <main className="wz-game"><World3D input={input} onCounts={setCounts} onTarget={setTarget} gatherApi={gatherApi}/>
  <div className="wz-hud"><header className="wz-statusbar"><div><h1>WORLD ZERO</h1><p>Divočina · REAL 3D</p></div><div className="wz-day"><strong>Den 1</strong><span>Větve: {counts.branches}</span><span>Klacky: {counts.sticks}</span><span>Listí: {counts.leaves}</span><span>Kameny: {counts.stones}</span><span><i className="is-ready"/>WebGL 3D</span></div></header>
  {target&&<button className="wz-gather" onPointerDown={e=>{e.preventDefault();e.stopPropagation();gatherApi.current();setFlash("SEBRÁNO");setTimeout(()=>setFlash(""),260)}}>{labels[target]}</button>}{flash&&<div className="wz-action-flash">{flash}</div>}
  <div className="wz-controls"><Joystick input={input}/><div className="wz-camera-controls"><Cam d={-1} input={input}>‹</Cam><Cam d={1} input={input}>›</Cam></div></div></div>
 </main>;
}
