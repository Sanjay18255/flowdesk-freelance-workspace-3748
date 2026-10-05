import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useTeam() {
  return useQuery(orpc.team.list.queryOptions());
}

function useTeamMutation<T>(factory: (opts: { onSuccess: () => void }) => T) {
  const qc = useQueryClient();
  return factory({
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orpc.team.key() });
    },
  });
}

export function useInviteMember() {
  return useMutation(useTeamMutation((o) => orpc.team.invite.mutationOptions(o)));
}
export function useUpdateMember() {
  return useMutation(useTeamMutation((o) => orpc.team.update.mutationOptions(o)));
}
export function useRemoveMember() {
  return useMutation(useTeamMutation((o) => orpc.team.remove.mutationOptions(o)));
}
