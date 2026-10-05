import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

export * from "./auth-schema";

const now = () => new Date();

/** Clients — the core CRM record. */
export const clients = sqliteTable(
  "clients",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    contactPerson: text("contact_person").default(""),
    email: text("email").default(""),
    phone: text("phone").default(""),
    industry: text("industry").default("Technology"),
    website: text("website").default(""),
    address: text("address").default(""),
    timezone: text("timezone").default("UTC"),
    prefContact: text("pref_contact").default("Email"),
    status: text("status").notNull().default("active"), // active | inactive | vip
    accent: text("accent").default("indigo"),
    clientSince: text("client_since").default(""),
    lastContact: text("last_contact").default(""),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  },
  (t) => [index("clients_user_idx").on(t.userId)],
);

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  clientId: text("client_id").notNull(),
  name: text("name").notNull(),
  position: text("position").default(""),
  email: text("email").default(""),
  phone: text("phone").default(""),
  birthday: text("birthday").default(""),
  linkedin: text("linkedin").default(""),
  notes: text("notes").default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

export const clientNotes = sqliteTable("client_notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  clientId: text("client_id").notNull(),
  title: text("title").default("Untitled note"),
  body: text("body").default(""),
  author: text("author").default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

export const communications = sqliteTable("communications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  clientId: text("client_id").notNull(),
  type: text("type").notNull().default("Email"), // Phone Call | Email | Meeting | WhatsApp | Zoom | Feedback
  summary: text("summary").default(""),
  date: text("date").notNull(),
  followUpDate: text("follow_up_date").default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

/** CRM pipeline leads. */
export const leads = sqliteTable(
  "leads",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    company: text("company").notNull(),
    contact: text("contact").default(""),
    email: text("email").default(""),
    phone: text("phone").default(""),
    value: real("value").notNull().default(0),
    source: text("source").default("Referral"),
    priority: text("priority").notNull().default("medium"),
    stage: text("stage").notNull().default("lead"),
    expectedClose: text("expected_close").default(""),
    owner: text("owner").default(""),
    notes: text("notes").default(""),
    lastInteraction: text("last_interaction").default(""),
    position: real("position").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  },
  (t) => [index("leads_user_idx").on(t.userId)],
);

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    clientId: text("client_id").default(""),
    name: text("name").notNull(),
    type: text("type").default("Web Design"),
    description: text("description").default(""),
    budget: real("budget").notNull().default(0),
    spent: real("spent").notNull().default(0),
    currency: text("currency").default("USD"),
    startDate: text("start_date").default(""),
    deadline: text("deadline").default(""),
    priority: text("priority").notNull().default("medium"),
    status: text("status").notNull().default("in_progress"),
    progress: integer("progress").notNull().default(0),
    color: text("color").default("indigo"),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    members: text("members", { mode: "json" }).$type<string[]>().default([]),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  },
  (t) => [index("projects_user_idx").on(t.userId)],
);

export const milestones = sqliteTable("milestones", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  projectId: text("project_id").notNull(),
  title: text("title").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  date: text("date").default(""),
  position: real("position").notNull().default(0),
});

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    projectId: text("project_id").default(""),
    title: text("title").notNull(),
    description: text("description").default(""),
    status: text("status").notNull().default("todo"), // todo | in_progress | review | done
    priority: text("priority").notNull().default("medium"),
    dueDate: text("due_date").default(""),
    assignee: text("assignee").default(""),
    labels: text("labels", { mode: "json" }).$type<string[]>().default([]),
    checklist: text("checklist", { mode: "json" })
      .$type<{ id: string; text: string; done: boolean }[]>()
      .default([]),
    estimateMins: integer("estimate_mins").notNull().default(0),
    actualMins: integer("actual_mins").notNull().default(0),
    billable: integer("billable", { mode: "boolean" }).notNull().default(true),
    position: real("position").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("tasks_user_idx").on(t.userId)],
);

export const taskComments = sqliteTable("task_comments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  taskId: text("task_id").notNull(),
  author: text("author").default(""),
  body: text("body").default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

export const timeEntries = sqliteTable("time_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  taskId: text("task_id").default(""),
  projectId: text("project_id").default(""),
  minutes: integer("minutes").notNull().default(0),
  billable: integer("billable", { mode: "boolean" }).notNull().default(true),
  date: text("date").notNull(),
  note: text("note").default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
};

export const invoices = sqliteTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    clientId: text("client_id").default(""),
    projectId: text("project_id").default(""),
    number: text("number").notNull(),
    status: text("status").notNull().default("draft"), // draft|sent|viewed|paid|overdue|cancelled
    issueDate: text("issue_date").notNull(),
    dueDate: text("due_date").notNull(),
    items: text("items", { mode: "json" }).$type<InvoiceItem[]>().default([]),
    taxRate: real("tax_rate").notNull().default(0),
    discount: real("discount").notNull().default(0),
    currency: text("currency").default("USD"),
    terms: text("terms").default("Net 14"),
    notes: text("notes").default(""),
    total: real("total").notNull().default(0),
    paidAt: text("paid_at").default(""),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  },
  (t) => [index("invoices_user_idx").on(t.userId)],
);

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  invoiceId: text("invoice_id").notNull(),
  txnId: text("txn_id").notNull(),
  method: text("method").default("Bank Transfer"),
  date: text("date").notNull(),
  amount: real("amount").notNull().default(0),
  status: text("status").default("completed"),
});

export type MeetingNotes = {
  agenda: string;
  discussion: string;
  actionItems: string;
  decisions: string;
  followUp: string;
};

export const meetings = sqliteTable(
  "meetings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    clientId: text("client_id").default(""),
    projectId: text("project_id").default(""),
    title: text("title").notNull(),
    date: text("date").notNull(),
    time: text("time").notNull().default("10:00"),
    duration: integer("duration").notNull().default(30),
    type: text("type").default("Zoom"),
    location: text("location").default(""),
    description: text("description").default(""),
    participants: text("participants", { mode: "json" }).$type<string[]>().default([]),
    status: text("status").notNull().default("upcoming"),
    reminder: text("reminder").default("1 hour before"),
    notes: text("notes", { mode: "json" }).$type<MeetingNotes>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  },
  (t) => [index("meetings_user_idx").on(t.userId)],
);

export type FileVersion = {
  version: number;
  key: string;
  size: number;
  uploadedAt: string;
};

export const files = sqliteTable(
  "files",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    projectId: text("project_id").default(""),
    clientId: text("client_id").default(""),
    folder: text("folder").notNull().default("Documents"),
    name: text("name").notNull(),
    key: text("key").notNull(),
    size: integer("size").notNull().default(0),
    mime: text("mime").default("application/octet-stream"),
    version: integer("version").notNull().default(1),
    uploadedBy: text("uploaded_by").default(""),
    versions: text("versions", { mode: "json" }).$type<FileVersion[]>().default([]),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  },
  (t) => [index("files_user_idx").on(t.userId)],
);

export const activities = sqliteTable(
  "activities",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull().default("generic"),
    text: text("text").notNull(),
    actor: text("actor").default(""),
    projectId: text("project_id").default(""),
    clientId: text("client_id").default(""),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  },
  (t) => [index("activities_user_idx").on(t.userId)],
);

export const projectComments = sqliteTable("project_comments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  projectId: text("project_id").notNull(),
  parentId: text("parent_id").default(""),
  author: text("author").default(""),
  body: text("body").default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

export const projectNotes = sqliteTable("project_notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  projectId: text("project_id").notNull(),
  body: text("body").default(""),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull().default("generic"),
    title: text("title").notNull(),
    body: text("body").default(""),
    read: integer("read", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  },
  (t) => [index("notifications_user_idx").on(t.userId)],
);

export const teamMembers = sqliteTable("team_members", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("Member"),
  status: text("status").notNull().default("offline"),
  accent: text("accent").default("indigo"),
  joinedAt: text("joined_at").default(""),
});

export type UserPrefs = {
  theme?: "light" | "dark" | "system";
  accent?: string;
  sidebar?: "default" | "compact";
  compact?: boolean;
  dashboardLayout?: string[];
  notify?: Record<string, boolean>;
  business?: {
    name?: string;
    logoText?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    taxNumber?: string;
    currency?: string;
    invoiceTerms?: string;
  };
  profile?: {
    jobTitle?: string;
    bio?: string;
    phone?: string;
    timezone?: string;
    website?: string;
    twitter?: string;
    linkedin?: string;
    dribbble?: string;
  };
  security?: { twoFactor?: boolean };
};

export const userSettings = sqliteTable("user_settings", {
  userId: text("user_id").primaryKey(),
  prefs: text("prefs", { mode: "json" }).$type<UserPrefs>().default({}),
  seeded: integer("seeded", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});
