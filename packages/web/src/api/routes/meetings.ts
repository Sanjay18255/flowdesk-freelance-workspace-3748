import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as s from "../database/schema";
import { id } from "../lib/ids";
import { logActivity, notify } from "../lib/activity";

const meetingInput = z.object({
  title: z.string().min(1),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  date: z.string(),
  time: z.string().optional(),
  duration: z.number().optional(),
  type: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  participants: z.array(z.string()).optional(),
  reminder: z.string().optional(),
  status: z.enum(["upcoming", "completed", "cancelled"]).optional(),
});

const notesSchema = z.object({
  agenda: z.string().optional(),
  discussion: z.string().optional(),
  actionItems: z.string().optional(),
  decisions: z.string().optional(),
  followUp: z.string().optional(),
});

export const meetings = {
  list: authed.handler(async ({ context }) => {
    const rows = await db.select().from(s.meetings).where(eq(s.meetings.userId, context.user.id));
    const today = new Date().toISOString().slice(0, 10);
    return rows
      .map((r) => ({
        ...r,
        status: r.status === "upcoming" && r.date < today ? "completed" : r.status,
      }))
      .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date < b.date ? -1 : 1));
  }),

  get: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [row] = await db
      .select()
      .from(s.meetings)
      .where(and(eq(s.meetings.id, input.id), eq(s.meetings.userId, context.user.id)))
      .limit(1);
    return row ?? null;
  }),

  create: authed.input(meetingInput).handler(async ({ input, context }) => {
    const [row] = await db
      .insert(s.meetings)
      .values({ id: id("mtg"), userId: context.user.id, ...input })
      .returning();
    await logActivity({
      userId: context.user.id,
      kind: "meeting",
      text: `Meeting scheduled: ${input.title} on ${input.date}.`,
      clientId: input.clientId,
      projectId: input.projectId,
    });
    await notify({
      userId: context.user.id,
      kind: "meeting",
      title: "Meeting scheduled",
      body: `${input.title} — ${input.date} at ${input.time ?? "10:00"}.`,
    });
    return row;
  }),

  update: authed.input(meetingInput.partial().extend({ id: z.string() })).handler(async ({ input, context }) => {
    const { id: mid, ...patch } = input;
    await db
      .update(s.meetings)
      .set(patch)
      .where(and(eq(s.meetings.id, mid), eq(s.meetings.userId, context.user.id)));
    const [row] = await db.select().from(s.meetings).where(eq(s.meetings.id, mid)).limit(1);
    return row;
  }),

  setStatus: authed
    .input(z.object({ id: z.string(), status: z.enum(["upcoming", "completed", "cancelled"]) }))
    .handler(async ({ input, context }) => {
      await db
        .update(s.meetings)
        .set({ status: input.status })
        .where(and(eq(s.meetings.id, input.id), eq(s.meetings.userId, context.user.id)));
      const [row] = await db.select().from(s.meetings).where(eq(s.meetings.id, input.id)).limit(1);
      return row;
    }),

  saveNotes: authed.input(notesSchema.extend({ id: z.string() })).handler(async ({ input, context }) => {
    const { id: mid, ...patch } = input;
    const [current] = await db
      .select()
      .from(s.meetings)
      .where(and(eq(s.meetings.id, mid), eq(s.meetings.userId, context.user.id)))
      .limit(1);
    if (!current) return null;
    const notes: s.MeetingNotes = {
      agenda: "",
      discussion: "",
      actionItems: "",
      decisions: "",
      followUp: "",
      ...(current.notes ?? {}),
      ...patch,
    };
    await db.update(s.meetings).set({ notes }).where(eq(s.meetings.id, mid));
    return { ...current, notes };
  }),

  remove: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await db.delete(s.meetings).where(and(eq(s.meetings.id, input.id), eq(s.meetings.userId, context.user.id)));
    return { ok: true };
  }),
};
