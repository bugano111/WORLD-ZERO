import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";

type InputState = {
  joystick: { x: number; y: number };
  camera: number;
};

type Point = { x: number; z: number };

function safelyCapturePointer(element: HTMLElement, pointerId: number) {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Some mobile Safari versions reject capture during synthesized touch events.
  }
}

const COLORS = {
  sky: "#9ccfe3",
  haze: "#d5e8dc",
  grass: "#6f9849",
  grassFar: "#88a957",
  grassDark: "#547c3d",
  bark: "#755036",
  leaves: "#315f36",
  leavesLight: "#477b40",
  stone: "#737b70",
  stoneLight: "#a4aa9e",
  skin: "#d7a57a",
  player: "#c8563f",
  trousers: "#263e36",
  npc: "#d2a13f",
  hat: "#6f4c35",
  shadow: "rgba(24, 35, 24, 0.28)",
} as const;

const TREES: Point[] = [
  { x: -8, z: -9 }, { x: -3, z: -12 }, { x: 5, z: -10 },
  { x: 10, z: -6 }, { x: -11, z: 0 }, { x: 11, z: 2 },
  { x: -8, z: 8 }, { x: 7, z: 9 }, { x: 1, z: 13 },
];

const ROCKS: Point[] = [
  { x: -5, z: -3 }, { x: 6, z: -5 }, { x: -9, z: 5 },
  { x: 4, z: 7 }, { x: 10, z: 10 },
];
const LOOSE_STONES: Point[] = [
  { x: -1.3, z: 3.6 }, { x: 3.8, z: 4.4 }, { x: -4.7, z: 6.3 }, { x: 6.1, z: 7.7 },
];
const STICKS: Point[] = [
  { x: -2.2, z: 4.2 }, { x: 2.8, z: 5.4 }, { x: -6.2, z: 7.1 },
  { x: 7.4, z: 3.5 }, { x: 1.2, z: -2.1 },
];

function drawStick(ctx: CanvasRenderingContext2D,x:number,y:number,scale:number){
  ellipse(ctx,x+2*scale,y+2*scale,14*scale,3.5*scale,"rgba(20,35,20,.24)");
  ctx.strokeStyle="#66442d"; ctx.lineWidth=Math.max(2.4,3.4*scale); ctx.lineCap="round";
  ctx.beginPath();ctx.moveTo(x-15*scale,y+1*scale);ctx.lineTo(x+14*scale,y-7*scale);ctx.stroke();
  ctx.strokeStyle="#8a6240";ctx.lineWidth=Math.max(1,1.2*scale);
  ctx.beginPath();ctx.moveTo(x-10*scale,y-1*scale);ctx.lineTo(x+9*scale,y-6*scale);ctx.stroke();
  ctx.strokeStyle="#5c3d29";ctx.lineWidth=Math.max(1.6,2.1*scale);
  ctx.beginPath();ctx.moveTo(x+1*scale,y-4*scale);ctx.lineTo(x+8*scale,y-13*scale);ctx.moveTo(x-5*scale,y-2*scale);ctx.lineTo(x-10*scale,y-9*scale);ctx.stroke();
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function polygon(ctx: CanvasRenderingContext2D, points: Array<[number, number]>, color: string) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawTree(ctx: CanvasRenderingContext2D,x:number,y:number,s:number){
  // physically grounded cast shadow
  ctx.save();ctx.translate(x,y);ctx.scale(1,.28);
  const sh=ctx.createRadialGradient(8*s,8*s,2,8*s,8*s,38*s);
  sh.addColorStop(0,"rgba(10,18,10,.42)");sh.addColorStop(1,"rgba(10,18,10,0)");
  ctx.fillStyle=sh;ctx.beginPath();ctx.arc(8*s,8*s,38*s,0,Math.PI*2);ctx.fill();ctx.restore();

  // roots
  [[-5,-1,-27,5],[5,-1,28,4],[-2,-2,-13,10]].forEach(r=>{
    const g=ctx.createLinearGradient(x+r[0]*s,y,x+r[2]*s,y);
    g.addColorStop(0,"#684832");g.addColorStop(1,"#3d2a20");
    ctx.strokeStyle=g;ctx.lineWidth=5*s;ctx.lineCap="round";ctx.beginPath();
    ctx.moveTo(x+r[0]*s,y+r[1]*s);ctx.lineTo(x+r[2]*s,y+r[3]*s);ctx.stroke();
  });

  // cylindrical tapered trunk, gradient gives actual volume
  const tg=ctx.createLinearGradient(x-11*s,0,x+11*s,0);
  tg.addColorStop(0,"#3b291f");tg.addColorStop(.24,"#755038");tg.addColorStop(.48,"#9a704d");
  tg.addColorStop(.72,"#62432f");tg.addColorStop(1,"#30221b");
  ctx.fillStyle=tg;ctx.beginPath();
  ctx.moveTo(x-10*s,y);ctx.bezierCurveTo(x-8*s,y-38*s,x-11*s,y-73*s,x-5*s,y-101*s);
  ctx.lineTo(x+4*s,y-101*s);ctx.bezierCurveTo(x+8*s,y-72*s,x+7*s,y-37*s,x+10*s,y);ctx.closePath();ctx.fill();

  // bark relief
  ctx.strokeStyle="rgba(38,24,17,.42)";ctx.lineWidth=Math.max(1,1.15*s);
  for(let i=0;i<7;i++){const yy=y-(12+i*12)*s,off=((i%3)-1)*3*s;ctx.beginPath();ctx.moveTo(x-5*s+off,yy);ctx.lineTo(x+2*s+off,yy-8*s);ctx.stroke();}

  // woody branch structure
  const branch=(x1:number,y1:number,x2:number,y2:number,w:number)=>{
    const bg=ctx.createLinearGradient(x1,y1,x2,y2);bg.addColorStop(0,"#65452f");bg.addColorStop(1,"#493124");
    ctx.strokeStyle=bg;ctx.lineWidth=w*s;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  };
  branch(x-2*s,y-74*s,x-35*s,y-108*s,6);branch(x+2*s,y-79*s,x+38*s,y-113*s,6);
  branch(x,y-94*s,x-10*s,y-137*s,5);branch(x-31*s,y-105*s,x-50*s,y-112*s,3);
  branch(x+34*s,y-110*s,x+52*s,y-124*s,3);

  // shaded foliage volumes: radial light from upper-left, dark undersides
  const leaf=(cx:number,cy:number,rx:number,ry:number,light="#5d9655",dark="#173b27")=>{
    const g=ctx.createRadialGradient(cx-rx*.35,cy-ry*.45,2,cx,cy,Math.max(rx,ry));
    g.addColorStop(0,light);g.addColorStop(.42,"#356f43");g.addColorStop(1,dark);
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();
  };
  leaf(x-31*s,y-116*s,34*s,27*s);leaf(x+31*s,y-120*s,35*s,29*s,"#4f884d");
  leaf(x-3*s,y-144*s,39*s,33*s,"#679d59");leaf(x-52*s,y-103*s,25*s,21*s,"#4c874c");
  leaf(x+53*s,y-106*s,25*s,22*s,"#467f48");leaf(x-20*s,y-157*s,25*s,21*s,"#72a45e");
  leaf(x+22*s,y-153*s,28*s,23*s,"#5b9552");
}

function drawRock(ctx:CanvasRenderingContext2D,x:number,y:number,s:number){
  ellipse(ctx,x+5*s,y+4*s,28*s,7*s,"rgba(15,22,16,.32)");
  const g=ctx.createLinearGradient(x-25*s,y-34*s,x+26*s,y);
  g.addColorStop(0,"#b6bbb2");g.addColorStop(.38,"#858d85");g.addColorStop(1,"#444d48");
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-27*s,y);ctx.lineTo(x-20*s,y-24*s);ctx.lineTo(x-5*s,y-37*s);
  ctx.lineTo(x+17*s,y-31*s);ctx.lineTo(x+29*s,y-9*s);ctx.lineTo(x+21*s,y);ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(225,229,218,.25)";ctx.beginPath();ctx.moveTo(x-19*s,y-23*s);ctx.lineTo(x-5*s,y-36*s);ctx.lineTo(x+16*s,y-30*s);ctx.lineTo(x+5*s,y-18*s);ctx.closePath();ctx.fill();
}

function drawCamp(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ellipse(ctx, x, y + 3 * scale, 48 * scale, 10 * scale, COLORS.shadow);
  polygon(ctx, [
    [x - 45 * scale, y],
    [x, y - 62 * scale],
    [x + 45 * scale, y],
  ], "#b88b56");
  polygon(ctx, [
    [x, y - 62 * scale],
    [x + 45 * scale, y],
    [x + 8 * scale, y],
  ], COLORS.hat);
  ctx.fillStyle = COLORS.hat;
  ctx.fillRect(x - 7 * scale, y - 26 * scale, 14 * scale, 26 * scale);
  ellipse(ctx, x + 64 * scale, y, 22 * scale, 7 * scale, COLORS.stone);
  polygon(ctx, [
    [x + 55 * scale, y - 4 * scale],
    [x + 64 * scale, y - 28 * scale],
    [x + 73 * scale, y - 4 * scale],
  ], "#ee8b37");
}

function drawPerson(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, npc: boolean, walking: number) {
  const stride = Math.sin(walking) * 4 * scale;
  ellipse(ctx, x, y + 3 * scale, 20 * scale, 6 * scale, COLORS.shadow);
  ctx.strokeStyle = COLORS.trousers;
  ctx.lineWidth = 7 * scale;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 5 * scale, y - 25 * scale);
  ctx.lineTo(x - 7 * scale + stride, y);
  ctx.moveTo(x + 5 * scale, y - 25 * scale);
  ctx.lineTo(x + 7 * scale - stride, y);
  ctx.stroke();
  ctx.fillStyle = npc ? COLORS.npc : COLORS.player;
  ctx.fillRect(x - 15 * scale, y - 65 * scale, 30 * scale, 41 * scale);
  // arms give the character a stronger 3D silhouette
  ctx.strokeStyle = COLORS.skin; ctx.lineWidth = 7 * scale; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x-14*scale,y-58*scale); ctx.lineTo(x-21*scale,y-32*scale+stride*.25);
  ctx.moveTo(x+14*scale,y-58*scale); ctx.lineTo(x+21*scale,y-32*scale-stride*.25); ctx.stroke();
  ctx.fillStyle = npc ? "#b98432" : "#9f4034";
  ctx.fillRect(x + 7 * scale, y - 65 * scale, 8 * scale, 41 * scale);
  ellipse(ctx, x, y - 78 * scale, 13 * scale, 15 * scale, COLORS.skin);
  ellipse(ctx, x + 4 * scale, y - 80 * scale, 4 * scale, 10 * scale, "rgba(116,69,46,.18)");
  if (npc) {
    ctx.fillStyle = COLORS.hat;
    ctx.fillRect(x - 16 * scale, y - 92 * scale, 32 * scale, 7 * scale);
    ctx.strokeStyle = COLORS.bark;
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.moveTo(x + 16 * scale, y - 54 * scale);
    ctx.lineTo(x + 30 * scale, y - 18 * scale);
    ctx.stroke();
    polygon(ctx, [[x + 22 * scale, y - 42 * scale], [x + 38 * scale, y - 50 * scale], [x + 36 * scale, y - 35 * scale]], COLORS.stoneLight);
  }
}

function WorldCanvas({ input, onWoodChange, onStoneChange, onStickChange, onNearResource, gatherApi }: { input: RefObject<InputState>; onWoodChange: (wood: number) => void; onStoneChange: (stone: number) => void; onStickChange: (sticks: number) => void; onNearResource: (resource: "wood" | "stone" | "stick" | null) => void; gatherApi: RefObject<() => void> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const player = { x: 0, z: 2.5, yaw: 0 };
    const camp = { x: -3, z: -1 };
    const harvestedTrees = new Set<number>();
    const branchCounts = new Map<number,number>();
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = performance.now();
    let playerBranches = 0;
    let playerSticks = 0;
    let playerStone = 0;
    const harvestedSticks = new Set<number>();
    const harvestedRocks = new Set<number>();
    const harvestedLooseStones = new Set<number>();
    let gatherCooldown = 0;
    let lastNearResource: "wood" | "stone" | "stick" | null = null;
    const screenDistanceTo = (point: Point) => {
      const p = project(point);
      return Math.hypot(p.x - width * 0.5, p.y - height * 0.69);
    };
    const gatherNow=()=>{
      if(gatherCooldown>0)return;
      let ti=-1,td=Infinity;
      TREES.forEach((t,i)=>{if(harvestedTrees.has(i))return;const d=Math.hypot(t.x-player.x,t.z-player.z);if(d<td){td=d;ti=i;}});
      if(ti>=0&&td<1.62){
        const taken=branchCounts.get(ti)||0;
        if(taken<3){branchCounts.set(ti,taken+1);playerBranches++;onWoodChange(playerBranches);gatherCooldown=.55;}
        return;
      }
      let si=-1,sd=Infinity;
      STICKS.forEach((s,i)=>{if(harvestedSticks.has(i))return;const d=Math.hypot(s.x-player.x,s.z-player.z);if(d<sd){sd=d;si=i;}});
      if(si>=0&&sd<1.05){harvestedSticks.add(si);playerSticks++;onStickChange(playerSticks);gatherCooldown=.35;return;}
            let li=-1,ld=Infinity;
      LOOSE_STONES.forEach((r,i)=>{if(harvestedLooseStones.has(i))return;const d=Math.hypot(r.x-player.x,r.z-player.z);if(d<ld){ld=d;li=i;}});
      if(li>=0&&ld<1.05){harvestedLooseStones.add(li);playerStone++;onStoneChange(playerStone);gatherCooldown=.35;}
    };
    gatherApi.current = gatherNow;

    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const project = (point: Point) => {
      const dx=point.x-player.x, dz=point.z-player.z;
      const side=dx;
      const forward=-dz;
      const visible=forward>-1.0 && forward<26;
      const distance=Math.max(1.5,forward+3.5);
      const scale=Math.max(.24,Math.min(1.30,4.8/distance));
      const horizon=height*.47;
      // true ground plane: far objects sit at horizon, near objects move toward bottom
      const groundFactor=Math.max(0,Math.min(1,(26-forward)/27));
      const y=horizon + Math.pow(groundFactor,1.45)*height*.34;
      return {x:width*.5+side*38*scale,y:Math.min(height*.84,y),scale,depth:distance,visible};
    };

    const render = (time: number) => {
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      // World objects stay fixed in world space; no fake orbiting/rotating scenery.
      const moveX = input.current.joystick.x;
      const moveY = input.current.joystick.y;
      const length = Math.hypot(moveX, moveY);
      if (length > 0.05) {
        const speed = 4.1 * dt / Math.max(1, length);
        const nextX = Math.max(-14, Math.min(14, player.x + moveX * speed));
        const nextZ = Math.max(-14, Math.min(14, player.z + moveY * speed));
        const TREE_R=1.35, ROCK_R=.92;
        const blocked=(x:number,z:number)=>{
          for(let i=0;i<TREES.length;i++){
            if(harvestedTrees.has(i)) continue;
            if(Math.hypot(x-TREES[i].x,z-TREES[i].z)<TREE_R) return true;
          }
          for(let i=0;i<ROCKS.length;i++){
            if(harvestedRocks.has(i)) continue;
            if(Math.hypot(x-ROCKS[i].x,z-ROCKS[i].z)<ROCK_R) return true;
          }
          return false;
        };
        if(!blocked(nextX,player.z)) player.x=nextX;
        if(!blocked(player.x,nextZ)) player.z=nextZ;
        // Hard safety: never allow player to remain inside a trunk/rock.
        const pushOut=(p:Point,r:number)=>{
          let dx=player.x-p.x,dz=player.z-p.z,d=Math.hypot(dx,dz);
          if(d<r){if(d<.001){dx=1;dz=0;d=1;} player.x=p.x+dx/d*r; player.z=p.z+dz/d*r;}
        };
        TREES.forEach((t,i)=>{if(!harvestedTrees.has(i))pushOut(t,TREE_R);});
        ROCKS.forEach((r,i)=>{if(!harvestedRocks.has(i))pushOut(r,ROCK_R);});
      }

      gatherCooldown = Math.max(0, gatherCooldown - dt);
      let nearestTree=-1,nearestDistance=Infinity;
      TREES.forEach((t,i)=>{if(harvestedTrees.has(i))return;const d=Math.hypot(t.x-player.x,t.z-player.z);if(d<nearestDistance){nearestDistance=d;nearestTree=i;}});
      let nearestStick=-1,nearestStickDistance=Infinity;
      STICKS.forEach((s,i)=>{if(harvestedSticks.has(i))return;const d=Math.hypot(s.x-player.x,s.z-player.z);if(d<nearestStickDistance){nearestStickDistance=d;nearestStick=i;}});
      let nearestRock=-1,nearestRockDistance=Infinity;
      LOOSE_STONES.forEach((r,i)=>{if(harvestedLooseStones.has(i))return;const d=Math.hypot(r.x-player.x,r.z-player.z);if(d<nearestRockDistance){nearestRockDistance=d;nearestRock=i;}});
      const nearResource:"wood"|"stone"|"stick"|null=
        nearestTree>=0&&nearestDistance<1.62?"wood":
        nearestStick>=0&&nearestStickDistance<1.05?"stick":
        nearestRock>=0&&nearestRockDistance<1.05?"stone":null;
      if(nearResource!==lastNearResource){lastNearResource=nearResource;onNearResource(nearResource);}

      // Worker disabled until settlement stage.

      // Atmosphere + layered terrain for stronger depth.
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.44);
      skyGradient.addColorStop(0, "#79b9d8");
      skyGradient.addColorStop(0.72, "#b8dbe3");
      skyGradient.addColorStop(1, "#dce9d7");
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height * 0.44);
      ellipse(ctx, width * 0.78, height * 0.12, 38, 38, "rgba(255,239,173,.78)");
      // soft layered clouds
      const cloud=(cx:number,cy:number,s:number,a:number)=>{ ellipse(ctx,cx,cy,38*s,11*s,`rgba(255,255,255,${a})`); ellipse(ctx,cx-18*s,cy-7*s,19*s,13*s,`rgba(255,255,255,${a})`); ellipse(ctx,cx+12*s,cy-10*s,24*s,16*s,`rgba(255,255,255,${a})`); };
      cloud(width*.18,height*.16,.72,.48); cloud(width*.58,height*.23,.5,.34);
      polygon(ctx, [[0,height*.43],[width*.18,height*.35],[width*.36,height*.43],[width*.55,height*.33],[width*.77,height*.43],[width,height*.36],[width,height*.5],[0,height*.5]], "#759365");
      polygon(ctx, [[0,height*.45],[width*.25,height*.39],[width*.47,height*.46],[width*.72,height*.38],[width,height*.45],[width,height*.53],[0,height*.53]], "#8faa72");
      const groundGradient = ctx.createLinearGradient(0, height * .47, 0, height);
      groundGradient.addColorStop(0, "#8eaa62");
      groundGradient.addColorStop(.55, "#688d48");
      groundGradient.addColorStop(1, "#4f743b");
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, height * .47, width, height * .57);
      // Natural ground: subtle soil/grass variation instead of cartoon stripes.
      const soil=ctx.createLinearGradient(0,height*.50,0,height);
      soil.addColorStop(0,"rgba(151,151,91,.08)");soil.addColorStop(.65,"rgba(68,73,39,.08)");soil.addColorStop(1,"rgba(35,48,28,.15)");
      ctx.fillStyle=soil;ctx.fillRect(0,height*.47,width,height*.53);
      // Small grass blades in foreground.
      ctx.strokeStyle = "rgba(39,84,43,.46)";
      ctx.lineWidth = 1.4;
      for (let i=0;i<34;i++) {
        const gx=(i*97 + 31)%Math.max(1,width), gy=height*(.56+((i*53)%41)/100);
        const gh=4+((i*7)%8);
        ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx-3,gy-gh); ctx.moveTo(gx,gy); ctx.lineTo(gx+3,gy-gh*.8); ctx.stroke();
      }
      // ground texture grows toward camera, reinforcing perspective
      for(let i=0;i<28;i++){
        const gx=(i*137+53)%Math.max(1,width), t=((i*47)%100)/100, gy=height*(.50+t*.48);
        const sz=1.5+t*4.5;
        ellipse(ctx,gx,gy,sz*1.8,sz*.55,i%3===0?"rgba(111,91,58,.24)":"rgba(38,86,43,.22)");
      }

      const mist=ctx.createLinearGradient(0,height*.38,0,height*.56); mist.addColorStop(0,"rgba(225,239,222,.42)"); mist.addColorStop(1,"rgba(225,239,222,0)"); ctx.fillStyle=mist; ctx.fillRect(0,height*.38,width,height*.2);
            const objects: Array<{ depth: number; draw: () => void }> = [];
      const campProjection = project(camp);
      if(campProjection.visible) objects.push({
        depth: campProjection.depth,
        draw: () => drawCamp(ctx, campProjection.x, campProjection.y, Math.min(.95,campProjection.scale * 0.72)),
      });
      TREES.forEach((tree, index) => {
        if (harvestedTrees.has(index)) return;
        const p = project(tree);
        if(p.visible) objects.push({ depth: p.depth, draw: () => drawTree(ctx, p.x, p.y, Math.min(1.12, p.scale * (0.82 + index % 3 * 0.06))) });
      });
      STICKS.forEach((stick,index)=>{
        if(harvestedSticks.has(index)) return;
        const p=project(stick);
        if(p.visible) objects.push({depth:p.depth,draw:()=>drawStick(ctx,p.x,p.y,Math.min(1,p.scale))});
      });
            LOOSE_STONES.forEach((stone,index)=>{
        if(harvestedLooseStones.has(index)) return;
        const p=project(stone);
        if(p.visible) objects.push({depth:p.depth,draw:()=>drawRock(ctx,p.x,p.y,Math.min(.34,p.scale*.30))});
      });
      ROCKS.forEach((rock, index) => {
        if (harvestedRocks.has(index)) return;
        const p = project(rock);
        if(p.visible) objects.push({ depth: p.depth, draw: () => drawRock(ctx, p.x, p.y, Math.min(.95,p.scale * (0.68 + index % 2 * 0.10))) });
      });
      objects.sort((a, b) => b.depth - a.depth).forEach((object) => object.draw());
      drawPerson(ctx, width * 0.5, height * 0.70, Math.min(width / 420, height / 790, 1.18), false, length > 0.05 ? time * 0.012 : 0);
      const vignette=ctx.createRadialGradient(width*.5,height*.55,Math.min(width,height)*.25,width*.5,height*.55,Math.max(width,height)*.72);
      vignette.addColorStop(.55,"rgba(0,0,0,0)"); vignette.addColorStop(1,"rgba(14,28,18,.16)");
      ctx.fillStyle=vignette; ctx.fillRect(0,0,width,height);

      frame = requestAnimationFrame(render);
    };

    resize();
    frame = requestAnimationFrame(render);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      gatherApi.current = () => {};
    };
  }, [input, onWoodChange, onStoneChange, onStickChange, onNearResource, gatherApi]);

  return <canvas ref={canvasRef} className="wz-world-canvas" aria-label="Herní svět WORLD ZERO" />;
}

function Joystick({ input }: { input: RefObject<InputState> }) {
  const activePointer = useRef<number | null>(null);
  const knob = useRef<HTMLSpanElement>(null);
  const update = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    let x = event.clientX - rect.left - rect.width / 2;
    let y = event.clientY - rect.top - rect.height / 2;
    const radius = rect.width * 0.32;
    const length = Math.hypot(x, y);
    if (length > radius) { x = x / length * radius; y = y / length * radius; }
    input.current.joystick = { x: x / radius, y: y / radius };
    if (knob.current) knob.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, [input]);
  const release = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    input.current.joystick = { x: 0, y: 0 };
    if (knob.current) knob.current.style.transform = "translate3d(0, 0, 0)";
  }, [input]);
  return <div className="wz-joystick" role="button" tabIndex={0} aria-label="Ovládání pohybu"
    onPointerDown={(event) => { activePointer.current = event.pointerId; safelyCapturePointer(event.currentTarget, event.pointerId); update(event); }}
    onPointerMove={(event) => { if (activePointer.current === event.pointerId) update(event); }} onPointerUp={release} onPointerCancel={release}>
    <span className="wz-joystick-ring" /><span ref={knob} className="wz-joystick-knob" />
  </div>;
}

function CameraButton({ direction, input, label, children }: { direction: number; input: RefObject<InputState>; label: string; children: ReactNode }) {
  const stop = () => { input.current.camera = 0; };
  return <button className="wz-camera-button" aria-label={label}
    onPointerDown={(event) => { safelyCapturePointer(event.currentTarget, event.pointerId); input.current.camera = direction; }}
    onPointerUp={stop} onPointerCancel={stop}>{children}</button>;
}

export function WorldZeroGame() {
  const input = useRef<InputState>({ joystick: { x: 0, y: 0 }, camera: 0 });
  const [wood, setWood] = useState(0);
  const [stone, setStone] = useState(0);
  const [sticks, setSticks] = useState(0);
  const [actionFlash, setActionFlash] = useState("");
  const handleWoodChange = useCallback((amount: number) => setWood(amount), []);
  const [nearResource, setNearResource] = useState<"wood" | "stone" | "stick" | null>(null);
  const gatherApi = useRef<() => void>(() => {});
  const handleNearResource = useCallback((resource: "wood" | "stone" | "stick" | null) => setNearResource(resource), []);
  const handleStoneChange = useCallback((amount: number) => setStone(amount), []);
  const handleStickChange = useCallback((amount: number) => setSticks(amount), []);
  return <main className="wz-game">
    <WorldCanvas input={input} onWoodChange={handleWoodChange} onStoneChange={handleStoneChange} onStickChange={handleStickChange} onNearResource={handleNearResource} gatherApi={gatherApi} />
    <div className="wz-hud">
      <header className="wz-statusbar">
        <div><h1>WORLD ZERO</h1><p>Divočina</p></div>
        <div className="wz-day"><strong>Den 1</strong><span>Větve: {wood}</span><span>Klacky: {sticks}</span><span>Kameny: {stone}</span><span><i className="is-ready" />renderer OK</span></div>
      </header>
      {nearResource && <button type="button" className="wz-gather" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); gatherApi.current(); setActionFlash("SEBRÁNO"); window.setTimeout(() => setActionFlash(""), 300); }}>{nearResource === "stone" ? "SEBRAT KÁMEN" : nearResource === "stick" ? "SEBRAT KLACEK" : "ULOMIT VĚTEV"}</button>}{actionFlash && <div className="wz-action-flash">{actionFlash}</div>}
      <div className="wz-controls">
        <Joystick input={input} />
        <div className="wz-camera-controls">
          <CameraButton direction={-1} input={input} label="Otočit kameru vlevo">‹</CameraButton>
          <CameraButton direction={1} input={input} label="Otočit kameru vpravo">›</CameraButton>
        </div>
      </div>
    </div>
  </main>;
}