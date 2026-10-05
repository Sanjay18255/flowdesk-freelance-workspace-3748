import { eq } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as s from "../database/schema";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export const dashboard = {
  summary: authed.handler(async ({ context }) => {
    const uid = context.user.id;
    const [clients, projects, tasks, invoices, meetings, activities, entries] = await Promise.all([
      db.select().from(s.clients).where(eq(s.clients.userId, uid)),
      db.select().from(s.projects).where(eq(s.projects.userId, uid)),
      db.select().from(s.tasks).where(eq(s.tasks.userId, uid)),
      db.select().from(s.invoices).where(eq(s.invoices.userId, uid)),
      db.select().from(s.meetings).where(eq(s.meetings.userId, uid)),
      db.select().from(s.activities).where(eq(s.activities.userId, uid)),
      db.select().from(s.timeEntries).where(eq(s.timeEntries.userId, uid)),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = today.slice(0, 7);
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = prevDate.toISOString().slice(0, 7);

    const paid = invoices.filter((i) => i.status === "paid");
    const revenueThisMonth = paid
      .filter((i) => monthKey(i.paidAt || i.issueDate) === thisMonth)
      .reduce((sum, i) => sum + i.total, 0);
    const revenuePrevMonth = paid
      .filter((i) => monthKey(i.paidAt || i.issueDate) === prevMonth)
      .reduce((sum, i) => sum + i.total, 0);
    const outstanding = invoices
      .filter((i) => i.status === "sent" || i.status === "viewed" || i.status === "overdue")
      .reduce((sum, i) => sum + i.total, 0);
    const overdue = invoices.filter((i) => i.status !== "paid" && i.status !== "draft" && i.dueDate < today);

    // 12-month revenue series
    const series: { label: string; value: number; key: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      series.push({
        key,
        label: MONTHS[d.getMonth()]!,
        value: paid
          .filter((inv) => monthKey(inv.paidAt || inv.issueDate) === key)
          .reduce((sum, inv) => sum + inv.total, 0),
      });
    }

    const activeProjects = projects.filter((p) => !p.archived && p.status !== "completed");
    const openTasks = tasks.filter((t) => t.status !== "done");
    const dueToday = openTasks.filter((t) => t.dueDate === today);
    const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < today);
    const completedThisWeek = tasks.filter(
      (t) => t.completedAt && +t.completedAt > Date.now() - 7 * 864e5,
    );
    const hoursThisWeek =
      entries
        .filter((e) => e.date >= new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10))
        .reduce((sum, e) => sum + e.minutes, 0) / 60;

    const todayMeetings = meetings
      .filter((m) => m.date === today && m.status !== "cancelled")
      .sort((a, b) => a.time.localeCompare(b.time));
    const upcomingMeetings = meetings
      .filter((m) => m.date >= today && m.status === "upcoming")
      .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date < b.date ? -1 : 1))
      .slice(0, 6);

    const clientRevenue = clients
      .map((c) => ({
        id: c.id,
        name: c.name,
        accent: c.accent ?? "indigo",
        revenue: paid.filter((i) => i.clientId === c.id).reduce((sum, i) => sum + i.total, 0),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const statusCounts = {
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      review: tasks.filter((t) => t.status === "review").length,
      done: tasks.filter((t) => t.status === "done").length,
    };

    const deadlines = activeProjects
      .filter((p) => p.deadline)
      .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        deadline: p.deadline!,
        progress: p.progress,
        color: p.color ?? "indigo",
        daysLeft: Math.ceil((new Date(p.deadline!).getTime() - Date.now()) / 864e5),
      }));

    return {
      kpis: {
        revenueThisMonth,
        revenueDelta:
          revenuePrevMonth > 0
            ? Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100)
            : 0,
        outstanding,
        overdueCount: overdue.length,
        activeProjects: activeProjects.length,
        totalClients: clients.length,
        vipClients: clients.filter((c) => c.status === "vip").length,
        openTasks: openTasks.length,
        dueToday: dueToday.length,
        overdueTasks: overdueTasks.length,
        completedThisWeek: completedThisWeek.length,
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        billableRatio: entries.length
          ? Math.round(
              (entries.filter((e) => e.billable).reduce((a, e) => a + e.minutes, 0) /
                Math.max(
                  1,
                  entries.reduce((a, e) => a + e.minutes, 0),
                )) *
                100,
            )
          : 0,
        lifetimeRevenue: paid.reduce((sum, i) => sum + i.total, 0),
      },
      series,
      statusCounts,
      clientRevenue: clientRevenue.slice(0, 6),
      deadlines,
      todayMeetings,
      upcomingMeetings,
      dueTodayTasks: dueToday.slice(0, 6).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        projectName: projects.find((p) => p.id === t.projectId)?.name ?? "No project",
      })),
      recentActivity: activities.sort((a, b) => +b.createdAt - +a.createdAt).slice(0, 10),
      projectSnapshot: activeProjects
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 5)
        .map((p) => ({
          id: p.id,
          name: p.name,
          progress: p.progress,
          color: p.color ?? "indigo",
          status: p.status,
          clientId: p.clientId ?? "",
        })),
    };
  }),
};
