import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useRefresh } from "./shared";

export function useLeads() {
  return useQuery(orpc.leads.list.queryOptions());
}

function useLeadMutation<T>(factory: (opts: { onSuccess: () => void }) => T) {
  const qc = useQueryClient();
  const refresh = useRefresh();
  return factory({
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orpc.leads.key() });
      void qc.invalidateQueries({ queryKey: orpc.clients.key() });
      refresh();
    },
  });
}

export function useCreateLead() {
  return useMutation(useLeadMutation((o) => orpc.leads.create.mutationOptions(o)));
}
export function useUpdateLead() {
  return useMutation(useLeadMutation((o) => orpc.leads.update.mutationOptions(o)));
}
export function useMoveLead() {
  return useMutation(useLeadMutation((o) => orpc.leads.move.mutationOptions(o)));
}
export function useDeleteLead() {
  return useMutation(useLeadMutation((o) => orpc.leads.remove.mutationOptions(o)));
}
export function useConvertLead() {
  return useMutation(useLeadMutation((o) => orpc.leads.convert.mutationOptions(o)));
}
