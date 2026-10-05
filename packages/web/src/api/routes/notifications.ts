import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as s from "../database/schema";

export const notifications = {
  list: authed.handler(async ({ context }) => {
    const rows = await db
      .select()
      .from(s.notifications)
      .where(eq(s.notifications.userId, context.user.id));
    return rows.sort((a, b) => +b.createdAt - +a.createdAt).slice(0, 60);
  }),

  markRead: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await db
      .update(s.notifications)
      .set({ read: true })
      .where(and(eq(s.notifications.id, input.id), eq(s.notifications.userId, context.user.id)));
    return { ok: true };
  }),

  markAllRead: authed.handler(async ({ context }) => {
    await db
      .update(s.notifications)
      .set({ read: true })
      .where(eq(s.notifications.userId, context.user.id));
    return { ok: true };
  }),

  remove: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await db
      .delete(s.notifications)
      .where(and(eq(s.notifications.id, input.id), eq(s.notifications.userId, context.user.id)));
    return { ok: true };
  }),

  clearAll: authed.handler(async ({ context }) => {
    await db.delete(s.notifications).where(eq(s.notifications.userId, context.user.id));
    return { ok: true };
  }),
};
