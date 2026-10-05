import { useEffect, useMemo, useState } from "react";
import { Link, useSearch as useQueryString } from "wouter";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  DollarSign,
  Eye,
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  Send,
  Trash2,
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
  Select,
  Textarea,
} from "../../components/ui/kit";
import { KpiCard } from "../../components/kpi";
import {
  useCreateInvoice,
  useDeleteInvoice,
  useDuplicateInvoice,
  useInvoices,
  useSetInvoiceStatus,
} from "../../queries/invoices";
import { orpc } from "../../lib/api";
import { useToast } from "../../components/toast";
import { money, shortDate } from "../../lib/format";
import { cn } from "../../lib/utils";

type Invoice = NonNullable<ReturnType<typeof useInvoices>["data"]>[number];
type Item = { id: string; description: string; quantity: number; rate: number };

const STATUSES = ["draft", "sent", "viewed", "paid", "overdue", "cancelled"] as const;

function newItem(): Item {
  return { id: Math.random().toString(36).slice(2, 9), description: "", quantity: 1, rate: 0 };
}

export default function InvoicesPage() {
  const qs = useQueryString();
  const { data, isLoading } = useInvoices();
  const clientOptions = useQuery(orpc.clients.options.queryOptions());
  const projectOptions = useQuery(orpc.projects.options.queryOptions());
  const nextNumber = useQuery(orpc.invoices.nextNumber.queryOptions());
  const create = useCreateInvoice();
  const setStatus = useSetInvoiceStatus();
  const duplicate = useDuplicateInvoice();
  const remove = useDeleteInvoice();
  const toast = useToast();

  const [q, setQ] = useState("");
  const [status, setStatusFilter] = useState("all");
  const [client, setClient] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const [form, setForm] = useState({
    clientId: "",
    projectId: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
    taxRate: 0,
    discount: 0,
    currency: "USD",
    terms: "Net 14",
    notes: "Thank you for your business.",
    status: "draft" as (typeof STATUSES)[number],
  });
  const [items, setItems] = useState<Item[]>([newItem()]);

  useEffect(() => {
    if (new URLSearchParams(qs).get("new") === "1") setFormOpen(true);
  }, [qs]);

  const rows = useMemo(() => {
    let list = data ?? [];
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter((i) => [i.number, i.notes].some((v) => (v ?? "").toLowerCase().includes(needle)));
    }
    if (status !== "all") list = list.filter((i) => i.status === status);
    if (client !== "all") list = list.filter((i) => i.clientId === client);
    return list;
  }, [data, q, status, client]);

  if (isLoading) return <PageSkeleton />;

  const all = data ?? [];
  const paid = all.filter((i) => i.status === "paid");
  const outstanding = all.filter((i) => ["sent", "viewed", "overdue"].includes(i.status));
  const overdue = all.filter((i) => i.status === "overdue");
  const clientName = (id?: string | null) => (clientOptions.data ?? []).find((c) => c.id === id)?.name ?? "—";

  const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
  const afterDiscount = Math.max(0, subtotal - form.discount);
  const tax = (afterDiscount * form.taxRate) / 100;
  const total = afterDiscount + tax;

  const submit = async () => {
    const clean = items.filter((i) => i.description.trim());
    if (!clean.length) {
      toast.error("Add at least one line item");
      return;
    }
    await create.mutateAsync({ ...form, items: clean });
    toast.success("Invoice created", `${money(total, form.currency)} for ${clientName(form.clientId)}`);
    setFormOpen(false);
    setItems([newItem()]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle={`${all.length} invoices · ${money(paid.reduce((s, i) => s + i.total, 0), "USD", true)} collected`}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus size={16} strokeWidth={2.2} />
            New invoice
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Collected"
          value={paid.reduce((s, i) => s + i.total, 0)}
          format={(v) => money(v)}
          deltaLabel={`${paid.length} paid`}
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          index={1}
          label="Outstanding"
          value={outstanding.reduce((s, i) => s + i.total, 0)}
          format={(v) => money(v)}
          deltaLabel={`${outstanding.length} awaiting payment`}
          icon={DollarSign}
          tone="primary"
        />
        <KpiCard
          index={2}
          label="Overdue"
          value={overdue.reduce((s, i) => s + i.total, 0)}
          format={(v) => money(v)}
          deltaLabel={`${overdue.length} past due`}
          icon={AlertTriangle}
          tone="danger"
        />
        <KpiCard
          index={3}
          label="Average invoice"
          value={paid.length ? paid.reduce((s, i) => s + i.total, 0) / paid.length : 0}
          format={(v) => money(v)}
          deltaLabel="Based on paid invoices"
          icon={Receipt}
          tone="warning"
        />
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by invoice number…" className="pl-9" />
        </div>
        <Select value={status} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto min-w-[140px]">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0]!.toUpperCase() + s.slice(1)}
            </option>
          ))}
        </Select>
        <Select value={client} onChange={(e) => setClient(e.target.value)} className="w-auto min-w-[170px]">
          <option value="all">All clients</option>
          {(clientOptions.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title={all.length ? "No invoices match" : "No invoices yet"}
            body={all.length ? "Try another status or client." : "Create your first invoice and get paid faster."}
            action={
              <Button onClick={() => setFormOpen(true)}>
                <Plus size={16} strokeWidth={2.2} />
                New invoice
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[13.5px]">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {["Invoice", "Client", "Issued", "Due", "Amount", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(i, 12) * 0.015 }}
                    className="border-b border-border last:border-0 hover:bg-hover"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/app/invoices/${inv.id}`} className="font-medium hover:text-primary">
                        {inv.number}
                      </Link>
                      <p className="text-[11.5px] text-muted-foreground">{(inv.items ?? []).length} line items</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{clientName(inv.clientId)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{shortDate(inv.issueDate)}</td>
                    <td
                      className={cn(
                        "px-4 py-3",
                        inv.status === "overdue" ? "font-medium text-danger" : "text-muted-foreground",
                      )}
                    >
                      {shortDate(inv.dueDate)}
                    </td>
                    <td className="px-4 py-3 font-medium tnum">{money(inv.total, inv.currency ?? "USD")}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[inv.status] ?? "neutral"} dot>
                        {inv.status}
                      </Badge>
                    </td>
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
                            {inv.status === "draft" && (
                              <MenuItem
                                icon={Send}
                                onClick={async () => {
                                  close();
                                  await setStatus.mutateAsync({ id: inv.id, status: "sent" });
                                  toast.success("Invoice sent", inv.number);
                                }}
                              >
                                Mark as sent
                              </MenuItem>
                            )}
                            {inv.status !== "paid" && inv.status !== "cancelled" && (
                              <MenuItem
                                icon={CheckCircle2}
                                onClick={async () => {
                                  close();
                                  await setStatus.mutateAsync({ id: inv.id, status: "paid" });
                                  toast.success("Marked as paid", `${money(inv.total)} recorded`);
                                }}
                              >
                                Mark as paid
                              </MenuItem>
                            )}
                            <MenuItem
                              icon={Eye}
                              onClick={() => {
                                close();
                                window.location.href = `/app/invoices/${inv.id}`;
                              }}
                            >
                              Open invoice
                            </MenuItem>
                            <MenuItem
                              icon={Copy}
                              onClick={async () => {
                                close();
                                await duplicate.mutateAsync({ id: inv.id });
                                toast.success("Duplicated", "A new draft was created.");
                              }}
                            >
                              Duplicate
                            </MenuItem>
                            {inv.status !== "cancelled" && inv.status !== "paid" && (
                              <MenuItem
                                icon={X}
                                onClick={async () => {
                                  close();
                                  await setStatus.mutateAsync({ id: inv.id, status: "cancelled" });
                                }}
                              >
                                Cancel invoice
                              </MenuItem>
                            )}
                            <MenuItem
                              icon={Trash2}
                              tone="danger"
                              onClick={() => {
                                setDeleting(inv);
                                close();
                              }}
                            >
                              Delete
                            </MenuItem>
                          </>
                        )}
                      </Dropdown>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="New invoice"
        subtitle={nextNumber.data ? `Number ${nextNumber.data}` : "Build a line-item invoice"}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={create.isPending}>
              Create invoice
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Client" className="sm:col-span-2">
              <Select value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}>
                <option value="">Select a client</option>
                {(clientOptions.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Project" className="sm:col-span-2">
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
            <Field label="Issue date">
              <Input type="date" value={form.issueDate} onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))} />
            </Field>
            <Field label="Due date">
              <Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
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
            <Field label="Terms">
              <Select value={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}>
                {["Due on receipt", "Net 7", "Net 14", "Net 30", "Net 45"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-semibold">Line items</p>
              <Button variant="outline" size="sm" onClick={() => setItems((it) => [...it, newItem()])}>
                <Plus size={14} strokeWidth={2.2} />
                Add line
              </Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                    <th className="w-20 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Qty</th>
                    <th className="w-28 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rate</th>
                    <th className="w-28 px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-2 py-1.5">
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            setItems((it) => it.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)))
                          }
                          placeholder="Design sprint — week 1"
                          className="h-9 border-transparent bg-transparent"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          min={0}
                          value={item.quantity}
                          onChange={(e) =>
                            setItems((it) => it.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) } : x)))
                          }
                          className="h-9 border-transparent bg-transparent"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          min={0}
                          value={item.rate}
                          onChange={(e) =>
                            setItems((it) => it.map((x, i) => (i === idx ? { ...x, rate: Number(e.target.value) } : x)))
                          }
                          className="h-9 border-transparent bg-transparent"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium tnum">
                        {money(item.quantity * item.rate, form.currency)}
                      </td>
                      <td className="px-2 py-1.5">
                        <button
                          type="button"
                          aria-label="Remove line"
                          onClick={() => setItems((it) => (it.length > 1 ? it.filter((_, i) => i !== idx) : it))}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 size={14} strokeWidth={1.9} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Field label="Notes">
                <Textarea rows={4} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </Field>
            </div>
            <div className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between text-[13.5px]">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tnum">{money(subtotal, form.currency)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[13.5px]">
                <span className="text-muted-foreground">Discount</span>
                <Input
                  type="number"
                  min={0}
                  value={form.discount}
                  onChange={(e) => setForm((f) => ({ ...f, discount: Number(e.target.value) }))}
                  className="h-9 w-28 text-right"
                />
              </div>
              <div className="flex items-center justify-between gap-3 text-[13.5px]">
                <span className="text-muted-foreground">Tax rate (%)</span>
                <Input
                  type="number"
                  min={0}
                  value={form.taxRate}
                  onChange={(e) => setForm((f) => ({ ...f, taxRate: Number(e.target.value) }))}
                  className="h-9 w-28 text-right"
                />
              </div>
              <div className="flex items-center justify-between text-[13.5px]">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium tnum">{money(tax, form.currency)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-[16px] font-semibold">
                <span>Total</span>
                <span className="tnum">{money(total, form.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this invoice?"
        body={`${deleting?.number ?? "This invoice"} and its payment records will be permanently removed.`}
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await remove.mutateAsync({ id: deleting.id });
          toast.success("Invoice deleted");
          setDeleting(null);
        }}
      />
    </div>
  );
}
