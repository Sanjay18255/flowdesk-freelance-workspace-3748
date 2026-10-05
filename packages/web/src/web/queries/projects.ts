import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useRefresh } from "./shared";

export function useProjects() {
  return useQuery(orpc.projects.list.queryOptions());
}

export function useProject(id: string) {
  return useQuery(orpc.projects.get.queryOptions({ input: { id }, enabled: !!id }));
}

function useProjectMutation<T>(factory: (opts: { onSuccess: () => void }) => T) {
  const qc = useQueryClient();
  const refresh = useRefresh();
  return factory({
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orpc.projects.key() });
      void qc.invalidateQueries({ queryKey: orpc.tasks.key() });
      refresh();
    },
  });
}

export function useCreateProject() {
  return useMutation(useProjectMutation((o) => orpc.projects.create.mutationOptions(o)));
}
export function useUpdateProject() {
  return useMutation(useProjectMutation((o) => orpc.projects.update.mutationOptions(o)));
}
export function useArchiveProject() {
  return useMutation(useProjectMutation((o) => orpc.projects.setArchived.mutationOptions(o)));
}
export function useDeleteProject() {
  return useMutation(useProjectMutation((o) => orpc.projects.remove.mutationOptions(o)));
}
export function useToggleMilestone() {
  return useMutation(useProjectMutation((o) => orpc.projects.toggleMilestone.mutationOptions(o)));
}
export function useAddMilestone() {
  return useMutation(useProjectMutation((o) => orpc.projects.addMilestone.mutationOptions(o)));
}
export function useSaveProjectNote() {
  return useMutation(useProjectMutation((o) => orpc.projects.saveNote.mutationOptions(o)));
}
export function useAddProjectComment() {
  return useMutation(useProjectMutation((o) => orpc.projects.addComment.mutationOptions(o)));
}
export function useRemoveProjectComment() {
  return useMutation(useProjectMutation((o) => orpc.projects.removeComment.mutationOptions(o)));
}
