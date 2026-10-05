import { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Clock, Mail, MoreHorizontal, Pencil, Trash2, UserPlus, UsersRound } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
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
  Select,
} from "../../components/ui/kit";
import { KpiCard } from "../../components/kpi";
import { useInviteMember, useRemoveMember, useTeam, useUpdateMember } from "../../queries/team";
import { useToast } from "../../components/toast";
import { hours } from "../../lib/format";
import { RankBars } from "../../components/charts";

type Member = NonNullable<ReturnType<typeof useTeam>["data"]>[number];

const ROLES = ["Owner", "Admin", "Project Manager", "Designer", "Developer", "Copywriter", "Member", "Contractor"];

export default function TeamPage() {
  const { data, isLoading } = useTeam();
  const invite = useInviteMember();
  const update = useUpdateMember();
  const remove = useRemoveMember();
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "Member", status: "offline" as "online" | "away" | "offline" });

  if (isLoading) return <PageSkeleton />;

  const members = data ?? [];
  const totalMinutes = members.reduce((s, m) => s + m.minutes, 0);
  const openTasks = members.reduce((s, m) => s + m.openTasks, 0);
  const doneTasks = members.reduce((s, m) => s + m.doneTasks, 0);

  const openForm = (m?: Member) => {
    if (m) {
      setEditing(m);
      setForm({ name: m.name, email: m.email, role: m.role, status: m.status as "online" | "away" | "offline" });
    } else {
      setEditing(null);
      setForm({ name: "", email: "", role: "Member", status: "offline" });
    }
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        subtitle={`${members.length} people · ${hours(totalMinutes)} logged between them`}
        actions={
          <Button onClick={() => openForm()}>
            <UserPlus size={16} strokeWidth={1.9} />
            Invite member
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Team size" value={members.length} deltaLabel="Active collaborators" icon={UsersRound} tone="primary" />
        <KpiCard index={1} label="Open tasks" value={openTasks} deltaLabel="Assigned across the team" icon={Clock} tone="warning" />
        <KpiCard index={2} label="Completed" value={doneTasks} deltaLabel="All time" icon={CheckCircle2} tone="success" />
        <KpiCard
          index={3}
          label="Hours logged"
          value={totalMinutes / 60}
          format={(v) => `${v.toFixed(1)}h`}
          deltaLabel="Team total"
          icon={Clock}
          tone="neutral"
        />
      </div>

      {members.length === 0 ? (
        <Card>
          <EmptyState
            icon={UsersRound}
            title="No team members yet"
            body="Invite the people you work with so you can assign tasks and see workload."
            action={
              <Button onClick={() => openForm()}>
                <UserPlus size={16} strokeWidth={1.9} />
                Invite member
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {members.map((m, i) => {
              const total = m.openTasks + m.doneTasks;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.26, delay: Math.min(i, 8) * 0.03 }}
                >
                  <Card hover className="flex h-full flex-col p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="relative">
                        <Avatar name={m.name} accent={m.accent ?? "indigo"} size="md" />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                            m.status === "online" ? "bg-success" : m.status === "away" ? "bg-warning" : "bg-muted-foreground/50"
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold">{m.name}</p>
                        <p className="truncate text-[12.5px] text-muted-foreground">{m.role}</p>
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
                                openForm(m);
                                close();
                              }}
                            >
                              Edit member
                            </MenuItem>
                            <MenuItem
                              icon={Trash2}
                              tone="danger"
                              onClick={() => {
                                setDeleting(m);
                                close();
                              }}
                            >
                              Remove
                            </MenuItem>
                          </>
                        )}
                      </Dropdown>
                    </div>

                    <p className="mt-3 flex items-center gap-2 truncate text-[12.5px] text-muted-foreground">
                      <Mail size={12.5} strokeWidth={1.9} />
                      {m.email}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone={STATUS_TONE[m.status] ?? "neutral"} dot>
                        {m.status}
                      </Badge>
                      <Badge tone="outline">{hours(m.minutes)} logged</Badge>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
                        <span className="text-muted-foreground">
                          {m.doneTasks}/{total} tasks done
                        </span>
                        <span className="font-medium tnum">{m.openTasks} open</span>
                      </div>
                      <Progress value={total ? (m.doneTasks / total) * 100 : 0} tone="success" />
                    </div>

                    {m.projects.length > 0 && (
                      <div className="mt-4 border-t border-border pt-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Projects</p>
                        <p className="mt-1 text-[12.5px] leading-relaxed">{m.projects.slice(0, 3).join(", ")}</p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Workload" subtitle="Open tasks per person" />
              <div className="p-5 pt-4">
                <RankBars
                  data={members.map((m) => ({ label: m.name, value: m.openTasks }))}
                  format={(v) => `${v} open`}
                />
              </div>
            </Card>
            <Card>
              <CardHeader title="Time logged" subtitle="Hours per person" />
              <div className="p-5 pt-4">
                <RankBars
                  data={members.map((m) => ({ label: m.name, value: Math.round((m.minutes / 60) * 10) / 10 }))}
                  format={(v) => `${v}h`}
                />
              </div>
            </Card>
          </div>
        </>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit member" : "Invite member"}
        subtitle={editing ? "Update their role or status." : "Add someone to your workspace."}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={invite.isPending || update.isPending}
              onClick={async () => {
                if (!form.name.trim() || !form.email.trim()) return;
                if (editing) {
                  await update.mutateAsync({ id: editing.id, ...form });
                  toast.success("Member updated", form.name);
                } else {
                  await invite.mutateAsync(form);
                  toast.success("Invitation sent", `${form.name} was added to the workspace.`);
                }
                setFormOpen(false);
              }}
            >
              {editing ? "Save changes" : "Send invite"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Sam Rivera" />
          </Field>
          <Field label="Email" className="sm:col-span-2">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="sam@studio.com"
            />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "online" | "away" | "offline" }))}
            >
              {["online", "away", "offline"].map((s) => (
                <option key={s} value={s}>
                  {s[0]!.toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Remove this member?"
        body={`${deleting?.name ?? "This person"} will lose access to the workspace. Their tasks stay assigned to their name.`}
        confirmLabel="Remove"
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await remove.mutateAsync({ id: deleting.id });
          toast.success("Member removed");
          setDeleting(null);
        }}
      />
    </div>
  );
}
