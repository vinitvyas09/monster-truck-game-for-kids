import { useId } from "react";
import type { BodyId, DecalId, TruckConfig, WheelId } from "@/lib/trucks";
import { colorOf } from "@/lib/trucks";

// Art coordinate space. The drive scene imports these to place and rotate the truck.
export const ART_W = 360;
export const ART_H = 270;
export const WHEEL_X = [95, 265] as const;
export const AXLE_Y = 195;
export const WHEEL_R = 52;
export const EXHAUST = { x: 84, y: 38 };

const NAVY = "#1d2b4f";
const TIRE = "#2b3445";
const TREAD = "#4a5b78";
const METAL = "#94a8bf";
const GLASS = "#c9ecff";

export function starPoints(cx: number, cy: number, outer: number, inner: number, n = 5): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

const BODY_PATHS: Record<BodyId, string> = {
  pickup:
    "M46 150 L46 96 Q46 88 54 88 L148 88 L162 60 Q165 54 172 54 L224 54 Q231 54 234 60 L250 88 L308 88 Q316 88 316 96 L316 150 Z",
  van: "M46 150 L46 74 Q46 58 62 58 L300 58 Q316 58 316 74 L316 150 Z",
  bug: "M48 150 Q52 78 128 62 Q196 50 252 68 Q310 86 314 150 Z",
  fire: "M46 150 L46 82 Q46 70 58 70 L304 70 Q316 70 316 82 L316 150 Z",
  rex: "M46 150 L46 94 Q46 82 58 82 L304 82 Q316 82 316 94 L316 150 Z",
};

type Box = { x: number; y: number; w: number; h: number };

const DECAL_BOX: Record<BodyId, Box> = {
  pickup: { x: 56, y: 98, w: 116, h: 46 },
  van: { x: 56, y: 84, w: 132, h: 30 },
  bug: { x: 64, y: 96, w: 118, h: 46 },
  fire: { x: 56, y: 76, w: 124, h: 34 },
  rex: { x: 56, y: 94, w: 126, h: 46 },
};

function Decal({ id, box }: { id: DecalId; box: Box }) {
  if (id === "none") return null;
  return (
    <g
      transform={`translate(${box.x} ${box.y}) scale(${box.w / 100} ${box.h / 50})`}
      stroke={NAVY}
      strokeWidth={3}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {id === "flames" && (
        <>
          <path
            d="M100 25 Q68 4 42 9 Q56 15 38 20 Q14 16 4 25 Q14 34 38 30 Q56 35 42 41 Q68 46 100 25 Z"
            fill="#ff8c2b"
          />
          <path
            d="M100 25 Q76 13 58 16 Q66 20 55 23 Q40 21 33 25 Q40 29 55 27 Q66 30 58 34 Q76 37 100 25 Z"
            fill="#ffd43b"
            stroke="none"
          />
        </>
      )}
      {id === "bolt" && <polygon points="55,1 16,29 37,29 28,49 72,19 49,19 60,1" fill="#ffd43b" />}
      {id === "stars" && (
        <>
          <polygon points={starPoints(24, 25, 13, 5.5)} fill="#fff" />
          <polygon points={starPoints(58, 13, 9, 4)} fill="#fff" />
          <polygon points={starPoints(76, 34, 10, 4.3)} fill="#fff" />
        </>
      )}
      {id === "eyes" && (
        <>
          <ellipse cx={32} cy={20} rx={13} ry={15} fill="#fff" />
          <ellipse cx={64} cy={20} rx={13} ry={15} fill="#fff" />
          <circle cx={35} cy={24} r={5.5} fill={NAVY} stroke="none" />
          <circle cx={67} cy={24} r={5.5} fill={NAVY} stroke="none" />
          <path d="M38 42 Q48 50 58 42" fill="none" strokeWidth={4} />
        </>
      )}
    </g>
  );
}

function BodyExtras({ body, dark }: { body: BodyId; dark: string }) {
  switch (body) {
    case "pickup":
      return (
        <g stroke={NAVY} strokeWidth={4} strokeLinejoin="round">
          <path d="M174 62 L222 62 L234 86 L164 86 Z" fill={GLASS} />
          <rect x={310} y={120} width={16} height={26} rx={5} fill={METAL} />
          <circle cx={306} cy={104} r={6} fill="#ffd43b" strokeWidth={3.5} />
        </g>
      );
    case "van":
      return (
        <g stroke={NAVY} strokeWidth={4} strokeLinejoin="round">
          <path d="M254 70 L296 70 Q306 70 308 80 L312 104 L254 104 Z" fill={GLASS} />
          <rect x={202} y={72} width={42} height={32} rx={7} fill={GLASS} />
          <circle cx={306} cy={128} r={6} fill="#ffd43b" strokeWidth={3.5} />
        </g>
      );
    case "bug":
      return (
        <g stroke={NAVY} strokeWidth={4} strokeLinejoin="round">
          <path d="M208 74 Q254 82 276 106 L208 106 Z" fill={GLASS} />
          <circle cx={296} cy={118} r={6} fill="#ffd43b" strokeWidth={3.5} />
        </g>
      );
    case "fire":
      return (
        <g stroke={NAVY} strokeWidth={3.5} strokeLinejoin="round">
          <rect x={72} y={46} width={168} height={6} rx={3} fill="#cfd8e6" />
          <rect x={72} y={58} width={168} height={6} rx={3} fill="#cfd8e6" />
          {[96, 132, 168, 204].map((x) => (
            <rect key={x} x={x} y={46} width={7} height={18} rx={3} fill="#cfd8e6" />
          ))}
          <rect className="fire-beacon" x={252} y={48} width={30} height={16} rx={6} fill="#ff5d5d" strokeWidth={4} />
          <path d="M260 80 L300 80 L308 106 L260 106 Z" fill={GLASS} strokeWidth={4} />
          <circle cx={306} cy={134} r={6} fill="#ffd43b" />
        </g>
      );
    case "rex":
      return (
        <g stroke={NAVY} strokeWidth={4} strokeLinejoin="round">
          {[64, 122, 180, 238].map((x) => (
            <polygon key={x} points={`${x},82 ${x + 22},52 ${x + 44},82`} fill={dark} />
          ))}
          <path
            d="M260 150 L269 132 L278 150 L287 132 L296 150 L305 132 L314 150 Z"
            fill="#fff"
          />
          <circle cx={286} cy={102} r={11} fill="#fff" />
          <circle className="rex-eye" cx={289} cy={103} r={5} fill={NAVY} stroke="none" />
        </g>
      );
  }
}

function Hub({ cx, style }: { cx: number; style: WheelId }) {
  const cy = AXLE_Y;
  switch (style) {
    case "mega":
      return (
        <g>
          <circle cx={cx} cy={cy} r={19} fill="#edf1f7" stroke={NAVY} strokeWidth={4} />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle
              key={a}
              cx={cx + 11 * Math.cos(((a - 90) * Math.PI) / 180)}
              cy={cy + 11 * Math.sin(((a - 90) * Math.PI) / 180)}
              r={3.2}
              fill={NAVY}
            />
          ))}
          <circle cx={cx} cy={cy} r={4.5} fill={NAVY} />
        </g>
      );
    case "star":
      return (
        <g>
          <circle cx={cx} cy={cy} r={19} fill="#edf1f7" stroke={NAVY} strokeWidth={4} />
          <polygon
            points={starPoints(cx, cy, 15, 6.5)}
            fill="#ffd43b"
            stroke={NAVY}
            strokeWidth={3}
            strokeLinejoin="round"
          />
        </g>
      );
    case "spike": {
      const spikes: string[] = [];
      for (let i = 0; i < 7; i++) {
        const a = (i * 2 * Math.PI) / 7 - Math.PI / 2;
        const tipX = cx + 33 * Math.cos(a);
        const tipY = cy + 33 * Math.sin(a);
        const b1X = cx + 14 * Math.cos(a + 0.42);
        const b1Y = cy + 14 * Math.sin(a + 0.42);
        const b2X = cx + 14 * Math.cos(a - 0.42);
        const b2Y = cy + 14 * Math.sin(a - 0.42);
        spikes.push(
          `${tipX.toFixed(1)},${tipY.toFixed(1)} ${b1X.toFixed(1)},${b1Y.toFixed(1)} ${b2X.toFixed(1)},${b2Y.toFixed(1)}`
        );
      }
      return (
        <g>
          {spikes.map((pts, i) => (
            <polygon key={i} points={pts} fill="#d7dee9" stroke={NAVY} strokeWidth={3} strokeLinejoin="round" />
          ))}
          <circle cx={cx} cy={cy} r={14} fill="#edf1f7" stroke={NAVY} strokeWidth={4} />
          <circle cx={cx} cy={cy} r={4} fill={NAVY} />
        </g>
      );
    }
    case "pinwheel":
      return (
        <g>
          <circle cx={cx} cy={cy} r={19} fill="#4dabf7" stroke={NAVY} strokeWidth={4} />
          {[0, 120, 240].map((a) => (
            <rect
              key={a}
              x={cx - 3.5}
              y={cy - 17}
              width={7}
              height={15}
              rx={3.5}
              fill="#fff"
              transform={`rotate(${a} ${cx} ${cy})`}
            />
          ))}
          <circle cx={cx} cy={cy} r={4} fill="#fff" />
        </g>
      );
  }
}

function Wheel({ cx, style }: { cx: number; style: WheelId }) {
  return (
    // .wheel-rot groups are rotated imperatively by the drive scene.
    <g className="wheel-rot" data-cx={cx} data-cy={AXLE_Y}>
      <circle cx={cx} cy={AXLE_Y} r={WHEEL_R} fill={TIRE} stroke={NAVY} strokeWidth={5} />
      <circle
        cx={cx}
        cy={AXLE_Y}
        r={42}
        fill="none"
        stroke={TREAD}
        strokeWidth={11}
        strokeDasharray="13 11"
      />
      <Hub cx={cx} style={style} />
      {/* wheel mud (spins with the wheel); hidden until .mud-2+ */}
      <g className="mud-wheel" fill="#6e4423" stroke="none">
        <path d={`M${cx - 36} ${AXLE_Y + 20} A42 42 0 0 0 ${cx + 24} ${AXLE_Y + 34} Q${cx} ${AXLE_Y + 18} ${cx - 36} ${AXLE_Y + 20} Z`} />
        <circle cx={cx + 30} cy={AXLE_Y - 22} r={7} />
        <circle cx={cx - 12} cy={AXLE_Y + 38} r={6} fill="#8a5a2e" />
      </g>
    </g>
  );
}

export function TruckArt({ config }: { config: TruckConfig }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const clipId = `truckclip${uid}`;
  const { main, dark } = colorOf(config.colorId);
  const path = BODY_PATHS[config.body];
  const box = DECAL_BOX[config.body];
  return (
    <g strokeLinecap="round">
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>
      <ellipse cx={180} cy={252} rx={138} ry={13} fill={NAVY} opacity={0.15} />
      {/* exhaust pipes */}
      <g fill={METAL} stroke={NAVY} strokeWidth={4}>
        <rect x={58} y={46} width={13} height={46} rx={5} />
        <rect x={78} y={38} width={13} height={54} rx={5} />
        <rect x={55} y={41} width={19} height={9} rx={4} fill="#62788f" />
        <rect x={75} y={33} width={19} height={9} rx={4} fill="#62788f" />
      </g>
      {/* suspension + chassis */}
      <path
        d="M76 160 L95 192 M114 160 L95 192 M246 160 L265 192 M284 160 L265 192"
        stroke={METAL}
        strokeWidth={9}
        fill="none"
      />
      <rect x={66} y={144} width={228} height={20} rx={9} fill="#46586e" stroke={NAVY} strokeWidth={4.5} />
      {/* body */}
      <path d={path} fill={main} stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
      <g clipPath={`url(#${clipId})`}>
        {config.body === "van" && <rect x={46} y={118} width={270} height={15} fill={dark} />}
        {config.body === "fire" && <rect x={46} y={114} width={270} height={13} fill="#fff" />}
        <Decal id={config.decal} box={box} />
        {/* mud coat: invisible until the drive scene toggles .mud-1/2/3 on an ancestor */}
        <g className="mud-coat" stroke="none">
          <g className="mud-a" fill="#6e4423">
            <ellipse cx={92} cy={144} rx={34} ry={11} />
            <ellipse cx={206} cy={147} rx={42} ry={10} />
            <ellipse cx={294} cy={142} rx={26} ry={9} />
            <ellipse cx={150} cy={150} rx={20} ry={8} />
          </g>
          <g className="mud-b" fill="#8a5a2e">
            <ellipse cx={128} cy={122} rx={24} ry={9} />
            <ellipse cx={250} cy={126} rx={30} ry={10} />
            <ellipse cx={64} cy={118} rx={14} ry={7} />
            <circle cx={186} cy={118} r={8} />
          </g>
          <g className="mud-c" fill="#6e4423">
            <ellipse cx={170} cy={92} rx={22} ry={8} />
            <ellipse cx={272} cy={96} rx={16} ry={7} />
            <ellipse cx={92} cy={94} rx={18} ry={7} />
            <circle cx={228} cy={86} r={6} />
            <circle cx={130} cy={80} r={5} />
          </g>
        </g>
      </g>
      <path d={path} fill="none" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
      <BodyExtras body={config.body} dark={dark} />
      {/* wheels on top so they overlap the chassis like a real monster truck */}
      <Wheel cx={WHEEL_X[0]} style={config.wheels} />
      <Wheel cx={WHEEL_X[1]} style={config.wheels} />
    </g>
  );
}

export function MonsterTruck({ config, className }: { config: TruckConfig; className?: string }) {
  return (
    <svg viewBox={`0 0 ${ART_W} ${ART_H}`} className={className} aria-hidden>
      <TruckArt config={config} />
    </svg>
  );
}
