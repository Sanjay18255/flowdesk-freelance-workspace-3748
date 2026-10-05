import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useRefresh } from "./shared";

export function useMeetings() {
  return useQuery(orpc.meetings.list.queryOptions());
}

function useMeetingMutation<T>(factory: (opts: { onSuccess: () => void }) => T) {
  const qc = useQueryClient();
  const refresh = useRefresh();
  return factory({
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orpc.meetings.key() });
      refresh();
    },
  });
}

export function useCreateMeeting() {
  return useMutation(useMeetingMutation((o) => orpc.meetings.create.mutationOptions(o)));
}
export function useUpdateMeeting() {
  return useMutation(useMeetingMutation((o) => orpc.meetings.update.mutationOptions(o)));
}
export function useSetMeetingStatus() {
  return useMutation(useMeetingMutation((o) => orpc.meetings.setStatus.mutationOptions(o)));
}
export function useSaveMeetingNotes() {
  return useMutation(useMeetingMutation((o) => orpc.meetings.saveNotes.mutationOptions(o)));
}
export function useDeleteMeeting() {
  return useMutation(useMeetingMutation((o) => orpc.meetings.remove.mutationOptions(o)));
}
