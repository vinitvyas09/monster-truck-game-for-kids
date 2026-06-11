"use client";

import { useEffect, useRef, useState } from "react";
import type { PaletteEntry, TruckConfig } from "@/lib/trucks";
import { PALETTE } from "@/lib/trucks";
import * as sfx from "@/lib/audio";
import { AXLE_Y, EXHAUST, TruckArt, WHEEL_R, starPoints } from "./TruckArt";
import { BoltIcon, CloudArt, HomeIcon, HornIcon, PlayIcon, StarIcon, SunArt, UpIcon } from "./icons";

const NAVY = "#1d2b4f";
const VB_W = 1000;
const VB_H = 600;
const BASE = 506; // flat-ground y in viewBox units
const SEG = 130; // terrain control point spacing
// One repeating lap: flats, a bump, the mud pit, rolling hills, a big jump ramp
// with a cliff drop, the school bus, then the carwash before the lap-end bumps.
const HEIGHTS = [0, 0, 0, 0, 20, 0, 0, 0, 0, 55, 105, 60, 0, 0, 0, 45, 95, 145, 0, 0, 0, 0, 26, 0, 14, 0];
const N = HEIGHTS.length;
const PERIOD = N * SEG;
const CAR_SLOTS = [3, 6, 13, 20, 23]; // flat segments where crushable cars sit (3, not 2: keep the first car visibly ahead of the truck spawn)
const CARS_PER = CAR_SLOTS.length;
const POOL = 6; // recycled car elements
const MUD_X = 7.5 * SEG;
const RESCUE_OFF = 8.15 * SEG;
const BALL_OFF = 14.2 * SEG; // right before the ramp: punts sail off the cliff
const BUS_OFF = 19.3 * SEG; // in the cliff landing zone
const WASH_X = 21.5 * SEG;
const SCALE = 0.92;
const HALF_BASE = 85 * SCALE; // axle distance from truck center
const R_S = WHEEL_R * SCALE;
const MAX_SPEED = 430;
const TURBO_SPEED = 780;
const GRAVITY = 1350;
const BALL_R = 34;

function hAt(x: number) {
  const i = Math.floor(x / SEG);
  const t = (x - i * SEG) / SEG;
  const a = HEIGHTS[((i % N) + N) % N];
  const b = HEIGHTS[(((i + 1) % N) + N) % N];
  const c = (1 - Math.cos(t * Math.PI)) / 2;
  return a + (b - a) * c;
}
const gy = (x: number) => BASE - hAt(x);

function buildTerrain() {
  let fill = `M0 ${VB_H + 40} L0 ${gy(0).toFixed(1)}`;
  let edge = `M0 ${gy(0).toFixed(1)}`;
  for (let x = SEG / 5; x <= PERIOD; x += SEG / 5) {
    const y = gy(x).toFixed(1);
    fill += ` L${x} ${y}`;
    edge += ` L${x} ${y}`;
  }
  fill += ` L${PERIOD} ${VB_H + 40} Z`;
  return { fill, edge };
}
const TERRAIN = buildTerrain();

function buildHills() {
  let d = "M0 480";
  for (let k = 0; k < 13; k++) d += ` Q${k * 260 + 130} ${k % 2 ? 398 : 362} ${(k + 1) * 260} 480`;
  return d + ` L${PERIOD} ${VB_H + 40} L0 ${VB_H + 40} Z`;
}
const HILLS = buildHills();

const carColor = (n: number): PaletteEntry =>
  PALETTE[(((n * 3 + 1) % PALETTE.length) + PALETTE.length) % PALETTE.length];

const HEART_D = "M0 6 C -8 -4 -18 2 0 16 C 18 2 8 -4 0 6 Z";

/** Little crushable car, origin at ground level under its center. */
export function CarShape({ main = "#9aa7b8", dark = "#7b8798" }: { main?: string; dark?: string }) {
  return (
    <g className="car-hopper">
      <g className="car-squash" stroke={NAVY} strokeLinejoin="round">
        <path className="car-roof" d="M-30 -32 Q-26 -54 -8 -54 L14 -54 Q26 -54 30 -32 Z" fill={dark} strokeWidth={4} />
        <rect x={-16} y={-50} width={26} height={15} rx={5} fill="#c9ecff" strokeWidth={3.5} />
        <rect className="car-body" x={-46} y={-34} width={92} height={27} rx={9} fill={main} strokeWidth={4} />
        <circle cx={-28} cy={-9} r={10} fill="#2b3445" strokeWidth={4} />
        <circle cx={28} cy={-9} r={10} fill="#2b3445" strokeWidth={4} />
        <circle cx={-28} cy={-9} r={3.5} fill="#edf1f7" stroke="none" />
        <circle cx={28} cy={-9} r={3.5} fill="#edf1f7" stroke="none" />
      </g>
    </g>
  );
}

/** Big yellow school bus, origin at ground level. */
function BusShape() {
  return (
    <g className="car-hopper">
      <g className="bus-squash" stroke={NAVY} strokeLinejoin="round">
        <rect x={-78} y={-92} width={156} height={78} rx={13} fill="#ffd43b" strokeWidth={5} />
        {[-58, -24, 10, 44].map((x) => (
          <rect key={x} x={x} y={-80} width={24} height={20} rx={5} fill="#c9ecff" strokeWidth={3.5} />
        ))}
        <rect x={-78} y={-46} width={156} height={11} fill="#f0a800" stroke="none" />
        <circle cx={68} cy={-24} r={5} fill="#fff" strokeWidth={3} />
        <circle cx={-45} cy={-11} r={12} fill="#2b3445" strokeWidth={4} />
        <circle cx={45} cy={-11} r={12} fill="#2b3445" strokeWidth={4} />
        <circle cx={-45} cy={-11} r={4.5} fill="#edf1f7" stroke="none" />
        <circle cx={45} cy={-11} r={4.5} fill="#edf1f7" stroke="none" />
      </g>
    </g>
  );
}

/** Sad little car stuck in the mud, wiggling for help. */
function RescueCar() {
  return (
    <g>
      <g className="rescue-pop">
        <g className="rescue-wiggle">
          <g transform="translate(0 16) rotate(-7)">
            <CarShape main="#74c0fc" dark="#1971c2" />
          </g>
        </g>
      </g>
      {/* mud mound stays behind when the car pops free */}
      <ellipse cx={2} cy={-3} rx={60} ry={13} fill="#6e4423" stroke={NAVY} strokeWidth={4} />
      <ellipse cx={-22} cy={-7} rx={20} ry={5} fill="#8a5a2e" stroke="none" />
    </g>
  );
}

function BeachBall() {
  return (
    <g stroke={NAVY}>
      <circle r={BALL_R} fill="#fff" strokeWidth={5} />
      <path d={`M0 -${BALL_R} A${BALL_R} ${BALL_R} 0 0 1 ${BALL_R * 0.87} ${BALL_R * 0.5} Q${BALL_R * 0.2} ${BALL_R * 0.15} 0 -${BALL_R} Z`} fill="#ff5d5d" strokeWidth={3} />
      <path d={`M0 -${BALL_R} A${BALL_R} ${BALL_R} 0 0 0 -${BALL_R * 0.87} ${BALL_R * 0.5} Q-${BALL_R * 0.2} ${BALL_R * 0.15} 0 -${BALL_R} Z`} fill="#4dabf7" strokeWidth={3} />
      <path d={`M-${BALL_R * 0.87} ${BALL_R * 0.5} A${BALL_R} ${BALL_R} 0 0 0 ${BALL_R * 0.87} ${BALL_R * 0.5} Q0 ${BALL_R * 0.05} -${BALL_R * 0.87} ${BALL_R * 0.5} Z`} fill="#ffd43b" strokeWidth={3} />
      <circle r={BALL_R} fill="none" strokeWidth={5} />
      <circle cx={-12} cy={-14} r={7} fill="#ffffff" stroke="none" opacity={0.8} />
    </g>
  );
}

/** Mud pit, drawn inside the repeating terrain so it scrolls for free. */
function MudPit() {
  return (
    <g transform={`translate(${MUD_X} 0)`}>
      <ellipse cx={0} cy={3} rx={95} ry={17} fill="#6e4423" stroke="#5a3a1d" strokeWidth={5} />
      <ellipse cx={-22} cy={-1} rx={55} ry={8} fill="#8a5a2e" stroke="none" />
      <ellipse cx={45} cy={5} rx={26} ry={6} fill="#5a3a1d" stroke="none" opacity={0.5} />
    </g>
  );
}

/** Carwash arch (behind the truck): posts, bubble roof, back brush. */
function WashArchBack() {
  return (
    <g transform={`translate(${WASH_X} 0)`} stroke={NAVY} strokeLinejoin="round">
      <rect x={-98} y={-182} width={20} height={182} rx={9} fill="#4dabf7" strokeWidth={5} />
      <rect x={78} y={-182} width={20} height={182} rx={9} fill="#4dabf7" strokeWidth={5} />
      <g className="brush-spin">
        <rect x={-60} y={-172} width={28} height={132} rx={14} fill="#9775fa" strokeWidth={5} />
      </g>
      <rect x={-114} y={-218} width={228} height={46} rx={17} fill="#f783ac" strokeWidth={5} />
      <circle cx={-62} cy={-195} r={11} fill="#fff" stroke="none" opacity={0.85} />
      <circle cx={-30} cy={-191} r={8} fill="#fff" stroke="none" opacity={0.7} />
      <circle cx={28} cy={-196} r={12} fill="#fff" stroke="none" opacity={0.85} />
      <circle cx={66} cy={-190} r={7} fill="#fff" stroke="none" opacity={0.7} />
    </g>
  );
}

/** Carwash front layer (drawn over the truck): front brush + hanging strips. */
function WashArchFront() {
  return (
    <g transform={`translate(${WASH_X} 0)`} stroke={NAVY} strokeLinejoin="round">
      <g className="brush-spin2">
        <rect x={34} y={-168} width={28} height={126} rx={14} fill="#22cdb7" strokeWidth={5} />
      </g>
      {[-20, -2, 16].map((x, i) => (
        <rect
          key={x}
          className="wash-strip"
          style={{ animationDelay: `${i * 0.18}s` }}
          x={x}
          y={-172}
          width={12}
          height={86}
          rx={6}
          fill="#c9ecff"
          strokeWidth={4}
        />
      ))}
    </g>
  );
}

type TurboPhase = "ready" | "active" | "charging";

type DriveProps = {
  config: TruckConfig;
  stars: number;
  onStars: (n: number) => void;
  onHome: () => void;
};

export function DriveScreen({ config, stars, onStars, onHome }: DriveProps) {
  const [targetColor, setTargetColor] = useState<PaletteEntry>(() => carColor(1 + Math.floor(Math.random() * 3)));
  const [turboUI, setTurboUI] = useState<TurboPhase>("ready");
  const [started, setStarted] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const truckRef = useRef<SVGGElement>(null);
  const wiggleRef = useRef<SVGGElement>(null);
  const terrainRef = useRef<SVGGElement>(null);
  const washFrontRef = useRef<SVGGElement>(null);
  const hillsRef = useRef<SVGGElement>(null);
  const cloudsRef = useRef<SVGGElement>(null);
  const fxRef = useRef<SVGGElement>(null);
  const carRefs = useRef<(SVGGElement | null)[]>([]);
  const busRef = useRef<SVGGElement>(null);
  const rescueRef = useRef<SVGGElement>(null);
  const ballRef = useRef<SVGGElement>(null);

  const gasPts = useRef<Set<number>>(new Set());
  const turboRef = useRef<{ phase: TurboPhase; until: number }>({ phase: "ready", until: 0 });
  const targetRef = useRef(targetColor);
  const starsRef = useRef(stars); // mount-time copy; the loop owns it from here
  const crushedRef = useRef<Set<number>>(new Set());
  const crushedBusRef = useRef<Set<number>>(new Set());
  const rescuedRef = useRef<Set<number>>(new Set());
  const truckSXRef = useRef(300);
  const scareRef = useRef<() => void>(() => {});
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jumpAt = useRef(0); // timestamp of last jump press; buffered so mashing pogo-hops on landing

  useEffect(() => {
    // refs are committed before effects run
    const root = rootRef.current!;
    const svgEl = svgRef.current!;
    const truckG = truckRef.current!;
    const wiggleG = wiggleRef.current!;
    const fx = fxRef.current!;
    const busG = busRef.current!;
    const rescueG = rescueRef.current!;
    const ballG = ballRef.current!;
    const wheels = Array.from(truckG.querySelectorAll<SVGGElement>(".wheel-rot"));
    const cars = carRefs.current.filter(Boolean) as SVGGElement[];

    // Keep the truck ~1/3 into the visible slice of the viewBox on any aspect ratio.
    const ro = new ResizeObserver(() => {
      const { width, height } = root.getBoundingClientRect();
      if (!width || !height) return;
      const visW = Math.min(VB_W, (VB_H * width) / height);
      truckSXRef.current = (VB_W - visW) / 2 + Math.max(180, visW * 0.3);
    });
    ro.observe(root);

    const st = {
      off: 0, speed: 0, y: BASE - R_S, vy: 0, ang: 0, wheelA: 0,
      smokeT: 0, flameT: 0, fleckT: 0, foamT: 0,
      airborne: false, airT: 0, liftSpeed: 0, flipping: false, flipDur: 0.4, jumped: false, shock: false,
      mud: 0, lastSplat: 0, inWash: false, puntCd: 0,
    };
    const ball = { mode: "idle" as "idle" | "fly", wx: BALL_OFF, y: 0, vx: 0, vy: 0, rot: 0, squash: 0 };
    let raf = 0;
    let last = performance.now();

    function spawnFx(
      x: number, y: number, colors: string[], count: number, dist: number,
      shape: "mixed" | "heart" = "mixed"
    ) {
      for (let i = 0; i < count; i++) {
        const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
        wrap.style.transform = `translate(${x}px, ${y}px)`;
        const c = colors[i % colors.length];
        let el: SVGElement;
        if (shape === "heart") {
          el = document.createElementNS("http://www.w3.org/2000/svg", "path");
          el.setAttribute("d", HEART_D);
          el.setAttribute("stroke", NAVY);
          el.setAttribute("stroke-width", "2.5");
        } else if (i % 2 === 0) {
          el = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          el.setAttribute("points", starPoints(0, 0, 13, 5.6));
          el.setAttribute("stroke", NAVY);
          el.setAttribute("stroke-width", "2.5");
          el.setAttribute("stroke-linejoin", "round");
        } else {
          el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          el.setAttribute("r", String(5 + (i % 3) * 2.5));
        }
        el.setAttribute("fill", c);
        const a = Math.random() * Math.PI * 2;
        const d = dist * (0.45 + Math.random() * 0.55);
        el.classList.add("fx-pop");
        el.style.setProperty("--dx", `${(Math.cos(a) * d).toFixed(0)}px`);
        el.style.setProperty("--dy", `${(Math.sin(a) * d - dist * 0.35).toFixed(0)}px`);
        el.style.setProperty("--rot", `${(Math.random() * 360 - 180).toFixed(0)}deg`);
        wrap.appendChild(el);
        fx.appendChild(wrap);
        setTimeout(() => wrap.remove(), 800);
      }
    }

    function puff(x: number, y: number, cls: string, fill: string, r: number, ttl = 1200) {
      const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
      wrap.style.transform = `translate(${x}px, ${y}px)`;
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("r", r.toFixed(1));
      c.setAttribute("fill", fill);
      c.classList.add(cls);
      wrap.appendChild(c);
      fx.appendChild(wrap);
      setTimeout(() => wrap.remove(), ttl);
    }

    function globs(x: number, y: number, count: number) {
      for (let i = 0; i < count; i++) {
        const wrap = document.createElementNS("http://www.w3.org/2000/svg", "g");
        wrap.style.transform = `translate(${x}px, ${y}px)`;
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("r", (4 + Math.random() * 7).toFixed(1));
        c.setAttribute("fill", i % 2 ? "#8a5a2e" : "#6e4423");
        c.classList.add("fx-glob");
        c.style.setProperty("--dx", `${(Math.random() * 280 - 140).toFixed(0)}px`);
        c.style.setProperty("--dy", `${(-60 - Math.random() * 130).toFixed(0)}px`);
        wrap.appendChild(c);
        fx.appendChild(wrap);
        setTimeout(() => wrap.remove(), 1000);
      }
    }

    function addStars(gained: number, fxX: number, fxY: number) {
      const before = starsRef.current;
      starsRef.current = before + gained;
      if (Math.floor(starsRef.current / 10) > Math.floor(before / 10)) {
        sfx.fanfare();
        spawnFx(fxX, fxY - 110, PALETTE.map((p) => p.main), 30, 250);
      }
      onStars(starsRef.current);
    }

    function newTarget(nearN: number) {
      const next = carColor(nearN + 1 + Math.floor(Math.random() * 3));
      targetRef.current = next;
      setTargetColor(next);
    }

    function crushCar(n: number, screenX: number, screenY: number, slot: SVGGElement) {
      crushedRef.current.add(n);
      slot.classList.add("crushed");
      sfx.crunch();
      const c = carColor(n);
      let gained = 1;
      if (c.id === targetRef.current.id) {
        gained = 3;
        sfx.sparkle();
        spawnFx(screenX, screenY - 44, PALETTE.map((p) => p.main), 26, 175);
        newTarget(n);
      } else {
        spawnFx(screenX, screenY - 38, [c.main, "#ffffff", "#ffd43b"], 12, 110);
      }
      addStars(gained, screenX, screenY);
    }

    function crushBus(k: number, screenX: number, screenY: number) {
      crushedBusRef.current.add(k);
      busG.classList.add("crushed");
      sfx.crunch();
      sfx.slam(false);
      let gained = 2;
      if (targetRef.current.id === "yellow") {
        gained = 4;
        sfx.sparkle();
        spawnFx(screenX, screenY - 60, PALETTE.map((p) => p.main), 30, 200);
        newTarget(k * CARS_PER + 3);
      } else {
        spawnFx(screenX, screenY - 55, ["#ffd43b", "#ffffff", "#f0a800"], 18, 150);
      }
      addStars(gained, screenX, screenY);
    }

    function applyMud(level: number) {
      st.mud = level;
      for (const l of [1, 2, 3]) truckG.classList.toggle(`mud-${l}`, level === l);
    }

    scareRef.current = () => {
      sfx.squeaks();
      const targets = [...cars, busG];
      for (const el of targets) {
        if (el.style.display === "none") continue;
        el.style.setProperty("--hopd", `${(Math.random() * 0.14).toFixed(2)}s`);
        // remove + reflow so mashing the horn re-triggers the hop
        el.classList.remove("scared");
        void el.getBoundingClientRect();
        el.classList.add("scared");
        setTimeout(() => el.classList.remove("scared"), 700);
      }
    };

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const truckSX = truckSXRef.current;

      const tb = turboRef.current;
      if (tb.phase === "active" && now >= tb.until) {
        tb.phase = "charging";
        tb.until = now + 4500;
        setTurboUI("charging");
      } else if (tb.phase === "charging" && now >= tb.until) {
        tb.phase = "ready";
        sfx.pop();
        setTurboUI("ready");
      }
      const turbo = tb.phase === "active";

      const gas = gasPts.current.size > 0;
      const targetSpeed = turbo ? TURBO_SPEED : gas ? MAX_SPEED : 0;
      const rate = turbo ? 900 : gas ? 420 : 380;
      st.speed =
        st.speed < targetSpeed
          ? Math.min(targetSpeed, st.speed + rate * dt)
          : Math.max(targetSpeed, st.speed - rate * dt);
      st.off += st.speed * dt;

      // chassis follows the ground through a springy suspension; once the ground
      // falls away faster than the spring can track, switch to a ballistic phase
      const frontX = st.off + truckSX + HALF_BASE;
      const rearX = st.off + truckSX - HALF_BASE;
      const fgy = gy(frontX);
      const rgy = gy(rearX);
      const targetY = (fgy + rgy) / 2 - R_S;

      // --- jump button: launch off the ground (buffered 600ms => mash = pogo) ---
      // Must run BEFORE physics + the grounded check, or this frame's touchdown
      // logic cancels the launch instantly and the jump shrinks to a spring hop.
      if (jumpAt.current && !st.airborne && now - jumpAt.current < 600) {
        jumpAt.current = 0;
        st.airborne = true;
        st.airT = 0;
        st.liftSpeed = st.speed;
        st.flipping = st.speed > 560; // turbo + jump = backflip anywhere
        st.flipDur = 0.8; // leisurely flip: jumps have real hang time
        st.jumped = true;
        st.vy = Math.max(-1050, Math.min(st.vy, 0) - 750); // keep upward momentum off ramps
        sfx.jump();
        wiggleG.classList.remove("jump-stretch");
        void wiggleG.getBBox();
        wiggleG.classList.add("jump-stretch");
        setTimeout(() => wiggleG.classList.remove("jump-stretch"), 350);
      }

      if (st.airborne) {
        st.vy += GRAVITY * dt;
        st.y += st.vy * dt;
      } else {
        st.vy += ((targetY - st.y) * 130 - st.vy * 9) * dt;
        st.y += st.vy * dt;
        if (st.y > targetY + 6) {
          st.y = targetY + 6;
          st.vy = Math.min(st.vy, 0);
        }
      }
      // on the ground, pitch with the slope; in the air, pitch with the arc
      // (nose up rising, nose down falling) instead of wiggling with the
      // terrain profile scrolling underneath
      const groundAng = (Math.atan2(fgy - rgy, HALF_BASE * 2) * 180) / Math.PI;
      const targetAng = st.airborne ? Math.max(-14, Math.min(16, st.vy * 0.022)) : groundAng;
      st.ang += (targetAng - st.ang) * Math.min(1, (st.airborne ? 6 : 10) * dt);
      const grounded = st.airborne ? st.y >= targetY : targetY - st.y < 26;

      // --- big air: slide whistle up, backflip at turbo speed, slam landing ---
      let visualAng = st.ang;
      if (!st.airborne && !grounded) {
        st.airborne = true;
        st.airT = 0;
        st.liftSpeed = st.speed;
        st.flipping = st.liftSpeed > 560;
        st.flipDur = 0.4;
      }
      if (st.airborne) {
        st.airT += dt;
        // whistle only on real air, not bump hops (idempotent start)
        if (st.airT > 0.12 && (st.liftSpeed > 330 || st.jumped)) sfx.whistleStart();
        sfx.whistleSet(st.vy);
        if (st.flipping) {
          const p = Math.min(1, st.airT / st.flipDur);
          visualAng = st.ang - 360 * p;
        }
        if (grounded) {
          // touchdown
          st.airborne = false;
          st.y = targetY;
          st.vy = Math.min(st.vy, 0);
          sfx.whistleStop();
          // plain jumps land with squash+dust; the BIG celebration stays reserved
          // for ramp flights, turbo flips, and jump combos with extra hang time
          // (a flat jump flies ~1.1s, so the combo gate sits just above that)
          const big = (st.airT > 0.36 && !st.jumped) || st.flipping || (st.jumped && st.airT > 1.25);
          if (st.airT > 0.18) {
            sfx.slam(big);
            for (let i = 0; i < 9; i++) {
              puff(truckSX - 130 + i * 32, st.y + R_S - 8, "fx-smoke", i % 2 ? "#cdb49a" : "#bba287", 9 + Math.random() * 6);
            }
            wiggleG.classList.remove("jump-stretch"); // never let the two transform animations fight
            wiggleG.classList.remove("slam-squash");
            void wiggleG.getBBox();
            wiggleG.classList.add("slam-squash");
            setTimeout(() => wiggleG.classList.remove("slam-squash"), 500);
            if (big) {
              sfx.cheer();
              st.shock = true; // flatten anything close (applied below, once cars are placed)
              svgEl.classList.remove("shake");
              void svgEl.getBBox();
              svgEl.classList.add("shake");
              setTimeout(() => svgEl.classList.remove("shake"), 420);
            }
            if (st.flipping) {
              addStars(2, truckSX, st.y - 60);
              spawnFx(truckSX, st.y - 130, PALETTE.map((p) => p.main), 20, 190);
            }
          } else if (st.airT > 0.1) {
            sfx.slam(false);
          }
          st.flipping = false;
          st.jumped = false;
        }
      }

      truckG.setAttribute(
        "transform",
        `translate(${truckSX.toFixed(1)} ${st.y.toFixed(1)}) rotate(${visualAng.toFixed(2)}) scale(${SCALE}) translate(-180 -${AXLE_Y})`
      );
      st.wheelA = (st.wheelA + ((st.speed * dt) / R_S) * (180 / Math.PI)) % 360;
      for (const w of wheels) {
        w.setAttribute("transform", `rotate(${st.wheelA.toFixed(1)} ${w.dataset.cx} ${w.dataset.cy})`);
      }

      const terrainShift = `translate(${(-(st.off % PERIOD)).toFixed(1)} 0)`;
      terrainRef.current?.setAttribute("transform", terrainShift);
      washFrontRef.current?.setAttribute("transform", terrainShift);
      hillsRef.current?.setAttribute("transform", `translate(${(-((st.off * 0.35) % PERIOD)).toFixed(1)} 0)`);
      cloudsRef.current?.setAttribute("transform", `translate(${(-((st.off * 0.12) % PERIOD)).toFixed(1)} 0)`);

      // --- assign visible cars to the recycled pool ---
      const visCars: { n: number; wx: number; sx: number; sy: number; slot: SVGGElement }[] = [];
      const used = new Set<number>();
      const kMin = Math.floor((st.off - 200) / PERIOD);
      const kMax = Math.floor((st.off + VB_W + 200) / PERIOD);
      for (let k = kMin; k <= kMax; k++) {
        for (let s = 0; s < CARS_PER; s++) {
          const n = k * CARS_PER + s;
          const wx = k * PERIOD + CAR_SLOTS[s] * SEG + SEG / 2;
          if (wx < st.off - 200 || wx > st.off + VB_W + 200) continue;
          const idx = ((n % POOL) + POOL) % POOL;
          const slot = cars[idx];
          if (!slot) continue;
          used.add(idx);
          if (slot.dataset.n !== String(n)) {
            slot.dataset.n = String(n);
            const c = carColor(n);
            slot.querySelectorAll<SVGElement>(".car-body").forEach((el) => el.setAttribute("fill", c.main));
            slot.querySelectorAll<SVGElement>(".car-roof").forEach((el) => el.setAttribute("fill", c.dark));
            slot.classList.toggle("crushed", crushedRef.current.has(n));
            slot.style.display = "";
          }
          const sx = wx - st.off;
          const sy = gy(wx);
          slot.setAttribute("transform", `translate(${sx.toFixed(1)} ${sy.toFixed(1)})`);
          visCars.push({ n, wx, sx, sy, slot });
        }
      }
      cars.forEach((el, i) => {
        if (!used.has(i) && el.style.display !== "none") {
          el.style.display = "none";
          el.dataset.n = "";
        }
      });

      // --- school bus + rescue car (one per lap each) ---
      let busInfo: { k: number; wx: number; sx: number; sy: number } | null = null;
      let rescueInfo: { k: number; wx: number } | null = null;
      for (let k = kMin; k <= kMax; k++) {
        const bwx = k * PERIOD + BUS_OFF;
        if (bwx >= st.off - 250 && bwx <= st.off + VB_W + 250) {
          busInfo = { k, wx: bwx, sx: bwx - st.off, sy: gy(bwx) };
        }
        const rwx = k * PERIOD + RESCUE_OFF;
        if (rwx >= st.off - 250 && rwx <= st.off + VB_W + 250) rescueInfo = { k, wx: rwx };
      }
      if (busInfo) {
        if (busG.dataset.n !== String(busInfo.k)) {
          busG.dataset.n = String(busInfo.k);
          busG.classList.toggle("crushed", crushedBusRef.current.has(busInfo.k));
        }
        busG.style.display = "";
        busG.setAttribute("transform", `translate(${busInfo.sx.toFixed(1)} ${busInfo.sy.toFixed(1)})`);
      } else if (busG.style.display !== "none") {
        busG.style.display = "none";
        busG.dataset.n = "";
      }
      if (rescueInfo) {
        if (rescueG.dataset.n !== String(rescueInfo.k)) {
          rescueG.dataset.n = String(rescueInfo.k);
          rescueG.classList.toggle("rescued", rescuedRef.current.has(rescueInfo.k));
        }
        rescueG.style.display = "";
        rescueG.setAttribute(
          "transform",
          `translate(${(rescueInfo.wx - st.off).toFixed(1)} ${gy(rescueInfo.wx).toFixed(1)})`
        );
      } else if (rescueG.style.display !== "none") {
        rescueG.style.display = "none";
        rescueG.dataset.n = "";
      }

      // --- crushes & rescues (only with wheels near the ground) ---
      const nearGround = st.y > targetY - 34;
      if (st.shock) {
        // a big slam flattens anything close, no contact needed
        st.shock = false;
        const center = st.off + truckSX;
        for (const c of visCars) {
          if (!crushedRef.current.has(c.n) && Math.abs(c.wx - center) < 175) {
            crushCar(c.n, c.sx, c.sy, c.slot);
          }
        }
        if (busInfo && !crushedBusRef.current.has(busInfo.k) && Math.abs(busInfo.wx - center) < 195) {
          crushBus(busInfo.k, busInfo.sx, busInfo.sy);
        }
      }
      if (nearGround) {
        for (const c of visCars) {
          if (!crushedRef.current.has(c.n) && (Math.abs(frontX - c.wx) < 52 || Math.abs(rearX - c.wx) < 52)) {
            crushCar(c.n, c.sx, c.sy, c.slot);
          }
        }
        if (busInfo && !crushedBusRef.current.has(busInfo.k) && Math.abs(frontX - busInfo.wx) < 80) {
          crushBus(busInfo.k, busInfo.sx, busInfo.sy);
        }
        if (rescueInfo && !rescuedRef.current.has(rescueInfo.k) && Math.abs(frontX - rescueInfo.wx) < 58) {
          rescuedRef.current.add(rescueInfo.k);
          rescueG.classList.add("rescued");
          sfx.chirps();
          const rsx = rescueInfo.wx - st.off;
          const rsy = gy(rescueInfo.wx);
          spawnFx(rsx, rsy - 70, ["#f783ac", "#ff5d5d", "#fff"], 11, 130, "heart");
          addStars(2, rsx, rsy);
        }
      }

      // --- beach ball ---
      st.puntCd = Math.max(0, st.puntCd - dt);
      if (ball.mode === "idle") {
        ball.y = gy(ball.wx) - BALL_R;
        if (st.puntCd === 0 && nearGround && Math.abs(frontX - ball.wx) < 70) {
          ball.mode = "fly";
          ball.vx = st.speed * 1.05 + 280;
          ball.vy = -470 - st.speed * 0.25;
          ball.squash = 0.12;
          st.puntCd = 0.35;
          sfx.punt();
        }
      } else {
        ball.vy += GRAVITY * dt;
        ball.wx += ball.vx * dt;
        ball.y += ball.vy * dt;
        const gnd = gy(ball.wx) - BALL_R;
        if (ball.y > gnd) {
          ball.y = gnd;
          if (Math.abs(ball.vy) > 130) {
            ball.vy = -Math.abs(ball.vy) * 0.6;
            ball.vx *= 0.85;
            ball.squash = 0.12;
            sfx.boingP(520 * Math.pow(0.82, Math.min(6, Math.round(Math.abs(ball.vy) / 120))));
          } else {
            ball.vy = 0;
            ball.vx *= 0.9;
            if (Math.abs(ball.vx) < 40) {
              ball.mode = "idle";
              ball.vx = 0;
            }
          }
        }
        // mid-air re-punt
        const bsx = ball.wx - st.off;
        if (
          st.puntCd === 0 &&
          Math.abs(bsx - truckSX) < 95 &&
          Math.abs(ball.y - (st.y - 40)) < 115
        ) {
          ball.vx = Math.max(ball.vx, st.speed) + 240;
          ball.vy = -430;
          ball.squash = 0.12;
          st.puntCd = 0.35;
          sfx.punt();
        }
      }
      ball.squash = Math.max(0, ball.squash - dt);
      ball.rot += ((ball.vx * dt) / BALL_R) * (180 / Math.PI);
      if (ball.wx < st.off - 380) {
        // respawn at the next slot ahead of the truck
        const pos = st.off + truckSX;
        const k = Math.floor(pos / PERIOD) + (((pos % PERIOD) + PERIOD) % PERIOD > BALL_OFF - 100 ? 1 : 0);
        ball.wx = k * PERIOD + BALL_OFF;
        ball.mode = "idle";
        ball.vx = 0;
        ball.vy = 0;
        ball.rot = 0;
      }
      // squash before rotate so the ball flattens vertically in world space
      const bsq = ball.squash > 0 ? " scale(1.22 0.72)" : "";
      ballG.setAttribute(
        "transform",
        `translate(${(ball.wx - st.off).toFixed(1)} ${ball.y.toFixed(1)})${bsq} rotate(${(ball.rot % 360).toFixed(1)})`
      );

      // --- mud pit splash & carwash ---
      const lapFront = ((frontX % PERIOD) + PERIOD) % PERIOD;
      if (nearGround && Math.abs(lapFront - MUD_X) < 80 && now - st.lastSplat > 800 && st.speed > 40) {
        st.lastSplat = now;
        sfx.splat();
        globs(truckSX + 30, st.y + R_S - 14, 14);
        applyMud(Math.min(3, st.mud + 1));
      }
      if (st.mud > 0 && st.speed > 140) {
        st.fleckT += dt;
        if (st.fleckT > 0.16) {
          st.fleckT = 0;
          puff(truckSX - HALF_BASE - 10, st.y + R_S * 0.5, "fx-fleck", "#6e4423", 4 + Math.random() * 4, 600);
        }
      }
      const lapMid = (((st.off + truckSX) % PERIOD) + PERIOD) % PERIOD;
      const inWash = Math.abs(lapMid - WASH_X) < 85;
      if (inWash && !st.inWash) {
        st.inWash = true;
        sfx.scrub();
      } else if (!inWash && st.inWash) {
        st.inWash = false;
        if (st.mud > 0) {
          applyMud(0);
          sfx.washDone();
          spawnFx(truckSX, st.y - 100, ["#ffffff", "#c9ecff", "#22cdb7"], 16, 150);
        } else {
          sfx.sparkle();
        }
      }
      if (st.inWash) {
        st.foamT += dt;
        if (st.foamT > 0.07) {
          st.foamT = 0;
          puff(
            truckSX - 90 + Math.random() * 180,
            st.y - 140 + Math.random() * 150,
            "fx-foam",
            "#ffffff",
            6 + Math.random() * 8,
            900
          );
        }
      }

      // --- exhaust: smoke when cruising, flames during turbo ---
      const exX = truckSX + (EXHAUST.x - 180) * SCALE;
      const exY = st.y + (EXHAUST.y - AXLE_Y) * SCALE;
      if (turbo) {
        st.flameT += dt;
        if (st.flameT > 0.05) {
          st.flameT = 0;
          puff(exX, exY, "fx-flame", Math.random() < 0.5 ? "#ff922b" : "#ffd43b", 8 + Math.random() * 5, 500);
        }
      } else if (st.speed > 30) {
        st.smokeT += dt;
        if (st.smokeT > 0.22) {
          st.smokeT = 0;
          puff(exX, exY, "fx-smoke", "#e3ebf3", 8 + Math.random() * 4);
        }
      }

      sfx.engineSet(st.speed / MAX_SPEED, turbo);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const onHide = () => {
      if (document.hidden) {
        gasPts.current.clear();
        sfx.engineSet(0, false);
        sfx.whistleStop();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onHide);
      sfx.whistleStop();
      sfx.engineStop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={rootRef}
      className="drive-sky relative h-full w-full select-none overflow-hidden touch-none"
      onPointerDown={(e) => {
        sfx.unlockAudio();
        sfx.engineStart();
        setStarted(true);
        gasPts.current.add(e.pointerId);
      }}
      onPointerUp={(e) => gasPts.current.delete(e.pointerId)}
      onPointerCancel={(e) => gasPts.current.delete(e.pointerId)}
      onPointerLeave={(e) => gasPts.current.delete(e.pointerId)}
    >
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMax slice"
        aria-hidden
      >
        <SunArt x={880} y={92} r={42} />
        <g ref={cloudsRef}>
          {[0, PERIOD].map((o) => (
            <g key={o} transform={`translate(${o} 0)`}>
              <CloudArt x={180} y={64} s={1.1} />
              <CloudArt x={1050} y={120} s={0.8} />
              <CloudArt x={1900} y={56} s={1.3} />
              <CloudArt x={2700} y={108} s={0.9} />
            </g>
          ))}
        </g>
        <g ref={hillsRef}>
          {[0, PERIOD].map((o) => (
            <path key={o} transform={`translate(${o} 0)`} d={HILLS} fill="#8fdc7a" />
          ))}
        </g>
        <g ref={terrainRef}>
          {[0, PERIOD].map((o) => (
            <g key={o} transform={`translate(${o} 0)`}>
              <path d={TERRAIN.fill} fill="#cd8447" />
              <path d={TERRAIN.edge} fill="none" stroke="#a05c2c" strokeWidth={8} strokeLinecap="round" />
              <g transform={`translate(0 ${BASE})`}>
                <MudPit />
                <WashArchBack />
              </g>
            </g>
          ))}
        </g>
        <g ref={rescueRef} style={{ display: "none" }}>
          <RescueCar />
        </g>
        <g ref={busRef} style={{ display: "none" }}>
          <BusShape />
        </g>
        <g>
          {Array.from({ length: POOL }).map((_, i) => (
            <g
              key={i}
              ref={(el) => {
                carRefs.current[i] = el;
              }}
              style={{ display: "none" }}
            >
              <CarShape />
            </g>
          ))}
        </g>
        <g ref={ballRef}>
          <BeachBall />
        </g>
        <g
          ref={truckRef}
          transform={`translate(300 ${BASE - R_S}) rotate(0) scale(${SCALE}) translate(-180 -${AXLE_Y})`}
        >
          <g ref={wiggleRef}>
            <TruckArt config={config} />
          </g>
        </g>
        <g ref={washFrontRef}>
          {[0, PERIOD].map((o) => (
            <g key={o} transform={`translate(${o} ${BASE})`}>
              <WashArchFront />
            </g>
          ))}
        </g>
        <g ref={fxRef} />
      </svg>

      {/* UI overlay */}
      <div className="pointer-events-none absolute inset-0">
        <div className="safe-t safe-x flex items-start justify-between gap-2 p-3 sm:p-4">
          <button
            aria-label="Back to garage"
            className="toy-btn pointer-events-auto h-16 w-16 bg-white/90 p-2.5"
            onPointerDown={(e) => {
              // plain tap: stars persist in Game state, so an accidental exit costs nothing
              e.stopPropagation();
              sfx.unlockAudio();
              sfx.pop();
              onHome();
            }}
          >
            <HomeIcon className="h-full w-full" />
          </button>
          <div key={targetColor.id} className="toy-pill boing flex items-center gap-1.5 px-4 py-1.5">
            <svg viewBox="-52 -62 104 66" className="h-10 w-[68px]" aria-hidden>
              <CarShape main={targetColor.main} dark={targetColor.dark} />
            </svg>
            <span className="text-2xl font-bold">=</span>
            <div className="flex items-center">
              <StarIcon className="h-7 w-7" />
              <StarIcon className="-ml-1.5 h-7 w-7" />
              <StarIcon className="-ml-1.5 h-7 w-7" />
            </div>
          </div>
          <div className="toy-pill flex min-w-[110px] items-center justify-center gap-2 px-4 py-1.5">
            <StarIcon className="h-9 w-9" />
            <span className="text-4xl font-bold tabular-nums">{stars}</span>
          </div>
        </div>

        <div className="safe-b safe-x absolute inset-x-0 bottom-0 flex items-end justify-between p-4 sm:p-6">
          <button
            aria-label="Honk"
            className="toy-btn pointer-events-auto h-20 w-20 bg-[#ff922b] p-4"
            style={{ borderRadius: 9999 }}
            onPointerDown={() => {
              sfx.unlockAudio();
              sfx.voice(config.body);
              scareRef.current();
              const g = truckRef.current;
              if (g) {
                // remove + reflow so mashing re-triggers the flash
                g.classList.remove("voice-flash");
                void g.getBoundingClientRect();
                g.classList.add("voice-flash");
                if (flashTimer.current) clearTimeout(flashTimer.current);
                flashTimer.current = setTimeout(() => g.classList.remove("voice-flash"), 1000);
              }
            }}
          >
            <HornIcon className="h-full w-full" />
          </button>
          <div className="flex items-end gap-4 sm:gap-5">
            <button
              aria-label="Turbo boost"
              className={`toy-btn pointer-events-auto h-20 w-20 p-3.5 ${turboUI === "active" ? "turbo-glow" : ""}`}
              style={{
                borderRadius: 9999,
                background:
                  turboUI === "charging"
                    ? "#b9c2d4"
                    : "linear-gradient(135deg,#ff5d5d,#ff922b,#ffd43b,#51cf66,#4dabf7,#9775fa)",
              }}
              onPointerDown={() => {
                sfx.unlockAudio();
                const tb = turboRef.current;
                if (tb.phase !== "ready") {
                  if (tb.phase === "charging") sfx.denied();
                  return;
                }
                tb.phase = "active";
                tb.until = performance.now() + 2300;
                setTurboUI("active");
                sfx.whoosh();
              }}
            >
              <BoltIcon className="h-full w-full" />
            </button>
            <button
              aria-label="Jump"
              className="toy-btn pointer-events-auto h-24 w-24 bg-[#4dabf7] p-5"
              style={{ borderRadius: 9999 }}
              onPointerDown={() => {
                // no stopPropagation: jumping also feeds the gas, which feels right
                jumpAt.current = performance.now();
              }}
            >
              <UpIcon className="h-full w-full" />
            </button>
            <button
              aria-label="Gas pedal"
              className={`toy-btn pointer-events-auto h-28 w-28 bg-[#51cf66] p-7 ${started ? "" : "pulse-ring"}`}
              style={{ borderRadius: 9999 }}
            >
              <PlayIcon className="h-full w-full" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
