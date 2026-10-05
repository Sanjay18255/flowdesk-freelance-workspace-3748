import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as s from "../database/schema";
import { id } from "../lib/ids";
import { logActivity } from "../lib/activity";

export const STATUSES = ["todo", "in_progress", "review", "done"] as const;

const taskInput = z.object({
  title: z.string().min(1),
  projectId: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().optional(),
  assignee: z.string().optional(),
  labels: z.array(z.string()).optional(),
  checklist: z.array(z.object({ id: z.string(), text: z.string(), done: z.boolean() })).optional(),
  estimateMins: z.number().optional(),
  billable: z.boolean().optional(),
});

async function recalcProject(userId: string, projectId: string) {
  if (!projectId) return;
  const rows = await db
    .select()
    .from(s.tasks)
    .where(and(eq(s.tasks.userId, userId), eq(s.tasks.projectId, projectId)));
  if (!rows.length) return;
  const done = rows.filter((t) => t.status === "done").length;
  const progress = Math.round((done / rows.length) * 100);
  await db
    .update(s.projects)
    .set({ progress, updatedAt: new Date() })
    .where(and(eq(s.projects.id, projectId), eq(s.projects.userId, userId)));
}

export const tasks = {
  list: authed.handler(async ({ context }) => {
    const rows = await db.select().from(s.tasks).where(eq(s.tasks.userId, context.user.id));
    return rows.sort((a, b) => a.position - b.position);
  }),

  get: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [task] = await db
      .select()
      .from(s.tasks)
      .where(and(eq(s.tasks.id, input.id), eq(s.tasks.userId, context.user.id)))
      .limit(1);
    if (!task) return null;
    const comments = await db.select().from(s.taskComments).where(eq(s.taskComments.taskId, task.id));
    const entries = await db.select().from(s.timeEntries).where(eq(s.timeEntries.taskId, task.id));
    return {
      task,
      comments: comments.sort((a, b) => +a.createdAt - +b.createdAt),
      timeEntries: entries.sort((a, b) => (a.date < b.date ? 1 : -1)),
    };
  }),

  create: authed.input(taskInput).handler(async ({ input, context }) => {
    const [row] = await db
      .insert(s.tasks)
      .values({
        id: id("tsk"),
        userId: context.user.id,
        position: Date.now() % 1000000,
        ...input,
      })
      .returning();
    await recalcProject(context.user.id, input.projectId ?? "");
    await logActivity({
      userId: context.user.id,
      kind: "task",
      text: `New task created: ${input.title}.`,
      projectId: input.projectId,
    });
    return row;
  }),

  update: authed.input(taskInput.partial().extend({ id: z.string() })).handler(async ({ input, context }) => {
    const { id: taskId, ...patch } = input;
    const set: Record<string, unknown> = { ...patch };
    if (patch.status) set.completedAt = patch.status === "done" ? new Date() : null;
    await db
      .update(s.tasks)
      .set(set)
      .where(and(eq(s.tasks.id, taskId), eq(s.tasks.userId, context.user.id)));
    const [row] = await db.select().from(s.tasks).where(eq(s.tasks.id, taskId)).limit(1);
    if (row) await recalcProject(context.user.id, row.projectId ?? "");
    return row;
  }),

  /** Kanban drag: change status and ordering in one call. */
  move: authed
    .input(z.object({ id: z.string(), status: z.enum(STATUSES), position: z.number() }))
    .handler(async ({ input, context }) => {
      await db
        .update(s.tasks)
        .set({
          status: input.status,
          position: input.position,
          completedAt: input.status === "done" ? new Date() : null,
        })
        .where(and(eq(s.tasks.id, input.id), eq(s.tasks.userId, context.user.id)));
      const [row] = await db.select().from(s.tasks).where(eq(s.tasks.id, input.id)).limit(1);
      if (row) {
        await recalcProject(context.user.id, row.projectId ?? "");
        if (input.status === "done") {
          await logActivity({
            userId: context.user.id,
            kind: "task",
            text: `Task completed: ${row.title}.`,
            projectId: row.projectId ?? "",
          });
        }
      }
      return row;
    }),

  toggleChecklist: authed
    .input(z.object({ id: z.string(), itemId: z.string() }))
    .handler(async ({ input, context }) => {
      const [task] = await db
        .select()
        .from(s.tasks)
        .where(and(eq(s.tasks.id, input.id), eq(s.tasks.userId, context.user.id)))
        .limit(1);
      if (!task) return null;
      const checklist = (task.checklist ?? []).map((c) =>
        c.id === input.itemId ? { ...c, done: !c.done } : c,
      );
      await db.update(s.tasks).set({ checklist }).where(eq(s.tasks.id, task.id));
      return { ...task, checklist };
    }),

  addChecklistItem: authed
    .input(z.object({ id: z.string(), text: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const [task] = await db
        .select()
        .from(s.tasks)
        .where(and(eq(s.tasks.id, input.id), eq(s.tasks.userId, context.user.id)))
        .limit(1);
      if (!task) return null;
      const checklist = [...(task.checklist ?? []), { id: id("chk"), text: input.text, done: false }];
      await db.update(s.tasks).set({ checklist }).where(eq(s.tasks.id, task.id));
      return { ...task, checklist };
    }),

  removeChecklistItem: authed
    .input(z.object({ id: z.string(), itemId: z.string() }))
    .handler(async ({ input, context }) => {
      const [task] = await db
        .select()
        .from(s.tasks)
        .where(and(eq(s.tasks.id, input.id), eq(s.tasks.userId, context.user.id)))
        .limit(1);
      if (!task) return null;
      const checklist = (task.checklist ?? []).filter((c) => c.id !== input.itemId);
      await db.update(s.tasks).set({ checklist }).where(eq(s.tasks.id, task.id));
      return { ...task, checklist };
    }),

  addComment: authed
    .input(z.object({ taskId: z.string(), body: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const [row] = await db
        .insert(s.taskComments)
        .values({
          id: id("tcm"),
          userId: context.user.id,
          taskId: input.taskId,
          author: context.user.name || "You",
          body: input.body,
        })
        .returning();
      return row;
    }),

  removeComment: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await db
      .delete(s.taskComments)
      .where(and(eq(s.taskComments.id, input.id), eq(s.taskComments.userId, context.user.id)));
    return { ok: true };
  }),

  /** Log time against a task — also bumps the task's actual minutes. */
  logTime: authed
    .input(
      z.object({
        taskId: z.string(),
        minutes: z.number().min(1),
        note: z.string().optional(),
        billable: z.boolean().optional(),
        date: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [task] = await db
        .select()
        .from(s.tasks)
        .where(and(eq(s.tasks.id, input.taskId), eq(s.tasks.userId, context.user.id)))
        .limit(1);
      if (!task) return null;
      await db.insert(s.timeEntries).values({
        id: id("tim"),
        userId: context.user.id,
        taskId: task.id,
        projectId: task.projectId ?? "",
        minutes: input.minutes,
        billable: input.billable ?? task.billable,
        date: input.date ?? new Date().toISOString().slice(0, 10),
        note: input.note ?? "",
      });
      const actualMins = task.actualMins + input.minutes;
      await db.update(s.tasks).set({ actualMins }).where(eq(s.tasks.id, task.id));
      return { ...task, actualMins };
    }),

  timeEntries: authed.handler(async ({ context }) => {
    const rows = await db.select().from(s.timeEntries).where(eq(s.timeEntries.userId, context.user.id));
    return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  }),

  remove: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [task] = await db
      .select()
      .from(s.tasks)
      .where(and(eq(s.tasks.id, input.id), eq(s.tasks.userId, context.user.id)))
      .limit(1);
    await db.delete(s.tasks).where(and(eq(s.tasks.id, input.id), eq(s.tasks.userId, context.user.id)));
    await db.delete(s.taskComments).where(eq(s.taskComments.taskId, input.id));
    await db.delete(s.timeEntries).where(eq(s.timeEntries.taskId, input.id));
    if (task) await recalcProject(context.user.id, task.projectId ?? "");
    return { ok: true };
  }),

  bulkStatus: authed
    .input(z.object({ ids: z.array(z.string()).min(1), status: z.enum(STATUSES) }))
    .handler(async ({ input, context }) => {
      await db
        .update(s.tasks)
        .set({ status: input.status, completedAt: input.status === "done" ? new Date() : null })
        .where(and(inArray(s.tasks.id, input.ids), eq(s.tasks.userId, context.user.id)));
      return { ok: true, count: input.ids.length };
    }),
};
