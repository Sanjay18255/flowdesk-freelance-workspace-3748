import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export type Point = { label: string; value: number };

/* --------------------------------- count up -------------------------------- */

export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - (1 - p) ** 3;
      setValue(from + (target - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

/* -------------------------------- area chart ------------------------------- */

export function AreaChart({
  data,
  height = 220,
  format = (v: number) => String(Math.round(v)),
  className,
}: {
  data: Point[];
  height?: number;
  format?: (v: number) => string;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 720;
  const h = height;
  const padX = 8;
  const padY = 18;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? (w - padX * 2) / (data.length - 1) : 0;
  const y = (v: number) => h - padY - (v / max) * (h - padY * 2);
  const pts = data.map((d, i) => [padX + i * stepX, y(d.value)] as const);

  const linePath = pts
    .map(([x, py], i) => {
      if (i === 0) return `M ${x} ${py}`;
      const [px, ppy] = pts[i - 1]!;
      const cx = (px + x) / 2;
      return `C ${cx} ${ppy} ${cx} ${py} ${x} ${py}`;
    })
    .join(" ");
  const areaPath = `${linePath} L ${padX + (data.length - 1) * stepX} ${h - padY} L ${padX} ${h - padY} Z`;

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        role="img"
        aria-label="Trend chart"
      >
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={0}
            x2={w}
            y1={padY + f * (h - padY * 2)}
            y2={padY + f * (h - padY * 2)}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        ))}
        <motion.path
          d={areaPath}
          fill="url(#area-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.25"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          vectorEffect="non-scaling-stroke"
        />
        {pts.map(([x, py], i) => (
          <circle
            key={data[i]!.label + i}
            cx={x}
            cy={py}
            r={hover === i ? 5 : 0}
            fill="var(--card)"
            stroke="var(--primary)"
            strokeWidth="2.5"
          />
        ))}
        {data.map((d, i) => (
          <rect
            key={`hit-${d.label}-${i}`}
            x={padX + i * stepX - stepX / 2}
            y={0}
            width={stepX || w}
            height={h}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[11px] font-medium text-muted-foreground">
        {data.map((d, i) => (
          <span key={`${d.label}-${i}`} className={cn(hover === i && "text-foreground")}>
            {d.label}
          </span>
        ))}
      </div>
      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-border bg-elevated px-2.5 py-1.5 text-[12px] font-medium shadow-[var(--shadow-pop)]"
          style={{
            left: `${((padX + hover * stepX) / w) * 100}%`,
            top: `${(y(data[hover].value) / h) * 100 - 16}%`,
          }}
        >
          <span className="text-muted-foreground">{data[hover].label}: </span>
          <span className="tnum">{format(data[hover].value)}</span>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- bar chart -------------------------------- */

export function BarChart({
  data,
  height = 200,
  format = (v: number) => String(Math.round(v)),
  tone = "primary",
  className,
}: {
  data: Point[];
  height?: number;
  format?: (v: number) => string;
  tone?: "primary" | "mixed";
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const colors = ["var(--primary)", "#10b981", "#f59e0b", "#f43f5e", "#0ea5e9", "#8b5cf6"];
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => (
          <div key={`${d.label}-${i}`} className="group flex h-full flex-1 flex-col justify-end gap-2">
            <div className="relative flex-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.value / max) * 100}%` }}
                transition={{ duration: 0.55, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-0 w-full rounded-t-[6px] opacity-90 transition-opacity group-hover:opacity-100"
                style={{ background: tone === "mixed" ? colors[i % colors.length] : "var(--primary)" }}
              />
              <span className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-elevated px-2 py-1 text-[11px] font-medium tnum opacity-0 shadow-[var(--shadow-pop)] transition-opacity group-hover:opacity-100">
                {format(d.value)}
              </span>
            </div>
            <span className="truncate text-center text-[11px] font-medium text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- donut chart ------------------------------ */

export function DonutChart({
  data,
  size = 168,
  thickness = 18,
  centerLabel,
  centerValue,
  className,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className={cn("flex items-center gap-6", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label="Distribution chart">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={thickness} />
          {data.map((d) => {
            const len = (d.value / total) * c;
            const dash = `${len} ${c - len}`;
            const el = (
              <motion.circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeLinecap="butt"
                strokeDasharray={dash}
                initial={{ strokeDashoffset: -offset - len }}
                animate={{ strokeDashoffset: -offset }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tnum">{centerValue}</span>
          <span className="text-[11.5px] text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2.5 text-[13px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="min-w-0 flex-1 truncate capitalize text-muted-foreground">{d.label.replace(/_/g, " ")}</span>
            <span className="shrink-0 font-medium tnum">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------- sparkline ------------------------------- */

export function Sparkline({
  values,
  className,
  tone = "primary",
}: {
  values: number[];
  className?: string;
  tone?: "primary" | "success" | "danger";
}) {
  const w = 100;
  const h = 28;
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = values.length > 1 ? w / (values.length - 1) : 0;
  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - ((v - min) / span) * (h - 4) - 2}`)
    .join(" ");
  const stroke = { primary: "var(--primary)", success: "var(--success)", danger: "var(--danger)" }[tone];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-7 w-24", className)} preserveAspectRatio="none" role="img" aria-label="Sparkline">
      <motion.path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
    </svg>
  );
}

/* ---------------------------------- ring ---------------------------------- */

export function Ring({
  value,
  size = 96,
  thickness = 9,
  label,
  tone = "var(--primary)",
}: {
  value: number;
  size?: number;
  thickness?: number;
  label?: string;
  tone?: string;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const len = (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={label ?? "Progress ring"}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={thickness} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${len} ${c}`}
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${len} ${c}` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[17px] font-semibold tnum">{Math.round(value)}%</span>
        {label && <span className="text-[10.5px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}

/* ------------------------------ horizontal bars --------------------------- */

export function RankBars({
  data,
  format = (v: number) => String(v),
  className,
}: {
  data: { label: string; value: number; color?: string }[];
  format?: (v: number) => string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className={cn("space-y-3.5", className)}>
      {data.map((d, i) => (
        <li key={d.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-[13px] font-medium">{d.label}</span>
            <span className="shrink-0 text-[12.5px] tnum text-muted-foreground">{format(d.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: d.color ?? "var(--primary)" }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
