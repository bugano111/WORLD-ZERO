import React,{useEffect,useRef,useState} from "react";
import * as THREE from "three";

type Input={x:number;y:number;look:number};
export function WorldZeroGame(){
 const host=useRef<HTMLDivElement>(null),input=useRef<Input>({x:0,y:0,look:0});
 const [status,setStatus]=useState("DEN 1 · ČLOVĚK V DIVOČINĚ"),[wood,setWood]=useState(0),[stone,setStone]=useState(0),[flint,setFlint]=useState(0),[fiber,setFiber]=useState(0),[fire,setFire]=useState(false),[near,setNear]=useState<"wood"|"stone"|"flint"|"fiber"|null>(null);
 const gather=useRef<()=>void>(()=>{});
 useEffect(()=>{
  if(!host.current)return;
  const el=host.current,scene=new THREE.Scene();
  scene.background=new THREE.Color(0xa9c6d6);scene.fog=new THREE.FogExp2(0xa8bac0,.00125);
  const camera=new THREE.PerspectiveCamera(72,1,.1,4000);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.92;renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xcfe5ef,0x394333,1.15));
  const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(10,24,16),new THREE.MeshBasicMaterial({color:0xffe7b0}));sunDisc.position.set(-260,330,-650);scene.add(sunDisc);
  const sun=new THREE.DirectionalLight(0xffefd0,3.1);sun.position.set(-90,140,55);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-180;sun.shadow.camera.right=180;sun.shadow.camera.top=180;sun.shadow.camera.bottom=-180;scene.add(sun);

  const H=(x:number,z:number)=>Math.sin(x*.009)*8+Math.cos(z*.012)*6+Math.sin((x+z)*.021)*2.2-Math.exp(-((x-40)**2+(z+60)**2)/18000)*13;
  const geo=new THREE.PlaneGeometry(1800,1800,240,240);geo.rotateX(-Math.PI/2);
  const p=geo.attributes.position as THREE.BufferAttribute;const cols:number[]=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=H(x,z);p.setY(i,y);const rock=y>11,low=y<-5;const c=new THREE.Color(rock?0x676861:low?0x52634a:y>5?0x465b38:0x3c5935);c.offsetHSL(0,0,(Math.sin(x*.11+z*.07))*0.025);cols.push(c.r,c.g,c.b)}
  geo.setAttribute("color",new THREE.Float32BufferAttribute(cols,3));geo.computeVertexNormals();
  const ground=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94,metalness:0}));ground.receiveShadow=true;scene.add(ground);

  const cloudMat=new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.68,roughness:1,depthWrite:false});
  for(let i=0;i<18;i++){const cg=new THREE.Group();for(let q=0;q<5;q++){const cm=new THREE.Mesh(new THREE.SphereGeometry(7+(q%3)*3,12,8),cloudMat);cm.scale.set(2.2,.55,1);cm.position.set(q*7,Math.sin(q)*2,0);cg.add(cm)}cg.position.set(-300+(i%6)*125,90+(i%3)*9,-260+Math.floor(i/6)*190);scene.add(cg)}
  const water=new THREE.Mesh(new THREE.PlaneGeometry(1100,520),new THREE.MeshPhysicalMaterial({color:0x284f5c,roughness:.08,metalness:0,transparent:true,opacity:.82,clearcoat:1,clearcoatRoughness:.08}));
  water.rotation.x=-Math.PI/2;water.position.set(260,-6.2,-470);scene.add(water);

  const bark=new THREE.MeshStandardMaterial({color:0x3c2b20,roughness:1});
  const leaf=[0x27452d,0x31533a,0x3c6041].map(v=>new THREE.MeshStandardMaterial({color:v,roughness:.95}));
  const tree=(x:number,z:number,s=1)=>{const g=new THREE.Group(),h=(8+Math.random()*5)*s;
   const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.35*s,.65*s,h,10),bark);trunk.position.y=h/2;trunk.castShadow=true;g.add(trunk);
   for(let b=0;b<11;b++){const a=b*2.399,r=1.2+(b%4)*.55,y=h*.48+(b%5)*h*.09;
    const br=new THREE.Mesh(new THREE.CylinderGeometry(.08*s,.16*s,3.8*s,7),bark);br.position.set(Math.cos(a)*r*.45,y,Math.sin(a)*r*.45);br.rotation.z=Math.PI/2.7;br.rotation.y=-a;br.castShadow=true;g.add(br);
    for(let q=0;q<3;q++){const crown=new THREE.Mesh(new THREE.SphereGeometry((1.35+q*.25)*s,8,6),leaf[(b+q)%3]);crown.scale.set(1.65,.48,.82+(b%3)*.12);crown.rotation.set((b%2)*.18,a*.13,(q-1)*.11);crown.position.set(Math.cos(a)*(r+q*.65),y+q*.6,Math.sin(a)*(r+q*.65));crown.castShadow=true;g.add(crown)}
   }g.position.set(x,H(x,z),z);scene.add(g)};
  for(let i=0;i<230;i++){const a=i*2.399,r=35+(i%47)*6.8,x=Math.cos(a)*r+(i%5)*28,z=Math.sin(a)*r-35;if(Math.hypot(x,z)>24)tree(x,z,.7+(i%7)*.08)}

  const rockMat=new THREE.MeshStandardMaterial({color:0x686963,roughness:.95});
  const resourceRocks:THREE.Mesh[]=[];
  for(let i=0;i<150;i++){const a=i*4.17,r=22+(i%39)*8,x=Math.cos(a)*r,z=Math.sin(a)*r;const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.5+(i%6)*.18,1),rockMat);m.scale.set(1.3,.65,1);m.position.set(x,H(x,z)+.3,z);m.rotation.set(i*.3,i*.7,0);m.castShadow=true;scene.add(m);resourceRocks.push(m)}

  const human=new THREE.Group(),skin=new THREE.MeshStandardMaterial({color:0xb88768,roughness:.8}),cloth=new THREE.MeshStandardMaterial({color:0x3d4742,roughness:1}),pants=new THREE.MeshStandardMaterial({color:0x242a2d,roughness:1});
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.48,1.05,6,10),cloth);torso.position.y=2.05;human.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.38,16,12),skin);head.scale.set(.86,1.08,.9);head.position.y=3.35;human.add(head);
  const arm=(x:number)=>{const m=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.95,5,8),skin);m.position.set(x,2.05,0);human.add(m);return m};
  const leg=(x:number)=>{const m=new THREE.Mesh(new THREE.CapsuleGeometry(.17,1.05,5,8),pants);m.position.set(x,.72,0);human.add(m);return m};
  const la=arm(-.62),ra=arm(.62),ll=leg(-.25),rl=leg(.25);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.39,16,10,0,Math.PI*2,0,Math.PI*.48),new THREE.MeshStandardMaterial({color:0x2b201a,roughness:1}));hair.position.y=3.47;human.add(hair);
  const shoeMat=new THREE.MeshStandardMaterial({color:0x171717,roughness:.85});
  const shoeL=new THREE.Mesh(new THREE.BoxGeometry(.34,.18,.58),shoeMat),shoeR=shoeL.clone();shoeL.position.set(-.25,.08,.12);shoeR.position.set(.25,.08,.12);human.add(shoeL,shoeR);
  [torso,head,la,ra,ll,rl,hair,shoeL,shoeR].forEach(m=>m.castShadow=true);scene.add(human);
  human.position.set(0,H(0,0),0);
  let woodCount=0,stoneCount=0,flintCount=0,fiberCount=0,gatherCooldown=0;const fires:THREE.Mesh[]=[];
  gather.current=()=>{if(gatherCooldown>0)return;let bestRock:THREE.Mesh|null=null,rd=3.2;for(const r of resourceRocks){if(!r.visible)continue;const d=Math.hypot(r.position.x-human.position.x,r.position.z-human.position.z);if(d<rd){rd=d;bestRock=r}}if(bestRock){bestRock.visible=false;if((stoneCount+flintCount)%3===1){flintCount++;setFlint(flintCount);setStatus('OBJEV: PAZOURKOVÝ KÁMEN · TVRDÝ, OSTRÝ, JISKŘÍ')}else{stoneCount++;setStone(stoneCount)}gatherCooldown=.45;return}let bestTree:THREE.Object3D|null=null,td=3.8;for(const o of scene.children){if(!(o instanceof THREE.Group)||o===human||!o.visible)continue;const d=Math.hypot(o.position.x-human.position.x,o.position.z-human.position.z);if(d<td&&o.position.y<30){td=d;bestTree=o}}if(bestTree){woodCount++;setWood(woodCount);gatherCooldown=.45;setStatus("NALEZENO DŘEVO · ZKOUŠEJ, KOMBINUJ, OBJEVUJ")}};


  const stickMat=new THREE.MeshStandardMaterial({color:0x5b3b25,roughness:1});
  for(let i=0;i<70;i++){const a=i*2.17,r=12+(i%35)*4.1,x=Math.cos(a)*r,z=Math.sin(a)*r;const st=new THREE.Mesh(new THREE.CylinderGeometry(.045,.065,1.4+(i%4)*.25,6),stickMat);st.rotation.z=Math.PI/2;st.rotation.y=a;st.position.set(x,H(x,z)+.08,z);st.castShadow=true;scene.add(st)}
  const fiberMat=new THREE.MeshStandardMaterial({color:0x66854b,roughness:1,side:THREE.DoubleSide});
  for(let i=0;i<120;i++){const a=i*1.71,r=10+(i%60)*3.2,x=Math.cos(a)*r,z=Math.sin(a)*r;const fg=new THREE.Group();for(let q=0;q<5;q++){const leafBlade=new THREE.Mesh(new THREE.PlaneGeometry(.12,.95),fiberMat);leafBlade.position.y=.45;leafBlade.rotation.y=q*1.256;leafBlade.rotation.z=(q-2)*.12;fg.add(leafBlade)}fg.position.set(x,H(x,z),z);scene.add(fg)}
  const birdMat=new THREE.MeshStandardMaterial({color:0x202426,roughness:.9});
  const birds:THREE.Group[]=[];for(let i=0;i<9;i++){const bg=new THREE.Group();const b1=new THREE.Mesh(new THREE.PlaneGeometry(.65,.16),birdMat),b2=b1.clone();b1.rotation.z=.25;b2.rotation.z=-.25;b1.position.x=-.32;b2.position.x=.32;bg.add(b1,b2);scene.add(bg);birds.push(bg)}
  const grassMat=new THREE.MeshStandardMaterial({color:0x496742,side:THREE.DoubleSide,roughness:1});
  const blade=new THREE.PlaneGeometry(.08,.7);blade.translate(0,.35,0);const inst=new THREE.InstancedMesh(blade,grassMat,9500),dummy=new THREE.Object3D();
  for(let i=0;i<9500;i++){const a=i*2.399,r=8+(i%240)*2.2,x=Math.cos(a)*r,z=Math.sin(a)*r;dummy.position.set(x,H(x,z),z);dummy.rotation.y=(i*.73)%6.28;dummy.scale.y=.55+(i%9)*.08;dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix)}scene.add(inst);

  let yaw=0,last=performance.now();const clock=(now:number)=>{const dt=Math.min(.04,(now-last)/1000);last=now;const j=input.current;
   yaw+=j.look*dt*1.5;gatherCooldown=Math.max(0,gatherCooldown-dt);const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)),right=new THREE.Vector3(forward.z,0,-forward.x);
   human.position.addScaledVector(forward,-j.y*dt*7);human.position.addScaledVector(right,-j.x*dt*7);human.position.y=H(human.position.x,human.position.z);
   let nr:"wood"|"stone"|"flint"|"fiber"|null=null,rd=3.2;for(const r of resourceRocks){if(r.visible){const d=Math.hypot(r.position.x-human.position.x,r.position.z-human.position.z);if(d<rd){rd=d;nr="stone"}}}if(!nr){let td=3.8;for(const o of scene.children){if(o instanceof THREE.Group&&o!==human&&o.visible){const d=Math.hypot(o.position.x-human.position.x,o.position.z-human.position.z);if(d<td){td=d;nr="wood"}}}}setNear(prev=>prev===nr?prev:nr);
   const moving=Math.abs(j.x)+Math.abs(j.y)>.1,t=now*.008;if(moving){la.rotation.x=Math.sin(t)*.7;ra.rotation.x=-Math.sin(t)*.7;ll.rotation.x=-Math.sin(t)*.55;rl.rotation.x=Math.sin(t)*.55}else{la.rotation.x=ra.rotation.x=ll.rotation.x=rl.rotation.x=0}
   const back=forward.clone().multiplyScalar(16);camera.position.set(human.position.x-back.x,human.position.y+6.0,human.position.z-back.z);camera.lookAt(human.position.x,human.position.y+1.72,human.position.z);camera.updateMatrixWorld(true);
   for(let i=0;i<birds.length;i++){const a=now*.00012+i*.7,r=55+i*5;birds[i].position.set(human.position.x+Math.cos(a)*r,H(human.position.x,human.position.z)+24+(i%3)*4,human.position.z+Math.sin(a)*r);birds[i].rotation.y=-a}water.material.opacity=.80+Math.sin(now*.0007)*.025;water.position.y=-6.2+Math.sin(now*.00045)*.05;renderer.render(scene,camera);requestAnimationFrame(clock)};
  const resize=()=>{const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);el.style.width=w+"px";el.style.height=h+"px";renderer.domElement.style.display="block";renderer.domElement.style.position="absolute";renderer.domElement.style.left="0";renderer.domElement.style.top="0";renderer.domElement.style.width="100%";renderer.domElement.style.height="100%";renderer.setSize(w,h,false);renderer.setViewport(0,0,w,h);camera.clearViewOffset();camera.aspect=w/h;camera.updateProjectionMatrix()};resize();addEventListener("resize",resize);requestAnimationFrame(clock);
  return()=>{removeEventListener("resize",resize);renderer.dispose();el.replaceChildren()}
 },[]);
 const joy=(e:React.PointerEvent<HTMLDivElement>)=>{const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/(r.width*.35),y=(e.clientY-r.top-r.height/2)/(r.height*.35);input.current.x=Math.max(-1,Math.min(1,x));input.current.y=Math.max(-1,Math.min(1,y))};
 return <main style={{position:"fixed",inset:0,overflow:"hidden",background:"#000",touchAction:"none"}}>
  <div ref={host} style={{position:"absolute",inset:0}}/>
  <div style={{position:"absolute",top:"max(12px,env(safe-area-inset-top))",left:12,color:"white",fontFamily:"system-ui",textShadow:"0 2px 8px #000"}}><b style={{fontSize:20}}>WORLD ZERO</b><div style={{fontSize:12,opacity:.9}}>{status} · DISCOVERY SIMULATION · REALISM 8</div><div style={{marginTop:6,fontSize:13}}>Dřevo {wood} · Kámen {stone} · Pazourek {flint} · Vlákno {fiber}</div></div>
  {flint>=2&&!fire&&<button onPointerDown={e=>{e.preventDefault();setFire(true);setFlint(v=>v-2);setStatus("OBJEV: JISKRA → OHEŇ · BEZ OHNIŠTĚ HROZÍ POŽÁR");const flame=new THREE.Mesh(new THREE.ConeGeometry(.35,1.15,10),new THREE.MeshStandardMaterial({color:0xff6b18,emissive:0xff3300,emissiveIntensity:2}));flame.position.set(human.position.x,H(human.position.x,human.position.z)+.55,human.position.z);scene.add(flame);fires.push(flame)}} style={{position:"absolute",right:24,bottom:"max(210px,calc(env(safe-area-inset-bottom) + 210px))",padding:"12px 15px",borderRadius:18,border:"2px solid #ffd27a",background:"#5b281ddd",color:"white",fontWeight:800,zIndex:5}}>KŘESAT PAZOURKY</button>}
  {near&&<button onPointerDown={e=>{e.preventDefault();gather.current()}} style={{position:"absolute",right:24,bottom:"max(112px,calc(env(safe-area-inset-bottom) + 112px))",width:86,height:86,borderRadius:"50%",border:"2px solid #ffffffaa",background:"#1d2b20dd",color:"white",fontWeight:800,fontSize:13,zIndex:5}}>SBÍRAT<br/>{near==="stone"?"KÁMEN":near==="flint"?"PAZOUREK":near==="fiber"?"VLÁKNO":"DŘEVO"}</button>}
  <div onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);joy(e)}} onPointerMove={e=>e.currentTarget.hasPointerCapture(e.pointerId)&&joy(e)} onPointerUp={e=>{input.current.x=input.current.y=0;e.currentTarget.releasePointerCapture(e.pointerId)}} style={{position:"absolute",left:22,bottom:"max(24px,env(safe-area-inset-bottom))",width:120,height:120,borderRadius:"50%",border:"2px solid #ffffff88",background:"#ffffff18"}}/>
  <div style={{position:"absolute",right:22,bottom:"max(35px,env(safe-area-inset-bottom))",display:"flex",gap:12}}>
   <button onPointerDown={()=>input.current.look=-1} onPointerUp={()=>input.current.look=0} onPointerCancel={()=>input.current.look=0} style={{width:58,height:58,borderRadius:"50%",fontSize:28}}>‹</button>
   <button onPointerDown={()=>input.current.look=1} onPointerUp={()=>input.current.look=0} onPointerCancel={()=>input.current.look=0} style={{width:58,height:58,borderRadius:"50%",fontSize:28}}>›</button>
  </div>
 </main>
}