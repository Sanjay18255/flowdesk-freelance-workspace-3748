import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as s from "../database/schema";
import { id } from "../lib/ids";
import { logActivity, notify } from "../lib/activity";

const DEFAULT_MILESTONES = [
  "Project kickoff",
  "Discovery & research",
  "Wireframes approved",
  "Design completed",
  "Development started",
  "Testing & QA",
  "Client review",
  "Final delivery",
];

const projectInput = z.object({
  name: z.string().min(1),
  clientId: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  budget: z.number().optional(),
  spent: z.number().optional(),
  currency: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  status: z.enum(["planning", "in_progress", "review", "on_hold", "completed", "cancelled"]).optional(),
  progress: z.number().optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
  members: z.array(z.string()).optional(),
});

export const projects = {
  list: authed.handler(async ({ context }) => {
    const uid = context.user.id;
    const [rows, clientRows, taskRows] = await Promise.all([
      db.select().from(s.projects).where(eq(s.projects.userId, uid)),
      db.select().from(s.clients).where(eq(s.clients.userId, uid)),
      db.select().from(s.tasks).where(eq(s.tasks.userId, uid)),
    ]);
    return rows
      .map((p) => {
        const tasks = taskRows.filter((t) => t.projectId === p.id);
        const done = tasks.filter((t) => t.status === "done").length;
        return {
          ...p,
          clientName: clientRows.find((c) => c.id === p.clientId)?.name ?? "Internal",
          clientAccent: clientRows.find((c) => c.id === p.clientId)?.accent ?? "indigo",
          taskCount: tasks.length,
          tasksDone: done,
          computedProgress: tasks.length ? Math.round((done / tasks.length) * 100) : p.progress,
        };
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }),

  get: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const uid = context.user.id;
    const [project] = await db
      .select()
      .from(s.projects)
      .where(and(eq(s.projects.id, input.id), eq(s.projects.userId, uid)))
      .limit(1);
    if (!project) throw new ORPCError("NOT_FOUND", { message: "Project not found" });

    const [client] = project.clientId
      ? await db.select().from(s.clients).where(eq(s.clients.id, project.clientId)).limit(1)
      : [undefined];

    const [milestoneRows, taskRows, fileRows, invoiceRows, meetingRows, activityRows, commentRows, noteRows, timeRows] =
      await Promise.all([
        db.select().from(s.milestones).where(and(eq(s.milestones.userId, uid), eq(s.milestones.projectId, input.id))),
        db.select().from(s.tasks).where(and(eq(s.tasks.userId, uid), eq(s.tasks.projectId, input.id))),
        db.select().from(s.files).where(and(eq(s.files.userId, uid), eq(s.files.projectId, input.id))),
        db.select().from(s.invoices).where(and(eq(s.invoices.userId, uid), eq(s.invoices.projectId, input.id))),
        db.select().from(s.meetings).where(and(eq(s.meetings.userId, uid), eq(s.meetings.projectId, input.id))),
        db
          .select()
          .from(s.activities)
          .where(and(eq(s.activities.userId, uid), eq(s.activities.projectId, input.id)))
          .orderBy(desc(s.activities.createdAt))
          .limit(25),
        db
          .select()
          .from(s.projectComments)
          .where(and(eq(s.projectComments.userId, uid), eq(s.projectComments.projectId, input.id)))
          .orderBy(desc(s.projectComments.createdAt)),
        db
          .select()
          .from(s.projectNotes)
          .where(and(eq(s.projectNotes.userId, uid), eq(s.projectNotes.projectId, input.id)))
          .limit(1),
        db.select().from(s.timeEntries).where(and(eq(s.timeEntries.userId, uid), eq(s.timeEntries.projectId, input.id))),
      ]);

    const done = taskRows.filter((t) => t.status === "done").length;
    return {
      project,
      client,
      milestones: milestoneRows.sort((a, b) => a.position - b.position),
      tasks: taskRows.sort((a, b) => a.position - b.position),
      files: fileRows,
      invoices: invoiceRows,
      meetings: meetingRows,
      activities: activityRows,
      comments: commentRows,
      note: noteRows[0]?.body ?? "",
      stats: {
        taskCount: taskRows.length,
        tasksDone: done,
        completion: taskRows.length ? Math.round((done / taskRows.length) * 100) : project.progress,
        remainingBudget: project.budget - project.spent,
        hours: Math.round(timeRows.reduce((sum, t) => sum + t.minutes, 0) / 60),
        billableHours: Math.round(
          timeRows.filter((t) => t.billable).reduce((sum, t) => sum + t.minutes, 0) / 60,
        ),
      },
    };
  }),

  create: authed.input(projectInput).handler(async ({ input, context }) => {
    const projectId = id("prj");
    const [row] = await db
      .insert(s.projects)
      .values({
        id: projectId,
        userId: context.user.id,
        startDate: input.startDate || new Date().toISOString().slice(0, 10),
        ...input,
      })
      .returning();
    await db.insert(s.milestones).values(
      DEFAULT_MILESTONES.map((m, i) => ({
        id: id("ms"),
        userId: context.user.id,
        projectId,
        title: m,
        done: false,
        date: "",
        position: i,
      })),
    );
    await logActivity({
      userId: context.user.id,
      kind: "project",
      text: `Project created: ${input.name}.`,
      projectId,
      clientId: input.clientId,
    });
    return row;
  }),

  update: authed.input(projectInput.partial().extend({ id: z.string() })).handler(async ({ input, context }) => {
    const { id: projectId, ...patch } = input;
    await db
      .update(s.projects)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(s.projects.id, projectId), eq(s.projects.userId, context.user.id)));
    const [row] = await db.select().from(s.projects).where(eq(s.projects.id, projectId)).limit(1);
    return row;
  }),

  setArchived: authed
    .input(z.object({ id: z.string(), archived: z.boolean() }))
    .handler(async ({ input, context }) => {
      await db
        .update(s.projects)
        .set({ archived: input.archived, updatedAt: new Date() })
        .where(and(eq(s.projects.id, input.id), eq(s.projects.userId, context.user.id)));
      return { ok: true };
    }),

  remove: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const uid = context.user.id;
    await db.delete(s.projects).where(and(eq(s.projects.id, input.id), eq(s.projects.userId, uid)));
    await db.delete(s.tasks).where(and(eq(s.tasks.projectId, input.id), eq(s.tasks.userId, uid)));
    await db.delete(s.milestones).where(and(eq(s.milestones.projectId, input.id), eq(s.milestones.userId, uid)));
    return { ok: true };
  }),

  toggleMilestone: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [m] = await db
      .select()
      .from(s.milestones)
      .where(and(eq(s.milestones.id, input.id), eq(s.milestones.userId, context.user.id)))
      .limit(1);
    if (!m) return null;
    await db.update(s.milestones).set({ done: !m.done }).where(eq(s.milestones.id, input.id));
    if (!m.done) {
      await logActivity({
        userId: context.user.id,
        kind: "milestone",
        text: `Milestone completed: ${m.title}.`,
        projectId: m.projectId,
      });
    }
    return { ...m, done: !m.done };
  }),

  addMilestone: authed
    .input(z.object({ projectId: z.string(), title: z.string(), date: z.string().optional() }))
    .handler(async ({ input, context }) => {
      const [row] = await db
        .insert(s.milestones)
        .values({
          id: id("ms"),
          userId: context.user.id,
          projectId: input.projectId,
          title: input.title,
          date: input.date ?? "",
          position: Date.now() % 100000,
        })
        .returning();
      return row;
    }),

  saveNote: authed
    .input(z.object({ projectId: z.string(), body: z.string() }))
    .handler(async ({ input, context }) => {
      const [existing] = await db
        .select()
        .from(s.projectNotes)
        .where(and(eq(s.projectNotes.userId, context.user.id), eq(s.projectNotes.projectId, input.projectId)))
        .limit(1);
      if (existing) {
        await db
          .update(s.projectNotes)
          .set({ body: input.body, updatedAt: new Date() })
          .where(eq(s.projectNotes.id, existing.id));
        return { ok: true };
      }
      await db
        .insert(s.projectNotes)
        .values({ id: id("pn"), userId: context.user.id, projectId: input.projectId, body: input.body });
      return { ok: true };
    }),

  addComment: authed
    .input(z.object({ projectId: z.string(), body: z.string(), parentId: z.string().optional() }))
    .handler(async ({ input, context }) => {
      const [row] = await db
        .insert(s.projectComments)
        .values({
          id: id("pc"),
          userId: context.user.id,
          projectId: input.projectId,
          parentId: input.parentId ?? "",
          author: context.user.name,
          body: input.body,
        })
        .returning();
      await logActivity({
        userId: context.user.id,
        kind: "comment",
        text: "Comment added on project.",
        projectId: input.projectId,
      });
      return row;
    }),

  updateComment: authed
    .input(z.object({ id: z.string(), body: z.string() }))
    .handler(async ({ input, context }) => {
      await db
        .update(s.projectComments)
        .set({ body: input.body })
        .where(and(eq(s.projectComments.id, input.id), eq(s.projectComments.userId, context.user.id)));
      return { ok: true };
    }),

  removeComment: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await db
      .delete(s.projectComments)
      .where(and(eq(s.projectComments.id, input.id), eq(s.projectComments.userId, context.user.id)));
    return { ok: true };
  }),

  options: authed.handler(async ({ context }) => {
    return db
      .select({ id: s.projects.id, name: s.projects.name, clientId: s.projects.clientId, color: s.projects.color })
      .from(s.projects)
      .where(eq(s.projects.userId, context.user.id));
  }),

  notifyDeadline: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [p] = await db.select().from(s.projects).where(eq(s.projects.id, input.id)).limit(1);
    if (p) await notify({ userId: context.user.id, kind: "deadline", title: "Deadline reminder set", body: p.name });
    return { ok: true };
  }),
};
