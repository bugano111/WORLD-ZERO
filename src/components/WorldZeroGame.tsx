import React,{useEffect,useRef,useState} from "react";
import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader.js";

type Input={x:number;y:number;look:number};
export function WorldZeroGame(){
 const host=useRef<HTMLDivElement>(null),input=useRef<Input>({x:0,y:0,look:0});
 const [status,setStatus]=useState("NAČÍTÁM SKUTEČNÝ SVĚT…"),[sound,setSound]=useState(false),[wood,setWood]=useState(0),[stone,setStone]=useState(0),[flint,setFlint]=useState(0),[fiber,setFiber]=useState(0),[fire,setFire]=useState(false),[near,setNear]=useState<"wood"|"stone"|"flint"|"fiber"|null>(null);
 const gather=useRef<()=>void>(()=>{});
 useEffect(()=>{
  if(!host.current)return;
  const el=host.current,scene=new THREE.Scene();
  scene.background=new THREE.Color(0x91a9ad);scene.fog=new THREE.FogExp2(0x59685e,.0038);
  // REALISM 25: a real 360° forest photograph now forms the entire horizon/canopy.
  const panoLoader=new RGBELoader();
  panoLoader.load("./real-assets/mossy_forest_panorama.hdr",tex=>{
    tex.mapping=THREE.EquirectangularReflectionMapping;
    scene.background=tex;scene.environment=tex;
  });
  const camera=new THREE.PerspectiveCamera(55,1,.08,2200);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.0;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xb9cbc2,0x182018,.42));
  const sun=new THREE.DirectionalLight(0xffddb0,3.0);sun.position.set(-70,115,42);sun.castShadow=true;
  sun.shadow.mapSize.set(4096,4096);sun.shadow.bias=-.00008;sun.shadow.normalBias=.018;sun.shadow.camera.left=-85;sun.shadow.camera.right=85;sun.shadow.camera.top=85;sun.shadow.camera.bottom=-85;scene.add(sun);

  const H=(x:number,z:number)=>{const broad=Math.sin(x*.0045)*6+Math.cos(z*.006)*4+Math.sin((x+z)*.012)*1.15-Math.exp(-((x-40)**2+(z+60)**2)/18000)*13;const d=Math.hypot(x,z);const spawn=1.2+Math.sin(x*.08)*.12+Math.cos(z*.07)*.1;const t=Math.min(1,Math.max(0,(d-32)/45));return THREE.MathUtils.lerp(spawn,broad,t)};
  const geo=new THREE.PlaneGeometry(1800,1800,420,420);geo.rotateX(-Math.PI/2);
  const p=geo.attributes.position as THREE.BufferAttribute;const cols:number[]=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=H(x,z);p.setY(i,y);const rock=y>11,low=y<-5;const c=new THREE.Color(rock?0x696a62:low?0x4e6045:y>5?0x3c5035:0x31472f);const micro=Math.sin(x*.17)*Math.cos(z*.13)*.018+Math.sin((x-z)*.047)*.014;c.offsetHSL(micro*.18,micro*.5,micro);cols.push(c.r,c.g,c.b)}
  geo.setAttribute("color",new THREE.Float32BufferAttribute(cols,3));geo.computeVertexNormals();
  const groundMat=new THREE.MeshStandardMaterial({roughness:.92,metalness:0});
  const tl=new THREE.TextureLoader();
  const prep=(t:THREE.Texture,srgb=false)=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(42,42);t.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t};
  groundMat.map=prep(tl.load("./real-assets/forest_floor_diff_1k.jpg"),true);
  groundMat.normalMap=prep(tl.load("./real-assets/forest_floor_nor_gl_1k.jpg"));groundMat.normalScale.set(1.7,1.7);
  groundMat.roughnessMap=prep(tl.load("./real-assets/forest_floor_rough_1k.jpg"));
  const ground=new THREE.Mesh(geo,groundMat);ground.receiveShadow=true;scene.add(ground);
  // REALISM 36: subtle wet moss floor layer breaks visible texture repetition near the player.
  const mossDetail=new THREE.Mesh(
    new THREE.CircleGeometry(42,64),
    new THREE.MeshStandardMaterial({color:0x263c29,roughness:.76,metalness:0,transparent:true,opacity:.13,depthWrite:false})
  );
  mossDetail.rotation.x=-Math.PI/2;mossDetail.scale.set(1.45,.82,1);mossDetail.position.set(-9,H(-9,8)+.035,8);scene.add(mossDetail);


  // REALISM 33: volumetric-style canopy light shafts, mobile-cheap transparent geometry.
  const shaftMat=new THREE.MeshBasicMaterial({color:0xffe7b5,transparent:true,opacity:.045,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  for(let i=0;i<9;i++){const s=new THREE.Mesh(new THREE.PlaneGeometry(3.5+(i%3)*2,34+(i%4)*7),shaftMat.clone());s.position.set(-24+i*7,18+(i%3)*4,10+(i%5)*10);s.rotation.set(-.32,.38+i*.07,-.18);scene.add(s)}

  const water=new THREE.Mesh(new THREE.PlaneGeometry(1100,520),new THREE.MeshPhysicalMaterial({color:0x6f9ca0,roughness:.12,metalness:0,transparent:true,opacity:.64,clearcoat:1,clearcoatRoughness:.035,ior:1.333,transmission:.32,thickness:1.4}));
  water.rotation.x=-Math.PI/2;water.position.set(260,-12,-470);scene.add(water);

  // REALISM 20: near-field forest is built from a real high-detail tree asset.
  const realTrees:THREE.Object3D[]=[];
  new GLTFLoader().load("./real-assets/models/tree_small_02.gltf",(gltf)=>{
    const src=gltf.scene;
    src.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});
    const spots=[[-4,4,2.5],[5,5,2.35],[-8,8,2.4],[9,9,2.25],[-13,13,2.3],[20,25,1.85],[-25,29,2.1],[27,34,1.95],[-33,39,2.2],[35,44,2.05],[-43,50,2.3],[46,57,2.2],[2,20,1.8],[9,31,1.95],[-10,36,2.05]];
    spots.forEach(([x,z,s],i)=>{const t=src.clone(true);t.position.set(x,H(x,z),z);t.scale.setScalar(s);t.rotation.y=i*1.618;scene.add(t);t.updateMatrixWorld(true);realTrees.push(t)});
    // REALISM 30: deep forest rings — real trees dominate the full playable view, not just six props.
    for(let i=0;i<28;i++){const a=i*2.39996323,r=48+(i%7)*13,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<10&&z>-5&&z<35)continue;const t=src.clone(true);t.position.set(x,H(x,z),z);const s=1.45+(i%6)*.16;t.scale.setScalar(s);t.rotation.y=a*1.71;scene.add(t);realTrees.push(t)}

  setStatus("DEN 1 · ČLOVĚK V DIVOČINĚ");},undefined,e=>{console.error("HERO TREE",e);setStatus("CHYBA NAČTENÍ LESA")});

  // Dense real-model understory around spawn; this is what fills the camera foreground.
  const denseLoader=new GLTFLoader();
  const dense=(url:string,n:number,base:number,spread:number)=>{
    denseLoader.load(url,g=>{
      const src=g.scene;src.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});
      for(let i=0;i<n;i++){const a=i*2.39996323,r=base+((i*37)%100)/100*spread,x=Math.cos(a)*r,z=Math.sin(a)*r;const q=src.clone(true);q.position.set(x,H(x,z),z);q.rotation.y=a*1.37;q.scale.setScalar(.22+((i*13)%20)/100);scene.add(q)}
    });
  };
  dense("./real-assets/models/shrub_02.gltf",34,5,48);
  dense("./real-assets/models/weed_plant_02.gltf",52,3,42);

  // REALISM 34: hand-seeded near-field ecology — dense asymmetric real vegetation in first 20 m.
  const clusters=[
    [-12,-7,1.15],[-9,-5,.82],[-7,-8,.72],[-5,-4,.94],[6,-7,.88],[9,-5,1.08],[12,-8,.76],
    [-14,1,.92],[-11,4,.74],[-8,7,1.04],[7,6,.82],[10,3,1.12],[14,1,.86],
    [-13,12,.88],[-9,15,1.08],[-5,13,.78],[5,14,.96],[9,16,.82],[13,12,1.14]
  ];
  clusters.forEach(([x,z,s],i)=>{
    hero("./real-assets/models/shrub_02.gltf",[[x,z,s,(i*.83)%6.28]]);
    hero("./real-assets/models/weed_plant_02.gltf",[[x+1.1*Math.sin(i),z+.9*Math.cos(i),s*.62,(i*1.37)%6.28]]);
  });
  hero("./real-assets/models/rock_moss_set_01.gltf",[[-11,-2,.62,.4],[12,-1,.76,1.8],[-8,9,.54,2.6],[10,10,.68,.9]]);
  hero("./real-assets/models/tree_stump_01.gltf",[[-6,-11,.68,1.1],[8,-12,.82,2.4],[-15,8,.72,.5]]);

  // REALISM 35: micro-ecology corridor. Real assets deliberately frame the walkable path without blocking it.
  hero("./real-assets/models/weed_plant_02.gltf",[
    [-3,-6,.38,.2],[3,-6,.42,1.1],[-4,-3,.34,2.2],[4,-2,.4,.7],
    [-5,1,.44,1.8],[5,2,.36,2.9],[-6,5,.46,.5],[6,6,.41,1.5],
    [-7,9,.5,2.5],[7,10,.45,.9],[-8,14,.48,1.2],[8,15,.52,2.3]
  ]);
  hero("./real-assets/models/shrub_02.gltf",[
    [-8,-5,.62,.8],[8,-4,.68,2.1],[-9,3,.72,1.5],[9,5,.64,.3],[-10,11,.76,2.7],[10,13,.7,1.1]
  ]);

  // REALISM 37: real deadwood / forest debris silhouettes near trail edges.
  hero("./real-assets/models/tree_stump_01.gltf",[
    [-12,-10,.58,.15],[13,-9,.66,1.7],[-15,0,.52,2.8],[16,4,.7,.8],
    [-14,17,.62,2.1],[15,20,.56,1.2]
  ]);
  const rockMat=new THREE.MeshStandardMaterial({color:0x555952,roughness:.88,metalness:0});
  // REALISM 26: hand-composed photoreal foreground at spawn, so the first frame is unmistakably new.
  const heroLoader=new GLTFLoader();
  const hero=(url:string,placements:number[][])=>{
    heroLoader.load(url,g=>{
      const src=g.scene;src.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});
      placements.forEach(([x,z,s,ry])=>{const q=src.clone(true);q.position.set(x,H(x,z),z);q.scale.setScalar(s);q.rotation.y=ry;scene.add(q)});
    });
  };
  hero("./real-assets/models/rock_moss_set_01.gltf",[[-3,5,.95,.3],[4,8,.72,1.7],[-7,12,1.05,2.4],[8,15,.82,.9]]);
  hero("./real-assets/models/tree_stump_01.gltf",[[3,6,.85,.4],[-5,10,.72,2.1],[9,19,.9,1.2]]);
  hero("./real-assets/models/shrub_02.gltf",[[-2,3,.65,.1],[2,4,.58,1.4],[-5,6,.72,2.2],[6,7,.68,.7],[-8,10,.8,1.8],[8,11,.75,2.8]]);
  hero("./real-assets/models/weed_plant_02.gltf",[[-1,2,.48,.2],[1,2.5,.44,1.2],[-3,4,.5,2.2],[3,5,.46,.8],[-6,8,.55,1.7],[5,9,.52,2.6]]);
  // REALISM 28: close camera occlusion layer made only from real vegetation assets.
  hero("./real-assets/models/shrub_02.gltf",[[-4,-2,.78,.5],[4,-3,.72,2.1],[-7,1,.88,1.4],[7,2,.8,2.8],[-10,4,.95,.2],[11,5,.9,1.9]]);
  hero("./real-assets/models/weed_plant_02.gltf",[[-2,-1,.55,.4],[2,-1,.5,1.8],[-5,2,.62,2.6],[5,3,.58,.9],[-8,5,.66,1.3],[9,6,.64,2.5]]);


  hero("./real-assets/models/rock_moss_set_01.gltf",[[-18,-14,.9,.2],[19,-16,.72,1.4],[-22,6,.82,2.5],[23,8,1.02,.7],[-16,22,.68,1.9],[18,25,.88,2.9]]);

  // REALISM 18: actual photogrammetry replaces the primitive near-field rocks.
  const realRockRoots:THREE.Object3D[]=[];
  new GLTFLoader().load("./real-assets/models/rock_moss_set_01.gltf",(gltf)=>{
    const source=gltf.scene;source.traverse(o=>{const m=o as THREE.Mesh;if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});
    const spots=[[9,-12,0.72],[-13,-8,0.58],[16,11,0.66],[-18,16,0.52],[25,-20,0.8],[-27,-24,0.6]];
    spots.forEach(([x,z,s],i)=>{const r=source.clone(true);r.position.set(x,H(x,z),z);r.scale.setScalar(s);r.rotation.y=i*1.07;scene.add(r);realRockRoots.push(r)});
  },undefined,(e)=>console.error("REALISM18 model load",e));
  const resourceRocks:THREE.Mesh[]=[];
  for(let i=0;i<150;i++){const a=i*4.17,r=22+(i%39)*8,x=Math.cos(a)*r,z=Math.sin(a)*r;const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.5+(i%6)*.18,2),rockMat);m.scale.set(1.3,.65,1);m.position.set(x,H(x,z)+.3,z);m.rotation.set(i*.3,i*.7,0);m.castShadow=false;m.visible=false;scene.add(m);resourceRocks.push(m)}

  const human=new THREE.Group(),skin=new THREE.MeshStandardMaterial({color:0x9f745d,roughness:.8}),cloth=new THREE.MeshStandardMaterial({color:0x2f352f,roughness:1}),pants=new THREE.MeshStandardMaterial({color:0x202426,roughness:1});
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.42,1.0,10,16),cloth);torso.scale.set(1.0,1.05,.72);torso.position.y=2.02;human.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.36,24,18),skin);head.scale.set(.86,1.08,.9);head.position.y=3.35;human.add(head);
  const arm=(x:number)=>{const m=new THREE.Mesh(new THREE.CapsuleGeometry(.115,.98,8,12),skin);m.position.set(x,2.05,0);human.add(m);return m};
  const leg=(x:number)=>{const m=new THREE.Mesh(new THREE.CapsuleGeometry(.145,1.08,8,12),pants);m.position.set(x,.72,0);human.add(m);return m};
  const la=arm(-.62),ra=arm(.62),ll=leg(-.25),rl=leg(.25);
  la.rotation.z=-.08;ra.rotation.z=.08;
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.14,.16,.22,12),skin);neck.position.y=2.94;human.add(neck);
  const shoulder=new THREE.Mesh(new THREE.CapsuleGeometry(.16,.72,8,12),cloth);shoulder.rotation.z=Math.PI/2;shoulder.position.y=2.55;human.add(shoulder);
  const hip=new THREE.Mesh(new THREE.CapsuleGeometry(.29,.32,8,12),pants);hip.rotation.z=Math.PI/2;hip.position.y=1.25;human.add(hip);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.39,16,10,0,Math.PI*2,0,Math.PI*.48),new THREE.MeshStandardMaterial({color:0x2b201a,roughness:1}));hair.position.y=3.47;human.add(hair);
  const shoeMat=new THREE.MeshStandardMaterial({color:0x171717,roughness:.85});
  const shoeL=new THREE.Mesh(new THREE.BoxGeometry(.34,.18,.58),shoeMat),shoeR=shoeL.clone();shoeL.position.set(-.25,.08,.12);shoeR.position.set(.25,.08,.12);human.add(shoeL,shoeR);
  [torso,head,la,ra,ll,rl,hair,shoeL,shoeR].forEach(m=>{m.castShadow=false;m.visible=false});neck.visible=false;shoulder.visible=false;hip.visible=false;scene.add(human);
  human.scale.setScalar(.82);human.position.set(0,H(0,0),0);
  const contact=new THREE.Mesh(new THREE.CircleGeometry(.62,32),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0,depthWrite:false}));
  contact.rotation.x=-Math.PI/2;contact.position.set(0,H(0,0)+.018,0);scene.add(contact);

  let woodCount=0,stoneCount=0,flintCount=0,fiberCount=0,gatherCooldown=0;const fires:THREE.Mesh[]=[];
  gather.current=()=>{if(gatherCooldown>0)return;let bestRock:THREE.Mesh|null=null,rd=3.2;for(const r of resourceRocks){if(r.userData.harvested)continue;const d=Math.hypot(r.position.x-human.position.x,r.position.z-human.position.z);if(d<rd){rd=d;bestRock=r}}if(bestRock){bestRock.userData.harvested=true;if((stoneCount+flintCount)%3===1){flintCount++;setFlint(flintCount);setStatus('OBJEV: PAZOURKOVÝ KÁMEN · TVRDÝ, OSTRÝ, JISKŘÍ')}else{stoneCount++;setStone(stoneCount)}gatherCooldown=.45;return}let bestTree:THREE.Object3D|null=null,td=3.8;for(const o of scene.children){if(!(o instanceof THREE.Group)||o===human||!o.visible)continue;const d=Math.hypot(o.position.x-human.position.x,o.position.z-human.position.z);if(d<td&&o.position.y<30){td=d;bestTree=o}}if(bestTree){woodCount++;setWood(woodCount);gatherCooldown=.45;setStatus("NALEZENO DŘEVO · ZKOUŠEJ, KOMBINUJ, OBJEVUJ")}};


  const fiberMat=new THREE.MeshStandardMaterial({color:0x66854b,roughness:1,side:THREE.DoubleSide});
  for(let i=0;i<120;i++){const a=i*1.71,r=10+(i%60)*3.2,x=Math.cos(a)*r,z=Math.sin(a)*r;const fg=new THREE.Group();for(let q=0;q<5;q++){const leafBlade=new THREE.Mesh(new THREE.PlaneGeometry(.12,.95),fiberMat);leafBlade.position.y=.45;leafBlade.rotation.y=q*1.256;leafBlade.rotation.z=(q-2)*.12;fg.add(leafBlade)}fg.position.set(x,H(x,z),z);fg.visible=false;scene.add(fg)}
  const insectMat=new THREE.MeshBasicMaterial({color:0x191612});
  const insects:THREE.Mesh[]=[];const insectHome:THREE.Vector3[]=[];
  for(let i=0;i<0;i++){const im=new THREE.Mesh(new THREE.SphereGeometry(.018,5,4),insectMat);const a=i*2.41,r=75+(i%7)*38,x=Math.cos(a)*r+((i%3)-1)*90,z=Math.sin(a)*r+((i%4)-2)*70;insectHome.push(new THREE.Vector3(x,H(x,z)+.7+(i%4)*.3,z));im.position.copy(insectHome[i]);scene.add(im);insects.push(im)}
  let audioCtx:AudioContext|null=null,master:GainNode|null=null,windGain:GainNode|null=null,stepTimer=0;
  const startAudio=()=>{if(audioCtx){audioCtx.resume();return}audioCtx=new AudioContext();master=audioCtx.createGain();master.gain.value=.48;master.connect(audioCtx.destination);
   const n=audioCtx.createBuffer(1,audioCtx.sampleRate*2,audioCtx.sampleRate);const d=n.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
   const src=audioCtx.createBufferSource();src.buffer=n;src.loop=true;const filt=audioCtx.createBiquadFilter();filt.type="lowpass";filt.frequency.value=650;windGain=audioCtx.createGain();windGain.gain.value=.035;src.connect(filt).connect(windGain).connect(master);src.start();
  };
  const audioUnlock=()=>startAudio();window.addEventListener("worldzero-audio",audioUnlock);
  const stepSound=()=>{if(!audioCtx||!master)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="triangle";o.frequency.value=95+Math.random()*35;g.gain.setValueAtTime(.001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.08);o.connect(g).connect(master);o.start();o.stop(audioCtx.currentTime+.09)};
    const sim={temperature:18,humidity:.58,wind:.22,soilMoisture:.62,forestHealth:1,pollution:0};
  const birdMat=new THREE.MeshStandardMaterial({color:0x202426,roughness:.9});
  const birds:THREE.Group[]=[];for(let i=0;i<0;i++){const bg=new THREE.Group();const b1=new THREE.Mesh(new THREE.PlaneGeometry(.65,.16),birdMat),b2=b1.clone();b1.rotation.z=.25;b2.rotation.z=-.25;b1.position.x=-.32;b2.position.x=.32;bg.add(b1,b2);scene.add(bg);birds.push(bg)}
  const patchMat=new THREE.MeshStandardMaterial({color:0x2f4b2d,transparent:true,opacity:.34,roughness:1,depthWrite:false});
  for(let i=0;i<0;i++){const a=i*2.399,r=18+(i%45)*8,x=Math.cos(a)*r,z=Math.sin(a)*r;const pm=new THREE.Mesh(new THREE.CircleGeometry(3+(i%7)*1.4,18),patchMat);pm.rotation.x=-Math.PI/2;pm.position.set(x,H(x,z)+.025,z);pm.scale.set(1.8,.7,1);scene.add(pm)}
  const debrisMat=new THREE.MeshStandardMaterial({color:0x493b27,roughness:1,metalness:0});
  const debrisGeo=new THREE.PlaneGeometry(.22,.55);
  const debris=new THREE.InstancedMesh(debrisGeo,debrisMat,4200);debris.receiveShadow=true;
  for(let i=0;i<4200;i++){const a=i*2.399963,r=8+Math.sqrt(i/4200)*410,x=Math.cos(a)*r+(i%17-8)*1.7,z=Math.sin(a)*r+((i*7)%19-9)*1.5;dummy.position.set(x,H(x,z)+.035,z);dummy.rotation.set(-Math.PI/2,0,a);const s=.45+(i%11)*.055;dummy.scale.set(s,s,1);dummy.updateMatrix();debris.setMatrixAt(i,dummy.matrix)}scene.add(debris);
  const grassMat=new THREE.MeshStandardMaterial({color:0x355438,side:THREE.DoubleSide,roughness:.96});
  const forestMist=new THREE.Mesh(new THREE.PlaneGeometry(1500,1500),new THREE.MeshBasicMaterial({color:0xb9c7b3,transparent:true,opacity:.035,depthWrite:false}));
  forestMist.rotation.x=-Math.PI/2;forestMist.position.y=10;scene.add(forestMist);
  ;

  let yaw=0,last=performance.now();const clock=(now:number)=>{const dt=Math.min(.04,(now-last)/1000);last=now;const j=input.current;
   yaw+=j.look*dt*1.5;gatherCooldown=Math.max(0,gatherCooldown-dt);const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)),right=new THREE.Vector3(forward.z,0,-forward.x);
   human.position.addScaledVector(forward,-j.y*dt*7);human.position.addScaledVector(right,-j.x*dt*7);human.position.y=H(human.position.x,human.position.z);
   let nr:"wood"|"stone"|"flint"|"fiber"|null=null,rd=3.2;for(const r of resourceRocks){if(r.visible){const d=Math.hypot(r.position.x-human.position.x,r.position.z-human.position.z);if(d<rd){rd=d;nr="stone"}}}if(!nr){let td=3.8;for(const o of scene.children){if(o instanceof THREE.Group&&o!==human&&o.visible){const d=Math.hypot(o.position.x-human.position.x,o.position.z-human.position.z);if(d<td){td=d;nr="wood"}}}}setNear(prev=>prev===nr?prev:nr);
   const speed=Math.min(1,Math.hypot(j.x,j.y)),moving=speed>.08,t=now*.0075;
   if(moving&&audioCtx){stepTimer-=dt;if(stepTimer<=0){stepSound();stepTimer=.48-.12*speed}}if(windGain)windGain.gain.value=.018+sim.wind*.08;
   if(moving){const gait=Math.sin(t),gait2=Math.sin(t+Math.PI);la.rotation.x=THREE.MathUtils.lerp(la.rotation.x,gait*.62,dt*12);ra.rotation.x=THREE.MathUtils.lerp(ra.rotation.x,gait2*.62,dt*12);ll.rotation.x=THREE.MathUtils.lerp(ll.rotation.x,gait2*.48,dt*12);rl.rotation.x=THREE.MathUtils.lerp(rl.rotation.x,gait*.48,dt*12);torso.rotation.z=THREE.MathUtils.lerp(torso.rotation.z,-j.x*.055,dt*7);torso.rotation.x=THREE.MathUtils.lerp(torso.rotation.x,.035,dt*7);human.position.y=H(human.position.x,human.position.z)+Math.abs(Math.sin(t))*0.035*speed;const moveAngle=Math.atan2(-j.x,-j.y)+yaw;human.rotation.y=THREE.MathUtils.lerp(human.rotation.y,moveAngle,Math.min(1,dt*8))}
   else{la.rotation.x=THREE.MathUtils.lerp(la.rotation.x,0,dt*9);ra.rotation.x=THREE.MathUtils.lerp(ra.rotation.x,0,dt*9);ll.rotation.x=THREE.MathUtils.lerp(ll.rotation.x,0,dt*9);rl.rotation.x=THREE.MathUtils.lerp(rl.rotation.x,0,dt*9);torso.rotation.z=THREE.MathUtils.lerp(torso.rotation.z,0,dt*8);torso.rotation.x=THREE.MathUtils.lerp(torso.rotation.x,0,dt*8)}
   const back=forward.clone().multiplyScalar(16),desiredCam=new THREE.Vector3(human.position.x-back.x,human.position.y+6.0,human.position.z-back.z);camera.position.lerp(desiredCam,1-Math.exp(-dt*9));camera.lookAt(human.position.x,human.position.y+1.72,human.position.z);camera.updateMatrixWorld(true);
   for(let i=0;i<insects.length;i++){const h=insectHome[i],a=now*.0007+i*1.73,r=.35+(i%5)*.16;const x=h.x+Math.cos(a*1.3)*r,z=h.z+Math.sin(a*.91)*r;insects[i].position.set(x,h.y+Math.sin(a*2.7)*.22,z)}
   for(let i=0;i<animals.length;i++){const a=now*.000025+i*1.7,r=48+i*3,x=Math.cos(a)*r,z=Math.sin(a*.83)*r;animals[i].position.set(x,H(x,z),z);animals[i].rotation.y=-a+.4}
   sim.humidity=.55+Math.sin(now*.00001)*.08;sim.wind=.18+Math.sin(now*.000017)*.1;
   for(let i=0;i<birds.length;i++){const a=now*.00012+i*.7,r=55+i*5;birds[i].position.set(human.position.x+Math.cos(a)*r,H(human.position.x,human.position.z)+24+(i%3)*4,human.position.z+Math.sin(a)*r);birds[i].rotation.y=-a}water.material.opacity=.80+Math.sin(now*.0007)*.025;water.position.y=-6.2+Math.sin(now*.00045)*.05;contact.position.set(human.position.x,H(human.position.x,human.position.z)+.018,human.position.z);renderer.render(scene,camera);requestAnimationFrame(clock)};
  const resize=()=>{const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);el.style.width=w+"px";el.style.height=h+"px";renderer.domElement.style.display="block";renderer.domElement.style.position="absolute";renderer.domElement.style.left="0";renderer.domElement.style.top="0";renderer.domElement.style.width="100%";renderer.domElement.style.height="100%";renderer.setSize(w,h,false);renderer.setViewport(0,0,w,h);camera.clearViewOffset();camera.aspect=w/h;camera.updateProjectionMatrix()};resize();addEventListener("resize",resize);requestAnimationFrame(clock);
  return()=>{removeEventListener("resize",resize);window.removeEventListener("worldzero-audio",audioUnlock);audioCtx?.close();renderer.dispose();el.replaceChildren()}
 },[]);
 const joy=(e:React.PointerEvent<HTMLDivElement>)=>{const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width*.35),y=(e.clientY-r.top-r.height/2)/(r.height*.35);input.current.x=Math.max(-1,Math.min(1,x));input.current.y=Math.max(-1,Math.min(1,y))};
 return <main style={{position:"fixed",inset:0,overflow:"hidden",background:"#000",touchAction:"none"}}>
  <div ref={host} style={{position:"absolute",inset:0}}/>
  {!sound&&<button onPointerDown={()=>{setSound(true);window.dispatchEvent(new Event("worldzero-audio"))}} style={{position:"absolute",top:"max(72px,env(safe-area-inset-top))",right:14,zIndex:20,padding:"10px 14px",borderRadius:18,border:"1px solid #ffffff99",background:"#152018dd",color:"white",fontWeight:800}}>🔊 ZAPNOUT ZVUK</button>}
  <div style={{position:"absolute",top:"max(12px,env(safe-area-inset-top))",left:12,color:"white",fontFamily:"system-ui",textShadow:"0 2px 8px #000"}}><b style={{fontSize:20}}>WORLD ZERO</b><div style={{fontSize:12,opacity:.9}}>{status} · LIVING PLANET · DISCOVERY SIMULATION · BUILD 43 · FRESH LIVE</div><div style={{marginTop:6,fontSize:13}}>Dřevo {wood} · Kámen {stone} · Pazourek {flint} · Vlákno {fiber}</div></div>
  {flint>=2&&!fire&&<button onPointerDown={e=>{e.preventDefault();setFire(true);setFlint(v=>v-2);setStatus("OBJEV: JISKRA → OHEŇ · BEZ OHNIŠTĚ HROZÍ POŽÁR");const flame=new THREE.Mesh(new THREE.ConeGeometry(.35,1.15,10),new THREE.MeshStandardMaterial({color:0xff6b18,emissive:0xff3300,emissiveIntensity:2}));flame.position.set(human.position.x,H(human.position.x,human.position.z)+.55,human.position.z);scene.add(flame);fires.push(flame)}} style={{position:"absolute",right:24,bottom:"max(210px,calc(env(safe-area-inset-bottom) + 210px))",padding:"12px 15px",borderRadius:18,border:"2px solid #ffd27a",background:"#5b281ddd",color:"white",fontWeight:800,zIndex:5}}>KŘESAT PAZOURKY</button>}
  {near&&<button onPointerDown={e=>{e.preventDefault();gather.current()}} style={{position:"absolute",right:24,bottom:"max(112px,calc(env(safe-area-inset-bottom) + 112px))",width:86,height:86,borderRadius:"50%",border:"2px solid #ffffffaa",background:"#1d2b20dd",color:"white",fontWeight:800,fontSize:13,zIndex:5}}>SBÍRAT<br/>{near==="stone"?"KÁMEN":near==="flint"?"PAZOUREK":near==="fiber"?"VLÁKNO":"DŘEVO"}</button>}
  <div onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);joy(e)}} onPointerMove={e=>e.currentTarget.hasPointerCapture(e.pointerId)&&joy(e)} onPointerUp={e=>{input.current.x=input.current.y=0;e.currentTarget.releasePointerCapture(e.pointerId)}} style={{position:"absolute",left:22,bottom:"max(24px,env(safe-area-inset-bottom))",width:120,height:120,borderRadius:"50%",border:"2px solid #ffffff88",background:"#ffffff18"}}/>
  <div style={{position:"absolute",right:22,bottom:"max(35px,env(safe-area-inset-bottom))",display:"flex",gap:12}}>
   <button onPointerDown={()=>input.current.look=-1} onPointerUp={()=>input.current.look=0} onPointerCancel={()=>input.current.look=0} style={{width:58,height:58,borderRadius:"50%",fontSize:28}}>‹</button>
   <button onPointerDown={()=>input.current.look=1} onPointerUp={()=>input.current.look=0} onPointerCancel={()=>input.current.look=0} style={{width:58,height:58,borderRadius:"50%",fontSize:28}}>›</button>
  </div>
 </main>
}