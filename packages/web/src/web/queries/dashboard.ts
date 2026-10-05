import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useDashboard() {
  return useQuery(orpc.dashboard.summary.queryOptions());
}

export function useActivityFeed() {
  return useQuery(orpc.search.activity.queryOptions());
}
