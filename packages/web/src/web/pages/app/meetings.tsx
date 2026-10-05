import { useEffect, useMemo, useState } from "react";
import { useSearch as useQueryString } from "wouter";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
  Video,
  X,
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
  STATUS_TONE,
  Segmented,
  Select,
  Textarea,
} from "../../components/ui/kit";
import { KpiCard } from "../../components/kpi";
import {
  useCreateMeeting,
  useDeleteMeeting,
  useMeetings,
  useSaveMeetingNotes,
  useSetMeetingStatus,
  useUpdateMeeting,
} from "../../queries/meetings";
import { orpc } from "../../lib/api";
import { useToast } from "../../components/toast";
import { shortDate, timeLabel, titleCase } from "../../lib/format";
import { cn } from "../../lib/utils";

type Meeting = NonNullable<ReturnType<typeof useMeetings>["data"]>[number];

const TYPES = ["Zoom", "Google Meet", "Phone Call", "In Person", "Teams"];

const EMPTY = {
  title: "",
  clientId: "",
  projectId: "",
  date: new Date().toISOString().slice(0, 10),
  time: "10:00",
  duration: 30,
  type: "Zoom",
  location: "",
  description: "",
  participants: [] as string[],
  reminder: "1 hour before",
  status: "upcoming" as "upcoming" | "completed" | "cancelled",
};

const NOTE_SECTIONS = [
  { key: "agenda", label: "Agenda", placeholder: "What are we covering?" },
  { key: "discussion", label: "Discussion", placeholder: "What was said?" },
  { key: "actionItems", label: "Action items", placeholder: "Who does what, by when?" },
  { key: "decisions", label: "Decisions", placeholder: "What did we agree?" },
  { key: "followUp", label: "Follow up", placeholder: "Next steps and dates." },
] as const;

export default function MeetingsPage() {
  const qs = useQueryString();
  const { data, isLoading } = useMeetings();
  const clientOptions = useQuery(orpc.clients.options.queryOptions());
  const projectOptions = useQuery(orpc.projects.options.queryOptions());
  const teamQuery = useQuery(orpc.team.list.queryOptions());
  const create = useCreateMeeting();
  const update = useUpdateMeeting();
  const setStatus = useSetMeetingStatus();
  const saveNotes = useSaveMeetingNotes();
  const remove = useDeleteMeeting();
  const toast = useToast();

  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [notesFor, setNotesFor] = useState<Meeting | null>(null);
  const [notes, setNotes] = useState({ agenda: "", discussion: "", actionItems: "", decisions: "", followUp: "" });
  const [deleting, setDeleting] = useState<Meeting | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(qs);
    if (params.get("new") === "1") {
      setEditing(null);
      setForm(EMPTY);
      setFormOpen(true);
    }
  }, [qs]);

  const today = new Date().toISOString().slice(0, 10);

  const rows = useMemo(() => {
    const list = data ?? [];
    if (filter === "upcoming") return list.filter((m) => m.date >= today && m.status !== "cancelled");
    if (filter === "past") return [...list].filter((m) => m.date < today).reverse();
    return list;
  }, [data, filter, today]);

  if (isLoading) return <PageSkeleton />;

  const all = data ?? [];
  const clientName = (id?: string | null) => (clientOptions.data ?? []).find((c) => c.id === id)?.name;
  const projectName = (id?: string | null) => (projectOptions.data ?? []).find((p) => p.id === id)?.name;

  const openForm = (m?: Meeting) => {
    if (m) {
      setEditing(m);
      setForm({
        title: m.title,
        clientId: m.clientId ?? "",
        projectId: m.projectId ?? "",
        date: m.date,
        time: m.time,
        duration: m.duration,
        type: m.type ?? "Zoom",
        location: m.location ?? "",
        description: m.description ?? "",
        participants: m.participants ?? [],
        reminder: m.reminder ?? "1 hour before",
        status: m.status as typeof EMPTY.status,
      });
    } else {
      setEditing(null);
      setForm(EMPTY);
    }
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.title.trim()) return;
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...form });
      toast.success("Meeting updated", form.title);
    } else {
      await create.mutateAsync(form);
      toast.success("Meeting scheduled", `${form.title} · ${shortDate(form.date)}`);
    }
    setFormOpen(false);
  };

  const grouped = rows.reduce<Record<string, Meeting[]>>((acc, m) => {
    (acc[m.date] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        subtitle={`${all.filter((m) => m.date >= today && m.status === "upcoming").length} upcoming · ${all.length} total`}
        actions={
          <>
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: "upcoming", label: "Upcoming" },
                { value: "past", label: "Past" },
                { value: "all", label: "All" },
              ]}
            />
            <Button onClick={() => openForm()}>
              <Plus size={16} strokeWidth={2.2} />
              Schedule meeting
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Upcoming"
          value={all.filter((m) => m.date >= today && m.status === "upcoming").length}
          deltaLabel="Scheduled ahead"
          icon={CalendarClock}
          tone="primary"
        />
        <KpiCard
          index={1}
          label="Completed"
          value={all.filter((m) => m.status === "completed").length}
          deltaLabel="Wrapped up"
          icon={CalendarCheck}
          tone="success"
        />
        <KpiCard
          index={2}
          label="Total hours"
          value={all.reduce((s, m) => s + m.duration, 0) / 60}
          format={(v) => `${v.toFixed(1)}h`}
          deltaLabel="Time in meetings"
          icon={Clock}
          tone="warning"
        />
        <KpiCard
          index={3}
          label="Cancelled"
          value={all.filter((m) => m.status === "cancelled").length}
          deltaLabel="Called off"
          icon={CalendarX}
          tone="danger"
        />
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarClock}
            title={filter === "upcoming" ? "Nothing scheduled" : "No meetings here"}
            body="Schedule a client call and keep the notes attached to it."
            action={
              <Button onClick={() => openForm()}>
                <Plus size={16} strokeWidth={2.2} />
                Schedule meeting
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="mb-3 flex items-center gap-3">
                <p className="text-[13px] font-semibold">
                  {date === today
                    ? "Today"
                    : new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                </p>
                <span className="h-px flex-1 bg-border" />
                <span className="text-[12px] text-muted-foreground">{items.length} meeting{items.length === 1 ? "" : "s"}</span>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {items.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.26, delay: Math.min(i, 6) * 0.03 }}
                  >
                    <Card hover className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-16 shrink-0 rounded-xl bg-primary-soft py-2 text-center text-primary">
                          <p className="text-[13px] font-semibold tnum">{timeLabel(m.time).split(" ")[0]}</p>
                          <p className="text-[10.5px] font-medium">{timeLabel(m.time).split(" ")[1]}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[14.5px] font-semibold">{m.title}</p>
                              <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                                {[clientName(m.clientId), projectName(m.projectId)].filter(Boolean).join(" · ") ||
                                  "No client linked"}
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
                                    icon={FileText}
                                    onClick={() => {
                                      setNotesFor(m);
                                      setNotes({
                                        agenda: m.notes?.agenda ?? "",
                                        discussion: m.notes?.discussion ?? "",
                                        actionItems: m.notes?.actionItems ?? "",
                                        decisions: m.notes?.decisions ?? "",
                                        followUp: m.notes?.followUp ?? "",
                                      });
                                      close();
                                    }}
                                  >
                                    Meeting notes
                                  </MenuItem>
                                  <MenuItem
                                    icon={Pencil}
                                    onClick={() => {
                                      openForm(m);
                                      close();
                                    }}
                                  >
                                    Edit meeting
                                  </MenuItem>
                                  {m.status !== "completed" && (
                                    <MenuItem
                                      icon={CheckCircle2}
                                      onClick={async () => {
                                        close();
                                        await setStatus.mutateAsync({ id: m.id, status: "completed" });
                                      }}
                                    >
                                      Mark completed
                                    </MenuItem>
                                  )}
                                  {m.status !== "cancelled" && (
                                    <MenuItem
                                      icon={X}
                                      onClick={async () => {
                                        close();
                                        await setStatus.mutateAsync({ id: m.id, status: "cancelled" });
                                      }}
                                    >
                                      Cancel meeting
                                    </MenuItem>
                                  )}
                                  <MenuItem
                                    icon={Trash2}
                                    tone="danger"
                                    onClick={() => {
                                      setDeleting(m);
                                      close();
                                    }}
                                  >
                                    Delete
                                  </MenuItem>
                                </>
                              )}
                            </Dropdown>
                          </div>

                          {m.description && (
                            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                              {m.description}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge tone={STATUS_TONE[m.status] ?? "neutral"} dot>
                              {titleCase(m.status)}
                            </Badge>
                            <Badge tone="outline">
                              <Video size={11} strokeWidth={2} />
                              {m.type}
                            </Badge>
                            <Badge tone="outline">
                              <Clock size={11} strokeWidth={2} />
                              {m.duration}m
                            </Badge>
                            {m.location && (
                              <Badge tone="outline">
                                <MapPin size={11} strokeWidth={2} />
                                {m.location}
                              </Badge>
                            )}
                          </div>

                          {(m.participants ?? []).length > 0 && (
                            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                              <Users size={12} strokeWidth={1.9} />
                              {(m.participants ?? []).join(", ")}
                            </p>
                          )}

                          {m.notes && (m.notes.agenda || m.notes.discussion) && (
                            <button
                              type="button"
                              onClick={() => {
                                setNotesFor(m);
                                setNotes({
                                  agenda: m.notes?.agenda ?? "",
                                  discussion: m.notes?.discussion ?? "",
                                  actionItems: m.notes?.actionItems ?? "",
                                  decisions: m.notes?.decisions ?? "",
                                  followUp: m.notes?.followUp ?? "",
                                });
                              }}
                              className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary hover:underline"
                            >
                              <FileText size={12.5} strokeWidth={1.9} />
                              View notes
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit meeting" : "Schedule meeting"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={create.isPending || update.isPending}>
              {editing ? "Save changes" : "Schedule"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Kickoff call" />
          </Field>
          <Field label="Client">
            <Select value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}>
              <option value="">No client</option>
              {(clientOptions.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Project">
            <Select value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}>
              <option value="">No project</option>
              {(projectOptions.data ?? [])
                .filter((p) => !form.clientId || p.clientId === form.clientId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Time">
            <Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
          </Field>
          <Field label="Duration (minutes)">
            <Select
              value={String(form.duration)}
              onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
            >
              {[15, 30, 45, 60, 90, 120].map((d) => (
                <option key={d} value={d}>
                  {d} minutes
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
          <Field label="Location or link" className="sm:col-span-2">
            <Input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="zoom.us/j/123456789"
            />
          </Field>
          <Field label="Reminder">
            <Select value={form.reminder} onChange={(e) => setForm((f) => ({ ...f, reminder: e.target.value }))}>
              {["None", "15 minutes before", "30 minutes before", "1 hour before", "1 day before"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof EMPTY.status }))}
            >
              {["upcoming", "completed", "cancelled"].map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Agenda / description" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
          <Field label="Participants" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {(teamQuery.data ?? []).map((t) => {
                const on = form.participants.includes(t.name);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        participants: on ? f.participants.filter((x) => x !== t.name) : [...f.participants, t.name],
                      }))
                    }
                    className={cn(
                      "rounded-full border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                      on ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground hover:bg-hover",
                    )}
                  >
                    {t.name}
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

      <Modal
        open={!!notesFor}
        onClose={() => setNotesFor(null)}
        title="Meeting notes"
        subtitle={notesFor ? `${notesFor.title} · ${shortDate(notesFor.date)}` : undefined}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setNotesFor(null)}>
              Close
            </Button>
            <Button
              loading={saveNotes.isPending}
              onClick={async () => {
                if (!notesFor) return;
                await saveNotes.mutateAsync({ id: notesFor.id, ...notes });
                setNotesFor(null);
                toast.success("Notes saved");
              }}
            >
              <Save size={15} strokeWidth={1.9} />
              Save notes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {NOTE_SECTIONS.map((s) => (
            <Field key={s.key} label={s.label}>
              <Textarea
                rows={3}
                value={notes[s.key]}
                onChange={(e) => setNotes((n) => ({ ...n, [s.key]: e.target.value }))}
                placeholder={s.placeholder}
              />
            </Field>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this meeting?"
        body={`"${deleting?.title ?? "This meeting"}" and its notes will be permanently removed.`}
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await remove.mutateAsync({ id: deleting.id });
          toast.success("Meeting deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
