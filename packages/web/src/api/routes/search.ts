import { z } from "zod";
import { eq } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { db } from "../database";
import * as s from "../database/schema";

export type SearchHit = {
  id: string;
  kind: "client" | "project" | "task" | "invoice" | "meeting" | "file" | "lead";
  title: string;
  subtitle: string;
  href: string;
};

export const search = {
  query: authed.input(z.object({ q: z.string() })).handler(async ({ input, context }) => {
    const q = input.q.trim().toLowerCase();
    if (q.length < 2) return [] as SearchHit[];
    const uid = context.user.id;

    const [clients, projects, tasks, invoices, meetings, files, leads] = await Promise.all([
      db.select().from(s.clients).where(eq(s.clients.userId, uid)),
      db.select().from(s.projects).where(eq(s.projects.userId, uid)),
      db.select().from(s.tasks).where(eq(s.tasks.userId, uid)),
      db.select().from(s.invoices).where(eq(s.invoices.userId, uid)),
      db.select().from(s.meetings).where(eq(s.meetings.userId, uid)),
      db.select().from(s.files).where(eq(s.files.userId, uid)),
      db.select().from(s.leads).where(eq(s.leads.userId, uid)),
    ]);

    const hits: SearchHit[] = [];
    const match = (...vals: (string | null | undefined)[]) =>
      vals.some((v) => (v ?? "").toLowerCase().includes(q));

    for (const c of clients) {
      if (match(c.name, c.contactPerson, c.email, c.industry)) {
        hits.push({
          id: c.id,
          kind: "client",
          title: c.name,
          subtitle: c.industry ?? "Client",
          href: `/app/clients/${c.id}`,
        });
      }
    }
    for (const p of projects) {
      if (match(p.name, p.description, p.type)) {
        hits.push({
          id: p.id,
          kind: "project",
          title: p.name,
          subtitle: p.type ?? "Project",
          href: `/app/projects/${p.id}`,
        });
      }
    }
    for (const t of tasks) {
      if (match(t.title, t.description, t.assignee)) {
        hits.push({
          id: t.id,
          kind: "task",
          title: t.title,
          subtitle: t.status.replace("_", " "),
          href: `/app/tasks?task=${t.id}`,
        });
      }
    }
    for (const i of invoices) {
      if (match(i.number, i.notes)) {
        hits.push({
          id: i.id,
          kind: "invoice",
          title: i.number,
          subtitle: `${i.status} · $${i.total.toLocaleString()}`,
          href: `/app/invoices/${i.id}`,
        });
      }
    }
    for (const m of meetings) {
      if (match(m.title, m.description, m.type)) {
        hits.push({
          id: m.id,
          kind: "meeting",
          title: m.title,
          subtitle: `${m.date} · ${m.time}`,
          href: `/app/meetings?meeting=${m.id}`,
        });
      }
    }
    for (const f of files) {
      if (match(f.name, f.folder)) {
        hits.push({
          id: f.id,
          kind: "file",
          title: f.name,
          subtitle: f.folder,
          href: `/app/files?file=${f.id}`,
        });
      }
    }
    for (const l of leads) {
      if (match(l.company, l.contact, l.notes)) {
        hits.push({
          id: l.id,
          kind: "lead",
          title: l.company,
          subtitle: `Pipeline · ${l.stage}`,
          href: `/app/pipeline?lead=${l.id}`,
        });
      }
    }

    return hits.slice(0, 24);
  }),

  activity: authed.handler(async ({ context }) => {
    const rows = await db.select().from(s.activities).where(eq(s.activities.userId, context.user.id));
    return rows.sort((a, b) => +b.createdAt - +a.createdAt).slice(0, 50);
  }),
};
