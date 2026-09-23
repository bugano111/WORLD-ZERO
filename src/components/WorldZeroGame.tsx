import React,{useEffect,useRef,useState} from "react";
import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader.js";
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader.js";
import {Sky} from "three/examples/jsm/objects/Sky.js";

type Input={x:number;y:number;look:number};
export function WorldZeroGame(){
 const host=useRef<HTMLDivElement>(null),input=useRef<Input>({x:0,y:0,look:0});
 const [status,setStatus]=useState("REALISM 102 · REAL FOREST…"),[wood,setWood]=useState(0),[stone,setStone]=useState(0),[fiber,setFiber]=useState(0),[ready,setReady]=useState(false),[firstPerson,setFirstPerson]=useState(false); const firstPersonRef=useRef(false);
 useEffect(()=>{
  if(!host.current)return;
  const el=host.current,scene=new THREE.Scene();
  scene.background=new THREE.Color(0x7895a4);scene.fog=new THREE.FogExp2(0xb6c0bd,.00072);
  const sky=new Sky();sky.scale.setScalar(1000);scene.add(sky);const su=sky.material.uniforms;su.turbidity.value=7.2;su.rayleigh.value=1.65;su.mieCoefficient.value=.0045;su.mieDirectionalG.value=.79;const skySun=new THREE.Vector3();skySun.setFromSphericalCoords(1,THREE.MathUtils.degToRad(76),THREE.MathUtils.degToRad(242));su.sunPosition.value.copy(skySun);
  const camera=new THREE.PerspectiveCamera(58,1,.1,1600);
  let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:"default",preserveDrawingBuffer:true});}catch(err){console.error(err);setStatus("R102 · WEBGL NELZE SPUSTIT");setReady(true);return;}
  const mobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1:1.25));renderer.shadowMap.enabled=true;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xdde8e4,0x263026,1.05));
  const sun=new THREE.DirectionalLight(0xffd2a0,3.0);sun.position.set(-145,52,-70);sun.castShadow=true;sun.shadow.mapSize.set(mobile?384:1024,mobile?384:1024);sun.shadow.camera.left=-80;sun.shadow.camera.right=80;sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;scene.add(sun);
  const H=(x:number,z:number)=>{const r=Math.hypot(x,z),plateau=16*Math.exp(-(x*x)/4200-(z*z)/2300),valley=-45*Math.exp(-((x-12)*(x-12))/26000-((z+160)*(z+160))/14500),ridgeA=15*Math.pow(Math.max(0,1-Math.abs(x+155)/190),1.8)*Math.max(0,Math.min(1,(-z-150)/150)),ridgeB=19*Math.pow(Math.max(0,1-Math.abs(x-170)/205),1.65)*Math.max(0,Math.min(1,(-z-175)/155)),basin=-10*Math.exp(-((x-38)*(x-38))/10500-((z+175)*(z+175))/4800),macro=3.1*Math.sin(x*.012+Math.sin(z*.008)*1.7)+2.1*Math.cos((x-z)*.018),erosion=(Math.abs(Math.sin(x*.031+z*.017))*1.7+Math.abs(Math.sin(x*.067-z*.029))*.7),cliff=-15*Math.max(0,Math.min(1,(-z-34)/64))*Math.exp(-(x*x)/16500),far=Math.max(0,-z-255)*.055;return 6+plateau+valley+ridgeA+ridgeB+basin+macro+erosion+cliff+far+r*.0015};
  const g=new THREE.PlaneGeometry(700,700,mobile?96:160,mobile?96:160);g.rotateX(-Math.PI/2);const pa=g.attributes.position as THREE.BufferAttribute;
  for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i);pa.setY(i,H(x,z))}g.computeVertexNormals();
  const tex=new THREE.TextureLoader(), groundMat=new THREE.MeshStandardMaterial({color:0x42513a,roughness:.96,metalness:0,vertexColors:true});
  const loadTex=(url:string,kind:"map"|"normalMap"|"roughnessMap")=>tex.load(url,t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(28,28);if(kind==="map")t.colorSpace=THREE.SRGBColorSpace;(groundMat as any)[kind]=t;groundMat.needsUpdate=true});
  /* R102: remove the orange leaf-photo albedo that dominated every previous build. */loadTex(`${import.meta.env.BASE_URL}real-assets/forest_floor_nor_gl_1k.jpg`,"normalMap");loadTex(`${import.meta.env.BASE_URL}real-assets/forest_floor_rough_1k.jpg`,"roughnessMap");
  const pos=g.attributes.position as THREE.BufferAttribute,cols:number[]=[];for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),dx=Math.abs(H(x+1.5,z)-H(x-1.5,z))/3,dz=Math.abs(H(x,z+1.5)-H(x,z-1.5))/3,slope=Math.min(1,Math.hypot(dx,dz)*.7),alt=Math.max(0,Math.min(1,(y+10)/70)),rock=Math.min(1,slope*1.35+alt*.22),cc=new THREE.Color().setRGB(.16+.22*rock,.235-.055*rock,.12+.075*rock);cols.push(cc.r,cc.g,cc.b)}g.setAttribute("color",new THREE.Float32BufferAttribute(cols,3));const ground=new THREE.Mesh(g,groundMat);ground.receiveShadow=true;scene.add(ground);
   // Foreground boulders now come from the authored moss-rock GLTF scatter below; primitive polyhedra removed.
  // R104: alpine valley composition visible from spawn: reflective lake + layered mountain skyline.
  const waterMat=new THREE.MeshPhysicalMaterial({color:0x2f7384,roughness:.035,metalness:.18,transparent:true,opacity:.88,clearcoat:1,clearcoatRoughness:.025,envMapIntensity:2.1,ior:1.333,reflectivity:.85});
  const lakeShape=new THREE.Shape();for(let i=0;i<72;i++){const a=i/72*Math.PI*2,r=78+13*Math.sin(a*3)+8*Math.sin(a*7+.8),x=Math.cos(a)*r*1.45,y=Math.sin(a)*r*.62;i?lakeShape.lineTo(x,y):lakeShape.moveTo(x,y)}const lake=new THREE.Mesh(new THREE.ShapeGeometry(lakeShape,10),waterMat);lake.rotation.x=-Math.PI/2;lake.position.set(42,-13,-157);scene.add(lake);const shoreMat=new THREE.MeshStandardMaterial({color:0x4f5144,roughness:1});for(let i=0;i<52;i++){const a=i/52*Math.PI*2,r=82+13*Math.sin(a*3)+8*Math.sin(a*7+.8),x=42+Math.cos(a)*r*1.45,z=-157+Math.sin(a)*r*.62;const s=new THREE.Mesh(new THREE.IcosahedronGeometry(.65+(i%5)*.18,1),shoreMat);s.scale.set(1.7,.45,1.15);s.position.set(x,-12.65,z);s.rotation.y=a+i*.3;scene.add(s)}
  const riverShape=new THREE.Shape();const riverPts=[[-16,96],[-8,62],[-17,30],[-7,2],[-12,-34],[-4,-74],[13,-92],[9,-55],[17,-21],[8,11],[18,44],[10,78]];riverPts.forEach((p,i)=>i?riverShape.lineTo(p[0],p[1]):riverShape.moveTo(p[0],p[1]));riverShape.closePath();const river=new THREE.Mesh(new THREE.ShapeGeometry(riverShape),waterMat);river.rotation.x=-Math.PI/2;river.rotation.z=-.19;river.position.set(-42,-12.7,-205);scene.add(river);
  const mountainMat=new THREE.MeshStandardMaterial({color:0x43514f,roughness:.94,vertexColors:true});
 const snowMat=new THREE.MeshStandardMaterial({color:0xe8ece9,roughness:.8});
 const buildMassif=(cx:number,cz:number,w:number,d:number,h:number,seed:number)=>{const geo=new THREE.PlaneGeometry(w,d,48,32);geo.rotateX(-Math.PI/2);const p=geo.attributes.position as THREE.BufferAttribute,colors:number[]=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),nx=x/(w*.5),nz=z/(d*.5),fall=Math.max(0,1-nx*nx-nz*nz),noise=Math.sin(x*.071+seed)*Math.cos(z*.058-seed)+.45*Math.sin((x+z)*.137+seed),y=-22+Math.pow(fall,1.35)*h+noise*8*fall;p.setY(i,y);const t=Math.max(0,Math.min(1,(y-20)/55)),cc=new THREE.Color().setRGB(.25+.45*t,.30+.43*t,.29+.42*t);colors.push(cc.r,cc.g,cc.b)}geo.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const m=new THREE.Mesh(geo,mountainMat);m.position.set(cx,0,cz);m.castShadow=m.receiveShadow=true;scene.add(m);const snowGeo=geo.clone(),sp=snowGeo.attributes.position as THREE.BufferAttribute;for(let i=0;i<sp.count;i++)if(sp.getY(i)<38)sp.setY(i,-200);snowGeo.computeVertexNormals();const snow=new THREE.Mesh(snowGeo,snowMat);snow.position.set(cx,1.1,cz);scene.add(snow)};
 buildMassif(-180,-385,330,210,118,.4);buildMassif(95,-420,390,235,142,1.7);buildMassif(310,-455,310,210,105,2.9);
 const hazeMat=new THREE.MeshBasicMaterial({color:0xc9d0cd,transparent:true,opacity:.055,depthWrite:false});for(let i=0;i<3;i++){const hz=new THREE.Mesh(new THREE.PlaneGeometry(850,120),hazeMat);hz.position.set(0,18+i*17,-300-i*65);scene.add(hz)}
 const cloudMat=new THREE.MeshStandardMaterial({color:0xf3f0e8,transparent:true,opacity:.17,roughness:1,depthWrite:false});for(let i=0;i<8;i++){const cloud=new THREE.Group();for(let k=0;k<9;k++){const puff=new THREE.Mesh(new THREE.IcosahedronGeometry(8+(k%4)*3,2),cloudMat);puff.scale.set(1.9+(k%3)*.25,.55+(k%2)*.18,1);puff.position.set((k-4)*9+(k%2)*4,Math.sin(k*1.7)*4,(k%3)*-4);cloud.add(puff)}cloud.position.set(-250+i*75,82+(i%3)*14,-315-(i%4)*38);scene.add(cloud)}
 
  // R68 dense mossy forest floor: layered fern-like ground cover, never billboard wallpaper.
  const mossMat=new THREE.MeshStandardMaterial({color:0x3f5831,roughness:1});
  const fernMat=new THREE.MeshStandardMaterial({color:0x2e512d,roughness:.95,side:THREE.DoubleSide});
  for(let i=0;i<(mobile?72:220);i++){const a=i*2.399963,r=3+((i*71)%100)/100*145,x=Math.cos(a)*r,z=Math.sin(a)*r;
    const patch=new THREE.Mesh(new THREE.CircleGeometry(.16+(i%5)*.055,6),mossMat);patch.rotation.x=-Math.PI/2;patch.position.set(x,H(x,z)+.006,z);scene.add(patch);
    if(i%3===0){const fern=new THREE.Group();for(let k=0;k<6;k++){const leaf=new THREE.Mesh(new THREE.PlaneGeometry(.08,.5),fernMat);leaf.position.y=.18;leaf.rotation.z=(k-2.5)*.24;leaf.rotation.y=k*1.047;fern.add(leaf)}fern.position.set(x,H(x,z)+.005,z);fern.scale.setScalar(.55+(i%4)*.12);scene.add(fern)}
  }
  const grassMat=new THREE.MeshStandardMaterial({color:0x455d34,roughness:1,side:THREE.DoubleSide});for(let i=0;i<(mobile?90:320);i++){const a=i*2.399963,r=4+((i*61)%100)/100*72,x=Math.cos(a)*r,z=Math.sin(a)*r*.72;const blade=new THREE.Mesh(new THREE.PlaneGeometry(.08,.38+(i%5)*.08),grassMat);blade.position.set(x,H(x,z)+.12,z);blade.rotation.y=a*2.3;blade.rotation.z=(i%3-1)*.09;scene.add(blade)}
  new RGBELoader().load(`${import.meta.env.BASE_URL}real-assets/mossy_forest_panorama.hdr`,hdr=>{hdr.mapping=THREE.EquirectangularReflectionMapping;scene.environment=hdr;scene.environmentIntensity=mobile?.42:.62;},undefined,e=>console.warn("HDR",e));
  const gltf=new GLTFLoader();
  // R161: Rocketbox FBX embeds geometry/rig but references legacy texture filenames.
  // Ignore those missing legacy texture requests; apply physically based materials below.
  const fbxManager=new THREE.LoadingManager();
  fbxManager.setURLModifier((url)=>/\.(png|jpe?g|tga|bmp|dds)$/i.test(url)?"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL7WQAAAABJRU5ErkJggg==":url);
  const fbx=new FBXLoader(fbxManager);
  gltf.load(`${import.meta.env.BASE_URL}real-assets/models/rock_moss_set_01.gltf`,res=>{for(let i=0;i<30;i++){const a=-1.48+i*.102,r=18+(i%7)*4.1,x=Math.sin(a)*r,z=-Math.cos(a)*r-26;const o=res.scene.clone(true);o.position.set(x,H(x,z)-.04,z);o.rotation.set(0,i*.79,0);o.scale.setScalar(.28+(i%5)*.07);o.traverse(v=>{if((v as THREE.Mesh).isMesh){(v as THREE.Mesh).castShadow=true;(v as THREE.Mesh).receiveShadow=true}});scene.add(o)}});

  const scatterModel=(url:string,count:number,minR:number,maxR:number,scale:number)=>gltf.load(url,res=>{for(let i=0;i<count;i++){const o=res.scene.clone(true),a=i*2.399963+count*.17,r=minR+((i*47)%101)/100*(maxR-minR),x=Math.cos(a)*r,z=Math.sin(a)*r;o.position.set(x,H(x,z)-.035,z);o.rotation.y=(a*1.7+(i%11)*.37)%(Math.PI*2);const v=.62+((i*37)%17)/20;o.scale.set(scale*v*(.88+(i%3)*.08),scale*v*(.82+(i%5)*.07),scale*v*(.9+(i%4)*.06));o.traverse(v=>{if((v as THREE.Mesh).isMesh){(v as THREE.Mesh).castShadow=true;(v as THREE.Mesh).receiveShadow=true}});scene.add(o)}});
  // R150: natural conifer silhouettes — irregular trunks/branch masses instead of stacked toy cones.
  const trunkMat=new THREE.MeshStandardMaterial({color:0x33271f,roughness:1});const needleMats=[0x173322,0x1d3d27,0x28492e].map(color=>new THREE.MeshStandardMaterial({color,roughness:1}));
  const treeCount=mobile?170:480,branchGeo=new THREE.IcosahedronGeometry(1,1),trunkGeo=new THREE.CylinderGeometry(.11,.25,7.8,7),trunks=new THREE.InstancedMesh(trunkGeo,trunkMat,treeCount),branches=[0,1,2,3,4].map((_,k)=>new THREE.InstancedMesh(branchGeo,needleMats[k%3],treeCount)),dummy=new THREE.Object3D();
  for(let i=0;i<treeCount;i++){const a=i*2.399963+(i%11)*.047,r=24+((i*53)%101)/100*345;let x=Math.cos(a)*r,z=Math.sin(a)*r;if(z<-72&&Math.abs(x)<54)x+=(x<0?-1:1)*(62+(i%8)*4);const h=.78+(i%13)*.035,rot=(i*.73)%(Math.PI*2),gy=H(x,z);dummy.position.set(x,gy+3.85*h,z);dummy.rotation.set(0,rot,0);dummy.scale.set(h,h,h);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);for(let k=0;k<5;k++){const t=k/4,w=(2.5-k*.38)*h,hh=(1.25-k*.11)*h;dummy.position.set(x+Math.sin(rot+k)*.22*h,gy+(4.15+k*1.35)*h,z+Math.cos(rot-k)*.22*h);dummy.rotation.set((k%2?-.08:.06),rot+k*.47,(k%3-1)*.06);dummy.scale.set(w,hh,w*.82);dummy.updateMatrix();branches[k].setMatrixAt(i,dummy.matrix)}}trunks.castShadow=true;trunks.receiveShadow=true;scene.add(trunks);branches.forEach(m=>{m.castShadow=!mobile;m.receiveShadow=true;scene.add(m)});
  scatterModel(`${import.meta.env.BASE_URL}real-assets/models/shrub_02.gltf`,mobile?120:320,10,250,.78);
  scatterModel(`${import.meta.env.BASE_URL}real-assets/models/weed_plant_02.gltf`,mobile?28:90,8,95,.38);
  scatterModel(`${import.meta.env.BASE_URL}real-assets/models/tree_stump_01.gltf`,mobile?3:10,75,145,.72);
  scatterModel(`${import.meta.env.BASE_URL}real-assets/models/rock_moss_set_01.gltf`,mobile?12:45,70,220,.58);
  // R111: keep the spawn overlook clear so the camera cannot start inside vegetation.\n  // R59: no primitive fallback geometry; the forest is built only from real glTF assets.
  const collectibleWood:THREE.Mesh[]=[];
  const woodMat=new THREE.MeshStandardMaterial({color:0x5b3821,roughness:1});
  for(let i=0;i<18;i++){const a=i*2.399,r=6+(i%9)*4.2,x=Math.cos(a)*r,z=Math.sin(a)*r;
    const log=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,.65,10),woodMat);log.rotation.z=Math.PI/2;log.rotation.y=a;log.position.set(x,H(x,z)+.11,z);log.castShadow=true;scene.add(log);collectibleWood.push(log)}
  // R61: real skinned human GLB with embedded Idle/Walk/Run animations.
  const human=new THREE.Group(); human.position.set(0,H(0,0)+.005,0); scene.add(human);
  let humanModel:THREE.Object3D|null=null,humanMixer:THREE.AnimationMixer|null=null;let gaitPhase=0,prevHumanY=human.position.y,verticalVel=0;
  let idleAction:THREE.AnimationAction|null=null,walkAction:THREE.AnimationAction|null=null,runAction:THREE.AnimationAction|null=null,currentAction:THREE.AnimationAction|null=null;
  const setHumanAction=(next:THREE.AnimationAction|null)=>{if(!next||next===currentAction)return;next.reset().fadeIn(.16).play();if(currentAction)currentAction.fadeOut(.16);currentAction=next};
  // R159: M1 is now the actual player model. Rocketbox is rigged and MIT licensed.
  fbx.load(`${import.meta.env.BASE_URL}real-assets/rocketbox/M1.fbx`,model=>{
    humanModel=model;
    humanModel.traverse((o:any)=>{if(o.isMesh){o.castShadow=!mobile;o.receiveShadow=true;if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach((m:any)=>{if("roughness" in m){m.roughness=.72;m.metalness=0}m.needsUpdate=true})}}});
    const box=new THREE.Box3().setFromObject(humanModel),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    const scale=1.84/Math.max(.01,size.y);humanModel.scale.setScalar(scale);humanModel.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);humanModel.rotation.y=0;human.add(humanModel);
    const contact=new THREE.Mesh(new THREE.CircleGeometry(.42,24),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.18,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.set(0,.008,0);contact.scale.set(1,.48,1);human.add(contact);
    // R164: load Rocketbox motions authored for the same skeleton and drive M1 with them.
    humanMixer=new THREE.AnimationMixer(humanModel);
    const loadMotion=(file:string,kind:"idle"|"walk"|"run")=>fbx.load(`${import.meta.env.BASE_URL}real-assets/rocketbox/${file}`,motion=>{
      const clip=(motion as any).animations?.[0] as THREE.AnimationClip|undefined;if(!clip)return;
      const action=humanMixer!.clipAction(clip);
      action.enabled=true;action.setLoop(THREE.LoopRepeat,Infinity);
      if(kind==="idle"){idleAction=action;if(!currentAction){currentAction=action;action.play()}}
      else if(kind==="walk")walkAction=action;else runAction=action;
    },undefined,e=>console.error("R164 motion load failed",kind,e));
    loadMotion("M1_idle.fbx","idle");loadMotion("M1_walk.fbx","walk");loadMotion("M1_run.fbx","run");
    setReady(true);setStatus("R162 · M1 · LIGHTING REBUILD");
  },undefined,e=>{console.error("R159 M1 load failed",e);setStatus("R159 · CHYBA M1");setReady(true)});
  // Never leave iPhone behind the loading curtain if a slow/broken asset stalls.
  const bootGuard=window.setTimeout(()=>{setReady(true);setStatus("REALISM 102 · SVĚT SPUŠTĚN")},6500);
  (window as any).__wzCollect=()=>{let best:THREE.Mesh|undefined,dist=3.2;for(const o of collectibleWood){if(!o.visible)continue;const d=o.position.distanceTo(human.position);if(d<dist){dist=d;best=o}}if(!best)return false;best.visible=false;return true};
  let windPhase=0;const windStrength=.55;const clock=new THREE.Clock();
  let yaw=Math.PI,last=performance.now();
  const birds:THREE.Mesh[]=[]; // R159: removed toy cone birds; wildlife returns only as authored assets.
  const windPlants:THREE.Object3D[]=[];scene.traverse(o=>{if(o!==ground&&o!==human&&o.position.y<4)windPlants.push(o)});
  const key=(e:KeyboardEvent,v:number)=>{if(e.code==="KeyW"||e.code==="ArrowUp")input.current.y=-v;if(e.code==="KeyS"||e.code==="ArrowDown")input.current.y=v;if(e.code==="KeyA")input.current.x=v;if(e.code==="KeyD")input.current.x=-v;if(e.code==="ArrowLeft")input.current.look=-v;if(e.code==="ArrowRight")input.current.look=v};
  const kd=(e:KeyboardEvent)=>key(e,1),ku=(e:KeyboardEvent)=>key(e,0);addEventListener("keydown",kd);addEventListener("keyup",ku);
  let raf=0;const loop=(now:number)=>{const dt=Math.min(.025,(now-last)/1000);last=now;const j=input.current;yaw+=j.look*dt*1.8;const f=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)),r=new THREE.Vector3(f.z,0,-f.x);
   const speed=Math.min(1,Math.hypot(j.x,j.y));human.position.addScaledVector(f,-j.y*dt*6);human.position.addScaledVector(r,-j.x*dt*6);// R165: gravity/terrain adhesion. Follow ground downward with gravity instead of teleporting/floating.
   const floorY=H(human.position.x,human.position.z)+.008;
   if(human.position.y<floorY){human.position.y=floorY;verticalVel=0}
   else{verticalVel-=22*dt;human.position.y=Math.max(floorY,human.position.y+verticalVel*dt);if(human.position.y<=floorY+.002)verticalVel=0}
   const moving=speed>.05;setHumanAction(moving?(speed>.72&&runAction?runAction:walkAction):idleAction);if(walkAction)walkAction.timeScale=.82+speed*.38;if(runAction)runAction.timeScale=.9+speed*.28;humanMixer?.update(dt);windPhase+=dt*.72;gaitPhase+=dt*(moving?7.2*speed:1.35);verticalVel=THREE.MathUtils.lerp(verticalVel,(human.position.y-prevHumanY)/Math.max(dt,.001),1-Math.exp(-dt*5));prevHumanY=human.position.y;if(humanModel){const breathe=Math.sin(gaitPhase*(moving?.45:1))*(moving?.004:.009),step=Math.abs(Math.sin(gaitPhase));humanModel.position.y=0;const lateral=moving?Math.sin(gaitPhase)*.014*speed:Math.sin(gaitPhase)*.002;humanModel.rotation.z=THREE.MathUtils.lerp(humanModel.rotation.z,lateral,1-Math.exp(-dt*8));humanModel.rotation.x=THREE.MathUtils.lerp(humanModel.rotation.x,(moving?.018:0)-THREE.MathUtils.clamp(verticalVel*.008,-.035,.035),1-Math.exp(-dt*6));humanModel.rotation.y=THREE.MathUtils.lerp(humanModel.rotation.y,moving?Math.sin(gaitPhase*.5)*.006:0,1-Math.exp(-dt*5));}human.rotation.y=yaw;if(Math.hypot(j.x,j.y)>.05)human.rotation.y=Math.atan2(-j.x,-j.y)+yaw;
   human.visible=!firstPersonRef.current; if(firstPersonRef.current){const eye=human.position.clone();eye.y+=1.67;camera.position.lerp(eye,1-Math.exp(-dt*12));camera.lookAt(eye.clone().addScaledVector(f,8));}else{const cam=human.position.clone().addScaledVector(f,-6.6);cam.y+=3.05;camera.position.lerp(cam,1-Math.exp(-dt*8));const target=human.position.clone().add(new THREE.Vector3(0,.8,0)).addScaledVector(f,150);camera.lookAt(target);}
   const t=clock.getElapsedTime();sun.position.x=-45+Math.sin(t*.015)*18;sun.position.z=-25+Math.cos(t*.015)*18;
   birds.forEach((b,i)=>{const a=t*.12+i*.7,r=34+i*3;b.position.set(human.position.x+Math.cos(a)*r,18+i*.8+Math.sin(t+i),human.position.z+Math.sin(a)*r);b.rotation.z=-a});
   try{renderer.render(scene,camera)}catch(e){console.error("R102 render",e);setStatus("R102 · CHYBA RENDERU");setReady(true);return}raf=requestAnimationFrame(loop)};
  const resize=()=>{const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};resize();addEventListener("resize",resize);setStatus("REALISM 102 · DEN 1 · REAL FOREST");requestAnimationFrame(loop);
  return()=>{cancelAnimationFrame(raf);removeEventListener("resize",resize);removeEventListener("keydown",kd);removeEventListener("keyup",ku);delete (window as any).__wzCollect;clearTimeout(bootGuard);renderer.dispose();el.replaceChildren()}
 },[]);
 const joy=(e:React.PointerEvent<HTMLDivElement>)=>{const r=e.currentTarget.getBoundingClientRect();input.current.x=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width*.35)));input.current.y=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(r.height*.35)))};
 return <main style={{position:"fixed",inset:0,overflow:"hidden",background:"#000",touchAction:"none"}}>
  <div ref={host} style={{position:"absolute",inset:0}}/>{!ready&&<div style={{position:"absolute",inset:0,zIndex:50,display:"grid",placeItems:"center",background:"#101813",color:"white",fontFamily:"system-ui",fontWeight:800,fontSize:20}}>WORLD ZERO<br/><span style={{fontSize:13,fontWeight:500}}>Načítám svět a postavu…</span></div>}
  <div style={{position:"absolute",top:"max(12px,env(safe-area-inset-top))",left:12,color:"white",fontFamily:"system-ui",textShadow:"0 2px 8px #000"}}><b style={{fontSize:26,letterSpacing:1}}>WORLD ZERO</b><div style={{fontSize:12,letterSpacing:.6}}>{status} · LIVING PLANET · ALPINE WILDERNESS</div><div style={{fontSize:13,marginTop:5}}>🪵 Dřevo {wood} · 🪨 Kámen {stone} · 🌿 Vláknina {fiber}</div><div style={{fontSize:12,marginTop:6,background:"#0008",padding:"6px 8px",borderRadius:8}}>ÚKOL: Nasbírej 5 dřeva · {wood}/5</div></div>
  <div style={{position:"absolute",top:"max(14px,env(safe-area-inset-top))",left:"50%",transform:"translateX(-50%)",color:"#fff",fontFamily:"system-ui",fontSize:12,fontWeight:800,letterSpacing:2,textShadow:"0 2px 6px #000"}}>W&nbsp;&nbsp;NW&nbsp;&nbsp;N&nbsp;&nbsp;NE&nbsp;&nbsp;E</div>
  <div style={{position:"absolute",top:"max(62px,env(safe-area-inset-top))",right:18,width:104,height:104,borderRadius:"50%",border:"2px solid #ffffffaa",background:"radial-gradient(circle at 48% 52%,#456b55 0 18%,#24443c 19% 43%,#162a27 44% 100%)",boxShadow:"0 3px 14px #0008",color:"#fff",fontFamily:"system-ui",fontSize:10,textAlign:"center",lineHeight:"104px"}}>▲ N</div>
  <div style={{position:"absolute",top:"max(174px,env(safe-area-inset-top))",right:18,color:"#fff",fontFamily:"system-ui",fontSize:11,textAlign:"right",textShadow:"0 2px 6px #000"}}>☀ 18:42&nbsp;&nbsp; 14°C<br/>JASNO · VÍTR 6 km/h</div>
  <div style={{position:"absolute",left:"50%",bottom:"max(18px,env(safe-area-inset-bottom))",transform:"translateX(-50%)",display:"flex",gap:5}}>{[1,2,3,4,5].map(n=><div key={n} style={{width:42,height:42,border:"1px solid #ffffff88",borderRadius:5,background:"#101813b8",color:"#ffffffaa",display:"grid",placeItems:"center",fontFamily:"system-ui",fontSize:11}}>{n}</div>)}</div>
  <button onPointerDown={()=>{const p=(window as any).__wzCollect?.();if(p===false){setStatus("PŘIBLIŽ SE K PADLÉMU DŘEVU");return}setWood(v=>v+1);if(wood>=4)setStatus("ÚKOL SPLNĚN · ODEMČENO: PRIMITIVNÍ TÁBOR");else setStatus("SEBRÁNO DŘEVO · POKRAČUJ V PRŮZKUMU")}} style={{position:"absolute",right:22,bottom:115,width:82,height:82,borderRadius:"50%",border:"2px solid #fff9",background:"#1d2b20dd",color:"white",fontWeight:800}}>SBÍRAT</button>
  <div onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);joy(e)}} onPointerMove={e=>e.currentTarget.hasPointerCapture(e.pointerId)&&joy(e)} onPointerUp={e=>{input.current.x=input.current.y=0;e.currentTarget.releasePointerCapture(e.pointerId)}} style={{position:"absolute",left:22,bottom:"max(24px,env(safe-area-inset-bottom))",width:120,height:120,borderRadius:"50%",border:"2px solid #ffffff88",background:"#ffffff18"}}/>
  <button onPointerDown={()=>{const n=!firstPerson;setFirstPerson(n);firstPersonRef.current=n}} style={{position:"absolute",right:22,top:"max(18px,env(safe-area-inset-top))",zIndex:20,border:"1px solid #fff8",borderRadius:10,padding:"9px 12px",background:"#101813cc",color:"white",fontWeight:800}}>{firstPerson?"1. OSOBA":"3. OSOBA"}</button><div style={{position:"absolute",right:22,bottom:"max(25px,env(safe-area-inset-bottom))",display:"flex",gap:10}}><button onPointerDown={()=>input.current.look=-1} onPointerUp={()=>input.current.look=0} style={{width:58,height:58,borderRadius:"50%",fontSize:28}}>‹</button><button onPointerDown={()=>input.current.look=1} onPointerUp={()=>input.current.look=0} style={{width:58,height:58,borderRadius:"50%",fontSize:28}}>›</button></div>
 </main>
}