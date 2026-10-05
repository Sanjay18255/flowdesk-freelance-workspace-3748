import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as s from "../database/schema";
import { id } from "../lib/ids";
import { logActivity } from "../lib/activity";

const ACCENTS = ["indigo", "emerald", "amber", "rose", "sky", "violet"];

const memberInput = z.object({
  name: z.string().min(1),
  email: z.string().min(1),
  role: z.string().optional(),
  status: z.enum(["online", "away", "offline"]).optional(),
});

export const team = {
  list: authed.handler(async ({ context }) => {
    const members = await db
      .select()
      .from(s.teamMembers)
      .where(eq(s.teamMembers.userId, context.user.id));
    const tasks = await db.select().from(s.tasks).where(eq(s.tasks.userId, context.user.id));
    const projects = await db.select().from(s.projects).where(eq(s.projects.userId, context.user.id));
    return members.map((m) => {
      const mine = tasks.filter((t) => t.assignee === m.name);
      return {
        ...m,
        openTasks: mine.filter((t) => t.status !== "done").length,
        doneTasks: mine.filter((t) => t.status === "done").length,
        minutes: mine.reduce((sum, t) => sum + t.actualMins, 0),
        projects: projects.filter((p) => (p.members ?? []).includes(m.name)).map((p) => p.name),
      };
    });
  }),

  invite: authed.input(memberInput).handler(async ({ input, context }) => {
    const [row] = await db
      .insert(s.teamMembers)
      .values({
        id: id("tm"),
        userId: context.user.id,
        accent: ACCENTS[Math.floor(Math.random() * ACCENTS.length)],
        joinedAt: new Date().toISOString().slice(0, 10),
        status: "offline",
        ...input,
      })
      .returning();
    await logActivity({
      userId: context.user.id,
      kind: "team",
      text: `${input.name} was invited to the workspace.`,
    });
    return row;
  }),

  update: authed.input(memberInput.partial().extend({ id: z.string() })).handler(async ({ input, context }) => {
    const { id: mid, ...patch } = input;
    await db
      .update(s.teamMembers)
      .set(patch)
      .where(and(eq(s.teamMembers.id, mid), eq(s.teamMembers.userId, context.user.id)));
    const [row] = await db.select().from(s.teamMembers).where(eq(s.teamMembers.id, mid)).limit(1);
    return row;
  }),

  remove: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await db
      .delete(s.teamMembers)
      .where(and(eq(s.teamMembers.id, input.id), eq(s.teamMembers.userId, context.user.id)));
    return { ok: true };
  }),
};
