import { useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

/**
 * Most mutations ripple into the dashboard, reports, activity feed and search,
 * so this returns one invalidator every feature hook can reuse.
 */
export function useRefresh() {
  const qc = useQueryClient();
  return (...extra: readonly unknown[][]) => {
    const keys = [
      orpc.dashboard.key(),
      orpc.reports.key(),
      orpc.search.key(),
      orpc.notifications.key(),
      ...extra,
    ];
    for (const key of keys) void qc.invalidateQueries({ queryKey: key });
  };
}
