import { z } from "zod";
import { eq } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as s from "../database/schema";
import { seedWorkspace } from "../lib/seed";

const prefsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  accent: z.string().optional(),
  sidebar: z.enum(["default", "compact"]).optional(),
  compact: z.boolean().optional(),
  dashboardLayout: z.array(z.string()).optional(),
  notify: z.record(z.string(), z.boolean()).optional(),
  business: z
    .object({
      name: z.string().optional(),
      logoText: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      address: z.string().optional(),
      taxNumber: z.string().optional(),
      currency: z.string().optional(),
      invoiceTerms: z.string().optional(),
    })
    .optional(),
  profile: z
    .object({
      jobTitle: z.string().optional(),
      bio: z.string().optional(),
      phone: z.string().optional(),
      timezone: z.string().optional(),
      website: z.string().optional(),
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      dribbble: z.string().optional(),
    })
    .optional(),
  security: z.object({ twoFactor: z.boolean().optional() }).optional(),
});

async function readSettings(userId: string) {
  const [row] = await db.select().from(s.userSettings).where(eq(s.userSettings.userId, userId)).limit(1);
  return row;
}

export const account = {
  /** Called right after sign-in/sign-up: seeds a demo workspace on first visit. */
  bootstrap: authed.handler(async ({ context }) => {
    await seedWorkspace(context.user.id, context.user.name || "You");
    const row = await readSettings(context.user.id);
    return { prefs: row?.prefs ?? {}, seeded: row?.seeded ?? false };
  }),

  settings: authed.handler(async ({ context }) => {
    const row = await readSettings(context.user.id);
    return { prefs: row?.prefs ?? {} };
  }),

  savePrefs: authed.input(prefsSchema).handler(async ({ input, context }) => {
    const row = await readSettings(context.user.id);
    const next = {
      ...(row?.prefs ?? {}),
      ...input,
      business: { ...(row?.prefs?.business ?? {}), ...(input.business ?? {}) },
      profile: { ...(row?.prefs?.profile ?? {}), ...(input.profile ?? {}) },
      notify: { ...(row?.prefs?.notify ?? {}), ...(input.notify ?? {}) },
      security: { ...(row?.prefs?.security ?? {}), ...(input.security ?? {}) },
    } as s.UserPrefs;
    if (row) {
      await db
        .update(s.userSettings)
        .set({ prefs: next, updatedAt: new Date() })
        .where(eq(s.userSettings.userId, context.user.id));
    } else {
      await db.insert(s.userSettings).values({ userId: context.user.id, prefs: next, seeded: true });
    }
    return { prefs: next };
  }),

  updateProfile: authed
    .input(
      z.object({
        name: z.string().min(1).optional(),
        businessName: z.string().optional(),
        jobTitle: z.string().optional(),
        image: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      await db.update(s.user).set(input).where(eq(s.user.id, context.user.id));
      const [row] = await db.select().from(s.user).where(eq(s.user.id, context.user.id)).limit(1);
      return row;
    }),

  sessions: authed.handler(async ({ context }) => {
    const rows = await db.select().from(s.session).where(eq(s.session.userId, context.user.id));
    return rows.map((r) => ({
      id: r.id,
      current: r.id === context.session.id,
      ipAddress: r.ipAddress ?? "—",
      userAgent: r.userAgent ?? "Unknown device",
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
    }));
  }),
};
