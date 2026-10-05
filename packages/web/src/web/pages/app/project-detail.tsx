import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "motion/react";
import {
  ArrowLeft,
  BellRing,
  CalendarClock,
  Check,
  Circle,
  Clock,
  FileText,
  FolderKanban,
  MessageSquare,
  Milestone,
  Plus,
  Receipt,
  Save,
  Send,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  PageSkeleton,
  Progress,
  STATUS_TONE,
  Tabs,
  Textarea,
} from "../../components/ui/kit";
import { Ring } from "../../components/charts";
import {
  useAddMilestone,
  useAddProjectComment,
  useProject,
  useRemoveProjectComment,
  useSaveProjectNote,
  useToggleMilestone,
} from "../../queries/projects";
import { orpc } from "../../lib/api";
import { useToast } from "../../components/toast";
import { hours, money, relative, shortDate, timeLabel, titleCase } from "../../lib/format";
import { cn } from "../../lib/utils";
import { useMutation } from "@tanstack/react-query";

export default function ProjectDetailPage() {
  const { id = "" } = useParams();
  const { data, isLoading, error } = useProject(id);
  const toggleMilestone = useToggleMilestone();
  const addMilestone = useAddMilestone();
  const saveNote = useSaveProjectNote();
  const addComment = useAddProjectComment();
  const removeComment = useRemoveProjectComment();
  const notifyDeadline = useMutation(orpc.projects.notifyDeadline.mutationOptions({}));
  const toast = useToast();

  const [tab, setTab] = useState("overview");
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");
  const [msOpen, setMsOpen] = useState(false);
  const [msForm, setMsForm] = useState({ title: "", date: "" });

  useEffect(() => {
    if (data) setNote(data.note);
  }, [data]);

  if (isLoading) return <PageSkeleton />;
  if (error || !data) {
    return (
      <Card>
        <EmptyState
          icon={FolderKanban}
          title="Project not found"
          body="This project may have been deleted."
          action={
            <Link href="/app/projects">
              <Button variant="outline">Back to projects</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const { project, client, milestones, tasks, files, invoices, meetings, activities, comments, stats } = data;
  const doneMilestones = milestones.filter((m) => m.done).length;

  return (
    <div className="space-y-6">
      <Link
        href="/app/projects"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} strokeWidth={2} />
        All projects
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[24px] font-semibold leading-tight">{project.name}</h1>
              <Badge tone={STATUS_TONE[project.status] ?? "neutral"} dot>
                {titleCase(project.status)}
              </Badge>
              <Badge tone={STATUS_TONE[project.priority] ?? "neutral"}>{project.priority}</Badge>
            </div>
            <p className="mt-2 text-[13.5px] text-muted-foreground">
              {client ? (
                <Link href={`/app/clients/${client.id}`} className="font-medium text-foreground hover:text-primary">
                  {client.name}
                </Link>
              ) : (
                "Internal project"
              )}
              {" · "}
              {project.type} · {shortDate(project.startDate)} → {shortDate(project.deadline)}
            </p>
            {project.description && (
              <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">{project.description}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(project.tags ?? []).map((t) => (
                <Badge key={t} tone="outline">
                  {t}
                </Badge>
              ))}
              {(project.members ?? []).length > 0 && (
                <span className="ml-1 flex items-center gap-1.5">
                  {(project.members ?? []).map((m) => (
                    <Avatar key={m} name={m} size="xs" accent={project.color ?? "indigo"} />
                  ))}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Ring value={stats.completion} size={92} label="complete" />
            <div className="flex flex-col gap-2.5">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await notifyDeadline.mutateAsync({ id: project.id });
                  toast.success("Reminder set", "You'll see it in your notifications.");
                }}
              >
                <BellRing size={15} strokeWidth={1.9} />
                Deadline reminder
              </Button>
              <Link href="/app/invoices?new=1">
                <Button size="sm" className="w-full">
                  <Receipt size={15} strokeWidth={1.9} />
                  Invoice project
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Budget", value: money(project.budget, project.currency ?? "USD"), icon: Wallet },
            { label: "Spent", value: money(project.spent, project.currency ?? "USD"), icon: Wallet },
            { label: "Remaining", value: money(stats.remainingBudget, project.currency ?? "USD"), icon: Wallet },
            { label: "Hours logged", value: `${stats.hours}h`, icon: Clock },
            { label: "Tasks", value: `${stats.tasksDone}/${stats.taskCount}`, icon: Check },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-[17px] font-semibold tnum">{s.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "milestones", label: "Milestones", count: milestones.length },
          { id: "tasks", label: "Tasks", count: tasks.length },
          { id: "files", label: "Files", count: files.length },
          { id: "invoices", label: "Invoices", count: invoices.length },
          { id: "meetings", label: "Meetings", count: meetings.length },
          { id: "discussion", label: "Discussion", count: comments.length },
          { id: "notes", label: "Notes" },
          { id: "activity", label: "Activity", count: activities.length },
        ]}
      />

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <Card>
            <CardHeader title="Timeline" subtitle={`${doneMilestones}/${milestones.length} milestones complete`} />
            <div className="p-5 pt-4">
              <Progress value={milestones.length ? (doneMilestones / milestones.length) * 100 : 0} showLabel />
              <ol className="mt-6 space-y-0">
                {milestones.map((m, i) => (
                  <li key={m.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {i < milestones.length - 1 && (
                      <span className="absolute left-[11px] top-6 h-full w-px bg-border" />
                    )}
                    <button
                      type="button"
                      onClick={() => toggleMilestone.mutate({ id: m.id })}
                      className={cn(
                        "relative z-10 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        m.done ? "border-success bg-success text-white" : "border-border bg-card text-transparent hover:border-primary",
                      )}
                      aria-label={m.done ? "Mark incomplete" : "Mark complete"}
                    >
                      <Check size={12} strokeWidth={3} />
                    </button>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className={cn("text-[13.5px] font-medium", m.done && "text-muted-foreground line-through")}>
                        {m.title}
                      </p>
                      {m.date && <p className="mt-0.5 text-[12px] text-muted-foreground">{shortDate(m.date)}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardHeader title="Budget health" />
              <div className="p-5 pt-4">
                <Progress
                  value={project.budget ? (project.spent / project.budget) * 100 : 0}
                  tone={project.spent > project.budget ? "danger" : project.spent / (project.budget || 1) > 0.8 ? "warning" : "success"}
                  showLabel
                />
                <div className="mt-4 grid grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <p className="text-muted-foreground">Billable hours</p>
                    <p className="mt-0.5 text-[15px] font-semibold tnum">{stats.billableHours}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Invoiced</p>
                    <p className="mt-0.5 text-[15px] font-semibold tnum">
                      {money(invoices.reduce((s, i) => s + i.total, 0), project.currency ?? "USD", true)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
            <Card>
              <CardHeader title="Task status" />
              <div className="space-y-3 p-5 pt-4">
                {(["todo", "in_progress", "review", "done"] as const).map((s) => {
                  const count = tasks.filter((t) => t.status === s).length;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-[12.5px] text-muted-foreground">{titleCase(s)}</span>
                      <Progress value={tasks.length ? (count / tasks.length) * 100 : 0} className="flex-1" />
                      <span className="w-6 shrink-0 text-right text-[12.5px] font-medium tnum">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "milestones" && (
        <Card>
          <CardHeader
            title="Milestones"
            subtitle="Tick them off as the project moves"
            action={
              <Button size="sm" variant="outline" onClick={() => setMsOpen(true)}>
                <Plus size={15} strokeWidth={2.2} />
                Add milestone
              </Button>
            }
          />
          <div className="p-5 pt-4">
            {milestones.length === 0 ? (
              <EmptyState icon={Milestone} title="No milestones" body="Break the project into checkpoints." />
            ) : (
              <ul className="divide-y divide-border">
                {milestones.map((m) => (
                  <li key={m.id} className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => toggleMilestone.mutate({ id: m.id })}
                      aria-label="Toggle milestone"
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        m.done ? "border-success bg-success text-white" : "border-border text-transparent hover:border-primary",
                      )}
                    >
                      <Check size={11} strokeWidth={3} />
                    </button>
                    <p className={cn("min-w-0 flex-1 text-[13.5px] font-medium", m.done && "text-muted-foreground line-through")}>
                      {m.title}
                    </p>
                    <span className="shrink-0 text-[12px] text-muted-foreground">{m.date ? shortDate(m.date) : "No date"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {tab === "tasks" && (
        <Card>
          <CardHeader
            title="Tasks"
            subtitle={`${stats.tasksDone} of ${stats.taskCount} complete`}
            action={
              <Link href="/app/tasks">
                <Button size="sm" variant="outline">
                  Open board
                </Button>
              </Link>
            }
          />
          <div className="p-5 pt-4">
            {tasks.length === 0 ? (
              <EmptyState icon={Check} title="No tasks" body="Add tasks from the tasks board." />
            ) : (
              <ul className="divide-y divide-border">
                {tasks.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    {t.status === "done" ? (
                      <Check size={15} strokeWidth={2.4} className="shrink-0 text-success" />
                    ) : (
                      <Circle size={15} strokeWidth={1.9} className="shrink-0 text-muted-foreground" />
                    )}
                    <p className={cn("min-w-0 flex-1 text-[13.5px] font-medium", t.status === "done" && "text-muted-foreground line-through")}>
                      {t.title}
                    </p>
                    <Badge tone={STATUS_TONE[t.priority] ?? "neutral"}>{t.priority}</Badge>
                    <Badge tone={STATUS_TONE[t.status] ?? "neutral"}>{titleCase(t.status)}</Badge>
                    <span className="w-24 shrink-0 text-right text-[12px] text-muted-foreground">
                      {t.dueDate ? shortDate(t.dueDate) : "—"}
                    </span>
                    <span className="w-16 shrink-0 text-right text-[12px] tnum text-muted-foreground">
                      {hours(t.actualMins)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {tab === "files" && (
        <Card>
          <CardHeader
            title="Files"
            subtitle={`${files.length} attached`}
            action={
              <Link href="/app/files">
                <Button size="sm" variant="outline">
                  Upload
                </Button>
              </Link>
            }
          />
          <div className="p-5 pt-4">
            {files.length === 0 ? (
              <EmptyState icon={FileText} title="No files" body="Upload deliverables from the files page." />
            ) : (
              <ul className="divide-y divide-border">
                {files.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <FileText size={16} strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium">{f.name}</p>
                        <p className="text-[12px] text-muted-foreground">
                          v{f.version} · {(f.size / 1024).toFixed(0)} KB · {f.uploadedBy}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[12px] text-muted-foreground">{relative(f.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {tab === "invoices" && (
        <Card>
          <CardHeader title="Invoices" subtitle={`${invoices.length} issued for this project`} />
          <div className="p-5 pt-4">
            {invoices.length === 0 ? (
              <EmptyState icon={Receipt} title="Not invoiced yet" body="Create an invoice tied to this project." />
            ) : (
              <ul className="divide-y divide-border">
                {invoices.map((inv) => (
                  <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <Link href={`/app/invoices/${inv.id}`} className="text-[13.5px] font-medium hover:text-primary">
                        {inv.number}
                      </Link>
                      <p className="text-[12px] text-muted-foreground">
                        Issued {shortDate(inv.issueDate)} · due {shortDate(inv.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13.5px] font-medium tnum">{money(inv.total, inv.currency ?? "USD")}</span>
                      <Badge tone={STATUS_TONE[inv.status] ?? "neutral"}>{inv.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {tab === "meetings" && (
        <Card>
          <CardHeader title="Meetings" subtitle={`${meetings.length} linked to this project`} />
          <div className="p-5 pt-4">
            {meetings.length === 0 ? (
              <EmptyState icon={CalendarClock} title="No meetings" body="Schedule a project call." />
            ) : (
              <ul className="divide-y divide-border">
                {meetings.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-[13.5px] font-medium">{m.title}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {shortDate(m.date)} · {timeLabel(m.time)} · {m.duration}m
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[m.status] ?? "neutral"}>{titleCase(m.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {tab === "discussion" && (
        <Card>
          <CardHeader title="Discussion" subtitle="Notes and decisions, in order" />
          <div className="p-5 pt-4">
            <div className="flex gap-3">
              <Textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment…"
              />
              <Button
                className="self-end"
                loading={addComment.isPending}
                onClick={async () => {
                  if (!comment.trim()) return;
                  await addComment.mutateAsync({ projectId: project.id, body: comment });
                  setComment("");
                }}
              >
                <Send size={15} strokeWidth={1.9} />
                Post
              </Button>
            </div>
            {comments.length === 0 ? (
              <EmptyState icon={MessageSquare} title="No comments yet" body="Start the thread." className="py-10" />
            ) : (
              <ul className="mt-6 space-y-4">
                {comments.map((c) => (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group flex gap-3"
                  >
                    <Avatar name={c.author || "You"} size="sm" />
                    <div className="min-w-0 flex-1 rounded-xl border border-border bg-card p-3.5">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold">{c.author}</p>
                        <span className="text-[11.5px] text-muted-foreground">{relative(c.createdAt)}</span>
                        <button
                          type="button"
                          aria-label="Delete comment"
                          onClick={() => removeComment.mutate({ id: c.id })}
                          className="ml-auto rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
                        >
                          <Trash2 size={13} strokeWidth={1.9} />
                        </button>
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed">{c.body}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {tab === "notes" && (
        <Card>
          <CardHeader
            title="Project notes"
            subtitle="A scratchpad only you can see"
            action={
              <Button
                size="sm"
                loading={saveNote.isPending}
                onClick={async () => {
                  await saveNote.mutateAsync({ projectId: project.id, body: note });
                  toast.success("Notes saved");
                }}
              >
                <Save size={15} strokeWidth={1.9} />
                Save
              </Button>
            }
          />
          <div className="p-5 pt-4">
            <Textarea
              rows={16}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Requirements, decisions, gotchas…"
              className="font-normal"
            />
          </div>
        </Card>
      )}

      {tab === "activity" && (
        <Card>
          <CardHeader title="Activity" subtitle="Everything that happened here" />
          <div className="p-5 pt-4">
            {activities.length === 0 ? (
              <EmptyState icon={Clock} title="No activity" body="Actions on this project will appear here." />
            ) : (
              <ul className="space-y-3.5">
                {activities.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-[13.5px] leading-snug">{a.text}</p>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                        {a.actor} · {relative(a.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      <Modal
        open={msOpen}
        onClose={() => setMsOpen(false)}
        title="Add milestone"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMsOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={addMilestone.isPending}
              onClick={async () => {
                if (!msForm.title.trim()) return;
                await addMilestone.mutateAsync({ projectId: project.id, ...msForm });
                setMsForm({ title: "", date: "" });
                setMsOpen(false);
                toast.success("Milestone added");
              }}
            >
              Add milestone
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title">
            <Input
              value={msForm.title}
              onChange={(e) => setMsForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Client sign-off"
            />
          </Field>
          <Field label="Target date" hint="Optional">
            <Input type="date" value={msForm.date} onChange={(e) => setMsForm((f) => ({ ...f, date: e.target.value }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
