// Chunky cartoon icons drawn inline so buttons need no text.

const NAVY = "#1d2b4f";

type IconProps = { className?: string };

export function TruckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <g fill="#fff" stroke={NAVY} strokeWidth={1.8} strokeLinejoin="round">
        <path d="M3 14 L3 9 L9 9 L11 5 L16 5 L18 9 L21 9 L21 14 Z" />
        <circle cx={7.5} cy={16} r={3} fill={NAVY} stroke="none" />
        <circle cx={16.5} cy={16} r={3} fill={NAVY} stroke="none" />
        <circle cx={7.5} cy={16} r={1.2} fill="#fff" stroke="none" />
        <circle cx={16.5} cy={16} r={1.2} fill="#fff" stroke="none" />
      </g>
    </svg>
  );
}

export function WheelIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx={12} cy={12} r={9} fill={NAVY} />
      <circle cx={12} cy={12} r={5.2} fill="#fff" />
      <circle cx={12} cy={12} r={1.6} fill={NAVY} />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle
          key={a}
          cx={12 + 3.4 * Math.cos(((a - 90) * Math.PI) / 180)}
          cy={12 + 3.4 * Math.sin(((a - 90) * Math.PI) / 180)}
          r={0.9}
          fill={NAVY}
        />
      ))}
    </svg>
  );
}

export function FlameIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2 C14.5 6 18.5 7.5 17.5 13 A5.8 5.8 0 0 1 6.5 13 C5.5 8.5 9.5 6.5 12 2 Z"
        fill="#ff922b"
        stroke={NAVY}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <path d="M12 9 C13.3 11 15 11.6 14.4 14.5 A2.9 2.9 0 0 1 9.6 14.5 C9 12.3 10.9 11.2 12 9 Z" fill="#ffd43b" />
    </svg>
  );
}

export function DiceIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x={3} y={3} width={18} height={18} rx={5} fill="#fff" stroke={NAVY} strokeWidth={2} />
      <circle cx={8.5} cy={8.5} r={1.8} fill={NAVY} />
      <circle cx={15.5} cy={8.5} r={1.8} fill={NAVY} />
      <circle cx={12} cy={12} r={1.8} fill={NAVY} />
      <circle cx={8.5} cy={15.5} r={1.8} fill={NAVY} />
      <circle cx={15.5} cy={15.5} r={1.8} fill={NAVY} />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <g stroke={NAVY} strokeWidth={1.8} strokeLinejoin="round">
        <path d="M3 11 L12 3.5 L21 11 L21 20 L3 20 Z" fill="#fff" />
        <rect x={8} y={12.5} width={8} height={7.5} fill="#ffd43b" />
        <path d="M8 15 L16 15 M8 17.5 L16 17.5" fill="none" />
      </g>
    </svg>
  );
}

export function HornIcon({ className }: IconProps) {
  // toy squeeze-horn at 45 degrees with an oversized bulb: deliberately nothing
  // like the horizontal box-and-cone speaker glyph used by the mute button
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {/* bell, pointing up-right */}
      <path
        d="M9.4 12.4 L15.5 2.5 Q16.3 1.3 17.4 2.2 L21.1 5.4 Q22.2 6.4 20.9 7.2 L11.6 14.6 Q10.2 15.6 9.4 14.2 Z"
        fill="#fff"
        stroke={NAVY}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      {/* big squeeze bulb */}
      <circle cx={8.2} cy={16} r={4.8} fill="#ffd43b" stroke={NAVY} strokeWidth={1.8} />
      {/* honk! burst */}
      <path
        d="M19.2 1.9 L20.2 0.7 M21.9 3.9 L23.3 3.2 M22.3 8.6 L23.6 9.1"
        fill="none"
        stroke={NAVY}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BoltIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <polygon
        points="13.5,1.5 4.5,13.5 10.5,13.5 8.5,22.5 19.5,9.5 12.5,9.5"
        fill="#ffd43b"
        stroke={NAVY}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarIcon({ className, fill = "#ffd43b" }: IconProps & { fill?: string }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 10.5 : 4.6;
    const a = (Math.PI * i) / 5 - Math.PI / 2;
    pts.push(`${12 + r * Math.cos(a)},${12.5 + r * Math.sin(a)}`);
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <polygon points={pts.join(" ")} fill={fill} stroke={NAVY} strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

export function SpeakerIcon({ className, muted }: IconProps & { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M4 9.5 L8 9.5 L13 5 L13 19 L8 14.5 L4 14.5 Z"
        fill="#fff"
        stroke={NAVY}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      {muted ? (
        <path d="M16 9.5 L21 14.5 M21 9.5 L16 14.5" fill="none" stroke={NAVY} strokeWidth={2.2} strokeLinecap="round" />
      ) : (
        <path
          d="M16.5 9 Q18.5 12 16.5 15 M19 6.5 Q22 12 19 17.5"
          fill="none"
          stroke={NAVY}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function UpIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2.5 L21 12 L15.5 12 L15.5 21 L8.5 21 L8.5 12 L3 12 Z"
        fill="#fff"
        stroke={NAVY}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M7 4.5 L19 12 L7 19.5 Z"
        fill="#fff"
        stroke={NAVY}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Smiling sun, drawn as an SVG group so it works inside any scene. */
export function SunArt({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <g className="sun-spin">
        {Array.from({ length: 12 }).map((_, i) => (
          <rect
            key={i}
            x={x - r * 0.13}
            y={y - r - r * 0.42}
            width={r * 0.26}
            height={r * 0.34}
            rx={r * 0.12}
            fill="#ffd43b"
            transform={`rotate(${i * 30} ${x} ${y})`}
          />
        ))}
      </g>
      <circle cx={x} cy={y} r={r} fill="#ffd43b" stroke="#f5a623" strokeWidth={r * 0.1} />
      <circle cx={x - r * 0.32} cy={y - r * 0.12} r={r * 0.09} fill="#1d2b4f" />
      <circle cx={x + r * 0.32} cy={y - r * 0.12} r={r * 0.09} fill="#1d2b4f" />
      <path
        d={`M${x - r * 0.34} ${y + r * 0.22} Q${x} ${y + r * 0.52} ${x + r * 0.34} ${y + r * 0.22}`}
        fill="none"
        stroke="#1d2b4f"
        strokeWidth={r * 0.09}
        strokeLinecap="round"
      />
    </g>
  );
}

/** Puffy cloud as an SVG group, ~140x55 units, anchored at (x, y) top-left. */
export function CloudArt({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#ffffff" opacity={0.95}>
      <ellipse cx={35} cy={36} rx={26} ry={18} />
      <ellipse cx={72} cy={26} rx={32} ry={24} />
      <ellipse cx={108} cy={38} rx={24} ry={16} />
      <rect x={16} y={34} width={108} height={20} rx={10} />
    </g>
  );
}
