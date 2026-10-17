type Wave = { d: string; delay: number; opacity: number };
type Node = { cx: number; cy: number; delay: number };

/**
 * Decorative "living" sheet music: soft flowing line-art over faint staff
 * lines. Lines draw themselves in, then the glow gently pulses. Fully
 * `aria-hidden` and pauses under `prefers-reduced-motion`.
 */
const waves: Wave[] = [
  {
    d: "M-60 196 C 140 76 320 306 520 196 S 880 76 1080 196 S 1360 306 1520 196",
    delay: 0,
    opacity: 0.3,
  },
  {
    d: "M-60 214 C 180 114 340 306 560 214 S 900 114 1120 214 S 1400 306 1520 214",
    delay: 260,
    opacity: 0.5,
  },
  {
    d: "M-60 176 C 160 44 340 286 540 176 S 860 44 1080 176 S 1340 286 1520 176",
    delay: 520,
    opacity: 0.75,
  },
];

const nodes: Node[] = [
  { cx: 180, cy: 150, delay: 0 },
  { cx: 360, cy: 232, delay: 500 },
  { cx: 540, cy: 176, delay: 1000 },
  { cx: 720, cy: 250, delay: 1500 },
  { cx: 900, cy: 156, delay: 2000 },
  { cx: 1080, cy: 226, delay: 2500 },
  { cx: 1260, cy: 168, delay: 3000 },
];

const staffLines = [88, 132, 176, 220, 264];

export default function SheetMusic({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1400 340"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="sm-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--sm-strong)" }} stopOpacity="0" />
          <stop offset="0.28" style={{ stopColor: "var(--sm-strong)" }} stopOpacity="0.85" />
          <stop offset="0.62" style={{ stopColor: "var(--sm-soft)" }} stopOpacity="0.9" />
          <stop offset="1" style={{ stopColor: "var(--sm-strong)" }} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="sm-glow" cx="0.5" cy="0.5" r="0.5">
          <stop
            offset="0"
            style={{ stopColor: "var(--sm-strong)", stopOpacity: "var(--sm-glow)" }}
          />
          <stop offset="1" style={{ stopColor: "var(--sm-strong)", stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      {/* soft light source behind the artwork */}
      <ellipse
        cx="700"
        cy="176"
        rx="620"
        ry="200"
        fill="url(#sm-glow)"
        className="motion-safe:animate-pulse-soft"
      />

      {/* faint staff lines */}
      {staffLines.map((y) => (
        <line
          key={y}
          x1="-60"
          x2="1520"
          y1={y}
          y2={y}
          style={{ stroke: "var(--stage-staff)" }}
          strokeWidth="1"
        />
      ))}

      {/* flowing line art */}
      {waves.map((w, i) => (
        <path
          key={i}
          d={w.d}
          fill="none"
          stroke="url(#sm-stroke)"
          strokeWidth="1.75"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          strokeOpacity={w.opacity}
          style={{ strokeDasharray: "2400", animationDelay: `${w.delay}ms` }}
          className="motion-safe:animate-draw"
        />
      ))}

      {/* pulsing note nodes */}
      {nodes.map((n, i) => (
        <g
          key={i}
          className="motion-safe:animate-pulse-soft"
          style={{ animationDelay: `${n.delay}ms` }}
        >
          <circle
            cx={n.cx}
            cy={n.cy}
            r="9"
            style={{ fill: "var(--sm-strong)" }}
            fillOpacity="0.14"
          />
          <circle cx={n.cx} cy={n.cy} r="3.2" style={{ fill: "var(--sm-soft)" }} />
        </g>
      ))}
    </svg>
  );
}
