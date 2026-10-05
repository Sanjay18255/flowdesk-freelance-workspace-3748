/** Short, sortable, collision-safe ids for app records. */
export function id(prefix = "r"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

/** ISO date (YYYY-MM-DD) offset from today by `days`. */
export function dayOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Timestamp offset from now by `hours`. */
export function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 3600_000);
}

export function monthOffset(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
