import { useEffect, useMemo, useState } from "react";
import { Link, useSearch as useQueryString } from "wouter";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  FolderKanban,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import {
  Avatar,
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
  Progress,
  STATUS_TONE,
  Segmented,
  Select,
  Textarea,
} from "../../components/ui/kit";
import { KpiCard } from "../../components/kpi";
import {
  useArchiveProject,
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from "../../queries/projects";
import { orpc } from "../../lib/api";
import { useToast } from "../../components/toast";
import { CHART_COLOR, daysUntil, money, shortDate, titleCase } from "../../lib/format";
import { cn } from "../../lib/utils";

type Project = NonNullable<ReturnType<typeof useProjects>["data"]>[number];

const TYPES = [
  "Web Design",
  "Web Development",
  "Branding",
  "Mobile App",
  "SEO",
  "Content",
  "Consulting",
  "Marketing",
  "Product Design",
];

const COLORS = ["indigo", "emerald", "amber", "rose", "sky", "violet"];

const EMPTY = {
  name: "",
  clientId: "",
  type: "Web Design",
  description: "",
  budget: 0,
  spent: 0,
  currency: "USD",
  startDate: "",
  deadline: "",
  priority: "medium" as "low" | "medium" | "high" | "urgent",
  status: "planning" as "planning" | "in_progress" | "review" | "on_hold" | "completed" | "cancelled",
  color: "indigo",
  tags: [] as string[],
  members: [] as string[],
};

export default function ProjectsPage() {
  const qs = useQueryString();
  const { data, isLoading } = useProjects();
  const clientOptions = useQuery(orpc.clients.options.queryOptions());
  const teamQuery = useQuery(orpc.team.list.queryOptions());
  const create = useCreateProject();
  const update = useUpdateProject();
  const archive = useArchiveProject();
  const remove = useDeleteProject();
  const toast = useToast();

  const [view, setView] = useState<"grid" | "table">("grid");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [client, setClient] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [tagDraft, setTagDraft] = useState("");

  useEffect(() => {
    if (new URLSearchParams(qs).get("new") === "1") {
      setEditing(null);
      setForm({ ...EMPTY, startDate: new Date().toISOString().slice(0, 10) });
      setFormOpen(true);
    }
  }, [qs]);

  const rows = useMemo(() => {
    let list = (data ?? []).filter((p) => (showArchived ? p.archived : !p.archived));
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter((p) =>
        [p.name, p.description, p.type, p.clientName].some((v) => (v ?? "").toLowerCase().includes(needle)),
      );
    }
    if (status !== "all") list = list.filter((p) => p.status === status);
    if (client !== "all") list = list.filter((p) => p.clientId === client);
    return list;
  }, [data, q, status, client, showArchived]);

  if (isLoading) return <PageSkeleton />;

  const all = (data ?? []).filter((p) => !p.archived);
  const active = all.filter((p) => p.status !== "completed" && p.status !== "cancelled");

  const openForm = (p?: Project) => {
    if (p) {
      setEditing(p);
      setForm({
        name: p.name,
        clientId: p.clientId ?? "",
        type: p.type ?? "Web Design",
        description: p.description ?? "",
        budget: p.budget,
        spent: p.spent,
        currency: p.currency ?? "USD",
        startDate: p.startDate ?? "",
        deadline: p.deadline ?? "",
        priority: p.priority as typeof EMPTY.priority,
        status: p.status as typeof EMPTY.status,
        color: p.color ?? "indigo",
        tags: p.tags ?? [],
        members: p.members ?? [],
      });
    } else {
      setEditing(null);
      setForm({ ...EMPTY, startDate: new Date().toISOString().slice(0, 10) });
    }
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...form });
      toast.success("Project updated", form.name);
    } else {
      await create.mutateAsync(form);
      toast.success("Project created", `${form.name} is ready — milestones added.`);
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle={`${active.length} active · ${money(all.reduce((s, p) => s + p.budget, 0), "USD", true)} total budget`}
        actions={
          <>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "grid", label: "Grid", icon: LayoutGrid },
                { value: "table", label: "Table", icon: List },
              ]}
            />
            <Button onClick={() => openForm()}>
              <Plus size={16} strokeWidth={2.2} />
              New project
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Active projects" value={active.length} deltaLabel={`${all.length} total`} icon={FolderKanban} tone="primary" />
        <KpiCard
          index={1}
          label="Total budget"
          value={all.reduce((s, p) => s + p.budget, 0)}
          format={(v) => money(v)}
          deltaLabel="Across live work"
          icon={Wallet}
          tone="success"
        />
        <KpiCard
          index={2}
          label="Avg completion"
          value={active.length ? active.reduce((s, p) => s + p.computedProgress, 0) / active.length : 0}
          format={(v) => `${Math.round(v)}%`}
          deltaLabel="Weighted by tasks"
          icon={CalendarDays}
          tone="warning"
        />
        <KpiCard
          index={3}
          label="Due in 14 days"
          value={active.filter((p) => p.deadline && daysUntil(p.deadline) <= 14).length}
          deltaLabel="Deadlines approaching"
          icon={CalendarDays}
          tone="danger"
        />
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" className="pl-9" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto min-w-[140px]">
          <option value="all">All statuses</option>
          {["planning", "in_progress", "review", "on_hold", "completed", "cancelled"].map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </Select>
        <Select value={client} onChange={(e) => setClient(e.target.value)} className="w-auto min-w-[160px]">
          <option value="all">All clients</option>
          {(clientOptions.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Button variant={showArchived ? "soft" : "outline"} size="sm" onClick={() => setShowArchived((v) => !v)}>
          <Archive size={15} strokeWidth={1.9} />
          {showArchived ? "Viewing archive" : "Archive"}
        </Button>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderKanban}
            title={showArchived ? "Nothing archived" : all.length ? "No projects match" : "No projects yet"}
            body={
              showArchived
                ? "Archived projects will show up here."
                : "Create a project to track budget, milestones, tasks and deliverables."
            }
            action={
              !showArchived && (
                <Button onClick={() => openForm()}>
                  <Plus size={16} strokeWidth={2.2} />
                  New project
                </Button>
              )
            }
          />
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p, i) => {
            const left = daysUntil(p.deadline);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: Math.min(i, 8) * 0.03 }}
              >
                <Card hover className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CHART_COLOR[p.color ?? "indigo"] ?? "var(--primary)" }} />
                        <Link href={`/app/projects/${p.id}`} className="truncate text-[15px] font-semibold hover:text-primary">
                          {p.name}
                        </Link>
                      </div>
                      <p className="mt-1 truncate text-[12.5px] text-muted-foreground">
                        {p.clientName} · {p.type}
                      </p>
                    </div>
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
                            icon={Pencil}
                            onClick={() => {
                              openForm(p);
                              close();
                            }}
                          >
                            Edit project
                          </MenuItem>
                          <MenuItem
                            icon={p.archived ? ArchiveRestore : Archive}
                            onClick={async () => {
                              close();
                              await archive.mutateAsync({ id: p.id, archived: !p.archived });
                              toast.success(p.archived ? "Restored" : "Archived", p.name);
                            }}
                          >
                            {p.archived ? "Restore" : "Archive"}
                          </MenuItem>
                          <MenuItem
                            icon={Trash2}
                            tone="danger"
                            onClick={() => {
                              setDeleting(p);
                              close();
                            }}
                          >
                            Delete
                          </MenuItem>
                        </>
                      )}
                    </Dropdown>
                  </div>

                  {p.description && (
                    <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{p.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone={STATUS_TONE[p.status] ?? "neutral"} dot>
                      {titleCase(p.status)}
                    </Badge>
                    <Badge tone={STATUS_TONE[p.priority] ?? "neutral"}>{p.priority}</Badge>
                    {(p.tags ?? []).slice(0, 2).map((t) => (
                      <Badge key={t} tone="outline">
                        {t}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
                      <span className="text-muted-foreground">
                        {p.tasksDone}/{p.taskCount} tasks
                      </span>
                      <span className="font-medium tnum">{p.computedProgress}%</span>
                    </div>
                    <Progress
                      value={p.computedProgress}
                      tone={p.computedProgress >= 100 ? "success" : left < 0 ? "danger" : "primary"}
                    />
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Budget</p>
                      <p className="mt-0.5 text-[15px] font-semibold tnum">{money(p.budget, p.currency ?? "USD", true)}</p>
                      <p className="text-[11.5px] text-muted-foreground">{money(p.spent, p.currency ?? "USD", true)} spent</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Deadline</p>
                      <p className="mt-0.5 text-[13px] font-medium">{shortDate(p.deadline)}</p>
                      <p
                        className={cn(
                          "text-[11.5px]",
                          left < 0 ? "text-danger" : left <= 7 ? "text-warning" : "text-muted-foreground",
                        )}
                      >
                        {p.deadline ? (left < 0 ? `${Math.abs(left)}d overdue` : `${left}d left`) : "No date"}
                      </p>
                    </div>
                  </div>

                  {(p.members ?? []).length > 0 && (
                    <div className="mt-4 flex items-center gap-1.5">
                      {(p.members ?? []).slice(0, 4).map((m) => (
                        <Avatar key={m} name={m} size="xs" accent={p.color ?? "indigo"} />
                      ))}
                      {(p.members ?? []).length > 4 && (
                        <span className="text-[11.5px] text-muted-foreground">+{(p.members ?? []).length - 4}</span>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[13.5px]">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {["Project", "Client", "Status", "Progress", "Budget", "Deadline", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-hover">
                    <td className="px-4 py-3">
                      <Link href={`/app/projects/${p.id}`} className="font-medium hover:text-primary">
                        {p.name}
                      </Link>
                      <p className="text-[12px] text-muted-foreground">{p.type}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.clientName}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[p.status] ?? "neutral"}>{titleCase(p.status)}</Badge>
                    </td>
                    <td className="w-[160px] px-4 py-3">
                      <Progress value={p.computedProgress} showLabel />
                    </td>
                    <td className="px-4 py-3 font-medium tnum">{money(p.budget, p.currency ?? "USD")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{shortDate(p.deadline)}</td>
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
                              icon={Pencil}
                              onClick={() => {
                                openForm(p);
                                close();
                              }}
                            >
                              Edit project
                            </MenuItem>
                            <MenuItem
                              icon={p.archived ? ArchiveRestore : Archive}
                              onClick={async () => {
                                close();
                                await archive.mutateAsync({ id: p.id, archived: !p.archived });
                              }}
                            >
                              {p.archived ? "Restore" : "Archive"}
                            </MenuItem>
                            <MenuItem
                              icon={Trash2}
                              tone="danger"
                              onClick={() => {
                                setDeleting(p);
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
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit project" : "New project"}
        subtitle={editing ? "Update scope, budget and timeline." : "Eight standard milestones are added automatically."}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={create.isPending || update.isPending}>
              {editing ? "Save changes" : "Create project"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project name" className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Website redesign" />
          </Field>
          <Field label="Client">
            <Select value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}>
              <option value="">Internal / no client</option>
              {(clientOptions.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What are you delivering?"
            />
          </Field>
          <Field label="Budget">
            <Input
              type="number"
              min={0}
              value={form.budget}
              onChange={(e) => setForm((f) => ({ ...f, budget: Number(e.target.value) }))}
            />
          </Field>
          <Field label="Spent to date">
            <Input
              type="number"
              min={0}
              value={form.spent}
              onChange={(e) => setForm((f) => ({ ...f, spent: Number(e.target.value) }))}
            />
          </Field>
          <Field label="Start date">
            <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          </Field>
          <Field label="Deadline">
            <Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof EMPTY.status }))}
            >
              {["planning", "in_progress", "review", "on_hold", "completed", "cancelled"].map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as typeof EMPTY.priority }))}
            >
              {["low", "medium", "high", "urgent"].map((p) => (
                <option key={p} value={p}>
                  {titleCase(p)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Currency">
            <Select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
              {["USD", "EUR", "GBP", "INR", "AUD", "CAD"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Colour">
            <div className="flex h-10 items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={cn(
                    "h-6 w-6 rounded-full ring-offset-2 ring-offset-card transition-all",
                    form.color === c && "ring-2 ring-primary",
                  )}
                  style={{ background: CHART_COLOR[c] }}
                />
              ))}
            </div>
          </Field>
          <Field label="Tags" hint="Press Enter to add" className="sm:col-span-2">
            <div className="rounded-[10px] border border-input bg-card p-2">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {form.tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11.5px] font-medium"
                  >
                    {t}
                    <Trash2 size={11} strokeWidth={2} />
                  </button>
                ))}
                {form.tags.length === 0 && <span className="px-1 text-[12.5px] text-muted-foreground">No tags yet</span>}
              </div>
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagDraft.trim()) {
                    e.preventDefault();
                    setForm((f) => ({ ...f, tags: [...new Set([...f.tags, tagDraft.trim()])] }));
                    setTagDraft("");
                  }
                }}
                placeholder="Add a tag…"
                className="w-full bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </div>
          </Field>
          <Field label="Team members" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {(teamQuery.data ?? []).map((m) => {
                const on = form.members.includes(m.name);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        members: on ? f.members.filter((x) => x !== m.name) : [...f.members, m.name],
                      }))
                    }
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                      on ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground hover:bg-hover",
                    )}
                  >
                    <Users size={12.5} strokeWidth={1.9} />
                    {m.name}
                  </button>
                );
              })}
              {(teamQuery.data ?? []).length === 0 && (
                <p className="text-[12.5px] text-muted-foreground">Invite teammates from the Team page first.</p>
              )}
            </div>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this project?"
        body={`${deleting?.name ?? "This project"}, its tasks and milestones will be permanently deleted. Invoices stay in your workspace.`}
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await remove.mutateAsync({ id: deleting.id });
          toast.success("Project deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
