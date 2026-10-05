import { useState } from "react";
import {
  BarChart3,
  Clock,
  Download,
  Gauge,
  Percent,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  PageSkeleton,
  Segmented,
} from "../../components/ui/kit";
import { KpiCard } from "../../components/kpi";
import { AreaChart, BarChart, DonutChart, RankBars, Ring } from "../../components/charts";
import { useReports } from "../../queries/reports";
import { useToast } from "../../components/toast";
import { CHART_COLOR, money, titleCase } from "../../lib/format";
import { cn } from "../../lib/utils";

const STATUS_COLOR: Record<string, string> = {
  draft: "#94a3b8",
  sent: "#6366f1",
  viewed: "#f59e0b",
  paid: "#10b981",
  overdue: "#f43f5e",
  cancelled: "#64748b",
  todo: "#94a3b8",
  in_progress: "#6366f1",
  review: "#f59e0b",
  done: "#10b981",
  lead: "#94a3b8",
  qualified: "#0ea5e9",
  discovery: "#6366f1",
  proposal: "#8b5cf6",
  negotiation: "#f59e0b",
  won: "#10b981",
  lost: "#f43f5e",
};

function csvEscape(value: string | number) {
  const s = String(value);
  return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function ReportsPage() {
  const [range, setRange] = useState<"3m" | "6m" | "12m">("12m");
  const { data, isLoading } = useReports(range);
  const toast = useToast();

  if (isLoading || !data) return <PageSkeleton />;

  const t = data.totals;

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["Metric", "Value"],
      ["Revenue (range)", t.revenue],
      ["Lifetime revenue", t.lifetimeRevenue],
      ["Invoiced total", t.invoiced],
      ["Outstanding", t.outstanding],
      ["Average invoice", t.avgInvoice],
      ["Average days to payment", t.avgPaymentDays],
      ["Hours logged", t.hours],
      ["Billable hours", t.billableHours],
      ["Billable ratio %", t.billableRatio],
      ["Tasks completed", t.tasksDone],
      ["Tasks open", t.tasksOpen],
      ["On-time rate %", t.onTimeRate],
      ["Estimate accuracy %", t.estimateAccuracy],
      ["Win rate %", t.winRate],
      ["Pipeline value", t.pipelineValue],
      ["Active projects", t.activeProjects],
      ["Completed projects", t.completedProjects],
      [],
      ["Month", "Revenue", "Invoiced"],
      ...data.revenueSeries.map((r, i) => [r.label, r.value, data.invoicedSeries[i]?.value ?? 0]),
      [],
      ["Client", "Revenue", "Projects"],
      ...data.revenueByClient.map((c) => [c.name, c.value, c.projects]),
      [],
      ["Project", "Budget", "Spent", "Revenue", "Hours", "Margin %", "Effective rate"],
      ...data.projectProfitability.map((p) => [p.name, p.budget, p.spent, p.revenue, p.hours, p.margin, p.effectiveRate]),
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowdesk-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported", "CSV downloaded");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Revenue, time, delivery and pipeline performance"
        actions={
          <>
            <Segmented
              value={range}
              onChange={setRange}
              options={[
                { value: "3m", label: "3 months" },
                { value: "6m", label: "6 months" },
                { value: "12m", label: "12 months" },
              ]}
            />
            <Button variant="outline" onClick={exportCsv}>
              <Download size={16} strokeWidth={1.9} />
              Export CSV
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Revenue in range"
          value={t.revenue}
          format={(v) => money(v)}
          deltaLabel={`${money(t.lifetimeRevenue, "USD", true)} lifetime`}
          icon={Wallet}
          tone="success"
        />
        <KpiCard
          index={1}
          label="Outstanding"
          value={t.outstanding}
          format={(v) => money(v)}
          deltaLabel={`${t.avgPaymentDays} days avg to pay`}
          icon={TrendingUp}
          tone="warning"
        />
        <KpiCard
          index={2}
          label="Billable hours"
          value={t.billableHours}
          format={(v) => `${v.toFixed(1)}h`}
          deltaLabel={`${t.billableRatio}% of ${t.hours}h logged`}
          icon={Clock}
          tone="primary"
        />
        <KpiCard
          index={3}
          label="Win rate"
          value={t.winRate}
          format={(v) => `${Math.round(v)}%`}
          deltaLabel={`${money(t.pipelineValue, "USD", true)} in pipeline`}
          icon={Target}
          tone="danger"
        />
      </div>

      <Card>
        <CardHeader
          title="Revenue vs invoiced"
          subtitle="Collected cash against what you billed"
          action={
            <div className="flex items-center gap-4 text-[12px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Collected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                Invoiced
              </span>
            </div>
          }
        />
        <div className="grid gap-6 p-5 pt-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Collected</p>
            <AreaChart data={data.revenueSeries} height={200} format={(v) => money(v)} />
          </div>
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Invoiced</p>
            <BarChart data={data.invoicedSeries} height={200} format={(v) => money(v, "USD", true)} />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Revenue by client" subtitle="Concentration risk check" />
          <div className="p-5 pt-4">
            {data.revenueByClient.length === 0 ? (
              <EmptyState icon={BarChart3} title="No revenue yet" body="Mark invoices as paid to populate this." />
            ) : (
              <RankBars
                data={data.revenueByClient.slice(0, 8).map((c) => ({
                  label: c.name,
                  value: c.value,
                  color: CHART_COLOR[c.accent] ?? "var(--primary)",
                }))}
                format={(v) => money(v, "USD", true)}
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Revenue by service" subtitle="Which work pays best" />
          <div className="p-5 pt-4">
            {data.revenueByProjectType.length === 0 ? (
              <EmptyState icon={BarChart3} title="Nothing to show" body="Link paid invoices to projects." />
            ) : (
              <RankBars
                data={data.revenueByProjectType.slice(0, 8).map((r, i) => ({
                  label: r.name,
                  value: r.value,
                  color: Object.values(CHART_COLOR)[i % 6],
                }))}
                format={(v) => money(v, "USD", true)}
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Invoice status" subtitle="Where the money sits" />
          <div className="p-5 pt-4">
            <DonutChart
              size={140}
              thickness={16}
              centerValue={String(data.invoiceStatusBreakdown.reduce((s, x) => s + x.value, 0))}
              centerLabel="invoices"
              data={data.invoiceStatusBreakdown
                .filter((s) => s.value > 0)
                .map((s) => ({ label: s.name, value: s.value, color: STATUS_COLOR[s.name] ?? "#94a3b8" }))}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Hours by project" subtitle="Where your time actually goes" />
          <div className="p-5 pt-4">
            {data.hoursByProject.length === 0 ? (
              <EmptyState icon={Clock} title="No time logged" body="Log time on tasks to see this breakdown." />
            ) : (
              <RankBars
                data={data.hoursByProject.map((h) => ({
                  label: h.name,
                  value: h.hours,
                  color: CHART_COLOR[h.color] ?? "var(--primary)",
                }))}
                format={(v) => `${v}h`}
              />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Weekly rhythm" subtitle="Hours logged per weekday" />
          <div className="p-5 pt-6">
            <BarChart data={data.hoursByDay} height={180} format={(v) => `${v}h`} tone="mixed" />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex items-center gap-5 p-5">
          <Ring value={t.billableRatio} size={88} label="billable" />
          <div>
            <p className="text-[13.5px] font-semibold">Billable ratio</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              {t.billableHours}h of {t.hours}h logged is billable.
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-5 p-5">
          <Ring value={t.onTimeRate} size={88} label="on time" tone="#10b981" />
          <div>
            <p className="text-[13.5px] font-semibold">On-time delivery</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              {t.tasksDone} tasks completed, {t.tasksOpen} still open.
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-5 p-5">
          <Ring value={Math.min(150, t.estimateAccuracy)} size={88} label="of estimate" tone="#f59e0b" />
          <div>
            <p className="text-[13.5px] font-semibold">Estimate accuracy</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              {t.estimateAccuracy > 100
                ? `You run ${t.estimateAccuracy - 100}% over your estimates.`
                : `You come in ${100 - t.estimateAccuracy}% under estimate.`}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-5 p-5">
          <Ring value={t.winRate} size={88} label="win rate" tone="#8b5cf6" />
          <div>
            <p className="text-[13.5px] font-semibold">Deals won</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              {money(t.pipelineValue, "USD", true)} still in the pipeline.
            </p>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Project profitability" subtitle="Budget, spend, hours and effective hourly rate" />
        <div className="mt-4 overflow-x-auto">
          {data.projectProfitability.length === 0 ? (
            <EmptyState icon={Gauge} title="No projects with budgets" body="Add a budget to a project to see profitability." />
          ) : (
            <table className="w-full min-w-[860px] text-left text-[13.5px]">
              <thead className="border-y border-border bg-muted/40">
                <tr>
                  {["Project", "Budget", "Spent", "Collected", "Hours", "Effective rate", "Margin"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.projectProfitability.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-hover">
                    <td className="px-5 py-3 font-medium">{p.name}</td>
                    <td className="px-5 py-3 tnum text-muted-foreground">{money(p.budget)}</td>
                    <td className="px-5 py-3 tnum text-muted-foreground">{money(p.spent)}</td>
                    <td className="px-5 py-3 tnum font-medium">{money(p.revenue)}</td>
                    <td className="px-5 py-3 tnum text-muted-foreground">{p.hours}h</td>
                    <td className="px-5 py-3 tnum text-muted-foreground">
                      {p.effectiveRate ? `${money(p.effectiveRate)}/h` : "—"}
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3 font-medium tnum",
                        p.margin < 0 ? "text-danger" : p.margin < 20 ? "text-warning" : "text-success",
                      )}
                    >
                      {p.margin}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Tasks completed" subtitle="Delivery volume per month" />
          <div className="p-5 pt-6">
            <BarChart data={data.completionSeries} height={170} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Task status" subtitle="Current workload split" />
          <div className="p-5 pt-4">
            <DonutChart
              size={140}
              thickness={16}
              centerValue={String(data.taskStatusBreakdown.reduce((s, x) => s + x.value, 0))}
              centerLabel="tasks"
              data={data.taskStatusBreakdown
                .filter((s) => s.value > 0)
                .map((s) => ({ label: titleCase(s.name), value: s.value, color: STATUS_COLOR[s.name] ?? "#94a3b8" }))}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Pipeline by stage" subtitle="Deal count and value" />
          <div className="p-5 pt-4">
            <ul className="space-y-3">
              {data.leadStageBreakdown.map((s) => (
                <li key={s.name} className="flex items-center gap-3">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_COLOR[s.name] }} />
                  <span className="w-24 shrink-0 text-[12.5px] capitalize text-muted-foreground">{s.name}</span>
                  <span className="flex-1 text-[12.5px] font-medium tnum">{s.value}</span>
                  <span className="shrink-0 text-[12.5px] tnum text-muted-foreground">
                    {money(s.amount, "USD", true)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-primary-soft text-primary">
            <Percent size={18} strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-[13.5px] font-semibold">
              {t.activeProjects} active projects · {t.completedProjects} completed · {t.meetings} meetings ({t.meetingHours}h)
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Average invoice {money(t.avgInvoice)} · total invoiced {money(t.invoiced)}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download size={16} strokeWidth={1.9} />
          Export full report
        </Button>
      </Card>
    </div>
  );
}
