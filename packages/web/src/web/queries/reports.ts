import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useReports(range: "3m" | "6m" | "12m") {
  return useQuery(orpc.reports.overview.queryOptions({ input: { range } }));
}
