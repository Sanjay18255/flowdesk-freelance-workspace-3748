import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useSearch(q: string) {
  return useQuery(
    orpc.search.query.queryOptions({
      input: { q },
      enabled: q.trim().length >= 2,
      staleTime: 5_000,
    }),
  );
}
