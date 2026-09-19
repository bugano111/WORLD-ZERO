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

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ellipse(ctx, x + 8*scale, y + 5*scale, 30*scale, 9*scale, "rgba(20,35,20,.34)");
  // tapered trunk with lit and shaded faces
  polygon(ctx, [[x-8*scale,y],[x-5*scale,y-58*scale],[x+4*scale,y-58*scale],[x+9*scale,y]], "#6d4930");
  polygon(ctx, [[x+2*scale,y],[x+4*scale,y-58*scale],[x+10*scale,y-51*scale],[x+9*scale,y]], "#4d3426");
  polygon(ctx, [[x-8*scale,y],[x-5*scale,y-58*scale],[x+1*scale,y-58*scale],[x-1*scale,y]], "#916748");
  // branches
  ctx.strokeStyle="#65432d"; ctx.lineWidth=6*scale; ctx.lineCap="round";
  ctx.beginPath(); ctx.moveTo(x,y-43*scale); ctx.lineTo(x-23*scale,y-70*scale); ctx.moveTo(x+2*scale,y-48*scale); ctx.lineTo(x+25*scale,y-76*scale); ctx.stroke();
  // volumetric crown clusters
  ellipse(ctx,x-25*scale,y-77*scale,30*scale,25*scale,"#2d6037");
  ellipse(ctx,x+24*scale,y-80*scale,32*scale,27*scale,"#285632");
  ellipse(ctx,x,y-99*scale,35*scale,31*scale,"#397444");
  ellipse(ctx,x-10*scale,y-109*scale,22*scale,20*scale,"#4b8650");
  ellipse(ctx,x+13*scale,y-104*scale,23*scale,21*scale,"#3b7042");
  ellipse(ctx,x-29*scale,y-86*scale,13*scale,11*scale,"rgba(112,157,78,.55)");
  ellipse(ctx,x+29*scale,y-72*scale,15*scale,12*scale,"rgba(22,67,37,.55)");
}

function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ellipse(ctx,x+5*scale,y+4*scale,29*scale,8*scale,"rgba(20,30,22,.32)");
  polygon(ctx,[[x-27*scale,y],[x-20*scale,y-25*scale],[x-5*scale,y-36*scale],[x+17*scale,y-31*scale],[x+29*scale,y-10*scale],[x+22*scale,y]],"#68726b");
  polygon(ctx,[[x-20*scale,y-25*scale],[x-5*scale,y-36*scale],[x+17*scale,y-31*scale],[x+7*scale,y-17*scale],[x-10*scale,y-15*scale]],"#aab0a5");
  polygon(ctx,[[x+7*scale,y-17*scale],[x+17*scale,y-31*scale],[x+29*scale,y-10*scale],[x+22*scale,y],[x+9*scale,y]],"#4e5953");
  polygon(ctx,[[x-27*scale,y],[x-20*scale,y-25*scale],[x-10*scale,y-15*scale],[x-8*scale,y]],"#7d8780");
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

function WorldCanvas({ input, onWoodChange, onStoneChange, onNearResource, gatherApi }: { input: RefObject<InputState>; onWoodChange: (wood: number) => void; onStoneChange: (stone: number) => void; onNearResource: (resource: "wood" | "stone" | null) => void; gatherApi: RefObject<() => void> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const player = { x: 0, z: 2.5, yaw: 0 };
    const camp = { x: -3, z: -1 };
    const npc = {
      x: camp.x,
      z: camp.z,
      phase: "toTree" as "toTree" | "working" | "toCamp" | "idle",
      treeIndex: 0,
      workTime: 0,
      wood: 0,
      harvested: new Set<number>(),
    };
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = performance.now();
    let playerWood = 0;
    let playerStone = 0;
    const harvestedRocks = new Set<number>();
    let gatherCooldown = 0;
    let lastNearResource: "wood" | "stone" | null = null;
    const screenDistanceTo = (point: Point) => {
      const p = project(point);
      return Math.hypot(p.x - width * 0.5, p.y - height * 0.69);
    };
    const gatherNow = () => {
      if (gatherCooldown > 0) return;
      let ti = -1, td = Infinity;
      TREES.forEach((tree, index) => {
        if (npc.harvested.has(index)) return;
        const d = screenDistanceTo(tree);
        if (d < td) { td = d; ti = index; }
      });
      if (ti >= 0 && td < 105) {
        playerWood += 1;
        onWoodChange(npc.wood + playerWood);
        gatherCooldown = .45;
        return;
      }
      let ri = -1, rd = Infinity;
      ROCKS.forEach((rock, index) => {
        if (harvestedRocks.has(index)) return;
        const d = screenDistanceTo(rock);
        if (d < rd) { rd = d; ri = index; }
      });
      if (ri >= 0 && rd < 82) {
        harvestedRocks.add(ri);
        playerStone += 1;
        onStoneChange(playerStone);
        gatherCooldown = .45;
      }
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
      const dx = point.x - player.x;
      const dz = point.z - player.z;
      const cosine = Math.cos(player.yaw);
      const sine = Math.sin(player.yaw);
      const side = dx * cosine - dz * sine;
      const depth = dx * sine + dz * cosine;
      return {
        x: width * 0.5 + side * Math.min(width * 0.078, 38),
        y: height * 0.535 + depth * Math.min(height * 0.031, 26),
        scale: Math.max(0.38, Math.min(1.52, 0.78 + depth * 0.042)),
        depth,
      };
    };

    const render = (time: number) => {
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      player.yaw += input.current.camera * 1.7 * dt;
      const moveX = input.current.joystick.x;
      const moveY = input.current.joystick.y;
      const length = Math.hypot(moveX, moveY);
      if (length > 0.05) {
        const speed = 4.1 * dt / Math.max(1, length);
        const nextX = Math.max(-14, Math.min(14, player.x + (moveX * Math.cos(player.yaw) + moveY * Math.sin(player.yaw)) * speed));
        const nextZ = Math.max(-14, Math.min(14, player.z + (-moveX * Math.sin(player.yaw) + moveY * Math.cos(player.yaw)) * speed));
        const blocked = (x: number, z: number) => {
          const oldX = player.x, oldZ = player.z;
          player.x = x; player.z = z;
          const footX = width * 0.5, footY = height * 0.69;
          const treeHit = TREES.some((tree, index) => {
            if (npc.harvested.has(index)) return false;
            const p = project(tree);
            return Math.abs(p.x - footX) < Math.max(13, 9 * p.scale) && Math.abs(p.y - footY) < 18;
          });
          const rockHit = ROCKS.some((rock, index) => {
            if (harvestedRocks.has(index)) return false;
            const p = project(rock);
            return Math.abs(p.x - footX) < Math.max(22, 18 * p.scale) && Math.abs(p.y - footY) < 14;
          });
          player.x = oldX; player.z = oldZ;
          return treeHit || rockHit;
        };
        if (!blocked(nextX, player.z)) player.x = nextX;
        if (!blocked(player.x, nextZ)) player.z = nextZ;
      }

      gatherCooldown = Math.max(0, gatherCooldown - dt);
      let nearestTree = -1, nearestDistance = Infinity;
      TREES.forEach((tree, index) => {
        if (npc.harvested.has(index)) return;
        const distance = screenDistanceTo(tree);
        if (distance < nearestDistance) { nearestDistance = distance; nearestTree = index; }
      });
      let nearestRock = -1, nearestRockDistance = Infinity;
      ROCKS.forEach((rock, index) => {
        if (harvestedRocks.has(index)) return;
        const distance = screenDistanceTo(rock);
        if (distance < nearestRockDistance) { nearestRockDistance = distance; nearestRock = index; }
      });
      const nearResource: "wood" | "stone" | null =
        nearestTree >= 0 && nearestDistance < 105 ? "wood" :
        nearestRock >= 0 && nearestRockDistance < 82 ? "stone" : null;
      if (nearResource !== lastNearResource) {
        lastNearResource = nearResource;
        onNearResource(nearResource);
      }

      const target = npc.phase === "toCamp" ? camp : TREES[npc.treeIndex];
      if ((npc.phase === "toTree" || npc.phase === "toCamp") && target) {
        const dx = target.x - npc.x;
        const dz = target.z - npc.z;
        const distance = Math.hypot(dx, dz);
        if (distance < 0.15) {
          if (npc.phase === "toTree") {
            npc.phase = "working";
            npc.workTime = 0;
          } else {
            const nextTree = TREES.findIndex((_, index) => !npc.harvested.has(index));
            if (nextTree === -1) npc.phase = "idle";
            else {
              npc.treeIndex = nextTree;
              npc.phase = "toTree";
            }
          }
        }
        else {
          npc.x += dx / distance * 1.8 * dt;
          npc.z += dz / distance * 1.8 * dt;
        }
      } else if (npc.phase === "working") {
        npc.workTime += dt;
        if (npc.workTime >= 1.1) {
          npc.harvested.add(npc.treeIndex);
          npc.wood += 1;
          onWoodChange(npc.wood + playerWood);
          npc.phase = "toCamp";
        }
      }

      // Atmosphere + layered terrain for stronger depth.
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.48);
      skyGradient.addColorStop(0, "#79b9d8");
      skyGradient.addColorStop(0.72, "#b8dbe3");
      skyGradient.addColorStop(1, "#dce9d7");
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height * 0.48);
      ellipse(ctx, width * 0.78, height * 0.12, 34, 34, "rgba(255,239,173,.72)");
      polygon(ctx, [[0,height*.43],[width*.18,height*.35],[width*.36,height*.43],[width*.55,height*.33],[width*.77,height*.43],[width,height*.36],[width,height*.5],[0,height*.5]], "#759365");
      polygon(ctx, [[0,height*.45],[width*.25,height*.39],[width*.47,height*.46],[width*.72,height*.38],[width,height*.45],[width,height*.53],[0,height*.53]], "#8faa72");
      const groundGradient = ctx.createLinearGradient(0, height * .43, 0, height);
      groundGradient.addColorStop(0, "#8eaa62");
      groundGradient.addColorStop(.55, "#688d48");
      groundGradient.addColorStop(1, "#4f743b");
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, height * .43, width, height * .57);
      // Perspective ground bands.
      polygon(ctx, [[0,height*.57],[width,height*.52],[width,height*.59],[0,height*.66]], "rgba(178,201,111,.30)");
      polygon(ctx, [[0,height*.74],[width,height*.63],[width,height*.72],[0,height*.86]], "rgba(45,91,48,.24)");
      polygon(ctx, [[0,height*.91],[width,height*.78],[width,height*.84],[0,height]], "rgba(183,205,112,.18)");
      // Small grass blades in foreground.
      ctx.strokeStyle = "rgba(39,84,43,.46)";
      ctx.lineWidth = 1.4;
      for (let i=0;i<34;i++) {
        const gx=(i*97 + 31)%Math.max(1,width), gy=height*(.56+((i*53)%41)/100);
        const gh=4+((i*7)%8);
        ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx-3,gy-gh); ctx.moveTo(gx,gy); ctx.lineTo(gx+3,gy-gh*.8); ctx.stroke();
      }

      const objects: Array<{ depth: number; draw: () => void }> = [];
      const campProjection = project({ x: -3.7, z: -1.8 });
      objects.push({
        depth: campProjection.depth,
        draw: () => drawCamp(ctx, campProjection.x, campProjection.y, campProjection.scale * 0.78),
      });
      TREES.forEach((tree, index) => {
        if (npc.harvested.has(index)) return;
        const p = project(tree);
        objects.push({ depth: p.depth, draw: () => drawTree(ctx, p.x, p.y, p.scale * (0.9 + index % 3 * 0.08)) });
      });
      ROCKS.forEach((rock, index) => {
        if (harvestedRocks.has(index)) return;
        const p = project(rock);
        objects.push({ depth: p.depth, draw: () => drawRock(ctx, p.x, p.y, p.scale * (0.72 + index % 2 * 0.12)) });
      });
      const npcProjection = project(npc);
      objects.push({
        depth: npcProjection.depth,
        draw: () => drawPerson(
          ctx,
          npcProjection.x,
          npcProjection.y,
          npcProjection.scale * 0.78,
          true,
          npc.phase === "working" ? time * 0.018 : time * 0.009,
        ),
      });
      objects.sort((a, b) => a.depth - b.depth).forEach((object) => object.draw());
      drawPerson(ctx, width * 0.5, height * 0.70, Math.min(width / 390, height / 720, 1.34), false, length > 0.05 ? time * 0.012 : 0);

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
  }, [input, onWoodChange, onStoneChange, onNearResource, gatherApi]);

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
  const [actionFlash, setActionFlash] = useState("");
  const handleWoodChange = useCallback((amount: number) => setWood(amount), []);
  const [nearResource, setNearResource] = useState<"wood" | "stone" | null>(null);
  const gatherApi = useRef<() => void>(() => {});
  const handleNearResource = useCallback((resource: "wood" | "stone" | null) => setNearResource(resource), []);
  const handleStoneChange = useCallback((amount: number) => setStone(amount), []);
  return <main className="wz-game">
    <WorldCanvas input={input} onWoodChange={handleWoodChange} onStoneChange={handleStoneChange} onNearResource={handleNearResource} gatherApi={gatherApi} />
    <div className="wz-hud">
      <header className="wz-statusbar">
        <div><h1>WORLD ZERO</h1><p>Divočina</p></div>
        <div className="wz-day"><strong>Den 1</strong><span>Dřevo: {wood}</span><span>Kámen: {stone}</span><span><i className="is-ready" />renderer OK</span></div>
      </header>
      {nearResource && <button type="button" className="wz-gather" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); gatherApi.current(); setActionFlash("SEBRÁNO"); window.setTimeout(() => setActionFlash(""), 300); }}>{nearResource === "stone" ? "SEBRAT KÁMEN" : "ULOMIT VĚTEV"}</button>}{actionFlash && <div className="wz-action-flash">{actionFlash}</div>}
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