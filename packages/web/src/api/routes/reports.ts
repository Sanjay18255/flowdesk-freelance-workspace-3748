import { z } from "zod";
import { eq } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as s from "../database/schema";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthsBack(count: number) {
  const out: { key: string; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    out.push({ key: d.toISOString().slice(0, 7), label: MONTHS[d.getMonth()]! });
  }
  return out;
}

export const reports = {
  overview: authed
    .input(z.object({ range: z.enum(["3m", "6m", "12m"]).optional() }).optional())
    .handler(async ({ input, context }) => {
      const uid = context.user.id;
      const months = monthsBack(input?.range === "3m" ? 3 : input?.range === "6m" ? 6 : 12);
      const since = `${months[0]!.key}-01`;

      const [clients, projects, tasks, invoices, entries, leads, meetings] = await Promise.all([
        db.select().from(s.clients).where(eq(s.clients.userId, uid)),
        db.select().from(s.projects).where(eq(s.projects.userId, uid)),
        db.select().from(s.tasks).where(eq(s.tasks.userId, uid)),
        db.select().from(s.invoices).where(eq(s.invoices.userId, uid)),
        db.select().from(s.timeEntries).where(eq(s.timeEntries.userId, uid)),
        db.select().from(s.leads).where(eq(s.leads.userId, uid)),
        db.select().from(s.meetings).where(eq(s.meetings.userId, uid)),
      ]);

      const paid = invoices.filter((i) => i.status === "paid");
      const inRange = paid.filter((i) => (i.paidAt || i.issueDate) >= since);

      const revenueSeries = months.map((m) => ({
        label: m.label,
        value: paid
          .filter((i) => (i.paidAt || i.issueDate).slice(0, 7) === m.key)
          .reduce((sum, i) => sum + i.total, 0),
      }));

      const invoicedSeries = months.map((m) => ({
        label: m.label,
        value: invoices
          .filter((i) => i.issueDate.slice(0, 7) === m.key)
          .reduce((sum, i) => sum + i.total, 0),
      }));

      const revenueByClient = clients
        .map((c) => ({
          name: c.name,
          accent: c.accent ?? "indigo",
          value: inRange.filter((i) => i.clientId === c.id).reduce((sum, i) => sum + i.total, 0),
          projects: projects.filter((p) => p.clientId === c.id).length,
        }))
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value);

      const revenueByProjectType = Object.entries(
        projects.reduce<Record<string, number>>((acc, p) => {
          const rev = paid.filter((i) => i.projectId === p.id).reduce((sum, i) => sum + i.total, 0);
          const key = p.type || "Other";
          acc[key] = (acc[key] ?? 0) + rev;
          return acc;
        }, {}),
      )
        .map(([name, value]) => ({ name, value }))
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value);

      const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);
      const billableMinutes = entries.filter((e) => e.billable).reduce((sum, e) => sum + e.minutes, 0);

      const hoursByProject = projects
        .map((p) => ({
          name: p.name,
          color: p.color ?? "indigo",
          hours: Math.round((entries.filter((e) => e.projectId === p.id).reduce((sum, e) => sum + e.minutes, 0) / 60) * 10) / 10,
        }))
        .filter((r) => r.hours > 0)
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 8);

      const hoursByDay = DAYS.map((label, idx) => ({
        label,
        value:
          Math.round(
            (entries
              .filter((e) => new Date(`${e.date}T00:00:00`).getDay() === idx)
              .reduce((sum, e) => sum + e.minutes, 0) /
              60) *
              10,
          ) / 10,
      }));

      const done = tasks.filter((t) => t.status === "done");
      const estimateAccuracy = (() => {
        const withBoth = done.filter((t) => t.estimateMins > 0 && t.actualMins > 0);
        if (!withBoth.length) return 0;
        const ratio =
          withBoth.reduce((sum, t) => sum + t.actualMins / t.estimateMins, 0) / withBoth.length;
        return Math.round(ratio * 100);
      })();

      const completionSeries = months.map((m) => ({
        label: m.label,
        value: done.filter((t) => t.completedAt && t.completedAt.toISOString().slice(0, 7) === m.key).length,
      }));

      const wonLeads = leads.filter((l) => l.stage === "won");
      const lostLeads = leads.filter((l) => l.stage === "lost");

      const projectProfitability = projects
        .filter((p) => p.budget > 0)
        .map((p) => {
          const revenue = paid.filter((i) => i.projectId === p.id).reduce((sum, i) => sum + i.total, 0);
          const hours = entries.filter((e) => e.projectId === p.id).reduce((sum, e) => sum + e.minutes, 0) / 60;
          return {
            id: p.id,
            name: p.name,
            budget: p.budget,
            spent: p.spent,
            revenue,
            hours: Math.round(hours * 10) / 10,
            margin: p.budget > 0 ? Math.round(((p.budget - p.spent) / p.budget) * 100) : 0,
            effectiveRate: hours > 0 ? Math.round((revenue || p.budget) / hours) : 0,
          };
        })
        .sort((a, b) => b.budget - a.budget);

      const avgPaymentDays = (() => {
        const withPaid = paid.filter((i) => i.paidAt);
        if (!withPaid.length) return 0;
        const total = withPaid.reduce(
          (sum, i) => sum + (new Date(i.paidAt!).getTime() - new Date(i.issueDate).getTime()) / 864e5,
          0,
        );
        return Math.round(total / withPaid.length);
      })();

      return {
        totals: {
          revenue: inRange.reduce((sum, i) => sum + i.total, 0),
          lifetimeRevenue: paid.reduce((sum, i) => sum + i.total, 0),
          invoiced: invoices.reduce((sum, i) => sum + i.total, 0),
          outstanding: invoices
            .filter((i) => i.status !== "paid" && i.status !== "draft" && i.status !== "cancelled")
            .reduce((sum, i) => sum + i.total, 0),
          avgInvoice: paid.length ? Math.round(paid.reduce((sum, i) => sum + i.total, 0) / paid.length) : 0,
          avgPaymentDays,
          hours: Math.round((totalMinutes / 60) * 10) / 10,
          billableHours: Math.round((billableMinutes / 60) * 10) / 10,
          billableRatio: totalMinutes ? Math.round((billableMinutes / totalMinutes) * 100) : 0,
          tasksDone: done.length,
          tasksOpen: tasks.length - done.length,
          onTimeRate: done.length
            ? Math.round(
                (done.filter((t) => !t.dueDate || (t.completedAt && t.completedAt.toISOString().slice(0, 10) <= t.dueDate)).length /
                  done.length) *
                  100,
              )
            : 0,
          estimateAccuracy,
          winRate: wonLeads.length + lostLeads.length
            ? Math.round((wonLeads.length / (wonLeads.length + lostLeads.length)) * 100)
            : 0,
          pipelineValue: leads
            .filter((l) => l.stage !== "won" && l.stage !== "lost")
            .reduce((sum, l) => sum + l.value, 0),
          meetings: meetings.length,
          meetingHours: Math.round((meetings.reduce((sum, m) => sum + m.duration, 0) / 60) * 10) / 10,
          activeProjects: projects.filter((p) => !p.archived && p.status !== "completed").length,
          completedProjects: projects.filter((p) => p.status === "completed").length,
        },
        revenueSeries,
        invoicedSeries,
        revenueByClient,
        revenueByProjectType,
        hoursByProject,
        hoursByDay,
        completionSeries,
        projectProfitability,
        invoiceStatusBreakdown: ["draft", "sent", "viewed", "paid", "overdue", "cancelled"].map((st) => ({
          name: st,
          value: invoices.filter((i) => i.status === st).length,
          amount: invoices.filter((i) => i.status === st).reduce((sum, i) => sum + i.total, 0),
        })),
        taskStatusBreakdown: ["todo", "in_progress", "review", "done"].map((st) => ({
          name: st,
          value: tasks.filter((t) => t.status === st).length,
        })),
        leadStageBreakdown: ["lead", "qualified", "discovery", "proposal", "negotiation", "won", "lost"].map(
          (st) => ({
            name: st,
            value: leads.filter((l) => l.stage === st).length,
            amount: leads.filter((l) => l.stage === st).reduce((sum, l) => sum + l.value, 0),
          }),
        ),
      };
    }),
};
