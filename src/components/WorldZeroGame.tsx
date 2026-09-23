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
  scene.background=new THREE.Color(0x7795a0);scene.fog=new THREE.FogExp2(0x9fb4b6,.00058);
  const camera=new THREE.PerspectiveCamera(50,1,.1,1600);
  let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:"default",preserveDrawingBuffer:true});}catch(err){console.error(err);setStatus("R102 · WEBGL NELZE SPUSTIT");setReady(true);return;}
  const mobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1:1.25));renderer.shadowMap.enabled=true;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.72;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xb8c9c5,0x10180f,.62));
  const sun=new THREE.DirectionalLight(0xffb56e,2.15);sun.position.set(-120,38,-80);sun.castShadow=true;sun.shadow.mapSize.set(mobile?512:1024,mobile?512:1024);sun.shadow.camera.left=-80;sun.shadow.camera.right=80;sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;scene.add(sun);
  const H=(x:number,z:number)=>{const overlook=10*Math.exp(-(x*x)/5200-(z*z)/2600);const valley=-58*Math.exp(-((x-35)*(x-35))/24000-((z+155)*(z+155))/17000);const farRise=Math.max(0,-z-235)*.07;return 5+overlook+Math.sin(x*.013)*3.2+Math.cos(z*.015)*2.4+Math.sin((x+z)*.006)*5.5+valley+farRise};
  const g=new THREE.PlaneGeometry(700,700,100,100);g.rotateX(-Math.PI/2);const pa=g.attributes.position as THREE.BufferAttribute;
  for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i);pa.setY(i,H(x,z))}g.computeVertexNormals();
  const tex=new THREE.TextureLoader(), groundMat=new THREE.MeshStandardMaterial({color:0x42513a,roughness:.96,metalness:0,vertexColors:true});
  const loadTex=(url:string,kind:"map"|"normalMap"|"roughnessMap")=>tex.load(url,t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(28,28);if(kind==="map")t.colorSpace=THREE.SRGBColorSpace;(groundMat as any)[kind]=t;groundMat.needsUpdate=true});
  /* R102: remove the orange leaf-photo albedo that dominated every previous build. */loadTex(`${import.meta.env.BASE_URL}real-assets/forest_floor_nor_gl_1k.jpg`,"normalMap");loadTex(`${import.meta.env.BASE_URL}real-assets/forest_floor_rough_1k.jpg`,"roughnessMap");
  const pos=g.attributes.position as THREE.BufferAttribute,cols:number[]=[];for(let i=0;i<pos.count;i++){const y=pos.getZ(i),x=pos.getX(i),z=-pos.getY(i),rock=Math.max(0,Math.min(1,(Math.abs(Math.sin(x*.031)+Math.cos(z*.027))-.55)*1.7));const cc=new THREE.Color().setRGB(.20+.18*rock,.27+.13*(1-rock),.18+.10*(1-rock));cols.push(cc.r,cc.g,cc.b)}g.setAttribute("color",new THREE.Float32BufferAttribute(cols,3));const ground=new THREE.Mesh(g,groundMat);ground.receiveShadow=true;scene.add(ground);
   const rockMat=new THREE.MeshStandardMaterial({color:0x56564d,roughness:.93});for(let i=0;i<34;i++){const a=i*2.399,r=5+(i%13)*2.1,x=Math.cos(a)*r,z=Math.sin(a)*r*.62-7;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.7+(i%5)*.34,0),rockMat);rock.scale.set(1.4+(i%3)*.4,.55+(i%4)*.22,1+(i%5)*.24);rock.position.set(x,H(x,z)+.25,z);rock.rotation.set(i*.31,i*.67,i*.19);rock.castShadow=rock.receiveShadow=true;scene.add(rock)}
  // R104: alpine valley composition visible from spawn: reflective lake + layered mountain skyline.
  const waterMat=new THREE.MeshPhysicalMaterial({color:0x1d5368,roughness:.10,metalness:.08,transparent:true,opacity:.94,clearcoat:.7,clearcoatRoughness:.18});
  const lakeShape=new THREE.Shape();for(let i=0;i<72;i++){const a=i/72*Math.PI*2,r=78+13*Math.sin(a*3)+8*Math.sin(a*7+.8),x=Math.cos(a)*r*1.45,y=Math.sin(a)*r*.62;i?lakeShape.lineTo(x,y):lakeShape.moveTo(x,y)}const lake=new THREE.Mesh(new THREE.ShapeGeometry(lakeShape,10),waterMat);lake.rotation.x=-Math.PI/2;lake.position.set(42,-13,-157);scene.add(lake);
  const river=new THREE.Mesh(new THREE.PlaneGeometry(38,210,1,12),waterMat);river.rotation.x=-Math.PI/2;river.rotation.z=-.27;river.position.set(-48,-12.6,-198);scene.add(river);
  const mountainMat=new THREE.MeshStandardMaterial({color:0x35464b,roughness:.97});
 const farMountainMat=new THREE.MeshStandardMaterial({color:0x526872,roughness:1});
 const snowMat=new THREE.MeshStandardMaterial({color:0xe8eeee,roughness:.82});
 const mountainRange=(z:number,baseY:number,phase:number,mat:THREE.Material,snowLine:number)=>{
   const geo=new THREE.PlaneGeometry(900,170,150,24);geo.rotateX(0);
   const p=geo.attributes.position as THREE.BufferAttribute;
   for(let i=0;i<p.count;i++){const x=p.getX(i),ly=p.getY(i),ridge=baseY+36+42*Math.abs(Math.sin(x*.0105+phase))+28*Math.abs(Math.sin(x*.022+phase*.7))+12*Math.sin(x*.049+phase);const v=(ly+85)/170;p.setY(i,baseY-34+v*(ridge-(baseY-34)));p.setZ(i,z-(1-v)*42-8*Math.sin(x*.018+phase));}
   geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,mat);scene.add(mesh);
   const cap=new THREE.BufferGeometry(),verts:number[]=[];
   for(let j=0;j<150;j++){const x0=-450+j*6,x1=x0+6;const peak=(x:number)=>baseY+36+42*Math.abs(Math.sin(x*.0105+phase))+28*Math.abs(Math.sin(x*.022+phase*.7))+12*Math.sin(x*.049+phase);const y0=peak(x0),y1=peak(x1),s0=Math.max(snowLine,y0-15),s1=Math.max(snowLine,y1-15);if(y0>snowLine||y1>snowLine)verts.push(x0,s0,z-1,x1,s1,z-1,x1,y1,z-3,x0,s0,z-1,x1,y1,z-3,x0,y0,z-3);}
   cap.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));cap.computeVertexNormals();scene.add(new THREE.Mesh(cap,snowMat));
 };
 mountainRange(-335,-42,.25,mountainMat,16);
 mountainRange(-410,-35,1.55,farMountainMat,19);
 mountainRange(-485,-29,2.75,mountainMat,23);
 const haze=new THREE.Mesh(new THREE.PlaneGeometry(900,210),new THREE.MeshBasicMaterial({color:0xbcc9ca,transparent:true,opacity:.035,depthWrite:false}));haze.position.set(0,44,-360);scene.add(haze);
 const cloudMat=new THREE.MeshBasicMaterial({color:0xf2f0e9,transparent:true,opacity:.16,depthWrite:false});
 for(let i=0;i<7;i++){const cloud=new THREE.Group();for(let k=0;k<5;k++){const puff=new THREE.Mesh(new THREE.SphereGeometry(9+(k%3)*5,12,7),cloudMat);puff.scale.set(2.1,.42,1);puff.position.set((k-2)*13,(k%2)*3,(k%3)*-3);cloud.add(puff)}cloud.position.set(-220+i*72,78+(i%3)*11,-300-(i%3)*44);scene.add(cloud)}
 const sunDisc=new THREE.Mesh(new THREE.SphereGeometry(5.4,20,14),new THREE.MeshBasicMaterial({color:0xffd49a}));sunDisc.position.set(-125,42,-260);scene.add(sunDisc);
  // R68 dense mossy forest floor: layered fern-like ground cover, never billboard wallpaper.
  const mossMat=new THREE.MeshStandardMaterial({color:0x334b2a,roughness:1});
  const fernMat=new THREE.MeshStandardMaterial({color:0x244326,roughness:.95,side:THREE.DoubleSide});
  for(let i=0;i<(mobile?70:140);i++){const a=i*2.399963,r=3+((i*71)%100)/100*145,x=Math.cos(a)*r,z=Math.sin(a)*r;
    const patch=new THREE.Mesh(new THREE.CircleGeometry(.16+(i%5)*.055,6),mossMat);patch.rotation.x=-Math.PI/2;patch.position.set(x,H(x,z)+.018,z);scene.add(patch);
    if(i%3===0){const fern=new THREE.Group();for(let k=0;k<6;k++){const leaf=new THREE.Mesh(new THREE.PlaneGeometry(.08,.5),fernMat);leaf.position.y=.18;leaf.rotation.z=(k-2.5)*.24;leaf.rotation.y=k*1.047;fern.add(leaf)}fern.position.set(x,H(x,z)+.02,z);fern.scale.setScalar(.55+(i%4)*.12);scene.add(fern)}
  }
  if(!mobile)new RGBELoader().load(`${import.meta.env.BASE_URL}real-assets/mossy_forest_panorama.hdr`,hdr=>{hdr.mapping=THREE.EquirectangularReflectionMapping;scene.environment=hdr;},undefined,e=>console.warn("HDR",e));
  const gltf=new GLTFLoader();
  gltf.load(`${import.meta.env.BASE_URL}real-assets/models/rock_moss_set_01.gltf`,res=>{for(let i=0;i<30;i++){const a=-1.48+i*.102,r=18+(i%7)*4.1,x=Math.sin(a)*r,z=-Math.cos(a)*r-26;const o=res.scene.clone(true);o.position.set(x,H(x,z)+.05,z);o.rotation.set(0,i*.79,0);o.scale.setScalar(.28+(i%5)*.07);o.traverse(v=>{if((v as THREE.Mesh).isMesh){(v as THREE.Mesh).castShadow=true;(v as THREE.Mesh).receiveShadow=true}});scene.add(o)}});

  const scatterModel=(url:string,count:number,minR:number,maxR:number,scale:number)=>gltf.load(url,res=>{for(let i=0;i<count;i++){const o=res.scene.clone(true),a=i*2.399963+count*.17,r=minR+((i*47)%101)/100*(maxR-minR),x=Math.cos(a)*r,z=Math.sin(a)*r;o.position.set(x,H(x,z),z);o.rotation.y=(a*1.7+(i%11)*.37)%(Math.PI*2);const v=.62+((i*37)%17)/20;o.scale.set(scale*v*(.88+(i%3)*.08),scale*v*(.82+(i%5)*.07),scale*v*(.9+(i%4)*.06));o.traverse(v=>{if((v as THREE.Mesh).isMesh){(v as THREE.Mesh).castShadow=true;(v as THREE.Mesh).receiveShadow=true}});scene.add(o)}});
  const trunkMat=new THREE.MeshStandardMaterial({color:0x3a281c,roughness:1});
  const needleMats=[0x173522,0x21452b,0x294e30].map(color=>new THREE.MeshStandardMaterial({color,roughness:.96}));
  const maturePine=(x:number,z:number,h:number,variant:number)=>{const grp=new THREE.Group();grp.position.set(x,H(x,z),z);const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16*h/10,.28*h/10,h*.72,7),trunkMat);trunk.position.y=h*.36;grp.add(trunk);const mat=needleMats[variant%needleMats.length];for(let k=0;k<5;k++){const t=k/4,rad=h*(.24-t*.115),crown=new THREE.Mesh(new THREE.ConeGeometry(rad,h*.31,9),mat);crown.position.y=h*(.47+k*.115);crown.rotation.y=variant*.71+k*.37;grp.add(crown)}grp.rotation.y=variant*.73;scene.add(grp)};
  for(let i=0;i<(mobile?180:420);i++){const a=i*2.399963+(i%7)*.09,r=26+((i*53)%101)/100*320;let x=Math.cos(a)*r,z=Math.sin(a)*r;if(z<-70&&Math.abs(x)<58)x+=(x<0?-1:1)*(62+(i%9)*3);maturePine(x,z,8.5+(i%11)*.72,i)}

  scatterModel(`${import.meta.env.BASE_URL}real-assets/models/shrub_02.gltf`,mobile?120:320,10,250,.78);
  scatterModel(`${import.meta.env.BASE_URL}real-assets/models/weed_plant_02.gltf`,mobile?28:90,8,95,.38);
  scatterModel(`${import.meta.env.BASE_URL}real-assets/models/tree_stump_01.gltf`,mobile?3:10,75,145,.72);
  scatterModel(`${import.meta.env.BASE_URL}real-assets/models/rock_moss_set_01.gltf`,mobile?12:45,70,220,.58);
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
    const scale=1.84/Math.max(.01,size.y); humanModel.scale.setScalar(scale); humanModel.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale); humanModel.rotation.y=0;
    human.add(humanModel);
    const pack=new THREE.Group();
    const packMat=new THREE.MeshStandardMaterial({color:0x202a25,roughness:.86});
    const bag=new THREE.Mesh(new THREE.CapsuleGeometry(.19,.34,6,10),packMat);bag.scale.set(1.05,1.25,.62);bag.position.set(0,1.17,-.13);bag.rotation.x=-.10;pack.add(bag);
    const roll=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.38,12),packMat);roll.rotation.z=Math.PI/2;roll.position.set(0,1.48,-.13);pack.add(roll);
    const strapMat=new THREE.MeshStandardMaterial({color:0x111713,roughness:1});
    for(const sx of [-.17,.17]){const s=new THREE.Mesh(new THREE.BoxGeometry(.035,.58,.035),strapMat);s.position.set(sx,1.16,-.08);pack.add(s);}
    human.add(pack);
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
   human.visible=!firstPersonRef.current; if(firstPersonRef.current){const eye=human.position.clone();eye.y+=1.67;camera.position.lerp(eye,1-Math.exp(-dt*12));camera.lookAt(eye.clone().addScaledVector(f,8));}else{const cam=human.position.clone().addScaledVector(f,-6.6);cam.y+=3.05;camera.position.lerp(cam,1-Math.exp(-dt*8));const target=human.position.clone().add(new THREE.Vector3(0,1.15,0)).addScaledVector(f,125);camera.lookAt(target);}
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