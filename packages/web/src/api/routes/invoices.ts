import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as s from "../database/schema";
import { id } from "../lib/ids";
import { logActivity, notify } from "../lib/activity";

const itemSchema = z.object({
  id: z.string(),
  description: z.string(),
  quantity: z.number(),
  rate: z.number(),
});

const invoiceInput = z.object({
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  number: z.string().optional(),
  status: z.enum(["draft", "sent", "viewed", "paid", "overdue", "cancelled"]).optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(itemSchema).optional(),
  taxRate: z.number().optional(),
  discount: z.number().optional(),
  currency: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
});

export function computeTotal(
  items: s.InvoiceItem[],
  taxRate: number,
  discount: number,
): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.rate, 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = (afterDiscount * taxRate) / 100;
  return { subtotal, tax, total: Math.round((afterDiscount + tax) * 100) / 100 };
}

async function nextNumber(userId: string) {
  const rows = await db.select().from(s.invoices).where(eq(s.invoices.userId, userId));
  const year = new Date().getFullYear();
  const nums = rows
    .map((r) => Number(r.number.split("-").pop()))
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `INV-${year}-${String(next).padStart(3, "0")}`;
}

export const invoices = {
  list: authed.handler(async ({ context }) => {
    const rows = await db.select().from(s.invoices).where(eq(s.invoices.userId, context.user.id));
    const today = new Date().toISOString().slice(0, 10);
    return rows
      .map((r) => ({
        ...r,
        status: r.status === "sent" && r.dueDate < today ? "overdue" : r.status,
      }))
      .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
  }),

  get: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [invoice] = await db
      .select()
      .from(s.invoices)
      .where(and(eq(s.invoices.id, input.id), eq(s.invoices.userId, context.user.id)))
      .limit(1);
    if (!invoice) return null;
    const pays = await db.select().from(s.payments).where(eq(s.payments.invoiceId, invoice.id));
    const client = invoice.clientId
      ? (await db.select().from(s.clients).where(eq(s.clients.id, invoice.clientId)).limit(1))[0]
      : undefined;
    const project = invoice.projectId
      ? (await db.select().from(s.projects).where(eq(s.projects.id, invoice.projectId)).limit(1))[0]
      : undefined;
    return {
      invoice,
      payments: pays,
      client: client ?? null,
      project: project ?? null,
      totals: computeTotal(invoice.items ?? [], invoice.taxRate, invoice.discount),
    };
  }),

  create: authed.input(invoiceInput).handler(async ({ input, context }) => {
    const items = input.items ?? [];
    const { total } = computeTotal(items, input.taxRate ?? 0, input.discount ?? 0);
    const [row] = await db
      .insert(s.invoices)
      .values({
        id: id("inv"),
        userId: context.user.id,
        number: input.number || (await nextNumber(context.user.id)),
        issueDate: input.issueDate || new Date().toISOString().slice(0, 10),
        dueDate: input.dueDate || new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
        ...input,
        items,
        total,
      })
      .returning();
    await logActivity({
      userId: context.user.id,
      kind: "invoice",
      text: `Invoice ${row?.number} created.`,
      clientId: input.clientId,
    });
    return row;
  }),

  update: authed.input(invoiceInput.extend({ id: z.string() })).handler(async ({ input, context }) => {
    const { id: invId, ...patch } = input;
    const [current] = await db
      .select()
      .from(s.invoices)
      .where(and(eq(s.invoices.id, invId), eq(s.invoices.userId, context.user.id)))
      .limit(1);
    if (!current) return null;
    const items = patch.items ?? current.items ?? [];
    const taxRate = patch.taxRate ?? current.taxRate;
    const discount = patch.discount ?? current.discount;
    const { total } = computeTotal(items, taxRate, discount);
    await db
      .update(s.invoices)
      .set({ ...patch, items, taxRate, discount, total })
      .where(eq(s.invoices.id, invId));
    const [row] = await db.select().from(s.invoices).where(eq(s.invoices.id, invId)).limit(1);
    return row;
  }),

  setStatus: authed
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["draft", "sent", "viewed", "paid", "overdue", "cancelled"]),
      }),
    )
    .handler(async ({ input, context }) => {
      const [current] = await db
        .select()
        .from(s.invoices)
        .where(and(eq(s.invoices.id, input.id), eq(s.invoices.userId, context.user.id)))
        .limit(1);
      if (!current) return null;
      await db
        .update(s.invoices)
        .set({
          status: input.status,
          paidAt: input.status === "paid" ? new Date().toISOString().slice(0, 10) : current.paidAt,
        })
        .where(eq(s.invoices.id, input.id));
      if (input.status === "paid") {
        await db.insert(s.payments).values({
          id: id("pay"),
          userId: context.user.id,
          invoiceId: current.id,
          txnId: `TXN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          method: "Bank Transfer",
          date: new Date().toISOString().slice(0, 10),
          amount: current.total,
          status: "completed",
        });
        await notify({
          userId: context.user.id,
          kind: "invoice",
          title: "Payment received",
          body: `${current.number} marked as paid — $${current.total.toLocaleString()}.`,
        });
      }
      await logActivity({
        userId: context.user.id,
        kind: "invoice",
        text: `Invoice ${current.number} marked ${input.status}.`,
        clientId: current.clientId ?? "",
      });
      const [row] = await db.select().from(s.invoices).where(eq(s.invoices.id, input.id)).limit(1);
      return row;
    }),

  addPayment: authed
    .input(
      z.object({
        invoiceId: z.string(),
        amount: z.number(),
        method: z.string().optional(),
        date: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [row] = await db
        .insert(s.payments)
        .values({
          id: id("pay"),
          userId: context.user.id,
          invoiceId: input.invoiceId,
          txnId: `TXN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          method: input.method ?? "Bank Transfer",
          date: input.date ?? new Date().toISOString().slice(0, 10),
          amount: input.amount,
          status: "completed",
        })
        .returning();
      return row;
    }),

  remove: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await db.delete(s.invoices).where(and(eq(s.invoices.id, input.id), eq(s.invoices.userId, context.user.id)));
    await db.delete(s.payments).where(eq(s.payments.invoiceId, input.id));
    return { ok: true };
  }),

  duplicate: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [current] = await db
      .select()
      .from(s.invoices)
      .where(and(eq(s.invoices.id, input.id), eq(s.invoices.userId, context.user.id)))
      .limit(1);
    if (!current) return null;
    const [row] = await db
      .insert(s.invoices)
      .values({
        ...current,
        id: id("inv"),
        number: await nextNumber(context.user.id),
        status: "draft",
        paidAt: "",
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
        createdAt: new Date(),
      })
      .returning();
    return row;
  }),

  payments: authed.handler(async ({ context }) => {
    const rows = await db.select().from(s.payments).where(eq(s.payments.userId, context.user.id));
    return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  }),

  nextNumber: authed.handler(({ context }) => nextNumber(context.user.id)),
};
