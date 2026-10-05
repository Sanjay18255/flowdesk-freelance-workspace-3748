import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as s from "../database/schema";
import { id } from "../lib/ids";
import { logActivity } from "../lib/activity";
import { s3, BUCKET } from "../lib/s3";

export const FOLDERS = ["Documents", "Designs", "Contracts", "Invoices", "Assets", "Deliverables"] as const;

export const files = {
  list: authed.handler(async ({ context }) => {
    const rows = await db.select().from(s.files).where(eq(s.files.userId, context.user.id));
    return rows.sort((a, b) => +b.createdAt - +a.createdAt);
  }),

  /** Register a file after the browser finished its presigned upload. */
  register: authed
    .input(
      z.object({
        name: z.string().min(1),
        key: z.string().min(1),
        size: z.number(),
        mime: z.string().optional(),
        folder: z.string().optional(),
        projectId: z.string().optional(),
        clientId: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const [row] = await db
        .insert(s.files)
        .values({
          id: id("fil"),
          userId: context.user.id,
          uploadedBy: context.user.name || "You",
          folder: input.folder ?? "Documents",
          versions: [
            { version: 1, key: input.key, size: input.size, uploadedAt: new Date().toISOString() },
          ],
          ...input,
        })
        .returning();
      await logActivity({
        userId: context.user.id,
        kind: "file",
        text: `File uploaded: ${input.name}.`,
        projectId: input.projectId,
        clientId: input.clientId,
      });
      return row;
    }),

  /** Upload a new version of an existing file. */
  addVersion: authed
    .input(z.object({ id: z.string(), key: z.string(), size: z.number() }))
    .handler(async ({ input, context }) => {
      const [current] = await db
        .select()
        .from(s.files)
        .where(and(eq(s.files.id, input.id), eq(s.files.userId, context.user.id)))
        .limit(1);
      if (!current) return null;
      const version = current.version + 1;
      const versions = [
        ...(current.versions ?? []),
        { version, key: input.key, size: input.size, uploadedAt: new Date().toISOString() },
      ];
      await db
        .update(s.files)
        .set({ version, versions, key: input.key, size: input.size })
        .where(eq(s.files.id, current.id));
      return { ...current, version, versions, key: input.key, size: input.size };
    }),

  update: authed
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        folder: z.string().optional(),
        projectId: z.string().optional(),
        clientId: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { id: fid, ...patch } = input;
      await db
        .update(s.files)
        .set(patch)
        .where(and(eq(s.files.id, fid), eq(s.files.userId, context.user.id)));
      const [row] = await db.select().from(s.files).where(eq(s.files.id, fid)).limit(1);
      return row;
    }),

  remove: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [current] = await db
      .select()
      .from(s.files)
      .where(and(eq(s.files.id, input.id), eq(s.files.userId, context.user.id)))
      .limit(1);
    if (!current) return { ok: true };
    await db.delete(s.files).where(eq(s.files.id, current.id));
    for (const v of current.versions ?? [{ key: current.key } as s.FileVersion]) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: v.key }));
      } catch {
        // storage object may already be gone — the record removal is what matters
      }
    }
    return { ok: true };
  }),
};
