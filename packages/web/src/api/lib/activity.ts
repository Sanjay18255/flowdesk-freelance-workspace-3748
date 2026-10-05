import { db } from "../database";
import * as s from "../database/schema";
import { id } from "./ids";

export async function logActivity(opts: {
  userId: string;
  kind: string;
  text: string;
  actor?: string;
  projectId?: string;
  clientId?: string;
}) {
  await db.insert(s.activities).values({
    id: id("act"),
    userId: opts.userId,
    kind: opts.kind,
    text: opts.text,
    actor: opts.actor ?? "You",
    projectId: opts.projectId ?? "",
    clientId: opts.clientId ?? "",
  });
}

export async function notify(opts: { userId: string; kind: string; title: string; body?: string }) {
  await db.insert(s.notifications).values({
    id: id("ntf"),
    userId: opts.userId,
    kind: opts.kind,
    title: opts.title,
    body: opts.body ?? "",
  });
}
