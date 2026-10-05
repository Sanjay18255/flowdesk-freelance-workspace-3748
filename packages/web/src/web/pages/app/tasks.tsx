import { useEffect, useMemo, useState } from "react";
import { useSearch as useQueryString } from "wouter";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns3,
  Flag,
  ListChecks,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  Timer,
  Trash2,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
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
  useAddChecklistItem,
  useAddTaskComment,
  useCreateTask,
  useDeleteTask,
  useLogTime,
  useMoveTask,
  useRemoveChecklistItem,
  useTask,
  useTasks,
  useTimeEntries,
  useToggleChecklist,
  useUpdateTask,
} from "../../queries/tasks";
import { orpc } from "../../lib/api";
import { useToast } from "../../components/toast";
import { hours, relative, shortDate, titleCase } from "../../lib/format";
import { cn } from "../../lib/utils";

type Task = NonNullable<ReturnType<typeof useTasks>["data"]>[number];
type Status = "todo" | "in_progress" | "review" | "done";

const COLUMNS: { id: Status; label: string; tone: string }[] = [
  { id: "todo", label: "To do", tone: "bg-slate-400" },
  { id: "in_progress", label: "In progress", tone: "bg-primary" },
  { id: "review", label: "Review", tone: "bg-amber-500" },
  { id: "done", label: "Done", tone: "bg-emerald-500" },
];

const LABELS = ["design", "development", "content", "research", "revision", "admin", "client", "urgent"];

const EMPTY = {
  title: "",
  projectId: "",
  description: "",
  status: "todo" as Status,
  priority: "medium" as "low" | "medium" | "high" | "urgent",
  dueDate: "",
  assignee: "",
  labels: [] as string[],
  estimateMins: 60,
  billable: true,
};

/* --------------------------------- timer ---------------------------------- */

function useTimer() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [running]);

  return {
    taskId,
    seconds,
    running,
    start: (id: string) => {
      setTaskId(id);
      setSeconds(0);
      setRunning(true);
    },
    pause: () => setRunning(false),
    resume: () => setRunning(true),
    reset: () => {
      setRunning(false);
      setTaskId(null);
      setSeconds(0);
    },
  };
}

function clock(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ------------------------------ task detail ------------------------------- */

function TaskDetail({
  id,
  onClose,
  onDelete,
}: {
  id: string | null;
  onClose: () => void;
  onDelete: (task: Task) => void;
}) {
  const { data } = useTask(id ?? "");
  const update = useUpdateTask();
  const toggleItem = useToggleChecklist();
  const addItem = useAddChecklistItem();
  const removeItem = useRemoveChecklistItem();
  const addComment = useAddTaskComment();
  const logTime = useLogTime();
  const [itemDraft, setItemDraft] = useState("");
  const [comment, setComment] = useState("");
  const [minutes, setMinutes] = useState(30);

  const task = data?.task;
  const checklist = task?.checklist ?? [];
  const doneItems = checklist.filter((c) => c.done).length;

  return (
    <Modal
      open={!!id}
      onClose={onClose}
      title={task?.title ?? "Task"}
      subtitle={task ? `${titleCase(task.status)} · ${task.priority} priority` : undefined}
      size="lg"
      footer={
        task && (
          <>
            <Button variant="danger" onClick={() => onDelete(task as Task)}>
              <Trash2 size={15} strokeWidth={1.9} />
              Delete
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </>
        )
      }
    >
      {!task ? (
        <p className="py-8 text-center text-[13px] text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status">
              <Select
                value={task.status}
                onChange={(e) => update.mutate({ id: task.id, status: e.target.value as Status })}
              >
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select
                value={task.priority}
                onChange={(e) =>
                  update.mutate({ id: task.id, priority: e.target.value as "low" | "medium" | "high" | "urgent" })
                }
              >
                {["low", "medium", "high", "urgent"].map((p) => (
                  <option key={p} value={p}>
                    {titleCase(p)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Due date">
              <Input
                type="date"
                value={task.dueDate ?? ""}
                onChange={(e) => update.mutate({ id: task.id, dueDate: e.target.value })}
              />
            </Field>
            <Field label="Assignee">
              <Input
                defaultValue={task.assignee ?? ""}
                onBlur={(e) => update.mutate({ id: task.id, assignee: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              rows={4}
              defaultValue={task.description ?? ""}
              onBlur={(e) => update.mutate({ id: task.id, description: e.target.value })}
              placeholder="Add detail…"
            />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-semibold">
                Checklist{" "}
                <span className="ml-1 text-[12px] font-normal text-muted-foreground">
                  {doneItems}/{checklist.length}
                </span>
              </p>
            </div>
            <Progress value={checklist.length ? (doneItems / checklist.length) * 100 : 0} />
            <ul className="mt-3 space-y-2">
              {checklist.map((c) => (
                <li key={c.id} className="group flex items-center gap-2.5">
                  <Checkbox
                    checked={c.done}
                    onChange={() => toggleItem.mutate({ id: task.id, itemId: c.id })}
                    label={<span className={cn(c.done && "text-muted-foreground line-through")}>{c.text}</span>}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    aria-label="Remove item"
                    onClick={() => removeItem.mutate({ id: task.id, itemId: c.id })}
                    className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:text-danger group-hover:opacity-100"
                  >
                    <Trash2 size={13} strokeWidth={1.9} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <Input
                value={itemDraft}
                onChange={(e) => setItemDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && itemDraft.trim()) {
                    addItem.mutate({ id: task.id, text: itemDraft.trim() });
                    setItemDraft("");
                  }
                }}
                placeholder="Add a checklist item…"
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (!itemDraft.trim()) return;
                  addItem.mutate({ id: task.id, text: itemDraft.trim() });
                  setItemDraft("");
                }}
              >
                <Plus size={15} strokeWidth={2.2} />
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold">Time</p>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  {hours(task.actualMins)} logged · {hours(task.estimateMins)} estimated
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="w-20"
                />
                <Button
                  variant="outline"
                  size="sm"
                  loading={logTime.isPending}
                  onClick={() => logTime.mutate({ taskId: task.id, minutes })}
                >
                  <Clock size={14} strokeWidth={1.9} />
                  Log minutes
                </Button>
              </div>
            </div>
            {(data?.timeEntries ?? []).length > 0 && (
              <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                {(data?.timeEntries ?? []).slice(0, 5).map((e) => (
                  <li key={e.id} className="flex justify-between text-[12.5px] text-muted-foreground">
                    <span>{shortDate(e.date)}</span>
                    <span className="tnum">
                      {hours(e.minutes)} {e.billable ? "· billable" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold">Comments</p>
            <div className="flex gap-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && comment.trim()) {
                    addComment.mutate({ taskId: task.id, body: comment.trim() });
                    setComment("");
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (!comment.trim()) return;
                  addComment.mutate({ taskId: task.id, body: comment.trim() });
                  setComment("");
                }}
              >
                <Send size={15} strokeWidth={1.9} />
              </Button>
            </div>
            <ul className="mt-3 space-y-3">
              {(data?.comments ?? []).map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  <Avatar name={c.author || "You"} size="xs" />
                  <div>
                    <p className="text-[12.5px]">
                      <span className="font-semibold">{c.author}</span>{" "}
                      <span className="text-muted-foreground">{relative(c.createdAt)}</span>
                    </p>
                    <p className="mt-0.5 text-[13px] leading-relaxed">{c.body}</p>
                  </div>
                </li>
              ))}
              {(data?.comments ?? []).length === 0 && (
                <li className="py-2 text-[12.5px] text-muted-foreground">No comments yet.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* --------------------------------- calendar -------------------------------- */

function TaskCalendar({ tasks, onOpen }: { tasks: Task[]; onOpen: (id: string) => void }) {
  const [cursor, setCursor] = useState(() => new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: startDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="text-[15px] font-semibold">
          {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            <ChevronLeft size={16} strokeWidth={1.9} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            <ChevronRight size={16} strokeWidth={1.9} />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const iso = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
          const dayTasks = day ? tasks.filter((t) => t.dueDate === iso) : [];
          return (
            <div
              key={i}
              className={cn(
                "min-h-[104px] border-b border-r border-border p-2 last:border-r-0",
                !day && "bg-muted/30",
                iso === today && "bg-primary-soft/40",
              )}
            >
              {day && (
                <>
                  <p
                    className={cn(
                      "mb-1.5 text-[11.5px] font-semibold tnum",
                      iso === today ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {day}
                  </p>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onOpen(t.id)}
                        className={cn(
                          "block w-full truncate rounded-md px-1.5 py-1 text-left text-[10.5px] font-medium transition-opacity hover:opacity-80",
                          t.status === "done"
                            ? "bg-success-soft text-success"
                            : t.priority === "urgent"
                              ? "bg-danger-soft text-danger"
                              : t.priority === "high"
                                ? "bg-warning-soft text-warning"
                                : "bg-primary-soft text-primary",
                        )}
                      >
                        {t.title}
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <p className="px-1.5 text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ----------------------------------- page ---------------------------------- */

export default function TasksPage() {
  const qs = useQueryString();
  const { data, isLoading } = useTasks();
  const projectOptions = useQuery(orpc.projects.options.queryOptions());
  const entries = useTimeEntries();
  const create = useCreateTask();
  const move = useMoveTask();
  const remove = useDeleteTask();
  const toast = useToast();
  const timer = useTimer();
  const logTime = useLogTime();

  const [view, setView] = useState<"board" | "list" | "calendar">("board");
  const [q, setQ] = useState("");
  const [project, setProject] = useState("all");
  const [priority, setPriority] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Status | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(qs);
    if (params.get("new") === "1") {
      setForm(EMPTY);
      setFormOpen(true);
    }
    const task = params.get("task");
    if (task) setDetailId(task);
  }, [qs]);

  const rows = useMemo(() => {
    let list = data ?? [];
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter((t) => [t.title, t.description, t.assignee].some((v) => (v ?? "").toLowerCase().includes(needle)));
    }
    if (project !== "all") list = list.filter((t) => t.projectId === project);
    if (priority !== "all") list = list.filter((t) => t.priority === priority);
    return list;
  }, [data, q, project, priority]);

  const byStatus = useMemo(() => {
    const map: Record<Status, Task[]> = { todo: [], in_progress: [], review: [], done: [] };
    for (const t of rows) map[t.status as Status]?.push(t);
    return map;
  }, [rows]);

  if (isLoading) return <PageSkeleton />;

  const all = data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const openTasks = all.filter((t) => t.status !== "done");
  const weekMinutes = (entries.data ?? [])
    .filter((e) => e.date >= new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10))
    .reduce((s, e) => s + e.minutes, 0);

  const projectName = (pid?: string | null) =>
    (projectOptions.data ?? []).find((p) => p.id === pid)?.name ?? "No project";

  const submit = async () => {
    if (!form.title.trim()) return;
    await create.mutateAsync(form);
    toast.success("Task created", form.title);
    setFormOpen(false);
    setForm(EMPTY);
  };

  const onDrop = async (status: Status) => {
    setOverCol(null);
    const task = all.find((t) => t.id === dragId);
    setDragId(null);
    if (!task || task.status === status) return;
    const target = byStatus[status];
    const position = target.length ? Math.max(...target.map((t) => t.position)) + 1 : 0;
    await move.mutateAsync({ id: task.id, status, position });
  };

  const activeTimerTask = all.find((t) => t.id === timer.taskId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        subtitle={`${openTasks.length} open · ${all.filter((t) => t.dueDate === today && t.status !== "done").length} due today`}
        actions={
          <>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "board", label: "Board", icon: Columns3 },
                { value: "list", label: "List", icon: ListChecks },
                { value: "calendar", label: "Calendar", icon: CalendarDays },
              ]}
            />
            <Button
              onClick={() => {
                setForm(EMPTY);
                setFormOpen(true);
              }}
            >
              <Plus size={16} strokeWidth={2.2} />
              New task
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Open tasks" value={openTasks.length} deltaLabel={`${all.length} total`} icon={ListChecks} tone="primary" />
        <KpiCard
          index={1}
          label="Completed"
          value={all.filter((t) => t.status === "done").length}
          deltaLabel="All time"
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          index={2}
          label="Overdue"
          value={openTasks.filter((t) => t.dueDate && t.dueDate < today).length}
          deltaLabel="Past due date"
          icon={Flag}
          tone="danger"
        />
        <KpiCard
          index={3}
          label="Hours this week"
          value={weekMinutes / 60}
          format={(v) => `${v.toFixed(1)}h`}
          deltaLabel="Logged time"
          icon={Clock}
          tone="warning"
        />
      </div>

      <AnimatePresence>
        {activeTimerTask && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="flex flex-wrap items-center gap-4 border-primary/40 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                <Timer size={17} strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold">{activeTimerTask.title}</p>
                <p className="text-[12px] text-muted-foreground">{projectName(activeTimerTask.projectId)}</p>
              </div>
              <p className="text-[20px] font-semibold tnum">{clock(timer.seconds)}</p>
              <div className="flex items-center gap-2">
                {timer.running ? (
                  <Button variant="outline" size="sm" onClick={timer.pause}>
                    <Pause size={14} strokeWidth={2} />
                    Pause
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={timer.resume}>
                    <Play size={14} strokeWidth={2} />
                    Resume
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={async () => {
                    const minutes = Math.max(1, Math.round(timer.seconds / 60));
                    await logTime.mutateAsync({ taskId: activeTimerTask.id, minutes, note: "Timer session" });
                    toast.success("Time logged", `${hours(minutes)} on ${activeTimerTask.title}`);
                    timer.reset();
                  }}
                >
                  <Check size={14} strokeWidth={2.2} />
                  Save & stop
                </Button>
                <Button variant="ghost" size="sm" onClick={timer.reset}>
                  Discard
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" className="pl-9" />
        </div>
        <Select value={project} onChange={(e) => setProject(e.target.value)} className="w-auto min-w-[170px]">
          <option value="all">All projects</option>
          {(projectOptions.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-auto min-w-[140px]">
          <option value="all">All priorities</option>
          {["low", "medium", "high", "urgent"].map((p) => (
            <option key={p} value={p}>
              {titleCase(p)}
            </option>
          ))}
        </Select>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={ListChecks}
            title={all.length ? "No tasks match those filters" : "No tasks yet"}
            body={all.length ? "Try a different project or priority." : "Create your first task to start the board."}
            action={
              <Button
                onClick={() => {
                  setForm(EMPTY);
                  setFormOpen(true);
                }}
              >
                <Plus size={16} strokeWidth={2.2} />
                New task
              </Button>
            }
          />
        </Card>
      ) : view === "board" ? (
        <div className="thin-scrollbar -mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, minmax(272px, 1fr))" }}>
            {COLUMNS.map((col) => {
              const items = byStatus[col.id];
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverCol(col.id);
                  }}
                  onDragLeave={() => setOverCol((s) => (s === col.id ? null : s))}
                  onDrop={() => onDrop(col.id)}
                  className={cn(
                    "flex flex-col rounded-[14px] border bg-card/60 transition-colors",
                    overCol === col.id ? "border-primary bg-primary-soft/40" : "border-border",
                  )}
                >
                  <div className="flex items-center gap-2 border-b border-border px-3.5 py-3">
                    <span className={cn("h-2 w-2 rounded-full", col.tone)} />
                    <p className="text-[13px] font-semibold">{col.label}</p>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10.5px] font-semibold tnum text-muted-foreground">
                      {items.length}
                    </span>
                  </div>
                  <div className="thin-scrollbar flex-1 space-y-2.5 overflow-y-auto p-2.5" style={{ maxHeight: "62vh" }}>
                    {items.length === 0 && (
                      <p className="px-2 py-6 text-center text-[12px] text-muted-foreground">Drop a task here</p>
                    )}
                    {items.map((t) => {
                      const checklist = t.checklist ?? [];
                      const doneItems = checklist.filter((c) => c.done).length;
                      const overdue = t.dueDate && t.dueDate < today && t.status !== "done";
                      return (
                        <motion.div
                          key={t.id}
                          layout
                          draggable
                          onDragStart={() => setDragId(t.id)}
                          onDragEnd={() => setDragId(null)}
                          className={cn(
                            "group cursor-grab rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)] active:cursor-grabbing",
                            dragId === t.id && "opacity-40",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailId(t.id)}
                              className="min-w-0 flex-1 text-left text-[13.5px] font-medium leading-snug hover:text-primary"
                            >
                              {t.title}
                            </button>
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
                                    icon={Timer}
                                    onClick={() => {
                                      timer.start(t.id);
                                      close();
                                    }}
                                  >
                                    Start timer
                                  </MenuItem>
                                  <MenuItem
                                    icon={Trash2}
                                    tone="danger"
                                    onClick={() => {
                                      setDeleting(t);
                                      close();
                                    }}
                                  >
                                    Delete
                                  </MenuItem>
                                </>
                              )}
                            </Dropdown>
                          </div>
                          <p className="mt-1.5 truncate text-[11.5px] text-muted-foreground">{projectName(t.projectId)}</p>
                          {checklist.length > 0 && (
                            <div className="mt-2.5">
                              <Progress value={(doneItems / checklist.length) * 100} />
                              <p className="mt-1 text-[10.5px] text-muted-foreground">
                                {doneItems}/{checklist.length} subtasks
                              </p>
                            </div>
                          )}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <Badge tone={STATUS_TONE[t.priority] ?? "neutral"}>{t.priority}</Badge>
                            {(t.labels ?? []).slice(0, 2).map((l) => (
                              <Badge key={l} tone="outline">
                                {l}
                              </Badge>
                            ))}
                          </div>
                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <span className={cn("text-[11.5px]", overdue ? "font-medium text-danger" : "text-muted-foreground")}>
                              {t.dueDate ? shortDate(t.dueDate) : "No due date"}
                            </span>
                            <span className="flex items-center gap-2">
                              {t.actualMins > 0 && (
                                <span className="text-[11px] tnum text-muted-foreground">{hours(t.actualMins)}</span>
                              )}
                              {t.assignee && <Avatar name={t.assignee} size="xs" />}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : view === "list" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[13.5px]">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {["Task", "Project", "Status", "Priority", "Due", "Time", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-hover">
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setDetailId(t.id)} className="text-left font-medium hover:text-primary">
                        {t.title}
                      </button>
                      {(t.checklist ?? []).length > 0 && (
                        <p className="text-[11.5px] text-muted-foreground">
                          {(t.checklist ?? []).filter((c) => c.done).length}/{(t.checklist ?? []).length} subtasks
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{projectName(t.projectId)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[t.status] ?? "neutral"}>{titleCase(t.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[t.priority] ?? "neutral"}>{t.priority}</Badge>
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3",
                        t.dueDate && t.dueDate < today && t.status !== "done" ? "font-medium text-danger" : "text-muted-foreground",
                      )}
                    >
                      {t.dueDate ? shortDate(t.dueDate) : "—"}
                    </td>
                    <td className="px-4 py-3 tnum text-muted-foreground">{hours(t.actualMins)}</td>
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
                              icon={MessageSquare}
                              onClick={() => {
                                setDetailId(t.id);
                                close();
                              }}
                            >
                              Open task
                            </MenuItem>
                            <MenuItem
                              icon={Timer}
                              onClick={() => {
                                timer.start(t.id);
                                close();
                              }}
                            >
                              Start timer
                            </MenuItem>
                            <MenuItem
                              icon={Trash2}
                              tone="danger"
                              onClick={() => {
                                setDeleting(t);
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
      ) : (
        <TaskCalendar tasks={rows} onOpen={setDetailId} />
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New task"
        subtitle="Add work to your board."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={create.isPending}>
              Create task
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Design the pricing page" />
          </Field>
          <Field label="Project">
            <Select value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}>
              <option value="">No project</option>
              {(projectOptions.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Assignee">
            <Input value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} placeholder="You" />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}>
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
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
          <Field label="Due date">
            <Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
          </Field>
          <Field label="Estimate (minutes)">
            <Input
              type="number"
              min={0}
              value={form.estimateMins}
              onChange={(e) => setForm((f) => ({ ...f, estimateMins: Number(e.target.value) }))}
            />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <Field label="Labels" className="sm:col-span-2">
            <div className="flex flex-wrap gap-1.5">
              {LABELS.map((l) => {
                const on = form.labels.includes(l);
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, labels: on ? f.labels.filter((x) => x !== l) : [...f.labels, l] }))
                    }
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11.5px] font-medium capitalize transition-colors",
                      on ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground hover:bg-hover",
                    )}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      </Modal>

      <TaskDetail
        id={detailId}
        onClose={() => setDetailId(null)}
        onDelete={(t) => {
          setDetailId(null);
          setDeleting(t);
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this task?"
        body={`"${deleting?.title ?? "This task"}" and its comments and time entries will be permanently removed.`}
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await remove.mutateAsync({ id: deleting.id });
          toast.success("Task deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
