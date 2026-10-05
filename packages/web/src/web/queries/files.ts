import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client, orpc } from "../lib/api";
import { useRefresh } from "./shared";

export function useFiles() {
  return useQuery(orpc.files.list.queryOptions());
}

function useFileMutation<T>(factory: (opts: { onSuccess: () => void }) => T) {
  const qc = useQueryClient();
  const refresh = useRefresh();
  return factory({
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orpc.files.key() });
      refresh();
    },
  });
}

export function useRegisterFile() {
  return useMutation(useFileMutation((o) => orpc.files.register.mutationOptions(o)));
}
export function useUpdateFile() {
  return useMutation(useFileMutation((o) => orpc.files.update.mutationOptions(o)));
}
export function useDeleteFile() {
  return useMutation(useFileMutation((o) => orpc.files.remove.mutationOptions(o)));
}
export function useAddFileVersion() {
  return useMutation(useFileMutation((o) => orpc.files.addVersion.mutationOptions(o)));
}

/** Presign, PUT the bytes straight to storage, return the object key. */
export async function uploadToStorage(file: File): Promise<{ key: string; size: number }> {
  const { url, key } = await client.upload.presign({
    filename: file.name,
    contentType: file.type || "application/octet-stream",
  });
  const res = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return { key, size: file.size };
}

export async function getDownloadUrl(key: string): Promise<string> {
  const { url } = await client.upload.signedUrl({ key });
  return url;
}
