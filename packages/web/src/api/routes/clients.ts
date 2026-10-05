import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as s from "../database/schema";
import { id } from "../lib/ids";
import { logActivity, notify } from "../lib/activity";

const clientInput = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  prefContact: z.string().optional(),
  status: z.enum(["active", "inactive", "vip"]).optional(),
  accent: z.string().optional(),
  clientSince: z.string().optional(),
});

export const clients = {
  list: authed.handler(async ({ context }) => {
    const uid = context.user.id;
    const [rows, projectRows, invoiceRows] = await Promise.all([
      db.select().from(s.clients).where(eq(s.clients.userId, uid)),
      db.select().from(s.projects).where(eq(s.projects.userId, uid)),
      db.select().from(s.invoices).where(eq(s.invoices.userId, uid)),
    ]);
    return rows
      .map((c) => {
        const projects = projectRows.filter((p) => p.clientId === c.id);
        const invoices = invoiceRows.filter((i) => i.clientId === c.id);
        const paid = invoices.filter((i) => i.status === "paid");
        const overdue = invoices.filter((i) => i.status === "overdue");
        return {
          ...c,
          activeProjects: projects.filter((p) => !["completed", "cancelled"].includes(p.status)).length,
          totalProjects: projects.length,
          lifetimeValue: paid.reduce((sum, i) => sum + i.total, 0),
          outstanding: invoices
            .filter((i) => ["sent", "viewed", "overdue"].includes(i.status))
            .reduce((sum, i) => sum + i.total, 0),
          overdueCount: overdue.length,
          avgProjectSize: projects.length
            ? Math.round(projects.reduce((sum, p) => sum + p.budget, 0) / projects.length)
            : 0,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }),

  get: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const uid = context.user.id;
    const [client] = await db
      .select()
      .from(s.clients)
      .where(and(eq(s.clients.id, input.id), eq(s.clients.userId, uid)))
      .limit(1);
    if (!client) throw new ORPCError("NOT_FOUND", { message: "Client not found" });

    const [contactRows, noteRows, commRows, projectRows, invoiceRows, meetingRows, fileRows, activityRows] =
      await Promise.all([
        db.select().from(s.contacts).where(and(eq(s.contacts.userId, uid), eq(s.contacts.clientId, input.id))),
        db
          .select()
          .from(s.clientNotes)
          .where(and(eq(s.clientNotes.userId, uid), eq(s.clientNotes.clientId, input.id)))
          .orderBy(desc(s.clientNotes.updatedAt)),
        db
          .select()
          .from(s.communications)
          .where(and(eq(s.communications.userId, uid), eq(s.communications.clientId, input.id)))
          .orderBy(desc(s.communications.date)),
        db.select().from(s.projects).where(and(eq(s.projects.userId, uid), eq(s.projects.clientId, input.id))),
        db
          .select()
          .from(s.invoices)
          .where(and(eq(s.invoices.userId, uid), eq(s.invoices.clientId, input.id)))
          .orderBy(desc(s.invoices.issueDate)),
        db
          .select()
          .from(s.meetings)
          .where(and(eq(s.meetings.userId, uid), eq(s.meetings.clientId, input.id)))
          .orderBy(desc(s.meetings.date)),
        db.select().from(s.files).where(and(eq(s.files.userId, uid), eq(s.files.clientId, input.id))),
        db
          .select()
          .from(s.activities)
          .where(and(eq(s.activities.userId, uid), eq(s.activities.clientId, input.id)))
          .orderBy(desc(s.activities.createdAt))
          .limit(20),
      ]);

    const paid = invoiceRows.filter((i) => i.status === "paid");
    return {
      client,
      contacts: contactRows,
      notes: noteRows,
      communications: commRows,
      projects: projectRows,
      invoices: invoiceRows,
      meetings: meetingRows,
      files: fileRows,
      activities: activityRows,
      stats: {
        lifetimeValue: paid.reduce((sum, i) => sum + i.total, 0),
        totalProjects: projectRows.length,
        activeProjects: projectRows.filter((p) => !["completed", "cancelled"].includes(p.status)).length,
        avgProjectSize: projectRows.length
          ? Math.round(projectRows.reduce((sum, p) => sum + p.budget, 0) / projectRows.length)
          : 0,
        outstanding: invoiceRows
          .filter((i) => ["sent", "viewed", "overdue"].includes(i.status))
          .reduce((sum, i) => sum + i.total, 0),
        paymentStatus: invoiceRows.some((i) => i.status === "overdue")
          ? "Overdue"
          : invoiceRows.some((i) => ["sent", "viewed"].includes(i.status))
            ? "Pending"
            : "Up to date",
      },
    };
  }),

  create: authed.input(clientInput).handler(async ({ input, context }) => {
    const row = {
      id: id("cli"),
      userId: context.user.id,
      clientSince: input.clientSince || new Date().toISOString().slice(0, 10),
      lastContact: new Date().toISOString().slice(0, 10),
      ...input,
    };
    const [created] = await db.insert(s.clients).values(row).returning();
    await logActivity({ userId: context.user.id, kind: "client", text: `New client added: ${input.name}.`, clientId: row.id });
    await notify({ userId: context.user.id, kind: "client", title: "New client added", body: `${input.name} was added to your workspace` });
    return created;
  }),

  update: authed
    .input(clientInput.partial().extend({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { id: clientId, ...patch } = input;
      await db
        .update(s.clients)
        .set(patch)
        .where(and(eq(s.clients.id, clientId), eq(s.clients.userId, context.user.id)));
      const [row] = await db.select().from(s.clients).where(eq(s.clients.id, clientId)).limit(1);
      return row;
    }),

  remove: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const uid = context.user.id;
    await db.delete(s.clients).where(and(eq(s.clients.id, input.id), eq(s.clients.userId, uid)));
    await db.delete(s.contacts).where(and(eq(s.contacts.clientId, input.id), eq(s.contacts.userId, uid)));
    await db.delete(s.clientNotes).where(and(eq(s.clientNotes.clientId, input.id), eq(s.clientNotes.userId, uid)));
    await db
      .delete(s.communications)
      .where(and(eq(s.communications.clientId, input.id), eq(s.communications.userId, uid)));
    return { ok: true };
  }),

  addContact: authed
    .input(
      z.object({
        clientId: z.string(),
        name: z.string().min(1),
        position: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        birthday: z.string().optional(),
        linkedin: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [row] = await db
        .insert(s.contacts)
        .values({ id: id("ct"), userId: context.user.id, ...input })
        .returning();
      return row;
    }),

  removeContact: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await db.delete(s.contacts).where(and(eq(s.contacts.id, input.id), eq(s.contacts.userId, context.user.id)));
    return { ok: true };
  }),

  saveNote: authed
    .input(z.object({ id: z.string().optional(), clientId: z.string(), title: z.string(), body: z.string() }))
    .handler(async ({ input, context }) => {
      if (input.id) {
        await db
          .update(s.clientNotes)
          .set({ title: input.title, body: input.body, updatedAt: new Date() })
          .where(and(eq(s.clientNotes.id, input.id), eq(s.clientNotes.userId, context.user.id)));
        const [row] = await db.select().from(s.clientNotes).where(eq(s.clientNotes.id, input.id)).limit(1);
        return row;
      }
      const [row] = await db
        .insert(s.clientNotes)
        .values({
          id: id("cn"),
          userId: context.user.id,
          clientId: input.clientId,
          title: input.title,
          body: input.body,
          author: context.user.name,
        })
        .returning();
      return row;
    }),

  removeNote: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await db.delete(s.clientNotes).where(and(eq(s.clientNotes.id, input.id), eq(s.clientNotes.userId, context.user.id)));
    return { ok: true };
  }),

  logCommunication: authed
    .input(
      z.object({
        clientId: z.string(),
        type: z.string(),
        summary: z.string(),
        date: z.string(),
        followUpDate: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [row] = await db
        .insert(s.communications)
        .values({ id: id("cm"), userId: context.user.id, ...input })
        .returning();
      await db
        .update(s.clients)
        .set({ lastContact: input.date })
        .where(and(eq(s.clients.id, input.clientId), eq(s.clients.userId, context.user.id)));
      await logActivity({
        userId: context.user.id,
        kind: "comment",
        text: `${input.type} logged with client.`,
        clientId: input.clientId,
      });
      return row;
    }),

  removeCommunication: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await db
      .delete(s.communications)
      .where(and(eq(s.communications.id, input.id), eq(s.communications.userId, context.user.id)));
    return { ok: true };
  }),

  /** Minimal picker options for modals. */
  options: authed.handler(async ({ context }) => {
    const rows = await db
      .select({ id: s.clients.id, name: s.clients.name, accent: s.clients.accent })
      .from(s.clients)
      .where(eq(s.clients.userId, context.user.id));
    return rows;
  }),

  byIds: authed.input(z.object({ ids: z.array(z.string()) })).handler(async ({ input, context }) => {
    if (!input.ids.length) return [];
    return db
      .select()
      .from(s.clients)
      .where(and(eq(s.clients.userId, context.user.id), inArray(s.clients.id, input.ids)));
  }),
};
