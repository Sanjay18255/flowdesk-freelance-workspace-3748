import { useEffect, useMemo, useState } from "react";
import { useSearch as useQueryString } from "wouter";
import { motion } from "motion/react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  Flame,
  Handshake,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
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
  Select,
  Textarea,
} from "../../components/ui/kit";
import { KpiCard } from "../../components/kpi";
import { useConvertLead, useCreateLead, useDeleteLead, useLeads, useMoveLead, useUpdateLead } from "../../queries/leads";
import { useToast } from "../../components/toast";
import { money, shortDate } from "../../lib/format";
import { cn } from "../../lib/utils";

const STAGES = [
  { id: "lead", label: "Lead", tone: "bg-slate-400" },
  { id: "qualified", label: "Qualified", tone: "bg-sky-500" },
  { id: "discovery", label: "Discovery", tone: "bg-indigo-500" },
  { id: "proposal", label: "Proposal", tone: "bg-violet-500" },
  { id: "negotiation", label: "Negotiation", tone: "bg-amber-500" },
  { id: "won", label: "Won", tone: "bg-emerald-500" },
  { id: "lost", label: "Lost", tone: "bg-rose-500" },
] as const;

type Stage = (typeof STAGES)[number]["id"];
type Lead = NonNullable<ReturnType<typeof useLeads>["data"]>[number];

const SOURCES = ["Referral", "Website", "Cold Outreach", "LinkedIn", "Upwork", "Event", "Repeat Client"];

const EMPTY = {
  company: "",
  contact: "",
  email: "",
  phone: "",
  value: 0,
  source: "Referral",
  priority: "medium" as "low" | "medium" | "high" | "urgent",
  stage: "lead" as Stage,
  expectedClose: "",
  owner: "",
  notes: "",
};

const PRIORITY_TONE = {
  low: "neutral",
  medium: "primary",
  high: "warning",
  urgent: "danger",
} as const;

export default function PipelinePage() {
  const qs = useQueryString();
  const { data, isLoading } = useLeads();
  const create = useCreateLead();
  const update = useUpdateLead();
  const move = useMoveLead();
  const remove = useDeleteLead();
  const convert = useConvertLead();
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<Stage | null>(null);

  useEffect(() => {
    if (new URLSearchParams(qs).get("new") === "1") {
      setEditing(null);
      setForm(EMPTY);
      setFormOpen(true);
    }
  }, [qs]);

  const byStage = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of STAGES) map[s.id] = [];
    for (const l of data ?? []) (map[l.stage] ??= []).push(l);
    return map;
  }, [data]);

  if (isLoading) return <PageSkeleton />;

  const leads = data ?? [];
  const open = leads.filter((l) => l.stage !== "won" && l.stage !== "lost");
  const won = leads.filter((l) => l.stage === "won");
  const lost = leads.filter((l) => l.stage === "lost");
  const winRate = won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;

  const openForm = (lead?: Lead) => {
    if (lead) {
      setEditing(lead);
      setForm({
        company: lead.company,
        contact: lead.contact ?? "",
        email: lead.email ?? "",
        phone: lead.phone ?? "",
        value: lead.value,
        source: lead.source ?? "Referral",
        priority: lead.priority as "low" | "medium" | "high" | "urgent",
        stage: lead.stage as Stage,
        expectedClose: lead.expectedClose ?? "",
        owner: lead.owner ?? "",
        notes: lead.notes ?? "",
      });
    } else {
      setEditing(null);
      setForm(EMPTY);
    }
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.company.trim()) return;
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...form });
      toast.success("Lead updated", form.company);
    } else {
      await create.mutateAsync(form);
      toast.success("Lead added", form.company);
    }
    setFormOpen(false);
  };

  const onDrop = async (stage: Stage) => {
    setOverStage(null);
    const lead = leads.find((l) => l.id === dragId);
    setDragId(null);
    if (!lead || lead.stage === stage) return;
    const target = byStage[stage] ?? [];
    const position = target.length ? Math.max(...target.map((t) => t.position)) + 1 : 0;
    await move.mutateAsync({ id: lead.id, stage, position });
    toast.success(`Moved to ${stage}`, lead.company);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        subtitle={`${open.length} open deals · ${money(open.reduce((s, l) => s + l.value, 0), "USD", true)} weighted value`}
        actions={
          <Button onClick={() => openForm()}>
            <Plus size={16} strokeWidth={2.2} />
            New lead
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Open pipeline"
          value={open.reduce((s, l) => s + l.value, 0)}
          format={(v) => money(v)}
          deltaLabel={`${open.length} active deals`}
          icon={DollarSign}
          tone="primary"
        />
        <KpiCard
          index={1}
          label="Won this cycle"
          value={won.reduce((s, l) => s + l.value, 0)}
          format={(v) => money(v)}
          deltaLabel={`${won.length} closed`}
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard index={2} label="Win rate" value={winRate} format={(v) => `${Math.round(v)}%`} deltaLabel={`${lost.length} lost`} icon={TrendingUp} tone="warning" />
        <KpiCard
          index={3}
          label="Hot deals"
          value={open.filter((l) => l.priority === "urgent" || l.priority === "high").length}
          deltaLabel="High or urgent priority"
          icon={Flame}
          tone="danger"
        />
      </div>

      {leads.length === 0 ? (
        <Card>
          <EmptyState
            icon={Handshake}
            title="Your pipeline is empty"
            body="Add the deals you're chasing and drag them across stages as they progress."
            action={
              <Button onClick={() => openForm()}>
                <Plus size={16} strokeWidth={2.2} />
                New lead
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="thin-scrollbar -mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          <div className="flex gap-4" style={{ minWidth: `${STAGES.length * 268}px` }}>
            {STAGES.map((stage) => {
              const items = byStage[stage.id] ?? [];
              const total = items.reduce((s, l) => s + l.value, 0);
              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverStage(stage.id);
                  }}
                  onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
                  onDrop={() => onDrop(stage.id)}
                  className={cn(
                    "flex w-[252px] shrink-0 flex-col rounded-[14px] border bg-card/60 transition-colors",
                    overStage === stage.id ? "border-primary bg-primary-soft/40" : "border-border",
                  )}
                >
                  <div className="flex items-center gap-2 border-b border-border px-3.5 py-3">
                    <span className={cn("h-2 w-2 rounded-full", stage.tone)} />
                    <p className="text-[13px] font-semibold">{stage.label}</p>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10.5px] font-semibold tnum text-muted-foreground">
                      {items.length}
                    </span>
                    <span className="ml-auto text-[11.5px] font-medium tnum text-muted-foreground">
                      {money(total, "USD", true)}
                    </span>
                  </div>
                  <div className="thin-scrollbar flex-1 space-y-2.5 overflow-y-auto p-2.5" style={{ maxHeight: "60vh" }}>
                    {items.length === 0 && (
                      <p className="px-2 py-6 text-center text-[12px] text-muted-foreground">Drop a deal here</p>
                    )}
                    {items.map((l) => (
                      <motion.div
                        key={l.id}
                        layout
                        draggable
                        onDragStart={() => setDragId(l.id)}
                        onDragEnd={() => setDragId(null)}
                        className={cn(
                          "group cursor-grab rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)] transition-all active:cursor-grabbing",
                          dragId === l.id && "opacity-40",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{l.company}</p>
                          <Dropdown
                            trigger={
                              <span className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-hover group-hover:opacity-100">
                                <MoreHorizontal size={14} strokeWidth={1.9} />
                              </span>
                            }
                          >
                            {(close) => (
                              <>
                                <MenuItem
                                  icon={Pencil}
                                  onClick={() => {
                                    openForm(l);
                                    close();
                                  }}
                                >
                                  Edit deal
                                </MenuItem>
                                <MenuItem
                                  icon={CheckCircle2}
                                  onClick={async () => {
                                    close();
                                    await convert.mutateAsync({ id: l.id });
                                    toast.success("Converted to client", l.company);
                                  }}
                                >
                                  Convert to client
                                </MenuItem>
                                <MenuItem
                                  icon={Trash2}
                                  tone="danger"
                                  onClick={() => {
                                    setDeleting(l);
                                    close();
                                  }}
                                >
                                  Delete
                                </MenuItem>
                              </>
                            )}
                          </Dropdown>
                        </div>
                        {l.contact && (
                          <p className="mt-1 flex items-center gap-1.5 truncate text-[12px] text-muted-foreground">
                            <Building2 size={11.5} strokeWidth={1.9} />
                            {l.contact}
                          </p>
                        )}
                        <p className="mt-2.5 text-[15px] font-semibold tnum">{money(l.value)}</p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <Badge tone={PRIORITY_TONE[l.priority as keyof typeof PRIORITY_TONE] ?? "neutral"}>
                            {l.priority}
                          </Badge>
                          <Badge tone="outline">{l.source}</Badge>
                        </div>
                        {l.expectedClose && (
                          <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                            <CalendarDays size={11.5} strokeWidth={1.9} />
                            Close {shortDate(l.expectedClose)}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit deal" : "New lead"}
        subtitle={editing ? "Update this opportunity." : "Track a new opportunity through your pipeline."}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={create.isPending || update.isPending}>
              {editing ? "Save changes" : "Add lead"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company" className="sm:col-span-2">
            <Input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Halcyon Labs" />
          </Field>
          <Field label="Contact">
            <Input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </Field>
          <Field label="Deal value (USD)">
            <Input
              type="number"
              min={0}
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
            />
          </Field>
          <Field label="Stage">
            <Select value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as Stage }))}>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as typeof form.priority }))}
            >
              {["low", "medium", "high", "urgent"].map((p) => (
                <option key={p} value={p}>
                  {p[0]!.toUpperCase() + p.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Source">
            <Select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Expected close">
            <Input
              type="date"
              value={form.expectedClose}
              onChange={(e) => setForm((f) => ({ ...f, expectedClose: e.target.value }))}
            />
          </Field>
          <Field label="Owner">
            <Input value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} placeholder="You" />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={4} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this deal?"
        body={`${deleting?.company ?? "This deal"} will be removed from your pipeline. This can't be undone.`}
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await remove.mutateAsync({ id: deleting.id });
          toast.success("Deal deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
