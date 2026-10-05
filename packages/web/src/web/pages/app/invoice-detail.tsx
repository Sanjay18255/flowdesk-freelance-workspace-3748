import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, CheckCircle2, Copy, Printer, Receipt, Send, Wallet, X } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  PageSkeleton,
  STATUS_TONE,
  Select,
} from "../../components/ui/kit";
import {
  useAddPayment,
  useDuplicateInvoice,
  useInvoice,
  useSetInvoiceStatus,
} from "../../queries/invoices";
import { useSettings } from "../../queries/account";
import { authClient } from "../../lib/auth";
import { useToast } from "../../components/toast";
import { money, shortDate } from "../../lib/format";
import { LogoMark } from "../../components/logo";

export default function InvoiceDetailPage() {
  const { id = "" } = useParams();
  const { data, isLoading, error } = useInvoice(id);
  const setStatus = useSetInvoiceStatus();
  const duplicate = useDuplicateInvoice();
  const addPayment = useAddPayment();
  const settings = useSettings();
  const { data: session } = authClient.useSession();
  const toast = useToast();

  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: 0,
    method: "Bank Transfer",
    date: new Date().toISOString().slice(0, 10),
  });

  if (isLoading) return <PageSkeleton />;
  if (error || !data) {
    return (
      <Card>
        <EmptyState
          icon={Receipt}
          title="Invoice not found"
          body="This invoice may have been deleted."
          action={
            <Link href="/app/invoices">
              <Button variant="outline">Back to invoices</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const { invoice, client, project, payments, totals } = data;
  const business = settings.data?.prefs?.business ?? {};
  const paidSum = payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.max(0, invoice.total - paidSum);
  const currency = invoice.currency ?? "USD";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link
          href="/app/invoices"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          All invoices
        </Link>
        <div className="flex flex-wrap items-center gap-2.5">
          {invoice.status === "draft" && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await setStatus.mutateAsync({ id: invoice.id, status: "sent" });
                toast.success("Marked as sent");
              }}
            >
              <Send size={15} strokeWidth={1.9} />
              Mark as sent
            </Button>
          )}
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <Button
              size="sm"
              onClick={async () => {
                await setStatus.mutateAsync({ id: invoice.id, status: "paid" });
                toast.success("Marked as paid", money(invoice.total, currency));
              }}
            >
              <CheckCircle2 size={15} strokeWidth={1.9} />
              Mark as paid
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setPayOpen(true)}>
            <Wallet size={15} strokeWidth={1.9} />
            Record payment
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await duplicate.mutateAsync({ id: invoice.id });
              toast.success("Duplicated", "A new draft was created.");
            }}
          >
            <Copy size={15} strokeWidth={1.9} />
            Duplicate
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer size={15} strokeWidth={1.9} />
            Print / PDF
          </Button>
          {invoice.status !== "cancelled" && invoice.status !== "paid" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await setStatus.mutateAsync({ id: invoice.id, status: "cancelled" });
              }}
            >
              <X size={15} strokeWidth={1.9} />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        {/* printable document */}
        <Card className="p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <LogoMark size={38} />
              <p className="mt-3 text-[17px] font-semibold">{business.name || session?.user?.name || "Your business"}</p>
              <div className="mt-1.5 space-y-0.5 text-[12.5px] text-muted-foreground">
                {business.email && <p>{business.email}</p>}
                {business.phone && <p>{business.phone}</p>}
                {business.website && <p>{business.website}</p>}
                {business.address && <p className="max-w-[220px]">{business.address}</p>}
                {business.taxNumber && <p>Tax ID {business.taxNumber}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Invoice</p>
              <p className="mt-1 text-[24px] font-semibold tracking-[-0.02em]">{invoice.number}</p>
              <div className="mt-3">
                <Badge tone={STATUS_TONE[invoice.status] ?? "neutral"} dot>
                  {invoice.status}
                </Badge>
              </div>
              <div className="mt-4 space-y-1 text-[12.5px]">
                <p>
                  <span className="text-muted-foreground">Issued </span>
                  {shortDate(invoice.issueDate)}
                </p>
                <p>
                  <span className="text-muted-foreground">Due </span>
                  {shortDate(invoice.dueDate)}
                </p>
                <p>
                  <span className="text-muted-foreground">Terms </span>
                  {invoice.terms}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 border-t border-border pt-6 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Billed to</p>
              <p className="mt-2 text-[15px] font-semibold">{client?.name ?? "—"}</p>
              <div className="mt-1 space-y-0.5 text-[12.5px] text-muted-foreground">
                {client?.contactPerson && <p>{client.contactPerson}</p>}
                {client?.email && <p>{client.email}</p>}
                {client?.address && <p>{client.address}</p>}
              </div>
            </div>
            {project && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Project</p>
                <p className="mt-2 text-[15px] font-semibold">{project.name}</p>
                <p className="mt-1 text-[12.5px] text-muted-foreground">{project.type}</p>
              </div>
            )}
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Description
                  </th>
                  <th className="w-16 px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Qty
                  </th>
                  <th className="w-28 px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Rate
                  </th>
                  <th className="w-32 px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items ?? []).map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 text-right tnum">{item.quantity}</td>
                    <td className="px-4 py-3 text-right tnum">{money(item.rate, currency)}</td>
                    <td className="px-4 py-3 text-right font-medium tnum">
                      {money(item.quantity * item.rate, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2.5 text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tnum">{money(totals.subtotal, currency)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="tnum">−{money(invoice.discount, currency)}</span>
                </div>
              )}
              {invoice.taxRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                  <span className="tnum">{money(totals.tax, currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2.5 text-[17px] font-semibold">
                <span>Total</span>
                <span className="tnum">{money(invoice.total, currency)}</span>
              </div>
              {paidSum > 0 && (
                <>
                  <div className="flex justify-between text-success">
                    <span>Paid</span>
                    <span className="tnum">−{money(paidSum, currency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Balance due</span>
                    <span className="tnum">{money(balance, currency)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-8 border-t border-border pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">{invoice.notes}</p>
            </div>
          )}
        </Card>

        {/* side panel */}
        <div className="space-y-4 no-print">
          <Card>
            <CardHeader title="Summary" />
            <dl className="space-y-3 p-5 pt-4 text-[13.5px]">
              {[
                ["Status", invoice.status],
                ["Total", money(invoice.total, currency)],
                ["Paid", money(paidSum, currency)],
                ["Balance", money(balance, currency)],
                ["Payment terms", invoice.terms ?? "—"],
                ["Paid on", invoice.paidAt ? shortDate(invoice.paidAt) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium capitalize">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Payments" subtitle={`${payments.length} recorded`} />
            <div className="p-5 pt-4">
              {payments.length === 0 ? (
                <EmptyState icon={Wallet} title="No payments" body="Record a payment when the money lands." />
              ) : (
                <ul className="divide-y divide-border">
                  {payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-[13px] font-medium">{money(p.amount, currency)}</p>
                        <p className="text-[11.5px] text-muted-foreground">
                          {p.method} · {shortDate(p.date)}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">{p.txnId}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record payment"
        subtitle={`Balance due ${money(balance, currency)}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={addPayment.isPending}
              onClick={async () => {
                const amount = payForm.amount || balance;
                await addPayment.mutateAsync({ invoiceId: invoice.id, ...payForm, amount });
                if (amount >= balance) await setStatus.mutateAsync({ id: invoice.id, status: "paid" });
                setPayOpen(false);
                toast.success("Payment recorded", money(amount, currency));
              }}
            >
              Save payment
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" hint={`Leave 0 to record the full balance (${money(balance, currency)})`}>
            <Input
              type="number"
              min={0}
              value={payForm.amount}
              onChange={(e) => setPayForm((f) => ({ ...f, amount: Number(e.target.value) }))}
            />
          </Field>
          <Field label="Date">
            <Input type="date" value={payForm.date} onChange={(e) => setPayForm((f) => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Method" className="sm:col-span-2">
            <Select value={payForm.method} onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value }))}>
              {["Bank Transfer", "Credit Card", "PayPal", "Stripe", "Wise", "Cash", "Cheque"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
