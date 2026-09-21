import React,{useEffect,useRef,useState} from "react";
import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader.js";

type Input={x:number;y:number;look:number};
export function WorldZeroGame(){
 const host=useRef<HTMLDivElement>(null),input=useRef<Input>({x:0,y:0,look:0});
 const [status,setStatus]=useState("REALISM 60 · REAL FOREST…"),[wood,setWood]=useState(0),[stone,setStone]=useState(0),[fiber,setFiber]=useState(0);
 useEffect(()=>{
  if(!host.current)return;
  const el=host.current,scene=new THREE.Scene();
  scene.background=new THREE.Color(0x9fb7bd);scene.fog=new THREE.FogExp2(0x9aa9a0,.0045);
  const camera=new THREE.PerspectiveCamera(58,1,.1,900);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xcfe2df,0x263225,1.25));
  const sun=new THREE.DirectionalLight(0xffe2b7,3.2);sun.position.set(-45,70,-25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-80;sun.shadow.camera.right=80;sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;scene.add(sun);
  const H=(x:number,z:number)=>Math.sin(x*.035)*1.4+Math.cos(z*.028)*1.1+Math.sin((x+z)*.012)*2.4;
  const g=new THREE.PlaneGeometry(700,700,150,150);g.rotateX(-Math.PI/2);const pa=g.attributes.position as THREE.BufferAttribute;
  for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i);pa.setY(i,H(x,z))}g.computeVertexNormals();
  const tex=new THREE.TextureLoader(), groundMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1});
  const loadTex=(url:string,kind:"map"|"normalMap"|"roughnessMap")=>tex.load(url,t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(70,70);if(kind==="map")t.colorSpace=THREE.SRGBColorSpace;(groundMat as any)[kind]=t;groundMat.needsUpdate=true});
  loadTex("/WORLD-ZERO/real-assets/forest_floor_diff_1k.jpg","map");loadTex("/WORLD-ZERO/real-assets/forest_floor_nor_gl_1k.jpg","normalMap");loadTex("/WORLD-ZERO/real-assets/forest_floor_rough_1k.jpg","roughnessMap");
  const ground=new THREE.Mesh(g,groundMat);ground.receiveShadow=true;scene.add(ground);
  new RGBELoader().load("/WORLD-ZERO/real-assets/mossy_forest_panorama.hdr",hdr=>{hdr.mapping=THREE.EquirectangularReflectionMapping;scene.environment=hdr;scene.background=hdr;scene.backgroundBlurriness=.18;});
  const gltf=new GLTFLoader();
  const scatterModel=(url:string,count:number,minR:number,maxR:number,scale:number)=>gltf.load(url,res=>{for(let i=0;i<count;i++){const o=res.scene.clone(true),a=i*2.399963+count*.17,r=minR+((i*47)%101)/100*(maxR-minR),x=Math.cos(a)*r,z=Math.sin(a)*r;o.position.set(x,H(x,z),z);o.rotation.y=a*1.7;o.scale.setScalar(scale*(.72+(i%7)*.075));o.traverse(v=>{if((v as THREE.Mesh).isMesh){(v as THREE.Mesh).castShadow=true;(v as THREE.Mesh).receiveShadow=true}});scene.add(o)}});
  scatterModel("/WORLD-ZERO/real-assets/models/pine_sapling_small.gltf",95,12,250,2.6);
  scatterModel("/WORLD-ZERO/real-assets/models/shrub_02.gltf",130,7,170,1.2);
  scatterModel("/WORLD-ZERO/real-assets/models/weed_plant_02.gltf",170,4,120,.85);
  scatterModel("/WORLD-ZERO/real-assets/models/tree_stump_01.gltf",24,14,150,1.4);
  scatterModel("/WORLD-ZERO/real-assets/models/rock_moss_set_01.gltf",45,9,160,1.25);
  // R59: no primitive fallback geometry; the forest is built only from real glTF assets.
  const collectibleWood:THREE.Mesh[]=[];
  const woodMat=new THREE.MeshStandardMaterial({color:0x5b3821,roughness:1});
  for(let i=0;i<18;i++){const a=i*2.399,r=6+(i%9)*4.2,x=Math.cos(a)*r,z=Math.sin(a)*r;
    const log=new THREE.Mesh(new THREE.CylinderGeometry(.13,.16,1.25,10),woodMat);log.rotation.z=Math.PI/2;log.rotation.y=a;log.position.set(x,H(x,z)+.18,z);log.castShadow=true;scene.add(log);collectibleWood.push(log)}
  // R60 articulated humanoid: torso, head, neck, arms, legs, hands, shoes and hair.
  const human=new THREE.Group();
  const cloth=new THREE.MeshStandardMaterial({color:0x26313a,roughness:.86});
  const pants=new THREE.MeshStandardMaterial({color:0x20252a,roughness:.9});
  const skin=new THREE.MeshStandardMaterial({color:0xb98569,roughness:.82});
  const shoe=new THREE.MeshStandardMaterial({color:0x17191b,roughness:.78});
  const hairMat=new THREE.MeshStandardMaterial({color:0x2b211b,roughness:1});
  const part=(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number)=>{const q=new THREE.Mesh(g,m);q.position.set(x,y,z);q.castShadow=true;human.add(q);return q};
  const torso=part(new THREE.CapsuleGeometry(.34,.72,8,14),cloth,0,1.78,0); torso.scale.set(1.05,1,.68);
  part(new THREE.CylinderGeometry(.12,.14,.18,12),skin,0,2.35,0);
  const head=part(new THREE.SphereGeometry(.285,20,16),skin,0,2.62,0); head.scale.set(.92,1.08,.9);
  const hair=part(new THREE.SphereGeometry(.292,20,12,0,Math.PI*2,0,Math.PI*.48),hairMat,0,2.67,0);
  const armG=new THREE.CapsuleGeometry(.105,.62,6,10), legG=new THREE.CapsuleGeometry(.14,.72,6,10);
  const armL=part(armG,cloth,-.45,1.82,0),armR=part(armG,cloth,.45,1.82,0);
  part(new THREE.SphereGeometry(.115,12,10),skin,-.45,1.38,0);part(new THREE.SphereGeometry(.115,12,10),skin,.45,1.38,0);
  const legL=part(legG,pants,-.18,.83,0),legR=part(legG,pants,.18,.83,0);
  const footL=part(new THREE.BoxGeometry(.25,.17,.42),shoe,-.18,.24,.09),footR=part(new THREE.BoxGeometry(.25,.17,.42),shoe,.18,.24,.09);
  human.position.set(0,H(0,0),0);human.scale.setScalar(.82);scene.add(human);
  (window as any).__wzCollect=()=>{let best:THREE.Mesh|undefined,dist=3.2;for(const o of collectibleWood){if(!o.visible)continue;const d=o.position.distanceTo(human.position);if(d<dist){dist=d;best=o}}if(!best)return false;best.visible=false;return true};
  const clock=new THREE.Clock();
  let yaw=0,last=performance.now();
  const birds:THREE.Mesh[]=[];const birdMat=new THREE.MeshBasicMaterial({color:0x171717});
  for(let i=0;i<9;i++){const b=new THREE.Mesh(new THREE.ConeGeometry(.12,.42,3),birdMat);b.rotation.x=Math.PI/2;scene.add(b);birds.push(b)}
  const windPlants:THREE.Object3D[]=[];scene.traverse(o=>{if(o!==ground&&o!==human&&o.position.y<4)windPlants.push(o)});
  const key=(e:KeyboardEvent,v:number)=>{if(e.code==="KeyW"||e.code==="ArrowUp")input.current.y=-v;if(e.code==="KeyS"||e.code==="ArrowDown")input.current.y=v;if(e.code==="KeyA")input.current.x=v;if(e.code==="KeyD")input.current.x=-v;if(e.code==="ArrowLeft")input.current.look=-v;if(e.code==="ArrowRight")input.current.look=v};
  const kd=(e:KeyboardEvent)=>key(e,1),ku=(e:KeyboardEvent)=>key(e,0);addEventListener("keydown",kd);addEventListener("keyup",ku);
  const loop=(now:number)=>{const dt=Math.min(.04,(now-last)/1000);last=now;const j=input.current;yaw+=j.look*dt*1.8;const f=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)),r=new THREE.Vector3(f.z,0,-f.x);
   human.position.addScaledVector(f,-j.y*dt*6);human.position.addScaledVector(r,-j.x*dt*6);human.position.y=H(human.position.x,human.position.z);const moving=Math.abs(j.x)+Math.abs(j.y)>.05;const gait=moving?Math.sin(now*.009)*.62:0;armL.rotation.x=gait;armR.rotation.x=-gait;legL.rotation.x=-gait*.72;legR.rotation.x=gait*.72;footL.rotation.x=-gait*.22;footR.rotation.x=gait*.22;human.rotation.y=yaw;if(Math.hypot(j.x,j.y)>.05)human.rotation.y=Math.atan2(-j.x,-j.y)+yaw;
   const cam=human.position.clone().addScaledVector(f,-11);cam.y+=4.8;camera.position.lerp(cam,1-Math.exp(-dt*8));camera.lookAt(human.position.x,human.position.y+1.5,human.position.z);
   const t=clock.getElapsedTime();sun.position.x=-45+Math.sin(t*.015)*18;sun.position.z=-25+Math.cos(t*.015)*18;
   birds.forEach((b,i)=>{const a=t*.12+i*.7,r=34+i*3;b.position.set(human.position.x+Math.cos(a)*r,18+i*.8+Math.sin(t+i),human.position.z+Math.sin(a)*r);b.rotation.z=-a});
   renderer.render(scene,camera);requestAnimationFrame(loop)};
  const resize=()=>{const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};resize();addEventListener("resize",resize);setStatus("REALISM 60 · DEN 1 · REAL FOREST");requestAnimationFrame(loop);
  return()=>{removeEventListener("resize",resize);removeEventListener("keydown",kd);removeEventListener("keyup",ku);delete (window as any).__wzCollect;renderer.dispose();el.replaceChildren()}
 },[]);
 const joy=(e:React.PointerEvent<HTMLDivElement>)=>{const r=e.currentTarget.getBoundingClientRect();input.current.x=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width*.35)));input.current.y=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(r.height*.35)))};
 return <main style={{position:"fixed",inset:0,overflow:"hidden",background:"#000",touchAction:"none"}}>
  <div ref={host} style={{position:"absolute",inset:0}}/>
  <div style={{position:"absolute",top:"max(12px,env(safe-area-inset-top))",left:12,color:"white",fontFamily:"system-ui",textShadow:"0 2px 8px #000"}}><b style={{fontSize:20}}>WORLD ZERO</b><div style={{fontSize:12}}>{status} · LIVING PLANET · BUILD R60</div><div style={{fontSize:13,marginTop:5}}>🪵 Dřevo {wood} · 🪨 Kámen {stone} · 🌿 Vláknina {fiber}</div><div style={{fontSize:12,marginTop:6,background:"#0008",padding:"6px 8px",borderRadius:8}}>ÚKOL: Nasbírej 5 dřeva · {wood}/5</div></div>
  <button onPointerDown={()=>{const p=(window as any).__wzCollect?.();if(p===false){setStatus("PŘIBLIŽ SE K PADLÉMU DŘEVU");return}setWood(v=>v+1);if(wood>=4)setStatus("ÚKOL SPLNĚN · ODEMČENO: PRIMITIVNÍ TÁBOR");else setStatus("SEBRÁNO DŘEVO · POKRAČUJ V PRŮZKUMU")}} style={{position:"absolute",right:22,bottom:115,width:82,height:82,borderRadius:"50%",border:"2px solid #fff9",background:"#1d2b20dd",color:"white",fontWeight:800}}>SBÍRAT</button>
  <div onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);joy(e)}} onPointerMove={e=>e.currentTarget.hasPointerCapture(e.pointerId)&&joy(e)} onPointerUp={e=>{input.current.x=input.current.y=0;e.currentTarget.releasePointerCapture(e.pointerId)}} style={{position:"absolute",left:22,bottom:"max(24px,env(safe-area-inset-bottom))",width:120,height:120,borderRadius:"50%",border:"2px solid #ffffff88",background:"#ffffff18"}}/>
  <div style={{position:"absolute",right:22,bottom:"max(25px,env(safe-area-inset-bottom))",display:"flex",gap:10}}><button onPointerDown={()=>input.current.look=-1} onPointerUp={()=>input.current.look=0} style={{width:58,height:58,borderRadius:"50%",fontSize:28}}>‹</button><button onPointerDown={()=>input.current.look=1} onPointerUp={()=>input.current.look=0} style={{width:58,height:58,borderRadius:"50%",fontSize:28}}>›</button></div>
 </main>
}