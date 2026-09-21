import React,{useEffect,useRef,useState} from "react";
import * as THREE from "three";

type Input={x:number;y:number;look:number};
export function WorldZeroGame(){
 const host=useRef<HTMLDivElement>(null),input=useRef<Input>({x:0,y:0,look:0});
 const [status,setStatus]=useState("REALISM 55 · NAČÍTÁM SVĚT…"),[wood,setWood]=useState(0),[stone,setStone]=useState(0);
 useEffect(()=>{
  if(!host.current)return;
  const el=host.current,scene=new THREE.Scene();
  scene.background=new THREE.Color(0x9fb7bd);scene.fog=new THREE.FogExp2(0x91a5a0,.006);
  const camera=new THREE.PerspectiveCamera(58,1,.1,900);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xcfe2df,0x263225,1.25));
  const sun=new THREE.DirectionalLight(0xffe2b7,3.2);sun.position.set(-45,70,-25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-80;sun.shadow.camera.right=80;sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;scene.add(sun);
  const H=(x:number,z:number)=>Math.sin(x*.035)*1.4+Math.cos(z*.028)*1.1+Math.sin((x+z)*.012)*2.4;
  const g=new THREE.PlaneGeometry(700,700,150,150);g.rotateX(-Math.PI/2);const pa=g.attributes.position as THREE.BufferAttribute;
  for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i);pa.setY(i,H(x,z))}g.computeVertexNormals();
  const ground=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x354b2e,roughness:.98}));ground.receiveShadow=true;scene.add(ground);
  const trunkMat=new THREE.MeshStandardMaterial({color:0x4b3524,roughness:1}),leafMat=new THREE.MeshStandardMaterial({color:0x29452b,roughness:.92});
  const trees:THREE.Group[]=[];
  for(let i=0;i<180;i++){const a=i*2.399963,r=18+((i*47)%100)/100*260,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<7&&z>-12&&z<55)continue;
   const t=new THREE.Group(),h=5+(i%9)*.55;const tr=new THREE.Mesh(new THREE.CylinderGeometry(.28,.48,h,8),trunkMat);tr.position.y=h/2;tr.castShadow=true;t.add(tr);
   for(let q=0;q<3;q++){const c=new THREE.Mesh(new THREE.ConeGeometry(2.2-q*.35,3.8,9),leafMat);c.position.y=h-1+q*1.5;c.castShadow=true;t.add(c)}
   t.position.set(x,H(x,z),z);t.rotation.y=a;t.scale.setScalar(.75+(i%7)*.06);scene.add(t);trees.push(t);
  }
  const rockMat=new THREE.MeshStandardMaterial({color:0x676c63,roughness:.96});const rocks:THREE.Mesh[]=[];
  for(let i=0;i<90;i++){const a=i*3.73,r=10+((i*29)%100)/100*180,x=Math.cos(a)*r,z=Math.sin(a)*r;const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.45+(i%5)*.16,0),rockMat);m.scale.set(1.4,.65,1);m.position.set(x,H(x,z)+.3,z);m.rotation.set(i*.2,i*.7,0);m.castShadow=true;scene.add(m);rocks.push(m)}
  const grassMat=new THREE.MeshStandardMaterial({color:0x45623a,side:THREE.DoubleSide,roughness:1});
  for(let i=0;i<700;i++){const a=i*2.399,r=4+Math.sqrt(i/700)*150,x=Math.cos(a)*r,z=Math.sin(a)*r;const blade=new THREE.Mesh(new THREE.PlaneGeometry(.16,.65),grassMat);blade.position.set(x,H(x,z)+.32,z);blade.rotation.y=a*1.7;scene.add(blade)}
  const human=new THREE.Group(),cloth=new THREE.MeshStandardMaterial({color:0x343936,roughness:1}),skin=new THREE.MeshStandardMaterial({color:0xa87960,roughness:.9});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.38,.9,6,10),cloth);body.position.y=1.65;const head=new THREE.Mesh(new THREE.SphereGeometry(.3,14,10),skin);head.position.y=2.65;human.add(body,head);human.position.set(0,H(0,0),0);scene.add(human);
  let yaw=0,last=performance.now();
  const key=(e:KeyboardEvent,v:number)=>{if(e.code==="KeyW"||e.code==="ArrowUp")input.current.y=-v;if(e.code==="KeyS"||e.code==="ArrowDown")input.current.y=v;if(e.code==="KeyA")input.current.x=v;if(e.code==="KeyD")input.current.x=-v;if(e.code==="ArrowLeft")input.current.look=-v;if(e.code==="ArrowRight")input.current.look=v};
  const kd=(e:KeyboardEvent)=>key(e,1),ku=(e:KeyboardEvent)=>key(e,0);addEventListener("keydown",kd);addEventListener("keyup",ku);
  const loop=(now:number)=>{const dt=Math.min(.04,(now-last)/1000);last=now;const j=input.current;yaw+=j.look*dt*1.8;const f=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)),r=new THREE.Vector3(f.z,0,-f.x);
   human.position.addScaledVector(f,-j.y*dt*6);human.position.addScaledVector(r,-j.x*dt*6);human.position.y=H(human.position.x,human.position.z);if(Math.hypot(j.x,j.y)>.05)human.rotation.y=Math.atan2(-j.x,-j.y)+yaw;
   const cam=human.position.clone().addScaledVector(f,-11);cam.y+=4.8;camera.position.lerp(cam,1-Math.exp(-dt*8));camera.lookAt(human.position.x,human.position.y+1.5,human.position.z);renderer.render(scene,camera);requestAnimationFrame(loop)};
  const resize=()=>{const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};resize();addEventListener("resize",resize);setStatus("REALISM 55 · DEN 1 · NOVÝ SVĚT");requestAnimationFrame(loop);
  return()=>{removeEventListener("resize",resize);removeEventListener("keydown",kd);removeEventListener("keyup",ku);renderer.dispose();el.replaceChildren()}
 },[]);
 const joy=(e:React.PointerEvent<HTMLDivElement>)=>{const r=e.currentTarget.getBoundingClientRect();input.current.x=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width*.35)));input.current.y=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(r.height*.35)))};
 return <main style={{position:"fixed",inset:0,overflow:"hidden",background:"#000",touchAction:"none"}}>
  <div ref={host} style={{position:"absolute",inset:0}}/>
  <div style={{position:"absolute",top:"max(12px,env(safe-area-inset-top))",left:12,color:"white",fontFamily:"system-ui",textShadow:"0 2px 8px #000"}}><b style={{fontSize:20}}>WORLD ZERO</b><div style={{fontSize:12}}>{status} · LIVING PLANET · BUILD R55</div><div style={{fontSize:13,marginTop:5}}>Dřevo {wood} · Kámen {stone}</div></div>
  <button onPointerDown={()=>{setWood(v=>v+1);setStatus("NALEZENO DŘEVO · OBJEVUJ A PŘEŽIJ")}} style={{position:"absolute",right:22,bottom:115,width:82,height:82,borderRadius:"50%",border:"2px solid #fff9",background:"#1d2b20dd",color:"white",fontWeight:800}}>SBÍRAT</button>
  <div onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);joy(e)}} onPointerMove={e=>e.currentTarget.hasPointerCapture(e.pointerId)&&joy(e)} onPointerUp={e=>{input.current.x=input.current.y=0;e.currentTarget.releasePointerCapture(e.pointerId)}} style={{position:"absolute",left:22,bottom:"max(24px,env(safe-area-inset-bottom))",width:120,height:120,borderRadius:"50%",border:"2px solid #ffffff88",background:"#ffffff18"}}/>
  <div style={{position:"absolute",right:22,bottom:"max(25px,env(safe-area-inset-bottom))",display:"flex",gap:10}}><button onPointerDown={()=>input.current.look=-1} onPointerUp={()=>input.current.look=0} style={{width:58,height:58,borderRadius:"50%",fontSize:28}}>‹</button><button onPointerDown={()=>input.current.look=1} onPointerUp={()=>input.current.look=0} style={{width:58,height:58,borderRadius:"50%",fontSize:28}}>›</button></div>
 </main>
}