import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import { useRefresh } from "./shared";

export function useClients() {
  return useQuery(orpc.clients.list.queryOptions());
}

export function useClient(id: string) {
  return useQuery(orpc.clients.get.queryOptions({ input: { id }, enabled: !!id }));
}

function useClientMutation<T>(factory: (opts: { onSuccess: () => void }) => T) {
  const qc = useQueryClient();
  const refresh = useRefresh();
  return factory({
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orpc.clients.key() });
      refresh();
    },
  });
}

export function useCreateClient() {
  return useMutation(useClientMutation((o) => orpc.clients.create.mutationOptions(o)));
}
export function useUpdateClient() {
  return useMutation(useClientMutation((o) => orpc.clients.update.mutationOptions(o)));
}
export function useDeleteClient() {
  return useMutation(useClientMutation((o) => orpc.clients.remove.mutationOptions(o)));
}
export function useAddContact() {
  return useMutation(useClientMutation((o) => orpc.clients.addContact.mutationOptions(o)));
}
export function useRemoveContact() {
  return useMutation(useClientMutation((o) => orpc.clients.removeContact.mutationOptions(o)));
}
export function useSaveClientNote() {
  return useMutation(useClientMutation((o) => orpc.clients.saveNote.mutationOptions(o)));
}
export function useRemoveClientNote() {
  return useMutation(useClientMutation((o) => orpc.clients.removeNote.mutationOptions(o)));
}
export function useLogCommunication() {
  return useMutation(useClientMutation((o) => orpc.clients.logCommunication.mutationOptions(o)));
}
export function useRemoveCommunication() {
  return useMutation(useClientMutation((o) => orpc.clients.removeCommunication.mutationOptions(o)));
}
