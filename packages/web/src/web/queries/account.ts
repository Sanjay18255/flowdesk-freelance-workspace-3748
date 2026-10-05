import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useSettings() {
  return useQuery(orpc.account.settings.queryOptions());
}

export function useSessions() {
  return useQuery(orpc.account.sessions.queryOptions());
}

export function useSavePrefs() {
  const qc = useQueryClient();
  return useMutation(
    orpc.account.savePrefs.mutationOptions({
      onSuccess: () => void qc.invalidateQueries({ queryKey: orpc.account.key() }),
    }),
  );
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation(
    orpc.account.updateProfile.mutationOptions({
      onSuccess: () => void qc.invalidateQueries({ queryKey: orpc.account.key() }),
    }),
  );
}
