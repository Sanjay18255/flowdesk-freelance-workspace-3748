import { useMemo } from "react";
import { Link } from "wouter";
import { motion } from "motion/react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  FolderKanban,
  Handshake,
  ListChecks,
  MessageSquare,
  Milestone,
  Plus,
  Receipt,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { authClient } from "../../lib/auth";
import { useDashboard } from "../../queries/dashboard";
import { Badge, Button, Card, CardHeader, EmptyState, PageSkeleton, Progress, STATUS_TONE } from "../../components/ui/kit";
import { KpiCard } from "../../components/kpi";
import { AreaChart, DonutChart, RankBars } from "../../components/charts";
import { daysUntil, hours, money, relative, timeLabel, tinyDate, titleCase } from "../../lib/format";
import { cn } from "../../lib/utils";

const ACTIVITY_ICON: Record<string, typeof FileText> = {
  client: Users,
  project: FolderKanban,
  task: ListChecks,
  invoice: Receipt,
  meeting: CalendarClock,
  file: FileText,
  lead: Handshake,
  milestone: Milestone,
  comment: MessageSquare,
  team: Users,
  generic: FileText,
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const { data, isLoading } = useDashboard();

  const donut = useMemo(() => {
    const c = data?.statusCounts;
    if (!c) return [];
    return [
      { label: "todo", value: c.todo, color: "#94a3b8" },
      { label: "in progress", value: c.in_progress, color: "var(--primary)" },
      { label: "review", value: c.review, color: "#f59e0b" },
      { label: "done", value: c.done, color: "#10b981" },
    ].filter((d) => d.value > 0);
  }, [data]);

  if (isLoading || !data) return <PageSkeleton />;

  const k = data.kpis;
  const firstName = (session?.user?.name ?? "there").split(" ")[0];
  const totalTasks = Object.values(data.statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[25px] font-semibold leading-tight">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            {k.dueToday > 0
              ? `${k.dueToday} task${k.dueToday === 1 ? "" : "s"} due today`
              : "Nothing due today"}
            {data.todayMeetings.length > 0 &&
              ` · ${data.todayMeetings.length} meeting${data.todayMeetings.length === 1 ? "" : "s"} on the calendar`}
            {k.overdueCount > 0 && ` · ${k.overdueCount} invoice${k.overdueCount === 1 ? "" : "s"} overdue`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/app/invoices?new=1">
            <Button variant="outline" size="sm">
              <Receipt size={15} strokeWidth={1.9} />
              New invoice
            </Button>
          </Link>
          <Link href="/app/projects?new=1">
            <Button size="sm">
              <Plus size={15} strokeWidth={2.2} />
              New project
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Revenue this month"
          value={k.revenueThisMonth}
          format={(v) => money(v)}
          delta={k.revenueDelta}
          deltaLabel="vs last month"
          icon={DollarSign}
          tone="success"
        />
        <KpiCard
          index={1}
          label="Outstanding"
          value={k.outstanding}
          format={(v) => money(v)}
          deltaLabel={k.overdueCount ? `${k.overdueCount} overdue` : "All on schedule"}
          icon={Receipt}
          tone={k.overdueCount ? "danger" : "primary"}
        />
        <KpiCard
          index={2}
          label="Active projects"
          value={k.activeProjects}
          deltaLabel={`${k.totalClients} clients · ${k.vipClients} VIP`}
          icon={FolderKanban}
          tone="primary"
        />
        <KpiCard
          index={3}
          label="Hours this week"
          value={k.hoursThisWeek}
          format={(v) => `${v.toFixed(1)}h`}
          deltaLabel={`${k.billableRatio}% billable`}
          icon={Clock}
          tone="warning"
        />
      </div>

      {/* revenue + tasks */}
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader
            title="Revenue"
            subtitle="Paid invoices over the last 12 months"
            action={
              <div className="text-right">
                <p className="text-[19px] font-semibold tnum">{money(k.lifetimeRevenue, "USD", true)}</p>
                <p className="text-[11.5px] text-muted-foreground">lifetime</p>
              </div>
            }
          />
          <div className="px-3 pb-4 pt-6">
            <AreaChart data={data.series} height={220} format={(v) => money(v)} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Task breakdown" subtitle={`${totalTasks} tasks in your workspace`} />
          <div className="p-5">
            {donut.length ? (
              <DonutChart data={donut} centerValue={String(totalTasks)} centerLabel="total" size={148} thickness={16} />
            ) : (
              <EmptyState icon={ListChecks} title="No tasks yet" body="Create your first task to see the split." />
            )}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
              <div>
                <p className="text-[11.5px] uppercase tracking-wide text-muted-foreground">Completed / week</p>
                <p className="mt-1 text-[17px] font-semibold tnum">{k.completedThisWeek}</p>
              </div>
              <div>
                <p className="text-[11.5px] uppercase tracking-wide text-muted-foreground">Overdue</p>
                <p className={cn("mt-1 text-[17px] font-semibold tnum", k.overdueTasks > 0 && "text-danger")}>
                  {k.overdueTasks}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* schedule + deadlines + clients */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader
            title="Today's schedule"
            subtitle={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            action={
              <Link href="/app/meetings" className="text-[12.5px] font-medium text-primary hover:underline">
                All meetings
              </Link>
            }
          />
          <div className="p-5 pt-4">
            {data.todayMeetings.length === 0 && data.upcomingMeetings.length === 0 && (
              <EmptyState icon={CalendarClock} title="Nothing scheduled" body="Your calendar is clear." />
            )}
            <ul className="space-y-3">
              {(data.todayMeetings.length ? data.todayMeetings : data.upcomingMeetings.slice(0, 4)).map((m) => (
                <li key={m.id} className="flex gap-3.5">
                  <div className="w-14 shrink-0 text-right">
                    <p className="text-[12.5px] font-semibold tnum">{timeLabel(m.time)}</p>
                    <p className="text-[11px] text-muted-foreground">{m.duration}m</p>
                  </div>
                  <div className="relative flex-1 border-l border-border pl-3.5">
                    <span className="absolute -left-[3.5px] top-1.5 h-[7px] w-[7px] rounded-full bg-primary" />
                    <p className="text-[13.5px] font-medium leading-snug">{m.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <Video size={12} strokeWidth={1.9} />
                      {m.type}
                      {data.todayMeetings.length === 0 && ` · ${tinyDate(m.date)}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Upcoming deadlines"
            subtitle="Projects closest to delivery"
            action={
              <Link href="/app/projects" className="text-[12.5px] font-medium text-primary hover:underline">
                All projects
              </Link>
            }
          />
          <div className="p-5 pt-4">
            {data.deadlines.length === 0 && (
              <EmptyState icon={FolderKanban} title="No deadlines" body="Add a deadline to a project to track it." />
            )}
            <ul className="space-y-4">
              {data.deadlines.map((d) => {
                const left = daysUntil(d.deadline);
                return (
                  <li key={d.id}>
                    <Link href={`/app/projects/${d.id}`} className="group block">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0 truncate text-[13.5px] font-medium group-hover:text-primary">
                          {d.name}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 text-[12px] font-medium tnum",
                            left < 0 ? "text-danger" : left <= 7 ? "text-warning" : "text-muted-foreground",
                          )}
                        >
                          {left < 0 ? `${Math.abs(left)}d late` : left === 0 ? "Today" : `${left}d left`}
                        </span>
                      </div>
                      <Progress value={d.progress} className="mt-2" showLabel />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader
            title="Top clients"
            subtitle="By lifetime paid revenue"
            action={
              <Link href="/app/clients" className="text-[12.5px] font-medium text-primary hover:underline">
                All clients
              </Link>
            }
          />
          <div className="p-5 pt-4">
            {data.clientRevenue.filter((c) => c.revenue > 0).length === 0 ? (
              <EmptyState icon={Users} title="No revenue yet" body="Mark an invoice as paid to see it here." />
            ) : (
              <RankBars
                data={data.clientRevenue
                  .filter((c) => c.revenue > 0)
                  .map((c) => ({ label: c.name, value: c.revenue }))}
                format={(v) => money(v, "USD", true)}
              />
            )}
          </div>
        </Card>
      </div>

      {/* activity + due today + snapshot */}
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="Recent activity" subtitle="Everything that moved in your workspace" />
          <div className="p-5 pt-4">
            {data.recentActivity.length === 0 && (
              <EmptyState icon={TrendingUp} title="No activity yet" body="Your actions will show up here." />
            )}
            <ul className="space-y-1">
              {data.recentActivity.map((a, i) => {
                const Icon = ACTIVITY_ICON[a.kind] ?? FileText;
                return (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    className="flex items-start gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-hover"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon size={14} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] leading-snug">{a.text}</p>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                        {a.actor} · {relative(a.createdAt)}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Due today"
              subtitle={`${k.dueToday} task${k.dueToday === 1 ? "" : "s"} on the clock`}
              action={
                <Link href="/app/tasks" className="text-[12.5px] font-medium text-primary hover:underline">
                  Open board
                </Link>
              }
            />
            <div className="p-5 pt-4">
              {data.dueTodayTasks.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="Inbox zero" body="Nothing is due today. Enjoy it." />
              ) : (
                <ul className="space-y-2.5">
                  {data.dueTodayTasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          t.priority === "urgent"
                            ? "bg-danger"
                            : t.priority === "high"
                              ? "bg-warning"
                              : "bg-primary",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium">{t.title}</p>
                        <p className="truncate text-[11.5px] text-muted-foreground">{t.projectName}</p>
                      </div>
                      <Badge tone={STATUS_TONE[t.status] ?? "neutral"}>{titleCase(t.status)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Project snapshot" subtitle="Active work, most complete first" />
            <div className="space-y-4 p-5 pt-4">
              {data.projectSnapshot.length === 0 && (
                <EmptyState icon={FolderKanban} title="No active projects" body="Create a project to get going." />
              )}
              {data.projectSnapshot.map((p) => (
                <Link key={p.id} href={`/app/projects/${p.id}`} className="group block">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[13.5px] font-medium group-hover:text-primary">{p.name}</p>
                    <Badge tone={STATUS_TONE[p.status] ?? "neutral"}>{titleCase(p.status)}</Badge>
                  </div>
                  <Progress value={p.progress} className="mt-2" showLabel />
                </Link>
              ))}
            </div>
          </Card>

          <Card className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-[13.5px] font-semibold">Time logged this week</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                {hours(Math.round(k.hoursThisWeek * 60))} · {k.billableRatio}% billable
              </p>
            </div>
            <Link href="/app/tasks">
              <Button variant="outline" size="sm">
                Log time
                <ArrowRight size={14} strokeWidth={2} />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
