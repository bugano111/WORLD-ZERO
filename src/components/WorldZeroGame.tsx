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
  const makeTexture=(base:string,spots:string,scale=1)=>{
    const cv=document.createElement("canvas");cv.width=cv.height=256;const x=cv.getContext("2d")!;
    x.fillStyle=base;x.fillRect(0,0,256,256);
    for(let i=0;i<1500;i++){const px=(i*73)%256,py=(i*151)%256,r=1+((i*19)%5)*scale;x.globalAlpha=.05+((i%7)/80);x.fillStyle=spots;x.fillRect(px,py,r,r);}
    x.globalAlpha=1;const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;
  };
  const grassTex=makeTexture("#526f3d","#283d25",1.3);grassTex.repeat.set(34,34);
  const barkTex=makeTexture("#65442d","#261a14",.8);barkTex.repeat.set(2,8);
  const rockTex=makeTexture("#777a72","#3f443f",1.1);rockTex.repeat.set(3,3);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x8fc5df);scene.fog=new THREE.FogExp2(0xb9cabb,.013);
  const camera=new THREE.PerspectiveCamera(58,1,.1,180);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setPixelRatio(Math.min(devicePixelRatio,2.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
  host.appendChild(renderer.domElement);

  const hemi=new THREE.HemisphereLight(0xcbe3f0,0x3e4b32,1.25);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffe4bd,2.55);sun.position.set(-22,32,18);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;scene.add(sun);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(150,24,16),new THREE.MeshBasicMaterial({color:0x91c8e3,side:THREE.BackSide,fog:false});scene.add(sky);
  const cloudMat=new THREE.MeshStandardMaterial({color:0xf2f4ef,roughness:1,transparent:true,opacity:.72,depthWrite:false});
  for(let i=0;i<9;i++){const cg=new THREE.Group();for(let j=0;j<5;j++){const cm=new THREE.Mesh(new THREE.SphereGeometry(3+(j%3)*1.1,12,8),cloudMat);cm.position.set(j*3.2-6,(j%2)*1.1,(j%3)*1.5);cm.scale.y=.55;cg.add(cm);}cg.position.set(-55+i*15,26+(i%3)*4,-55-(i%4)*9);scene.add(cg);}
  const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(2.2,18,12),new THREE.MeshBasicMaterial({color:0xffe6a8,fog:false});sunDisc.position.set(-45,48,-70);scene.add(sunDisc);
  const terrainY=(x:number,z:number)=>{
    const rolling=.55*Math.sin(x*.085)+.38*Math.cos(z*.095)+.22*Math.sin((x+z)*.16);
    const hill1=2.5*Math.exp(-((x+18)*(x+18)+(z+22)*(z+22))/180);
    const hill2=1.8*Math.exp(-((x-20)*(x-20)+(z+8)*(z+8))/130);
    const valley=-.75*Math.exp(-((x-2)*(x-2)+(z-5)*(z-5))/95);
    return rolling+hill1+hill2+valley;
  };
  const groundMat=new THREE.MeshStandardMaterial({map:grassTex,color:0x87926e,roughness:.98,metalness:0});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(420,420,120,120),groundMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
  const pos=ground.geometry.attributes.position as THREE.BufferAttribute;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);
    pos.setZ(i,terrainY(x,y);
  }
  ground.geometry.computeVertexNormals();scene.add(ground);

  const horizonMat=new THREE.MeshBasicMaterial({color:0xb8c9b4,transparent:true,opacity:.48,side:THREE.DoubleSide,fog:true});
  const horizon=new THREE.Mesh(new THREE.CylinderGeometry(92,92,11,48,1,true),horizonMat);horizon.position.y=4.2;scene.add(horizon);
  const waterMat=new THREE.MeshPhysicalMaterial({color:0x4f91a7,roughness:.18,metalness:0,transparent:true,opacity:.78,transmission:.12});
  const stream=new THREE.Mesh(new THREE.PlaneGeometry(10,75,8,32),waterMat);stream.rotation.x=-Math.PI/2;stream.rotation.z=.08;stream.position.set(20,-.32,-8);stream.receiveShadow=true;scene.add(stream);
  const soilMat=new THREE.MeshStandardMaterial({color:0x6d5840,roughness:1});
  for(let i=0;i<18;i++){const x=((i*41)%67)-33,z=((i*59)%71)-35;const patch=new THREE.Mesh(new THREE.CircleGeometry(1.2+(i%4)*.45,18),soilMat);patch.rotation.x=-Math.PI/2;patch.position.set(x,terrainY(x,z)+.012,z);patch.scale.set(1.7,.7,1);scene.add(patch);}
  const shoreMat=new THREE.MeshStandardMaterial({color:0x8a8065,roughness:1});
  for(let i=0;i<36;i++){const z=-40+i*2.1,x=15.2+Math.sin(i*.8)*1.1;const s=.18+(i%5)*.07;const q=new THREE.Mesh(new THREE.DodecahedronGeometry(s,1),shoreMat);q.position.set(x,terrainY(x,z)+s*.25,z);q.scale.y=.55;q.castShadow=true;scene.add(q);}
  const mountainMat=new THREE.MeshStandardMaterial({color:0x596c5d,roughness:1});
  for(const [x,z,s] of [[-38,-48,15],[0,-58,19],[37,-49,17],[-58,-34,12],[57,-35,13],[-24,28,7],[31,25,8]] as number[][]){
    const geo=new THREE.IcosahedronGeometry(s,2);const a=geo.attributes.position as THREE.BufferAttribute;
    for(let i=0;i<a.count;i++){const vx=a.getX(i),vy=a.getY(i),vz=a.getZ(i);const n=1+.08*Math.sin(vx*.31+vz*.23)+.05*Math.cos(vy*.42);a.setXYZ(i,vx*n,vy*n*.68,vz*n);}
    geo.computeVertexNormals();const m=new THREE.Mesh(geo,mountainMat);m.position.set(x,s*.28,z);m.rotation.y=x*.07;m.receiveShadow=true;scene.add(m);
  }
  const player=new THREE.Group();
  const skin=new THREE.MeshStandardMaterial({color:0xc58d68,roughness:.72}),shirt=new THREE.MeshStandardMaterial({color:0x596b58,roughness:.92}),dark=new THREE.MeshStandardMaterial({color:0x2e342f,roughness:.94}),boot=new THREE.MeshStandardMaterial({color:0x30261f,roughness:1}),hairM=new THREE.MeshStandardMaterial({color:0x35271f,roughness:1});
  const pelvis=new THREE.Mesh(new THREE.CapsuleGeometry(.24,.28,6,12),dark);pelvis.position.y=.91;pelvis.castShadow=true;player.add(pelvis);
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.31,.55,7,14),shirt);torso.position.y=1.28;torso.scale.set(1.08,1,.72);torso.castShadow=true;player.add(torso);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.095,.105,.16,12),skin);neck.position.y=1.68;player.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.235,24,18),skin);head.position.y=1.86;head.scale.set(.88,1.08,.92);head.castShadow=true;player.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.238,22,12,0,Math.PI*2,0,Math.PI*.48),hairM);hair.position.y=1.91;hair.scale.set(.9,1.05,.94);player.add(hair);
  const nose=new THREE.Mesh(new THREE.ConeGeometry(.035,.10,8),skin);nose.position.set(0,1.86,-.225);nose.rotation.x=-Math.PI/2;player.add(nose);
  const eyeM=new THREE.MeshStandardMaterial({color:0x25221e,roughness:.7});
  for(const ex of [-.075,.075]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),eyeM);eye.position.set(ex,1.895,-.218);player.add(eye);}
  for(const ex of [-.255,.255]){const ear=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),skin);ear.position.set(ex,1.86,0);ear.scale.y=1.25;player.add(ear);}

  for(const sx of [-1,1]){
    const upper=new THREE.Mesh(new THREE.CapsuleGeometry(.065,.34,5,9),shirt);upper.position.set(sx*.36,1.38,0);upper.rotation.z=sx*.12;upper.castShadow=true;player.add(upper);
    const fore=new THREE.Mesh(new THREE.CapsuleGeometry(.055,.31,5,9),skin);fore.position.set(sx*.39,1.05,0);fore.castShadow=true;player.add(fore);
    const thigh=new THREE.Mesh(new THREE.CapsuleGeometry(.095,.40,5,10),dark);thigh.position.set(sx*.145,.66,0);thigh.castShadow=true;player.add(thigh);
    const shin=new THREE.Mesh(new THREE.CapsuleGeometry(.078,.38,5,10),skin);shin.position.set(sx*.145,.28,0);shin.castShadow=true;player.add(shin);
    const foot=new THREE.Mesh(new THREE.BoxGeometry(.18,.12,.34),boot);foot.position.set(sx*.145,.08,-.07);foot.castShadow=true;player.add(foot);
  }
  scene.add(player);

  const obstacles:{p:THREE.Vector3;r:number}[]=[];const interactives:THREE.Object3D[]=[];
  const bark=new THREE.MeshStandardMaterial({map:barkTex,color:0xa88467,roughness:1}),leafMats=[0x315c35,0x3f7440,0x28512f].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.94});
  const treePts=[[-8,-9],[-3,-12],[5,-10],[10,-6],[-11,0],[11,2],[-8,8],[7,9],[1,13],[-14,-14],[14,-14]] as number[][];
  treePts.forEach(([x,z],i)=>{
   const g=new THREE.Group();g.position.set(x,terrainY(x,z),z);g.userData.tree=true;g.userData.branches=0;
   const h=5.4+(i%4)*.55;
   const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.38+(i%3)*.04,.68+(i%2)*.08,h,14),bark);trunk.position.y=h/2;trunk.castShadow=true;trunk.receiveShadow=true;g.add(trunk);
   g.rotation.y=(i*.71)%6.28;
   const branchGeo=new THREE.CylinderGeometry(.13,.22,2.5,8);
   for(const [rx,rz,ry,rzrot] of [[-.65,0,h*.68,-1.0],[.65,.25,h*.73,1.0],[-.28,-.2,h*.82,-.65],[.25,-.25,h*.88,.62]] as number[][]){
    const b=new THREE.Mesh(branchGeo,bark);b.position.set(rx,ry,rz);b.rotation.z=rzrot;b.rotation.x=rz*.35;b.castShadow=true;g.add(b);
    const twig=new THREE.Mesh(new THREE.CylinderGeometry(.045,.09,1.45,7),bark);twig.position.set(rx*1.75,ry+.55,rz*1.8);twig.rotation.z=rzrot*.8;twig.castShadow=true;g.add(twig);
   }
   const crownY=h+.15;
   const clusters=18;
   for(let j=0;j<clusters;j++){
    const ang=j*2.399+i*.43,rad=.45+(j%5)*.38,rr=.62+(j%4)*.13;
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(rr,2),leafMats[(i+j)%leafMats.length]);
    crown.position.set(Math.cos(ang)*rad,crownY+(j%6)*.28-.35,Math.sin(ang)*rad*.82);
    crown.scale.set(1.05+(j%3)*.08,.72+(j%4)*.06,.92+(j%2)*.08);
    crown.rotation.set(j*.07,ang,j*.04);crown.castShadow=true;crown.receiveShadow=true;g.add(crown);
   }
   g.userData.kind="branch";interactives.push(g);obstacles.push({p:new THREE.Vector3(x,0,z),r:.95});scene.add(g);
  });

  const saplingMat=new THREE.MeshStandardMaterial({color:0x35633a,roughness:1});
  for(let i=0;i<120;i++){
    const a=i*2.399,r=13+(i%24)*2.0,x=Math.cos(a)*r,z=Math.sin(a)*r-7;
    const sg=new THREE.Group();
    const sh=2.5+(i%9)*.48;const st=new THREE.Mesh(new THREE.CylinderGeometry(.07+sh*.018,.13+sh*.025,sh,9),bark);st.position.y=sh/2;st.castShadow=true;sg.add(st);
    for(let k=0;k<5;k++){const cr=new THREE.Mesh(new THREE.IcosahedronGeometry(.55+(i%4)*.09,2),saplingMat);cr.position.set(Math.cos(k*1.25)*.42,sh-.15+k*.18,Math.sin(k*1.25)*.35);cr.scale.set(1,.72,1);cr.castShadow=true;sg.add(cr);}
    sg.position.set(x,terrainY(x,z),z);scene.add(sg);
  }

  const makePickup=(kind:Kind,x:number,z:number)=>{
   let mesh:THREE.Mesh;
   if(kind==="stone"){mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(.20,1),new THREE.MeshStandardMaterial({color:0x777b72,roughness:1});mesh.position.y=.18;}
   else {mesh=new THREE.Mesh(new THREE.CylinderGeometry(.045,.065,.8,7),new THREE.MeshStandardMaterial({color:kind==="leaf"?0x477b3d:0x65442c,roughness:1});mesh.rotation.z=Math.PI/2;mesh.position.y=.10;}
   mesh.position.x=x;mesh.position.z=z;mesh.position.y+=terrainY(x,z);mesh.castShadow=true;mesh.userData.kind=kind;interactives.push(mesh);scene.add(mesh);
  };
  [[-2.2,4.2],[2.8,5.4],[-6.2,7.1],[7.4,3.5],[1.2,-2.1]].forEach(p=>makePickup("stick",p[0],p[1]);
  [[-1.3,3.6],[3.8,4.4],[-4.7,6.3],[6.1,7.7]].forEach(p=>makePickup("stone",p[0],p[1]);
  [[-.4,2.4],[4.2,2.0],[-3.5,5.2]].forEach(p=>makePickup("leaf",p[0],p[1]);

  const rockMat=new THREE.MeshStandardMaterial({map:rockTex,color:0x9a9a91,roughness:.96});
  [[-5,-3,.65],[6,-5,.9],[-9,5,.7],[4,7,.8],[10,10,1.0]].forEach(([x,z,s])=>{
    const r=new THREE.Mesh(new THREE.DodecahedronGeometry(s,1),rockMat);r.position.set(x,terrainY(x,z)+s*.45,z);r.scale.y=.72;r.rotation.set(.18,x*.13,.08);r.castShadow=true;r.receiveShadow=true;scene.add(r);obstacles.push({p:new THREE.Vector3(x,0,z),r:s*.75});
  });
  const cliffMat=new THREE.MeshStandardMaterial({map:rockTex,color:0x8a8b82,roughness:.98});
  const cliffPositions=[[-18,0,-22,3.8],[-14,1,-24,3.1],[-10,.3,-25,2.6],[17,0,-17,3.4],[20,.2,-19,2.8],[-7,0,18,1.7],[-5,0,19,1.35],[-3,0,20,1.05]] as number[][];
  cliffPositions.forEach(([x,y,z,s],i)=>{const cr=new THREE.Mesh(new THREE.DodecahedronGeometry(s,1),cliffMat);cr.position.set(x,y+s*.48,z);cr.scale.set(1.25,.85,.9);cr.rotation.set(i*.13,i*.51,i*.07);cr.castShadow=true;cr.receiveShadow=true;scene.add(cr);});
  const logMat=new THREE.MeshStandardMaterial({color:0x513523,roughness:1});
  [[-6,6,.3],[8,7,-.22]].forEach(([x,z,rot])=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(.24,.3,3.2,10),logMat);l.position.set(x,terrainY(x,z)+.28,z);l.rotation.z=Math.PI/2;l.rotation.y=rot;l.castShadow=true;scene.add(l);});

  const litterMat=new THREE.MeshStandardMaterial({color:0x65523a,roughness:1,side:THREE.DoubleSide});
  const pebbleMat=new THREE.MeshStandardMaterial({color:0x74766e,roughness:1});
  for(let i=0;i<130;i++){
    const x=((i*73)%127)/127*54-27,z=((i*41)%113)/113*54-27;
    if(i%3===0){const q=new THREE.Mesh(new THREE.DodecahedronGeometry(.055+(i%5)*.012,0),pebbleMat);q.position.set(x,.055,z);q.scale.y=.55;scene.add(q);}
    else {const q=new THREE.Mesh(new THREE.PlaneGeometry(.16+(i%4)*.025,.07),litterMat);q.rotation.x=-Math.PI/2;q.rotation.z=i*.83;q.position.set(x,.018,z);scene.add(q);}
  }
  // Real 3D grass tufts
  const grassMat=new THREE.MeshStandardMaterial({color:0x466f3b,roughness:1,side:THREE.DoubleSide});
  for(let i=0;i<1150;i++){const x=((i*37)%101)/101*110-55,z=((i*61)%97)/97*110-55;const blade=new THREE.Mesh(new THREE.ConeGeometry(.025,.24+(i%7)*.035,3),grassMat);blade.position.set(x,.17,z);scene.add(blade);}

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
  const shrubMat=new THREE.MeshStandardMaterial({color:0x365d35,roughness:1});
  for(let i=0;i<85;i++){const x=((i*83)%131)/131*110-55,z=((i*57)%127)/127*110-55;const s=.25+(i%6)*.07;const b=new THREE.Mesh(new THREE.IcosahedronGeometry(s,1),shrubMat);b.position.set(x,terrainY(x,z)+s*.65,z);b.scale.set(1.35,.75,1);b.castShadow=true;scene.add(b);}
  const flowerMats=[0xd9d0a8,0xc9b5d4,0xe0c68d].map(v=>new THREE.MeshStandardMaterial({color:v,roughness:.9}));
  for(let i=0;i<75;i++){const x=((i*97)%137)/137*70-35,z=((i*71)%139)/139*70-35;const stem=new THREE.Mesh(new THREE.CylinderGeometry(.008,.012,.25,5),new THREE.MeshStandardMaterial({color:0x4d713e}));stem.position.set(x,terrainY(x,z)+.12,z);scene.add(stem);const fl=new THREE.Mesh(new THREE.SphereGeometry(.045,6,5),flowerMats[i%3]);fl.position.set(x,terrainY(x,z)+.27,z);scene.add(fl);}
  const plantMat=new THREE.MeshStandardMaterial({color:0x73924b,roughness:1,side:THREE.DoubleSide});
  for(let i=0;i<70;i++){const x=((i*47)%103)/103*100-50,z=((i*29)%89)/89*100-50;const p=new THREE.Mesh(new THREE.ConeGeometry(.08,.48,4),plantMat);p.position.set(x,.24,z);p.rotation.z=(i%3-1)*.12;scene.add(p);}
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
   const j=input.current.joystick,len=Math.min(1,Math.hypot(j.x,j.y);
   if(len>.02){const fx=Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=Math.sin(yaw);const dx=(rx*j.x+fx*(-j.y))*3.0*dt,dz=(rz*j.x+fz*(-j.y))*3.0*dt;
    const nx=player.position.x+dx,nz=player.position.z+dz;
    const blocked=(x:number,z:number)=>obstacles.some(o=>Math.hypot(x-o.p.x,z-o.p.z)<o.r+.32);
    if(!blocked(nx,nz)){player.position.x=nx;player.position.z=nz}else{if(!blocked(nx,player.position.z))player.position.x=nx;if(!blocked(player.position.x,nz))player.position.z=nz;}
   }
   player.position.y=terrainY(player.position.x,player.position.z);
   player.rotation.y=yaw;
   const walk=len>.04?Math.sin(now*.011)*.10:0;player.position.y+=Math.abs(walk)*.035;
   if(player.children[7])player.children[7].rotation.x=walk;if(player.children[9])player.children[9].rotation.x=-walk;
   chooseTarget();
   animals.forEach((a,i)=>{const ph=now*.00018+a.userData.phase;a.position.x+=Math.sin(ph+i)*dt*.18;a.position.z+=Math.cos(ph*.83+i)*dt*.15;a.rotation.y=Math.atan2(Math.sin(ph+i),Math.cos(ph*.83+i);});
   const behind=4.25,high=2.45;const camX=player.position.x-Math.sin(yaw)*behind,camZ=player.position.z+Math.cos(yaw)*behind;
   const camGround=terrainY(camX,camZ);
   camera.position.set(camX,Math.max(player.position.y+high,camGround+1.45),camZ);
   camera.lookAt(player.position.x,player.position.y+1.15,player.position.z);
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
