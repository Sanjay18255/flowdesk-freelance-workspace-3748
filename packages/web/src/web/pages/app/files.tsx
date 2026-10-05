import { useEffect, useMemo, useRef, useState } from "react";
import { useSearch as useQueryString } from "wouter";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  FolderOpen,
  History,
  LayoutGrid,
  List,
  MoreHorizontal,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  Field,
  Input,
  MenuItem,
  Modal,
  PageHeader,
  PageSkeleton,
  Segmented,
  Select,
} from "../../components/ui/kit";
import {
  getDownloadUrl,
  useAddFileVersion,
  useDeleteFile,
  useFiles,
  useRegisterFile,
  uploadToStorage,
} from "../../queries/files";
import { orpc } from "../../lib/api";
import { useToast } from "../../components/toast";
import { relative, shortDate } from "../../lib/format";
import { cn } from "../../lib/utils";

type FileRow = NonNullable<ReturnType<typeof useFiles>["data"]>[number];

const FOLDERS = ["Documents", "Designs", "Contracts", "Invoices", "Assets", "Deliverables"];

function iconFor(mime: string, name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("video/")) return FileVideo;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive;
  if (["csv", "xlsx", "xls"].includes(ext)) return FileSpreadsheet;
  return FileText;
}

function sizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPage() {
  const qs = useQueryString();
  const { data, isLoading } = useFiles();
  const clientOptions = useQuery(orpc.clients.options.queryOptions());
  const projectOptions = useQuery(orpc.projects.options.queryOptions());
  const register = useRegisterFile();
  const addVersion = useAddFileVersion();
  const remove = useDeleteFile();
  const toast = useToast();

  const inputRef = useRef<HTMLInputElement>(null);
  const versionRef = useRef<HTMLInputElement>(null);
  const [versionFor, setVersionFor] = useState<FileRow | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [historyFor, setHistoryFor] = useState<FileRow | null>(null);
  const [deleting, setDeleting] = useState<FileRow | null>(null);
  const [meta, setMeta] = useState({ folder: "Documents", projectId: "", clientId: "" });

  useEffect(() => {
    if (new URLSearchParams(qs).get("new") === "1") setUploadOpen(true);
  }, [qs]);

  const rows = useMemo(() => {
    let list = data ?? [];
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(needle));
    }
    if (folder !== "all") list = list.filter((f) => f.folder === folder);
    return list;
  }, [data, q, folder]);

  if (isLoading) return <PageSkeleton />;

  const all = data ?? [];
  const totalSize = all.reduce((s, f) => s + f.size, 0);
  const projectName = (id?: string | null) => (projectOptions.data ?? []).find((p) => p.id === id)?.name;
  const clientName = (id?: string | null) => (clientOptions.data ?? []).find((c) => c.id === id)?.name;

  const handleFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(list)) {
        const { key, size } = await uploadToStorage(file);
        await register.mutateAsync({
          name: file.name,
          key,
          size,
          mime: file.type || "application/octet-stream",
          folder: meta.folder,
          projectId: meta.projectId,
          clientId: meta.clientId,
        });
      }
      toast.success(`Uploaded ${list.length} file${list.length === 1 ? "" : "s"}`);
      setUploadOpen(false);
    } catch (err) {
      toast.error("Upload failed", err instanceof Error ? err.message : "Try again");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const download = async (f: FileRow, key?: string) => {
    const url = await getDownloadUrl(key ?? f.key);
    if (!url) {
      toast.error("Could not create a download link");
      return;
    }
    window.open(url, "_blank", "noopener");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files"
        subtitle={`${all.length} files · ${sizeLabel(totalSize)} stored`}
        actions={
          <>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "grid", label: "Grid", icon: LayoutGrid },
                { value: "list", label: "List", icon: List },
              ]}
            />
            <Button onClick={() => setUploadOpen(true)}>
              <Upload size={16} strokeWidth={1.9} />
              Upload files
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {FOLDERS.map((f) => {
          const count = all.filter((x) => x.folder === f).length;
          const on = folder === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFolder(on ? "all" : f)}
              className={cn(
                "flex items-center gap-3 rounded-[14px] border p-4 text-left transition-all",
                on ? "border-primary bg-primary-soft" : "border-border bg-card hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]",
                  on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {on ? <FolderOpen size={17} strokeWidth={1.75} /> : <Folder size={17} strokeWidth={1.75} />}
              </span>
              <div className="min-w-0">
                <p className={cn("truncate text-[13px] font-medium", on && "text-primary")}>{f}</p>
                <p className="text-[11.5px] text-muted-foreground tnum">{count} files</p>
              </div>
            </button>
          );
        })}
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…" className="pl-9" />
        </div>
        <Select value={folder} onChange={(e) => setFolder(e.target.value)} className="w-auto min-w-[150px]">
          <option value="all">All folders</option>
          {FOLDERS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderOpen}
            title={all.length ? "No files match" : "No files yet"}
            body="Upload contracts, designs and deliverables — every file keeps its version history."
            action={
              <Button onClick={() => setUploadOpen(true)}>
                <Upload size={16} strokeWidth={1.9} />
                Upload files
              </Button>
            }
          />
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((f, i) => {
            const Icon = iconFor(f.mime ?? "", f.name);
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, delay: Math.min(i, 10) * 0.025 }}
              >
                <Card hover className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[11px] bg-primary-soft text-primary">
                      <Icon size={20} strokeWidth={1.75} />
                    </span>
                    <Dropdown
                      trigger={
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground">
                          <MoreHorizontal size={16} strokeWidth={1.9} />
                        </span>
                      }
                    >
                      {(close) => (
                        <>
                          <MenuItem
                            icon={Download}
                            onClick={() => {
                              close();
                              void download(f);
                            }}
                          >
                            Download
                          </MenuItem>
                          <MenuItem
                            icon={Upload}
                            onClick={() => {
                              close();
                              setVersionFor(f);
                              versionRef.current?.click();
                            }}
                          >
                            Upload new version
                          </MenuItem>
                          <MenuItem
                            icon={History}
                            onClick={() => {
                              setHistoryFor(f);
                              close();
                            }}
                          >
                            Version history
                          </MenuItem>
                          <MenuItem
                            icon={Trash2}
                            tone="danger"
                            onClick={() => {
                              setDeleting(f);
                              close();
                            }}
                          >
                            Delete
                          </MenuItem>
                        </>
                      )}
                    </Dropdown>
                  </div>
                  <p className="mt-4 break-words text-[13.5px] font-medium leading-snug">{f.name}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {sizeLabel(f.size)} · v{f.version}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge tone="outline">{f.folder}</Badge>
                    {projectName(f.projectId) && <Badge tone="primary">{projectName(f.projectId)}</Badge>}
                  </div>
                  <p className="mt-auto pt-4 text-[11.5px] text-muted-foreground">
                    {f.uploadedBy} · {relative(f.createdAt)}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-[13.5px]">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {["Name", "Folder", "Linked to", "Size", "Version", "Uploaded", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => {
                  const Icon = iconFor(f.mime ?? "", f.name);
                  return (
                    <tr key={f.id} className="border-b border-border last:border-0 hover:bg-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Icon size={17} strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
                          <span className="font-medium">{f.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{f.folder}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {projectName(f.projectId) ?? clientName(f.clientId) ?? "—"}
                      </td>
                      <td className="px-4 py-3 tnum text-muted-foreground">{sizeLabel(f.size)}</td>
                      <td className="px-4 py-3 tnum text-muted-foreground">v{f.version}</td>
                      <td className="px-4 py-3 text-muted-foreground">{relative(f.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Dropdown
                          trigger={
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground">
                              <MoreHorizontal size={16} strokeWidth={1.9} />
                            </span>
                          }
                        >
                          {(close) => (
                            <>
                              <MenuItem
                                icon={Download}
                                onClick={() => {
                                  close();
                                  void download(f);
                                }}
                              >
                                Download
                              </MenuItem>
                              <MenuItem
                                icon={History}
                                onClick={() => {
                                  setHistoryFor(f);
                                  close();
                                }}
                              >
                                Version history
                              </MenuItem>
                              <MenuItem
                                icon={Trash2}
                                tone="danger"
                                onClick={() => {
                                  setDeleting(f);
                                  close();
                                }}
                              >
                                Delete
                              </MenuItem>
                            </>
                          )}
                        </Dropdown>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* hidden inputs */}
      <input ref={inputRef} type="file" multiple hidden onChange={(e) => void handleFiles(e.target.files)} />
      <input
        ref={versionRef}
        type="file"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file || !versionFor) return;
          try {
            const { key, size } = await uploadToStorage(file);
            await addVersion.mutateAsync({ id: versionFor.id, key, size });
            toast.success("New version uploaded", versionFor.name);
          } catch (err) {
            toast.error("Upload failed", err instanceof Error ? err.message : "Try again");
          } finally {
            setVersionFor(null);
            if (versionRef.current) versionRef.current.value = "";
          }
        }}
      />

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload files"
        subtitle="Files upload straight to your storage bucket."
        footer={
          <>
            <Button variant="secondary" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button loading={uploading} onClick={() => inputRef.current?.click()}>
              <Upload size={15} strokeWidth={1.9} />
              Choose files
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 transition-colors hover:border-primary hover:bg-primary-soft/30"
          >
            <Upload size={22} strokeWidth={1.6} className="text-muted-foreground" />
            <p className="text-[13.5px] font-medium">Click to choose files</p>
            <p className="text-[12.5px] text-muted-foreground">Any file type · multiple files supported</p>
          </button>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Folder">
              <Select value={meta.folder} onChange={(e) => setMeta((m) => ({ ...m, folder: e.target.value }))}>
                {FOLDERS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Client">
              <Select value={meta.clientId} onChange={(e) => setMeta((m) => ({ ...m, clientId: e.target.value }))}>
                <option value="">None</option>
                {(clientOptions.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Project">
              <Select value={meta.projectId} onChange={(e) => setMeta((m) => ({ ...m, projectId: e.target.value }))}>
                <option value="">None</option>
                {(projectOptions.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!historyFor}
        onClose={() => setHistoryFor(null)}
        title="Version history"
        subtitle={historyFor?.name}
        footer={
          <Button variant="secondary" onClick={() => setHistoryFor(null)}>
            Close
          </Button>
        }
      >
        <ul className="divide-y divide-border">
          {(historyFor?.versions ?? []).slice().reverse().map((v) => (
            <li key={v.version} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-[13.5px] font-medium">Version {v.version}</p>
                <p className="text-[12px] text-muted-foreground">
                  {sizeLabel(v.size)} · {shortDate(v.uploadedAt.slice(0, 10))}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => historyFor && void download(historyFor, v.key)}
              >
                <Download size={14} strokeWidth={1.9} />
                Download
              </Button>
            </li>
          ))}
          {(historyFor?.versions ?? []).length === 0 && (
            <li className="py-6 text-center text-[13px] text-muted-foreground">Only the original version exists.</li>
          )}
        </ul>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this file?"
        body={`"${deleting?.name ?? "This file"}" and every stored version will be permanently deleted.`}
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await remove.mutateAsync({ id: deleting.id });
          toast.success("File deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
