import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as s from "../database/schema";
import { id } from "../lib/ids";
import { logActivity } from "../lib/activity";

export const STAGES = ["lead", "qualified", "discovery", "proposal", "negotiation", "won", "lost"] as const;

const leadInput = z.object({
  company: z.string().min(1),
  contact: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  value: z.number().optional(),
  source: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  stage: z.enum(STAGES).optional(),
  expectedClose: z.string().optional(),
  owner: z.string().optional(),
  notes: z.string().optional(),
});

export const leads = {
  list: authed.handler(async ({ context }) => {
    const rows = await db.select().from(s.leads).where(eq(s.leads.userId, context.user.id));
    return rows.sort((a, b) => a.position - b.position);
  }),

  create: authed.input(leadInput).handler(async ({ input, context }) => {
    const [row] = await db
      .insert(s.leads)
      .values({
        id: id("ld"),
        userId: context.user.id,
        position: Date.now() % 100000,
        lastInteraction: new Date().toISOString().slice(0, 10),
        ...input,
      })
      .returning();
    await logActivity({ userId: context.user.id, kind: "lead", text: `New lead added: ${input.company}.` });
    return row;
  }),

  update: authed.input(leadInput.partial().extend({ id: z.string() })).handler(async ({ input, context }) => {
    const { id: leadId, ...patch } = input;
    await db
      .update(s.leads)
      .set(patch)
      .where(and(eq(s.leads.id, leadId), eq(s.leads.userId, context.user.id)));
    const [row] = await db.select().from(s.leads).where(eq(s.leads.id, leadId)).limit(1);
    return row;
  }),

  move: authed
    .input(z.object({ id: z.string(), stage: z.enum(STAGES), position: z.number() }))
    .handler(async ({ input, context }) => {
      await db
        .update(s.leads)
        .set({ stage: input.stage, position: input.position, lastInteraction: new Date().toISOString().slice(0, 10) })
        .where(and(eq(s.leads.id, input.id), eq(s.leads.userId, context.user.id)));
      const [row] = await db.select().from(s.leads).where(eq(s.leads.id, input.id)).limit(1);
      if (row) {
        await logActivity({
          userId: context.user.id,
          kind: "lead",
          text: `Lead moved to ${input.stage}: ${row.company}.`,
        });
      }
      return row;
    }),

  remove: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await db.delete(s.leads).where(and(eq(s.leads.id, input.id), eq(s.leads.userId, context.user.id)));
    return { ok: true };
  }),

  /** Convert a won lead into a client record. */
  convert: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [lead] = await db
      .select()
      .from(s.leads)
      .where(and(eq(s.leads.id, input.id), eq(s.leads.userId, context.user.id)))
      .limit(1);
    if (!lead) return null;
    const [client] = await db
      .insert(s.clients)
      .values({
        id: id("cli"),
        userId: context.user.id,
        name: lead.company,
        contactPerson: lead.contact ?? "",
        email: lead.email ?? "",
        phone: lead.phone ?? "",
        status: "active",
        clientSince: new Date().toISOString().slice(0, 10),
        lastContact: new Date().toISOString().slice(0, 10),
      })
      .returning();
    await db
      .update(s.leads)
      .set({ stage: "won" })
      .where(eq(s.leads.id, input.id));
    await logActivity({
      userId: context.user.id,
      kind: "client",
      text: `Lead converted to client: ${lead.company}.`,
      clientId: client?.id,
    });
    return client;
  }),
};
