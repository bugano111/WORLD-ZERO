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
  gather: boolean;
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
  ellipse(ctx, x, y + 2 * scale, 19 * scale, 6 * scale, COLORS.shadow);
  ctx.fillStyle = COLORS.bark;
  ctx.fillRect(x - 5 * scale, y - 46 * scale, 10 * scale, 48 * scale);
  polygon(ctx, [[x, y - 112 * scale], [x - 35 * scale, y - 44 * scale], [x + 35 * scale, y - 44 * scale]], COLORS.leavesLight);
  polygon(ctx, [[x, y - 88 * scale], [x - 43 * scale, y - 20 * scale], [x + 43 * scale, y - 20 * scale]], COLORS.leaves);
}

function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ellipse(ctx, x, y + 2 * scale, 22 * scale, 6 * scale, COLORS.shadow);
  polygon(ctx, [
    [x - 22 * scale, y], [x - 15 * scale, y - 21 * scale],
    [x + 7 * scale, y - 28 * scale], [x + 23 * scale, y - 10 * scale],
    [x + 17 * scale, y],
  ], COLORS.stone);
  polygon(ctx, [
    [x - 15 * scale, y - 21 * scale], [x + 7 * scale, y - 28 * scale],
    [x + 14 * scale, y - 16 * scale], [x - 8 * scale, y - 13 * scale],
  ], COLORS.stoneLight);
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
  ellipse(ctx, x, y - 78 * scale, 13 * scale, 15 * scale, COLORS.skin);
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

function WorldCanvas({ input, onWoodChange, onNearTree }: { input: RefObject<InputState>; onWoodChange: (wood: number) => void; onNearTree: (near: boolean) => void }) {
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
    let gatherCooldown = 0;
    let wasNearTree = false;

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
        x: width * 0.5 + side * Math.min(width * 0.07, 34),
        y: height * 0.57 + depth * Math.min(height * 0.026, 22),
        scale: Math.max(0.48, Math.min(1.28, 0.84 + depth * 0.025)),
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
        player.x += (moveX * Math.cos(player.yaw) + moveY * Math.sin(player.yaw)) * speed;
        player.z += (-moveX * Math.sin(player.yaw) + moveY * Math.cos(player.yaw)) * speed;
        player.x = Math.max(-14, Math.min(14, player.x));
        player.z = Math.max(-14, Math.min(14, player.z));
      }

      gatherCooldown = Math.max(0, gatherCooldown - dt);
      let nearestTree = -1;
      let nearestDistance = Infinity;
      TREES.forEach((tree, index) => {
        if (npc.harvested.has(index)) return;
        const distance = Math.hypot(tree.x - player.x, tree.z - player.z);
        if (distance < nearestDistance) { nearestDistance = distance; nearestTree = index; }
      });
      const isNearTree = nearestTree >= 0 && nearestDistance < 2.35;
      if (isNearTree !== wasNearTree) { wasNearTree = isNearTree; onNearTree(isNearTree); }
      if (input.current.gather && isNearTree && gatherCooldown <= 0) {
        npc.harvested.add(nearestTree);
        playerWood += 1;
        onWoodChange(npc.wood + playerWood);
        gatherCooldown = 0.55;
        input.current.gather = false;
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

      ctx.fillStyle = COLORS.sky;
      ctx.fillRect(0, 0, width, height * 0.43);
      ctx.fillStyle = COLORS.haze;
      ctx.fillRect(0, height * 0.39, width, height * 0.08);
      polygon(ctx, [[0, height * 0.43], [width, height * 0.43], [width, height], [0, height]], COLORS.grass);
      polygon(ctx, [[0, height * 0.43], [width, height * 0.43], [width, height * 0.55], [0, height * 0.51]], COLORS.grassFar);
      polygon(ctx, [[0, height * 0.67], [width, height * 0.58], [width, height * 0.72], [0, height * 0.83]], COLORS.grassDark);

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
      drawPerson(ctx, width * 0.5, height * 0.69, Math.min(width / 430, height / 800, 1.18), false, length > 0.05 ? time * 0.012 : 0);

      frame = requestAnimationFrame(render);
    };

    resize();
    frame = requestAnimationFrame(render);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [input, onWoodChange, onNearTree]);

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
  const input = useRef<InputState>({ joystick: { x: 0, y: 0 }, camera: 0, gather: false });
  const [wood, setWood] = useState(0);
  const handleWoodChange = useCallback((amount: number) => setWood(amount), []);
  const [nearTree, setNearTree] = useState(false);
  const handleNearTree = useCallback((near: boolean) => setNearTree(near), []);
  return <main className="wz-game">
    <WorldCanvas input={input} onWoodChange={handleWoodChange} onNearTree={handleNearTree} />
    <div className="wz-hud">
      <header className="wz-statusbar">
        <div><h1>WORLD ZERO</h1><p>Divočina</p></div>
        <div className="wz-day"><strong>Den 1</strong><span>Dřevo: {wood}</span><span><i className="is-ready" />renderer OK</span></div>
      </header>
      {nearTree && <button className="wz-gather" onPointerDown={() => { input.current.gather = true; }}>SBÍRAT</button>}
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