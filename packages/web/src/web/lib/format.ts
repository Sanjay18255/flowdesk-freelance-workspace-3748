export function money(value: number, currency = "USD", compact = false): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : value % 1 === 0 ? 0 : 2,
  }).format(value || 0);
}

export function num(value: number): string {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

export function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(+d)) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function tinyDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(+d)) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function relative(date: Date | string | number): string {
  const t = typeof date === "object" ? +date : +new Date(date);
  const diff = Date.now() - t;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return `${Math.round(days / 30)}mo ago`;
}

export function daysUntil(iso?: string | null): number {
  if (!iso) return 0;
  return Math.ceil((new Date(`${iso.slice(0, 10)}T00:00:00`).getTime() - Date.now()) / 864e5);
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function hours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

export function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function timeLabel(time: string): string {
  const [h = "0", m = "00"] = time.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${suffix}`;
}

/** Deterministic accent bucket for a string (avatars, chips). */
export const ACCENTS = ["indigo", "emerald", "amber", "rose", "sky", "violet"] as const;
export type Accent = (typeof ACCENTS)[number];

export function accentOf(seed: string): Accent {
  let sum = 0;
  for (const ch of seed) sum += ch.charCodeAt(0);
  return ACCENTS[sum % ACCENTS.length]!;
}

export const ACCENT_CLASS: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

export const DOT_CLASS: Record<string, string> = {
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
};

export const CHART_COLOR: Record<string, string> = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  violet: "#8b5cf6",
};
