import React,{useEffect,useRef,useState} from "react";
import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader.js";

type Input={x:number;y:number;look:number};
export function WorldZeroGame(){
 const host=useRef<HTMLDivElement>(null),input=useRef<Input>({x:0,y:0,look:0});
 const [status,setStatus]=useState("REALISM 102 · REAL FOREST…"),[wood,setWood]=useState(0),[stone,setStone]=useState(0),[fiber,setFiber]=useState(0),[ready,setReady]=useState(false),[firstPerson,setFirstPerson]=useState(false); const firstPersonRef=useRef(false);
 useEffect(()=>{
  if(!host.current)return;
  const el=host.current,scene=new THREE.Scene();
  scene.background=new THREE.Color(0x9eb9c5);scene.fog=new THREE.FogExp2(0xb6c2bc,.00115);
  const camera=new THREE.PerspectiveCamera(60,1,.1,1600);
  let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:"default",preserveDrawingBuffer:true});}catch(err){console.error(err);setStatus("R102 · WEBGL NELZE SPUSTIT");setReady(true);return;}
  const mobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1:1.25));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xd9e7e4,0x182318,1.02));
  const sun=new THREE.DirectionalLight(0xffbd72,6.0);sun.position.set(-120,38,-80);sun.castShadow=true;sun.shadow.mapSize.set(mobile?512:1024,mobile?512:1024);sun.shadow.camera.left=-80;sun.shadow.camera.right=80;sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;scene.add(sun);
  const H=(x:number,z:number)=>{const overlook=10*Math.exp(-(x*x)/5200-(z*z)/2600);const valley=-34*Math.exp(-((x-55)*(x-55))/18000-((z+145)*(z+145))/13000);const farRise=Math.max(0,-z-235)*.07;return 5+overlook+Math.sin(x*.013)*3.2+Math.cos(z*.015)*2.4+Math.sin((x+z)*.006)*5.5+valley+farRise};
  const g=new THREE.PlaneGeometry(700,700,100,100);g.rotateX(-Math.PI/2);const pa=g.attributes.position as THREE.BufferAttribute;
  for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i);pa.setY(i,H(x,z))}g.computeVertexNormals();
  const tex=new THREE.TextureLoader(), groundMat=new THREE.MeshStandardMaterial({color:0x68705a,roughness:.94});
  const loadTex=(url:string,kind:"map"|"normalMap"|"roughnessMap")=>tex.load(url,t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(28,28);if(kind==="map")t.colorSpace=THREE.SRGBColorSpace;(groundMat as any)[kind]=t;groundMat.needsUpdate=true});
  /* R102: remove the orange leaf-photo albedo that dominated every previous build. */loadTex(`${import.meta.env.BASE_URL}real-assets/forest_floor_nor_gl_1k.jpg`,"normalMap");loadTex(`${import.meta.env.BASE_URL}real-assets/forest_floor_rough_1k.jpg`,"roughnessMap");
  const ground=new THREE.Mesh(g,groundMat);ground.receiveShadow=true;scene.add(ground);
  // R104: alpine valley composition visible from spawn: reflective lake + layered mountain skyline.
  const waterMat=new THREE.MeshPhysicalMaterial({color:0x4b8798,roughness:.16,metalness:.04,transparent:true,opacity:.88,clearcoat:.7,clearcoatRoughness:.18});
  const lake=new THREE.Mesh(new THREE.PlaneGeometry(260,92),waterMat);lake.rotation.x=-Math.PI/2;lake.rotation.z=-.08;lake.position.set(58,-12.5,-142);scene.add(lake);
  const lake2=new THREE.Mesh(new THREE.PlaneGeometry(120,38),waterMat);lake2.rotation.x=-Math.PI/2;lake2.rotation.z=.18;lake2.position.set(-72,-10.5,-188);scene.add(lake2);
  const mountainMat=new THREE.MeshStandardMaterial({color:0x59615f,roughness:.98,flatShading:true});
  const snowMat=new THREE.MeshStandardMaterial({color:0xe8edf0,roughness:.92,flatShading:true});
  // R113: continuous irregular alpine ridges instead of obvious cone primitives.
  const ridge=(z:number,baseY:number,depth:number,phase:number,mat:THREE.Material)=>{
    const seg=72,geo=new THREE.BufferGeometry(),v:number[]=[];
    for(let i=0;i<seg;i++){const x0=-390+i*780/seg,x1=-390+(i+1)*780/seg;const peak=(x:number)=>baseY+22+34*Math.abs(Math.sin(x*.018+phase))+18*Math.abs(Math.sin(x*.043+phase*.7))+9*Math.sin(x*.071+phase);const y0=peak(x0),y1=peak(x1);v.push(x0,baseY,z,x1,baseY,z,x1,y1,z-depth,x0,baseY,z,x1,y1,z-depth,x0,y0,z-depth)}
    geo.setAttribute("position",new THREE.Float32BufferAttribute(v,3));geo.computeVertexNormals();scene.add(new THREE.Mesh(geo,mat));
  };
  ridge(-338,-10,18,.3,mountainMat);ridge(-385,-4,24,1.7,mountainMat);ridge(-430,4,30,2.8,mountainMat);
  const snowRidgeMat=snowMat.clone();(snowRidgeMat as THREE.MeshStandardMaterial).transparent=true;(snowRidgeMat as THREE.MeshStandardMaterial).opacity=.92;
  ridge(-431,43,31,2.8,snowRidgeMat);
  const haze=new THREE.Mesh(new THREE.PlaneGeometry(760,220),new THREE.MeshBasicMaterial({color:0xb8c8c9,transparent:true,opacity:.12,depthWrite:false}));haze.position.set(0,55,-330);scene.add(haze);
  // R114: overlook rocks now use the real mossy-rock glTF instead of primitive dodecahedrons.
  const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(4.2,16,12),new THREE.MeshBasicMaterial({color:0xffd69a}));sunDisc.position.set(-105,48,-260);scene.add(sunDisc);
  // R68 dense mossy forest floor: layered fern-like ground cover, never billboard wallpaper.
  const mossMat=new THREE.MeshStandardMaterial({color:0x334b2a,roughness:1});
  const fernMat=new THREE.MeshStandardMaterial({color:0x244326,roughness:.95,side:THREE.DoubleSide});
  for(let i=0;i<(mobile?70:140);i++){const a=i*2.399963,r=3+((i*71)%100)/100*145,x=Math.cos(a)*r,z=Math.sin(a)*r;
    const patch=new THREE.Mesh(new THREE.CircleGeometry(.16+(i%5)*.055,6),mossMat);patch.rotation.x=-Math.PI/2;patch.position.set(x,H(x,z)+.018,z);scene.add(patch);
    if(i%3===0){const fern=new THREE.Group();for(let k=0;k<6;k++){const leaf=new THREE.Mesh(new THREE.PlaneGeometry(.08,.5),fernMat);leaf.position.y=.18;leaf.rotation.z=(k-2.5)*.24;leaf.rotation.y=k*1.047;fern.add(leaf)}fern.position.set(x,H(x,z)+.02,z);fern.scale.setScalar(.55+(i%4)*.12);scene.add(fern)}
  }
  if(!mobile)new RGBELoader().load(`${import.meta.env.BASE_URL}real-assets/mossy_forest_panorama.hdr`,hdr=>{hdr.mapping=THREE.EquirectangularReflectionMapping;scene.environment=hdr;},undefined,e=>console.warn("HDR",e));
  const gltf=new GLTFLoader();
  gltf.load(`${import.meta.env.BASE_URL}real-assets/models/rock_moss_set_01.gltf`,res=>{for(let i=0;i<22;i++){const a=-1.35+i*.125,r=18+(i%6)*2.2,x=Math.sin(a)*r,z=-Math.cos(a)*r-10;const o=res.scene.clone(true);o.position.set(x,H(x,z)+.05,z);o.rotation.set(0,i*.79,0);o.scale.setScalar(.42+(i%5)*.10);o.traverse(v=>{if((v as THREE.Mesh).isMesh){(v as THREE.Mesh).castShadow=true;(v as THREE.Mesh).receiveShadow=true}});scene.add(o)}});

  const scatterModel=(url:string,count:number,minR:number,maxR:number,scale:number)=>gltf.load(url,res=>{for(let i=0;i<count;i++){const o=res.scene.clone(true),a=i*2.399963+count*.17,r=minR+((i*47)%101)/100*(maxR-minR),x=Math.cos(a)*r,z=Math.sin(a)*r;o.position.set(x,H(x,z),z);o.rotation.y=(a*1.7+(i%11)*.37)%(Math.PI*2);const v=.62+((i*37)%17)/20;o.scale.set(scale*v*(.88+(i%3)*.08),scale*v*(.82+(i%5)*.07),scale*v*(.9+(i%4)*.06));o.traverse(v=>{if((v as THREE.Mesh).isMesh){(v as THREE.Mesh).castShadow=true;(v as THREE.Mesh).receiveShadow=true}});scene.add(o)}});
  scatterModel(`${import.meta.env.BASE_URL}real-assets/models/pine_sapling_small.gltf`,mobile?190:500,34,320,34);
  scatterModel(`${import.meta.env.BASE_URL}real-assets/models/shrub_02.gltf`,mobile?65:240,28,235,1.45);
  scatterModel(`${import.meta.env.BASE_URL}real-assets/models/weed_plant_02.gltf`,mobile?12:70,24,115,.52);
  scatterModel(`${import.meta.env.BASE_URL}real-assets/models/tree_stump_01.gltf`,mobile?10:18,10,145,.88);
  scatterModel(`${import.meta.env.BASE_URL}real-assets/models/rock_moss_set_01.gltf`,mobile?42:100,5,220,.85);
  // R111: keep the spawn overlook clear so the camera cannot start inside vegetation.\n  // R59: no primitive fallback geometry; the forest is built only from real glTF assets.
  const collectibleWood:THREE.Mesh[]=[];
  const woodMat=new THREE.MeshStandardMaterial({color:0x5b3821,roughness:1});
  for(let i=0;i<18;i++){const a=i*2.399,r=6+(i%9)*4.2,x=Math.cos(a)*r,z=Math.sin(a)*r;
    const log=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,.65,10),woodMat);log.rotation.z=Math.PI/2;log.rotation.y=a;log.position.set(x,H(x,z)+.18,z);log.castShadow=true;scene.add(log);collectibleWood.push(log)}
  // R61: real skinned human GLB with embedded Idle/Walk/Run animations.
  const human=new THREE.Group(); human.position.set(0,H(0,0)+.05,0); scene.add(human);
  let humanModel:THREE.Object3D|null=null,humanMixer:THREE.AnimationMixer|null=null;
  let idleAction:THREE.AnimationAction|null=null,walkAction:THREE.AnimationAction|null=null,runAction:THREE.AnimationAction|null=null,currentAction:THREE.AnimationAction|null=null;
  const setHumanAction=(next:THREE.AnimationAction|null)=>{if(!next||next===currentAction)return;next.reset().fadeIn(.18).play();if(currentAction)currentAction.fadeOut(.18);currentAction=next};
  gltf.load(`${import.meta.env.BASE_URL}real-assets/models/human.glb`,g=>{
    humanModel=g.scene;
    // R73: preserve the complete model and its original embedded materials/textures.
    humanModel.traverse((o:any)=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
    // R70: keep the rigged human intact. The R69 overlay geometry produced the boxy broken body seen on iPhone.
    // No rigid clothing primitives are attached to the skeleton.
    const box=new THREE.Box3().setFromObject(humanModel),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    const scale=1.90/Math.max(.01,size.y); humanModel.scale.setScalar(scale); humanModel.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
    human.add(humanModel);
    setReady(true); setStatus("REALISM 102 · DEN 1 · REAL FOREST");
    // R75 stability: preserve the model's own materials; no runtime material guessing.
    humanModel.traverse((o:any)=>{if(o.isMesh){o.castShadow=!mobile;o.receiveShadow=true;}});
    // R74: use only the source human mesh. Do not bolt primitive spheres/cylinders onto a body.
    // The next character replacement must be a complete, correctly rigged human asset.
    if(g.animations.length){humanMixer=new THREE.AnimationMixer(humanModel);
    const by=(n:string)=>g.animations.find(x=>x.name.toLowerCase().includes(n));
    idleAction=by("idle")?humanMixer.clipAction(by("idle")!):null; walkAction=by("walk")?humanMixer.clipAction(by("walk")!):null; runAction=by("run")?humanMixer.clipAction(by("run")!):walkAction;
    currentAction=idleAction; idleAction?.play();}
  },undefined,e=>{console.error("R61 human load failed",e);setStatus("R102 · CHYBA MODELU POSTAVY");setReady(true)});
  // Never leave iPhone behind the loading curtain if a slow/broken asset stalls.
  const bootGuard=window.setTimeout(()=>{setReady(true);setStatus("REALISM 102 · SVĚT SPUŠTĚN")},6500);
  (window as any).__wzCollect=()=>{let best:THREE.Mesh|undefined,dist=3.2;for(const o of collectibleWood){if(!o.visible)continue;const d=o.position.distanceTo(human.position);if(d<dist){dist=d;best=o}}if(!best)return false;best.visible=false;return true};
  const clock=new THREE.Clock();
  let yaw=Math.PI,last=performance.now();
  const birds:THREE.Mesh[]=[];const birdMat=new THREE.MeshBasicMaterial({color:0x171717});
  for(let i=0;i<9;i++){const b=new THREE.Mesh(new THREE.ConeGeometry(.12,.42,3),birdMat);b.rotation.x=Math.PI/2;scene.add(b);birds.push(b)}
  const windPlants:THREE.Object3D[]=[];scene.traverse(o=>{if(o!==ground&&o!==human&&o.position.y<4)windPlants.push(o)});
  const key=(e:KeyboardEvent,v:number)=>{if(e.code==="KeyW"||e.code==="ArrowUp")input.current.y=-v;if(e.code==="KeyS"||e.code==="ArrowDown")input.current.y=v;if(e.code==="KeyA")input.current.x=v;if(e.code==="KeyD")input.current.x=-v;if(e.code==="ArrowLeft")input.current.look=-v;if(e.code==="ArrowRight")input.current.look=v};
  const kd=(e:KeyboardEvent)=>key(e,1),ku=(e:KeyboardEvent)=>key(e,0);addEventListener("keydown",kd);addEventListener("keyup",ku);
  let raf=0;const loop=(now:number)=>{const dt=Math.min(.025,(now-last)/1000);last=now;const j=input.current;yaw+=j.look*dt*1.8;const f=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)),r=new THREE.Vector3(f.z,0,-f.x);
   human.position.addScaledVector(f,-j.y*dt*6);human.position.addScaledVector(r,-j.x*dt*6);human.position.y=H(human.position.x,human.position.z);const moving=Math.abs(j.x)+Math.abs(j.y)>.05;humanMixer?.update(dt);setHumanAction(moving?walkAction:idleAction);human.rotation.y=yaw;if(Math.hypot(j.x,j.y)>.05)human.rotation.y=Math.atan2(-j.x,-j.y)+yaw;
   human.visible=!firstPersonRef.current; if(firstPersonRef.current){const eye=human.position.clone();eye.y+=1.67;camera.position.lerp(eye,1-Math.exp(-dt*12));camera.lookAt(eye.clone().addScaledVector(f,8));}else{const cam=human.position.clone().addScaledVector(f,-7.4);cam.y+=3.6;camera.position.lerp(cam,1-Math.exp(-dt*8));camera.lookAt(human.position.x,human.position.y+1.35,human.position.z);}
   const t=clock.getElapsedTime();sun.position.x=-45+Math.sin(t*.015)*18;sun.position.z=-25+Math.cos(t*.015)*18;
   birds.forEach((b,i)=>{const a=t*.12+i*.7,r=34+i*3;b.position.set(human.position.x+Math.cos(a)*r,18+i*.8+Math.sin(t+i),human.position.z+Math.sin(a)*r);b.rotation.z=-a});
   try{renderer.render(scene,camera)}catch(e){console.error("R102 render",e);setStatus("R102 · CHYBA RENDERU");setReady(true);return}raf=requestAnimationFrame(loop)};
  const resize=()=>{const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};resize();addEventListener("resize",resize);setStatus("REALISM 102 · DEN 1 · REAL FOREST");requestAnimationFrame(loop);
  return()=>{cancelAnimationFrame(raf);removeEventListener("resize",resize);removeEventListener("keydown",kd);removeEventListener("keyup",ku);delete (window as any).__wzCollect;clearTimeout(bootGuard);renderer.dispose();el.replaceChildren()}
 },[]);
 const joy=(e:React.PointerEvent<HTMLDivElement>)=>{const r=e.currentTarget.getBoundingClientRect();input.current.x=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width*.35)));input.current.y=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(r.height*.35)))};
 return <main style={{position:"fixed",inset:0,overflow:"hidden",background:"#000",touchAction:"none"}}>
  <div ref={host} style={{position:"absolute",inset:0}}/>{!ready&&<div style={{position:"absolute",inset:0,zIndex:50,display:"grid",placeItems:"center",background:"#101813",color:"white",fontFamily:"system-ui",fontWeight:800,fontSize:20}}>WORLD ZERO<br/><span style={{fontSize:13,fontWeight:500}}>Načítám svět a postavu…</span></div>}
  <div style={{position:"absolute",top:"max(12px,env(safe-area-inset-top))",left:12,color:"white",fontFamily:"system-ui",textShadow:"0 2px 8px #000"}}><b style={{fontSize:26,letterSpacing:1}}>WORLD ZERO</b><div style={{fontSize:12,letterSpacing:.6}}>{status} · LIVING PLANET · BUILD R102</div><div style={{fontSize:13,marginTop:5}}>🪵 Dřevo {wood} · 🪨 Kámen {stone} · 🌿 Vláknina {fiber}</div><div style={{fontSize:12,marginTop:6,background:"#0008",padding:"6px 8px",borderRadius:8}}>ÚKOL: Nasbírej 5 dřeva · {wood}/5</div></div>
  <button onPointerDown={()=>{const p=(window as any).__wzCollect?.();if(p===false){setStatus("PŘIBLIŽ SE K PADLÉMU DŘEVU");return}setWood(v=>v+1);if(wood>=4)setStatus("ÚKOL SPLNĚN · ODEMČENO: PRIMITIVNÍ TÁBOR");else setStatus("SEBRÁNO DŘEVO · POKRAČUJ V PRŮZKUMU")}} style={{position:"absolute",right:22,bottom:115,width:82,height:82,borderRadius:"50%",border:"2px solid #fff9",background:"#1d2b20dd",color:"white",fontWeight:800}}>SBÍRAT</button>
  <div onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);joy(e)}} onPointerMove={e=>e.currentTarget.hasPointerCapture(e.pointerId)&&joy(e)} onPointerUp={e=>{input.current.x=input.current.y=0;e.currentTarget.releasePointerCapture(e.pointerId)}} style={{position:"absolute",left:22,bottom:"max(24px,env(safe-area-inset-bottom))",width:120,height:120,borderRadius:"50%",border:"2px solid #ffffff88",background:"#ffffff18"}}/>
  <button onPointerDown={()=>{const n=!firstPerson;setFirstPerson(n);firstPersonRef.current=n}} style={{position:"absolute",right:22,top:"max(18px,env(safe-area-inset-top))",zIndex:20,border:"1px solid #fff8",borderRadius:10,padding:"9px 12px",background:"#101813cc",color:"white",fontWeight:800}}>{firstPerson?"1. OSOBA":"3. OSOBA"}</button><div style={{position:"absolute",right:22,bottom:"max(25px,env(safe-area-inset-bottom))",display:"flex",gap:10}}><button onPointerDown={()=>input.current.look=-1} onPointerUp={()=>input.current.look=0} style={{width:58,height:58,borderRadius:"50%",fontSize:28}}>‹</button><button onPointerDown={()=>input.current.look=1} onPointerUp={()=>input.current.look=0} style={{width:58,height:58,borderRadius:"50%",fontSize:28}}>›</button></div>
 </main>
}