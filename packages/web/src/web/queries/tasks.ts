import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useRefresh } from "./shared";

export function useTasks() {
  return useQuery(orpc.tasks.list.queryOptions());
}

export function useTask(id: string) {
  return useQuery(orpc.tasks.get.queryOptions({ input: { id }, enabled: !!id }));
}

export function useTimeEntries() {
  return useQuery(orpc.tasks.timeEntries.queryOptions());
}

function useTaskMutation<T>(factory: (opts: { onSuccess: () => void }) => T) {
  const qc = useQueryClient();
  const refresh = useRefresh();
  return factory({
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orpc.tasks.key() });
      void qc.invalidateQueries({ queryKey: orpc.projects.key() });
      refresh();
    },
  });
}

export function useCreateTask() {
  return useMutation(useTaskMutation((o) => orpc.tasks.create.mutationOptions(o)));
}
export function useUpdateTask() {
  return useMutation(useTaskMutation((o) => orpc.tasks.update.mutationOptions(o)));
}
export function useMoveTask() {
  return useMutation(useTaskMutation((o) => orpc.tasks.move.mutationOptions(o)));
}
export function useDeleteTask() {
  return useMutation(useTaskMutation((o) => orpc.tasks.remove.mutationOptions(o)));
}
export function useToggleChecklist() {
  return useMutation(useTaskMutation((o) => orpc.tasks.toggleChecklist.mutationOptions(o)));
}
export function useAddChecklistItem() {
  return useMutation(useTaskMutation((o) => orpc.tasks.addChecklistItem.mutationOptions(o)));
}
export function useRemoveChecklistItem() {
  return useMutation(useTaskMutation((o) => orpc.tasks.removeChecklistItem.mutationOptions(o)));
}
export function useAddTaskComment() {
  return useMutation(useTaskMutation((o) => orpc.tasks.addComment.mutationOptions(o)));
}
export function useLogTime() {
  return useMutation(useTaskMutation((o) => orpc.tasks.logTime.mutationOptions(o)));
}
export function useBulkTaskStatus() {
  return useMutation(useTaskMutation((o) => orpc.tasks.bulkStatus.mutationOptions(o)));
}
