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
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x8fc5df);scene.fog=new THREE.FogExp2(0xb8c8bd,.0038);
  const camera=new THREE.PerspectiveCamera(62,1,.1,180);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.physicallyCorrectLights=true;renderer.setPixelRatio(Math.min(devicePixelRatio,2.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
  host.appendChild(renderer.domElement);

  const hemi=new THREE.HemisphereLight(0xcbe3f0,0x3e4b32,1.25);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffe4bd,2.55);sun.position.set(-22,32,18);sun.castShadow=true;
  sun.shadow.mapSize.set(4096,4096);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;scene.add(sun);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(150,24,16),new THREE.MeshBasicMaterial({color:0x91c8e3,side:THREE.BackSide,fog:false});scene.add(sky);
  const cloudMat=new THREE.MeshStandardMaterial({color:0xf2f4ef,roughness:1,transparent:true,opacity:.72,depthWrite:false});
  for(let i=0;i<9;i++){const cg=new THREE.Group();for(let j=0;j<5;j++){const cm=new THREE.Mesh(new THREE.SphereGeometry(3+(j%3)*1.1,12,8),cloudMat);cm.position.set(j*3.2-6,(j%2)*1.1,(j%3)*1.5);cm.scale.y=.55;cg.add(cm);}cg.position.set(-55+i*15,26+(i%3)*4,-55-(i%4)*9);scene.add(cg);}
  const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(4.5,24,18),new THREE.MeshBasicMaterial({color:0xffe6a8,fog:false});sunDisc.position.set(-180,210,-420);scene.add(sunDisc);
  const PLANET_RADIUS=6371;
  const terrainY=(x:number,z:number)=>{
    const d2=x*x+z*z;
    const curvature=-d2/(2*PLANET_RADIUS);
    const continental=2.4*Math.sin(x*.014)*Math.cos(z*.012)+1.25*Math.sin((x+z)*.027);
    const rolling=.62*Math.sin(x*.085)+.43*Math.cos(z*.095)+.24*Math.sin((x+z)*.16);
    const hill1=3.2*Math.exp(-((x+18)*(x+18)+(z+22)*(z+22))/180);
    const hill2=2.4*Math.exp(-((x-20)*(x-20)+(z+8)*(z+8))/130);
    const valley=-1.1*Math.exp(-((x-2)*(x-2)+(z-5)*(z-5))/95);
    return curvature+continental+rolling+hill1+hill2+valley;
  };
  const groundMat=new THREE.MeshStandardMaterial({map:grassTex,color:0x687052,roughness:.98,metalness:0});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(1800,1800,220,220),groundMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
  const pos=ground.geometry.attributes.position as THREE.BufferAttribute;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);
    pos.setZ(i,terrainY(x,y);
  }
  ground.geometry.computeVertexNormals();scene.add(ground);
  // WORLD SHELL: distant terrain continues beyond the playable patch instead of ending after a few metres.
  const farMat=new THREE.MeshStandardMaterial({map:grassTex,color:0x646b50,roughness:1});
  for(let ring=0;ring<4;ring++){
    const size=1800+ring*1300;
    const far=new THREE.Mesh(new THREE.RingGeometry(size*.32,size*.72,128,12),farMat);
    far.rotation.x=-Math.PI/2;far.position.y=-size*size/(8*6371000)-5-ring*2;far.receiveShadow=true;scene.add(far);
  }


  const oceanMat=new THREE.MeshPhysicalMaterial({color:0x376f87,roughness:.28,metalness:0,transparent:true,opacity:.72});
  const ocean=new THREE.Mesh(new THREE.CircleGeometry(620,96),oceanMat);ocean.rotation.x=-Math.PI/2;ocean.position.y=-8.4;scene.add(ocean);
  // VOLUMETRIC MIST: layered transparent haze between forest depth planes.
  const mistMat=new THREE.MeshBasicMaterial({color:0xdce5d8,transparent:true,opacity:.035,depthWrite:false,side:THREE.DoubleSide});
  for(let i=0;i<18;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(55,16),mistMat);m.position.set(((i*17)%47)-23,6, -18-i*9);m.rotation.y=(i%5)*.17;scene.add(m);}
  const atmosphereMat=new THREE.MeshBasicMaterial({color:0xbfd8df,transparent:true,opacity:.11,side:THREE.BackSide,depthWrite:false});
  const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(720,48,28),atmosphereMat);atmosphere.position.y=-PLANET_RADIUS+2;scene.add(atmosphere);
  const mountainMat=new THREE.MeshStandardMaterial({color:0x596c5d,roughness:1});
  for(const [x,z,s] of [[-38,-48,15],[0,-58,19],[37,-49,17],[-58,-34,12],[57,-35,13],[-24,28,7],[31,25,8],[-105,-92,24],[88,-118,31],[130,-55,26],[-138,-48,29],[72,112,22],[-82,126,25]] as number[][]){
    const geo=new THREE.PlaneGeometry(.46,.22);const a=geo.attributes.position as THREE.BufferAttribute;
    for(let i=0;i<a.count;i++){const vx=a.getX(i),vy=a.getY(i),vz=a.getZ(i);const n=1+.08*Math.sin(vx*.31+vz*.23)+.05*Math.cos(vy*.42);a.setXYZ(i,vx*n,vy*n*.68,vz*n);}
    geo.computeVertexNormals();const m=new THREE.Mesh(geo,mountainMat);m.position.set(x,s*.28,z);m.rotation.y=x*.07;m.receiveShadow=true;scene.add(m);
  }
  const player=new THREE.Group();
  const skin=new THREE.MeshPhysicalMaterial({color:0xb77b58,roughness:.68,clearcoat:.05});
  const cloth=new THREE.MeshStandardMaterial({color:0x55584f,roughness:.92});
  const pants=new THREE.MeshStandardMaterial({color:0x2f3130,roughness:.96});
  const boots=new THREE.MeshStandardMaterial({color:0x2a211c,roughness:1});
  const hairM=new THREE.MeshStandardMaterial({color:0x2d211b,roughness:1});
  const add=(geo:THREE.BufferGeometry,mat:THREE.Material,p:[number,number,number],s:[number,number,number]=[1,1,1])=>{const m=new THREE.Mesh(geo,mat);m.position.set(...p);m.scale.set(...s);m.castShadow=true;m.receiveShadow=true;player.add(m);return m};
  add(new THREE.CapsuleGeometry(.24,.28,8,16),pants,[0,.91,0],[1,.88,.78]);
  add(new THREE.CapsuleGeometry(.30,.58,10,18),cloth,[0,1.31,0],[1.12,1,.72]);
  add(new THREE.CylinderGeometry(.085,.105,.15,16),skin,[0,1.68,0]);
  add(new THREE.SphereGeometry(.225,28,22),skin,[0,1.87,0],[.88,1.08,.94]);
  const jaw=add(new THREE.SphereGeometry(.18,20,16),skin,[0,1.78,-.015],[.92,.75,.9]);
  add(new THREE.SphereGeometry(.232,26,14,0,Math.PI*2,0,Math.PI*.48),hairM,[0,1.93,0],[.91,1.04,.95]);
  const eyeWhite=new THREE.MeshStandardMaterial({color:0xe8e2d6,roughness:.5}),iris=new THREE.MeshStandardMaterial({color:0x3d493c,roughness:.45});
  for(const x of [-.071,.071]){add(new THREE.SphereGeometry(.025,10,8),eyeWhite,[x,1.895,-.211],[1,.62,.38]);add(new THREE.SphereGeometry(.010,8,6),iris,[x,1.895,-.229]);}
  add(new THREE.ConeGeometry(.034,.095,10),skin,[0,1.855,-.237]).rotation.x=-Math.PI/2;
  for(const x of [-.238,.238])add(new THREE.SphereGeometry(.041,10,8),skin,[x,1.87,0],[.55,1.2,.65]);
  const browM=new THREE.MeshStandardMaterial({color:0x392b22,roughness:1});
  for(const x of [-.072,.072]){const br=add(new THREE.BoxGeometry(.075,.012,.012),browM,[x,1.935,-.211]);br.rotation.z=x<0?.08:-.08;}
  const mouth=add(new THREE.BoxGeometry(.075,.012,.01),new THREE.MeshStandardMaterial({color:0x754b43,roughness:.8}),[0,1.79,-.218]);

  for(const sx of [-1,1]){
    const shoulder=add(new THREE.SphereGeometry(.105,12,10),cloth,[sx*.34,1.48,0],[1,.9,.8]);
    const upper=add(new THREE.CapsuleGeometry(.062,.31,6,11),cloth,[sx*.38,1.27,0]);upper.rotation.z=sx*.08;
    const elbow=add(new THREE.SphereGeometry(.066,10,8),skin,[sx*.395,1.08,0]);
    const fore=add(new THREE.CapsuleGeometry(.052,.27,6,10),skin,[sx*.405,.91,0]);
    add(new THREE.SphereGeometry(.068,10,8),skin,[sx*.41,.72,-.005],[.72,1.12,.82]);
    for(let fi=0;fi<4;fi++){const finger=add(new THREE.CapsuleGeometry(.009,.055,3,6),skin,[sx*(.385+fi*.012),.665,-.012]);finger.rotation.z=sx*.05;}
    const thigh=add(new THREE.CapsuleGeometry(.09,.39,7,12),pants,[sx*.135,.65,0]);
    const knee=add(new THREE.SphereGeometry(.086,10,9),skin,[sx*.135,.405,0],[.9,1,.88]);
    const shin=add(new THREE.CapsuleGeometry(.068,.34,7,11),skin,[sx*.135,.22,0]);
    add(new THREE.BoxGeometry(.17,.115,.34),boots,[sx*.135,.065,-.085]);
  }
  scene.add(player);player.visible=true;

  const obstacles:{p:THREE.Vector3;r:number}[]=[];const interactives:THREE.Object3D[]=[];
  const bark=new THREE.MeshStandardMaterial({map:barkTex,color:0x5f4b3b,roughness:1});
  const leafMats=[0x315b31,0x3d6a36,0x456f39,0x294b2c].map(v=>new THREE.MeshStandardMaterial({color:v,roughness:.9,side:THREE.DoubleSide}));
  const cyl=(a:THREE.Vector3,b:THREE.Vector3,r0:number,r1:number)=>{
    const d=new THREE.Vector3().subVectors(b,a),len=d.length(),m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r0,len,10),bark);
    m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());m.castShadow=true;m.receiveShadow=true;return m;
  };
  // HERO TREE — immediate visual proof of the new world build.
  const hero=new THREE.Group();hero.position.set(-6,terrainY(-6,-8),-8);
  const ht=new THREE.Mesh(new THREE.CylinderGeometry(.55,.92,11,14),bark);ht.position.y=5.5;ht.castShadow=true;hero.add(ht);
  const heroLeaf=new THREE.MeshStandardMaterial({color:0x315735,roughness:.92,side:THREE.DoubleSide});
  for(let b=0;b<18;b++){const a=b*2.399,y=5.2+(b%7)*.75,len=3.2+(b%4)*.65;
    const br=new THREE.Mesh(new THREE.CylinderGeometry(.08,.22,len,8),bark);br.position.set(Math.cos(a)*1.15,y,Math.sin(a)*1.15);br.rotation.z=Math.cos(a)*1.08;br.rotation.x=Math.sin(a)*.82;hero.add(br);
    for(let q=0;q<15;q++){const lf=new THREE.Mesh(new THREE.PlaneGeometry(.34,.15),heroLeaf);const rr=1.8+(q%5)*.42;lf.position.set(Math.cos(a+q*.52)*rr,y+(q%4)*.35,Math.sin(a+q*.52)*rr);lf.rotation.set(q*.23,a+q*.52,q*.11);hero.add(lf);}
  }scene.add(hero);
  const makeTree=(x:number,z:number,seed:number)=>{
    const g=new THREE.Group(),h=8.5+(seed%4)*.9,tips:THREE.Vector3[]=[];
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.27,.67,h*.58,16),bark);trunk.position.y=h*.29;trunk.castShadow=true;g.add(trunk);
    for(let r=0;r<7;r++){const a=r*Math.PI*2/7;g.add(cyl(new THREE.Vector3(Math.cos(a)*.12,.2,Math.sin(a)*.12),new THREE.Vector3(Math.cos(a)*1.05,.03,Math.sin(a)*1.05),.15,.035));}
    const grow=(from:THREE.Vector3,dir:THREE.Vector3,len:number,rad:number,depth:number,s:number)=>{
      const to=from.clone().add(dir.clone().normalize().multiplyScalar(len));g.add(cyl(from,to,rad,rad*.56));
      if(depth===0){tips.push(to);return;}
      const n=depth===3?3:2;for(let q=0;q<n;q++){const a=s*1.37+q*2.22;grow(to,new THREE.Vector3(dir.x*.52+Math.cos(a)*.62,Math.max(.2,dir.y*.7+.22+(q%2)*.14),dir.z*.52+Math.sin(a)*.62),len*(.58+q*.055),rad*.58,depth-1,s+q+1);}
    };
    for(let b=0;b<6;b++){const a=b*Math.PI*2/6+seed*.29;grow(new THREE.Vector3(0,h*.45+(b%3)*.28,0),new THREE.Vector3(Math.cos(a)*.78,.68+(b%2)*.18,Math.sin(a)*.78),h*.22,.18,3,seed+b*2);}
    const leafGeo=new THREE.PlaneGeometry(.17,.075);
    tips.forEach((p,t)=>{for(let q=0;q<8;q++){const a=(t*5+q)*2.399,rr=.10+(q%4)*.09,lf=new THREE.Mesh(leafGeo,leafMats[(t+q)%4]);lf.position.set(p.x+Math.cos(a)*rr,p.y+(q%3)*.07,p.z+Math.sin(a)*rr);lf.rotation.set(a*.24,a,a*.13);lf.castShadow=true;g.add(lf);}});
    g.position.set(x,terrainY(x,z),z);g.userData.tree=true;g.userData.branches=0;g.userData.kind="branch";interactives.push(g);obstacles.push({p:new THREE.Vector3(x,0,z),r:.75});scene.add(g);
  };
  [[-8,-9],[-3,-12],[5,-10],[10,-6],[-11,0],[11,2],[-8,8],[7,9],[1,13],[-14,-14],[14,-14]].forEach((p,i)=>makeTree(p[0],p[1],i));
  const saplingMat=new THREE.MeshStandardMaterial({color:0x35633a,roughness:1,side:THREE.DoubleSide});
  const sapLeaf=new THREE.PlaneGeometry(.20,.085);
  for(let i=0;i<210;i++){
    const a=i*2.399,r=18+(i%70)*2.65,x=Math.cos(a)*r,z=Math.sin(a)*r-7,sg=new THREE.Group(),sh=5.5+(i%10)*.72;
    const st=new THREE.Mesh(new THREE.CylinderGeometry(.07,.19,sh,9),bark);st.position.y=sh/2;st.castShadow=true;sg.add(st);
    for(let b=0;b<9;b++){const ba=b*2.399,by=sh*.48+b*.055;const br=new THREE.Mesh(new THREE.CylinderGeometry(.018,.055,1.25+(b%3)*.28,6),bark);br.position.set(Math.cos(ba)*.42,by,Math.sin(ba)*.42);br.rotation.z=Math.cos(ba)*1.02;br.rotation.x=Math.sin(ba)*.72;sg.add(br);
      for(let q=0;q<5;q++){const lf=new THREE.Mesh(sapLeaf,saplingMat);lf.position.set(Math.cos(ba)*( .65+q*.12),by+(q%2)*.12,Math.sin(ba)*( .65+q*.12));lf.rotation.set(.25*q,ba,.12*q);sg.add(lf);}}
    sg.position.set(x,terrainY(x,z),z);scene.add(sg);
  }

  // SPAWN DETAIL
  for(let i=0;i<22;i++){const a=i*2.399,r=5+(i%6)*2.2,x=Math.cos(a)*r,z=Math.sin(a)*r;
    const rr=new THREE.Mesh(new THREE.DodecahedronGeometry(.25+(i%5)*.12,1),rockMat);rr.scale.set(1.4,.65,1);rr.position.set(x,terrainY(x,z)+.18,z);rr.rotation.set(i*.3,i*.7,0);rr.castShadow=true;scene.add(rr);}
  const makePickup=(kind:Kind,x:number,z:number)=>{
   let mesh:THREE.Mesh;
   if(kind==="stone"){mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(.20,1),new THREE.MeshStandardMaterial({color:0x777b72,roughness:1}));mesh.position.y=.18;}
   else {mesh=new THREE.Mesh(new THREE.CylinderGeometry(.045,.065,.8,7),new THREE.MeshStandardMaterial({color:kind==="leaf"?0x477b3d:0x65442c,roughness:1}));mesh.rotation.z=Math.PI/2;mesh.position.y=.10;}
   mesh.position.x=x;mesh.position.z=z;mesh.position.y+=terrainY(x,z);mesh.castShadow=true;mesh.userData.kind=kind;interactives.push(mesh);scene.add(mesh);
  };
  [[-2.2,4.2],[2.8,5.4],[-6.2,7.1],[7.4,3.5],[1.2,-2.1]].forEach(p=>makePickup("stick",p[0],p[1]));
  [[-1.3,3.6],[3.8,4.4],[-4.7,6.3],[6.1,7.7]].forEach(p=>makePickup("stone",p[0],p[1]));
  [[-.4,2.4],[4.2,2.0],[-3.5,5.2]].forEach(p=>makePickup("leaf",p[0],p[1]));

  const rockMat=new THREE.MeshStandardMaterial({map:rockTex,color:0x9a9a91,roughness:.96});
  [[-5,-3,.65],[6,-5,.9],[-9,5,.7],[4,7,.8],[10,10,1.0]].forEach(([x,z,s])=>{
    const r=new THREE.Mesh(new THREE.DodecahedronGeometry(s,1),rockMat);r.position.set(x,terrainY(x,z)+s*.45,z);r.scale.y=.72;r.rotation.set(.18,x*.13,.08);r.castShadow=true;r.receiveShadow=true;scene.add(r);obstacles.push({p:new THREE.Vector3(x,0,z),r:s*.75});
  });
  const cliffMat=new THREE.MeshStandardMaterial({map:rockTex,color:0x8a8b82,roughness:.98});
  const cliffPositions=[[-18,0,-22,3.8],[-14,1,-24,3.1],[-10,.3,-25,2.6],[17,0,-17,3.4],[20,.2,-19,2.8],[-7,0,18,1.7],[-5,0,19,1.35],[-3,0,20,1.05]] as number[][];
  cliffPositions.forEach(([x,y,z,s],i)=>{const cr=new THREE.Mesh(new THREE.DodecahedronGeometry(s,1),cliffMat);cr.position.set(x,y+s*.48,z);cr.scale.set(1.25,.85,.9);cr.rotation.set(i*.13,i*.51,i*.07);cr.castShadow=true;cr.receiveShadow=true;scene.add(cr);});
  const logMat=new THREE.MeshStandardMaterial({color:0x513523,roughness:1});
  [[-6,6,.3],[8,7,-.22]].forEach(([x,z,rot])=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(.24,.3,3.2,10),logMat);l.position.set(x,terrainY(x,z)+.28,z);l.rotation.z=Math.PI/2;l.rotation.y=rot;l.castShadow=true;scene.add(l);});

  const mossMat=new THREE.MeshStandardMaterial({color:0x43563a,roughness:1});
  const soilMat2=new THREE.MeshStandardMaterial({color:0x514638,roughness:1});
  for(let i=0;i<260;i++){const x=((i*83)%251)/251*170-85,z=((i*47)%239)/239*170-85,r=.35+(i%11)*.13;
    const p=new THREE.Mesh(new THREE.CircleGeometry(r,10),i%3?mossMat:soilMat2);p.rotation.x=-Math.PI/2;p.position.set(x,terrainY(x,z)+.012,z);p.scale.set(1.8,.7,1);p.receiveShadow=true;scene.add(p);}
  // LEAF LITTER CARPET
  const dryLeafMat=new THREE.MeshStandardMaterial({color:0x6a5538,roughness:1,side:THREE.DoubleSide});
  const dryLeafGeo=new THREE.PlaneGeometry(.10,.055),leafCarpet=new THREE.InstancedMesh(dryLeafGeo,dryLeafMat,5000),ld=new THREE.Object3D();
  for(let i=0;i<5000;i++){const x=((i*67)%701)/701*120-60,z=((i*131)%709)/709*120-60;ld.position.set(x,terrainY(x,z)+.018,z);ld.rotation.set(-Math.PI/2,(i*.77)%6.28,0);ld.updateMatrix();leafCarpet.setMatrixAt(i,ld.matrix);}scene.add(leafCarpet);
  const litterMat=new THREE.MeshStandardMaterial({color:0x65523a,roughness:1,side:THREE.DoubleSide});
  const pebbleMat=new THREE.MeshStandardMaterial({color:0x74766e,roughness:1});
  for(let i=0;i<130;i++){
    const x=((i*73)%127)/127*54-27,z=((i*41)%113)/113*54-27;
    if(i%3===0){const q=new THREE.Mesh(new THREE.DodecahedronGeometry(.055+(i%5)*.012,0),pebbleMat);q.position.set(x,.055,z);q.scale.y=.55;scene.add(q);}
    else {const q=new THREE.Mesh(new THREE.PlaneGeometry(.16+(i%4)*.025,.07),litterMat);q.rotation.x=-Math.PI/2;q.rotation.z=i*.83;q.position.set(x,.018,z);scene.add(q);}
  }
  // Instanced grass carpet: 18,000 individual blades, terrain-following and wind-leaned.
  const bladeGeo=new THREE.PlaneGeometry(.018,.32);
  bladeGeo.translate(0,.16,0);
  const grassMat=new THREE.MeshStandardMaterial({color:0x4d713e,roughness:1,side:THREE.DoubleSide});
  const grass=new THREE.InstancedMesh(bladeGeo,grassMat,18000);const dummy=new THREE.Object3D();
  for(let i=0;i<18000;i++){const x=((i*73)%997)/997*210-105,z=((i*151)%991)/991*210-105;dummy.position.set(x,terrainY(x,z),z);dummy.rotation.set(0,(i*.618)%6.283,((i%9)-4)*.018);const s=.65+(i%13)*.045;dummy.scale.set(s,s,s);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);}
  grass.instanceMatrix.needsUpdate=true;grass.frustumCulled=true;scene.add(grass);

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
  const fernMat=new THREE.MeshStandardMaterial({color:0x3f6d38,roughness:1,side:THREE.DoubleSide});
  const fernLeaf=new THREE.PlaneGeometry(.55,.09);
  for(let i=0;i<170;i++){const x=((i*79)%181)/181*130-65,z=((i*53)%173)/173*130-65,fg=new THREE.Group();for(let q=0;q<7;q++){const fr=new THREE.Mesh(fernLeaf,fernMat);const a=q*Math.PI*2/7;fr.position.set(Math.cos(a)*.25,.18,Math.sin(a)*.25);fr.rotation.set(-.55,a,0);fg.add(fr);}fg.position.set(x,terrainY(x,z),z);scene.add(fg);}
  const shrubMat=new THREE.MeshStandardMaterial({color:0x365d35,roughness:1});
  for(let i=0;i<85;i++){const x=((i*83)%131)/131*110-55,z=((i*57)%127)/127*110-55;const s=.25+(i%6)*.07;const b=new THREE.Mesh(new THREE.PlaneGeometry(.46,.22),shrubMat);b.position.set(x,terrainY(x,z)+s*.65,z);b.scale.set(1.35,.75,1);b.castShadow=true;scene.add(b);}
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
   const j=input.current.joystick,len=Math.min(1,Math.hypot(j.x,j.y));
   if(len>.02){const fx=Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=Math.sin(yaw);const dx=(rx*j.x+fx*(-j.y))*2.8*dt,dz=(rz*j.x+fz*(-j.y))*3.0*dt;
    const nx=player.position.x+dx,nz=player.position.z+dz;
    player.position.x=nx;player.position.z=nz;
   }
   player.position.y=terrainY(player.position.x,player.position.z);
   player.rotation.y=yaw;
   const walk=len>.04?Math.sin(now*.011)*.10:0;
   if(player.children[7])player.children[7].rotation.x=walk;if(player.children[9])player.children[9].rotation.x=-walk;
   chooseTarget();
   animals.forEach((a,i)=>{const ph=now*.00018+a.userData.phase;a.position.x+=Math.sin(ph+i)*dt*.18;a.position.z+=Math.cos(ph*.83+i)*dt*.15;a.rotation.y=Math.atan2(Math.sin(ph+i),Math.cos(ph*.83+i));});
   const eye=1.68,bob=len>.04?Math.sin(now*.009)*.012:0;
   const dist=4.6,camX=player.position.x-Math.sin(yaw)*dist,camZ=player.position.z+Math.cos(yaw)*dist;
   camera.position.lerp(new THREE.Vector3(camX,Math.max(terrainY(camX,camZ)+1.45,player.position.y+2.15+bob),camZ),.14);
   camera.lookAt(player.position.x,player.position.y+1.35,player.position.z);
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
 const [hunger,setHunger]=useState(100),[thirst,setThirst]=useState(100),[energy,setEnergy]=useState(100);
 const [knowledge,setKnowledge]=useState<string[]>([]);
 const [fiber,setFiber]=useState(0),[flint,setFlint]=useState(0);
 const [survivalMsg,setSurvivalMsg]=useState("Jsi sám v divočině. První úkol: přežít a poznat okolí.");
 const learn=(k:string,msg:string)=>setKnowledge(v=>v.includes(k)?v:(setSurvivalMsg(msg),[...v,k]));

 const input=useRef<InputState>({joystick:{x:0,y:0},camera:0}),gatherApi=useRef<()=>void>(()=>{});
 const [counts,setCounts]=useState({branches:0,sticks:0,stones:0,leaves:0});const [target,setTarget]=useState<Kind|null>(null);const [flash,setFlash]=useState("");
 useEffect(()=>{const id=setInterval(()=>{setHunger(v=>Math.max(0,v-.35));setThirst(v=>Math.max(0,v-.55));setEnergy(v=>Math.max(0,v-.12));},2500);return()=>clearInterval(id)},[]);
 useEffect(()=>{if(counts.stones>=2&&!knowledge.includes("flint")){setFlint(1);learn("flint","Při zkoumání kamenů jsi objevil ostrou hranu. To je základ řezného nástroje.");}},[counts.stones]);
 useEffect(()=>{if(counts.leaves>=3&&!knowledge.includes("fiber")){setFiber(1);learn("fiber","Z rostlin jsi získal pevná vlákna. Lze jimi svazovat materiály.");}},[counts.leaves]);
 const labels:Record<Kind,string>={branch:"ULOMIT VĚTEV",stick:"SEBRAT KLACEK",stone:"SEBRAT KÁMEN",leaf:"SEBRAT LISTÍ"};
 return <main className="wz-game"><World3D input={input} onCounts={setCounts} onTarget={setTarget} gatherApi={gatherApi}/>
  <div className="wz-hud"><header className="wz-statusbar"><div><h1>WORLD ZERO</h1><p>Divočina · WORLD BUILD 05 · REAL WORLD REBUILD</p></div><div className="wz-day"><strong>Den 1</strong><span>Větve: {counts.branches}</span><span>Klacky: {counts.sticks}</span><span>Listí: {counts.leaves}</span><span>Kameny: {counts.stones}</span><span><i className="is-ready"/>WebGL 3D</span><span>Hlad {Math.round(hunger)}</span><span>Žízeň {Math.round(thirst)}</span><span>Energie {Math.round(energy)}</span></div></header>
  <div style={{position:"absolute",top:96,left:12,right:12,textAlign:"center",pointerEvents:"none",zIndex:5}}><span style={{display:"inline-block",background:"rgba(15,18,14,.72)",color:"#f3efdc",padding:"7px 10px",borderRadius:9,fontSize:12}}>{survivalMsg}</span></div>
  {flint>0&&fiber>0&&counts.branches>0&&!knowledge.includes("tool")&&<button className="wz-gather" style={{bottom:116}} onPointerDown={e=>{e.preventDefault();learn("tool","První technologický objev: svázaný kamenný nástroj. Teď může začít skutečné opracování dřeva.");}}>SPOJIT KÁMEN + VĚTEV + VLÁKNO</button>}
  {target&&<button className="wz-gather" onPointerDown={e=>{e.preventDefault();e.stopPropagation();gatherApi.current();setFlash("SEBRÁNO");setTimeout(()=>setFlash(""),260)}}>{labels[target]}</button>}{flash&&<div className="wz-action-flash">{flash}</div>}
  <div className="wz-controls"><Joystick input={input}/><div className="wz-camera-controls"><Cam d={-1} input={input}>‹</Cam><Cam d={1} input={input}>›</Cam></div></div></div>
 </main>;
}
