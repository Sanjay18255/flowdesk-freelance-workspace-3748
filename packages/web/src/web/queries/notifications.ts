import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useNotifications() {
  return useQuery(orpc.notifications.list.queryOptions({ refetchInterval: 60_000 }));
}

function useNotifMutation<T>(factory: (opts: { onSuccess: () => void }) => T) {
  const qc = useQueryClient();
  return factory({
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orpc.notifications.key() });
    },
  });
}

export function useMarkRead() {
  return useMutation(useNotifMutation((o) => orpc.notifications.markRead.mutationOptions(o)));
}
export function useMarkAllRead() {
  return useMutation(useNotifMutation((o) => orpc.notifications.markAllRead.mutationOptions(o)));
}
export function useRemoveNotification() {
  return useMutation(useNotifMutation((o) => orpc.notifications.remove.mutationOptions(o)));
}
export function useClearNotifications() {
  return useMutation(useNotifMutation((o) => orpc.notifications.clearAll.mutationOptions(o)));
}
