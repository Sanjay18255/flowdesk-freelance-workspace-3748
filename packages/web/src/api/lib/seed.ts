import { eq } from "drizzle-orm";
import { db } from "../database";
import * as s from "../database/schema";
import { dayOffset, hoursAgo, id } from "./ids";

const ACCENTS = ["indigo", "violet", "blue", "emerald", "amber", "rose", "cyan", "orange"];

type SeedClient = {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry: string;
  website: string;
  address: string;
  timezone: string;
  status: string;
  since: string;
};

const CLIENTS: SeedClient[] = [
  {
    name: "North Studio",
    contactPerson: "Elena Rowe",
    email: "elena@northstudio.co",
    phone: "+1 (415) 220-8841",
    industry: "Technology",
    website: "northstudio.co",
    address: "812 Folsom St, San Francisco, CA",
    timezone: "America/Los_Angeles",
    status: "vip",
    since: "2023-04-12",
  },
  {
    name: "Pixel Labs",
    contactPerson: "Marcus Feld",
    email: "marcus@pixellabs.io",
    phone: "+1 (212) 660-1190",
    industry: "E-commerce",
    website: "pixellabs.io",
    address: "44 Wooster St, New York, NY",
    timezone: "America/New_York",
    status: "active",
    since: "2023-09-01",
  },
  {
    name: "BluePeak Health",
    contactPerson: "Dr. Anita Raman",
    email: "anita@bluepeak.health",
    phone: "+44 20 7946 0813",
    industry: "Healthcare",
    website: "bluepeak.health",
    address: "18 Charlotte St, London",
    timezone: "Europe/London",
    status: "active",
    since: "2024-02-20",
  },
  {
    name: "Studio Nova",
    contactPerson: "Yuki Tanaka",
    email: "yuki@studionova.jp",
    phone: "+81 3 6555 1200",
    industry: "Marketing",
    website: "studionova.jp",
    address: "2-11 Shibuya, Tokyo",
    timezone: "Asia/Tokyo",
    status: "vip",
    since: "2022-11-05",
  },
  {
    name: "Orbit Creative",
    contactPerson: "Daniel Osei",
    email: "daniel@orbitcreative.com",
    phone: "+1 (312) 448-7702",
    industry: "Marketing",
    website: "orbitcreative.com",
    address: "310 W Superior, Chicago, IL",
    timezone: "America/Chicago",
    status: "active",
    since: "2024-06-14",
  },
  {
    name: "Lumen Realty",
    contactPerson: "Sofia Marchetti",
    email: "sofia@lumenrealty.com",
    phone: "+39 02 8901 4477",
    industry: "Real Estate",
    website: "lumenrealty.com",
    address: "Via Tortona 27, Milan",
    timezone: "Europe/Rome",
    status: "active",
    since: "2025-01-09",
  },
  {
    name: "Kite Learning",
    contactPerson: "Priya Nair",
    email: "priya@kitelearning.in",
    phone: "+91 98200 44112",
    industry: "Education",
    website: "kitelearning.in",
    address: "Lower Parel, Mumbai",
    timezone: "Asia/Kolkata",
    status: "active",
    since: "2025-03-22",
  },
  {
    name: "Halden & Co",
    contactPerson: "Tom Halden",
    email: "tom@haldenco.com",
    phone: "+1 (206) 771-3390",
    industry: "Other",
    website: "haldenco.com",
    address: "1201 2nd Ave, Seattle, WA",
    timezone: "America/Los_Angeles",
    status: "inactive",
    since: "2023-01-30",
  },
];

const PROJECT_BLUEPRINTS = [
  { name: "Website Redesign", type: "Web Design", budget: 18500, status: "in_progress", progress: 68, priority: "high" },
  { name: "Brand Identity System", type: "Branding", budget: 12000, status: "in_progress", progress: 42, priority: "medium" },
  { name: "Shopify Store Build", type: "Development", budget: 24000, status: "in_progress", progress: 81, priority: "high" },
  { name: "Patient Portal UX", type: "Product Design", budget: 31000, status: "review", progress: 90, priority: "urgent" },
  { name: "Launch Campaign Assets", type: "Marketing", budget: 9500, status: "in_progress", progress: 35, priority: "medium" },
  { name: "Quarterly Video Series", type: "Video", budget: 14200, status: "in_progress", progress: 55, priority: "medium" },
  { name: "Listing Platform MVP", type: "Development", budget: 42000, status: "planning", progress: 12, priority: "high" },
  { name: "Course Landing Pages", type: "Web Design", budget: 7800, status: "completed", progress: 100, priority: "low" },
  { name: "Annual Report Design", type: "Print", budget: 6400, status: "completed", progress: 100, priority: "low" },
];

const MILESTONES = [
  "Project kickoff",
  "Discovery & research",
  "Wireframes approved",
  "Design completed",
  "Development started",
  "Testing & QA",
  "Client review",
  "Final delivery",
];

const TASK_TITLES = [
  "Audit current information architecture",
  "Design homepage hero variations",
  "Build responsive navigation",
  "Write copy for pricing section",
  "Set up analytics events",
  "Prepare client presentation deck",
  "Refine typography scale",
  "Implement contact form validation",
  "Compress and optimise imagery",
  "Create component library in Figma",
  "Wire up CMS collections",
  "Accessibility pass on forms",
  "Storyboard launch video",
  "Colour grade footage",
  "Export final deliverables",
  "Draft SEO metadata",
  "QA on Safari and Firefox",
  "Prepare handoff documentation",
];

const LABELS = ["design", "frontend", "copy", "research", "urgent", "client", "qa"];
const ASSIGNEES = ["You", "Emma Cole", "Lucas Brandt", "John Mercer"];

const LEADS = [
  { company: "Arcline Studio", contact: "Ravi Menon", value: 14000, stage: "lead", source: "Referral", priority: "medium" },
  { company: "Vessel Coffee", contact: "Mia Duarte", value: 6500, stage: "lead", source: "Instagram", priority: "low" },
  { company: "Northwind Bank", contact: "Greg Palmer", value: 58000, stage: "qualified", source: "Cold Email", priority: "high" },
  { company: "Hexa Robotics", contact: "Sana Iqbal", value: 32000, stage: "discovery", source: "Website", priority: "high" },
  { company: "Marlow Interiors", contact: "Claire Bennet", value: 11500, stage: "discovery", source: "Referral", priority: "medium" },
  { company: "Fielder Sports", contact: "Owen Fielder", value: 21000, stage: "proposal", source: "LinkedIn", priority: "high" },
  { company: "Cedar Wellness", contact: "Nina Park", value: 9200, stage: "proposal", source: "Referral", priority: "medium" },
  { company: "Tandem Legal", contact: "Marcus Vaughn", value: 17800, stage: "negotiation", source: "Network Event", priority: "urgent" },
  { company: "Bright Harbor", contact: "Ellie Shaw", value: 26500, stage: "won", source: "Referral", priority: "high" },
  { company: "Quarry Fitness", contact: "Dev Sharma", value: 8000, stage: "lost", source: "Cold Email", priority: "low" },
];

const TEAM = [
  { name: "Emma Cole", email: "emma@studio.com", role: "Admin", status: "online" },
  { name: "Lucas Brandt", email: "lucas@studio.com", role: "Manager", status: "away" },
  { name: "John Mercer", email: "john@studio.com", role: "Member", status: "offline" },
  { name: "Aisha Bello", email: "aisha@studio.com", role: "Member", status: "online" },
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]!;
}

function monthKeyOffset(monthsBack: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsBack);
  return d;
}

/** Seeds a brand-new account with a realistic demo workspace. Idempotent per user. */
export async function seedWorkspace(userId: string, userName: string) {
  const existing = await db
    .select()
    .from(s.userSettings)
    .where(eq(s.userSettings.userId, userId))
    .limit(1);
  if (existing[0]?.seeded) return;

  const clientRows = CLIENTS.map((c, i) => ({
    id: id("cli"),
    userId,
    name: c.name,
    contactPerson: c.contactPerson,
    email: c.email,
    phone: c.phone,
    industry: c.industry,
    website: c.website,
    address: c.address,
    timezone: c.timezone,
    prefContact: i % 3 === 0 ? "Phone" : "Email",
    status: c.status,
    accent: pick(ACCENTS, i),
    clientSince: c.since,
    lastContact: dayOffset(-(i * 3 + 1)),
    createdAt: hoursAgo(24 * (60 - i * 5)),
  }));
  await db.insert(s.clients).values(clientRows);

  const contactRows = clientRows.flatMap((c, i) => [
    {
      id: id("ct"),
      userId,
      clientId: c.id,
      name: c.contactPerson,
      position: pick(["Founder", "Marketing Lead", "Head of Product", "Operations Director"], i),
      email: c.email,
      phone: c.phone,
      birthday: `199${i % 10}-0${(i % 9) + 1}-1${i % 9}`,
      linkedin: `linkedin.com/in/${c.contactPerson.toLowerCase().replace(/[^a-z]/g, "")}`,
      notes: "Primary decision maker. Prefers async updates.",
    },
    {
      id: id("ct"),
      userId,
      clientId: c.id,
      name: pick(["Jordan Wu", "Amelia Frost", "Noah Reyes", "Leila Haddad"], i),
      position: pick(["Project Manager", "Designer", "Finance", "Developer"], i + 1),
      email: `team${i}@${c.website || "example.com"}`,
      phone: "+1 (555) 010-99" + (10 + i),
      birthday: "",
      linkedin: "",
      notes: "Handles day-to-day feedback.",
    },
  ]);
  await db.insert(s.contacts).values(contactRows);

  await db.insert(s.clientNotes).values(
    clientRows.slice(0, 5).map((c, i) => ({
      id: id("cn"),
      userId,
      clientId: c.id,
      title: pick(["Kickoff summary", "Feedback round 2", "Scope discussion", "Renewal ideas", "Budget notes"], i),
      body:
        "<p><strong>Key points</strong></p><ul><li>Wants a cleaner visual system</li><li>Launch target is end of quarter</li><li>Budget approved for phase two</li></ul><p>Follow up with a written scope next week.</p>",
      author: userName,
      createdAt: hoursAgo(24 * (i + 2)),
      updatedAt: hoursAgo(12 * (i + 1)),
    })),
  );

  await db.insert(s.communications).values(
    clientRows.flatMap((c, i) =>
      [0, 1, 2].map((k) => ({
        id: id("cm"),
        userId,
        clientId: c.id,
        type: pick(["Phone Call", "Email", "Meeting", "WhatsApp Message", "Zoom Call", "Feedback Session"], i + k),
        summary: pick(
          [
            "Walked through the latest designs, feedback was positive.",
            "Sent revised proposal with updated timeline.",
            "Discussed scope for the second phase of work.",
            "Quick check-in on outstanding invoice.",
            "Reviewed analytics from the launch week.",
          ],
          i + k,
        ),
        date: dayOffset(-(k * 6 + i)),
        followUpDate: k === 0 ? dayOffset(5 + i) : "",
        createdAt: hoursAgo(24 * (k * 6 + i)),
      })),
    ),
  );

  await db.insert(s.leads).values(
    LEADS.map((l, i) => ({
      id: id("ld"),
      userId,
      company: l.company,
      contact: l.contact,
      email: `${l.contact.split(" ")[0]!.toLowerCase()}@${l.company.toLowerCase().replace(/[^a-z]/g, "")}.com`,
      phone: "+1 (555) 220-11" + (10 + i),
      value: l.value,
      source: l.source,
      priority: l.priority,
      stage: l.stage,
      expectedClose: dayOffset(10 + i * 4),
      owner: pick(ASSIGNEES, i),
      notes: "Warm intro. Needs a proposal with clear phases and pricing.",
      lastInteraction: dayOffset(-(i + 1)),
      position: i,
      createdAt: hoursAgo(24 * (i + 1)),
    })),
  );

  const projectRows = PROJECT_BLUEPRINTS.map((p, i) => {
    const client = pick(clientRows, i);
    return {
      id: id("prj"),
      userId,
      clientId: client.id,
      name: p.name,
      type: p.type,
      description: `${p.name} for ${client.name}. Full scope covering discovery, design, build and handoff with weekly review checkpoints.`,
      budget: p.budget,
      spent: Math.round(p.budget * (p.progress / 100) * 0.72),
      currency: "USD",
      startDate: dayOffset(-(40 + i * 8)),
      deadline: p.status === "completed" ? dayOffset(-(5 + i)) : dayOffset(8 + i * 6),
      priority: p.priority,
      status: p.status,
      progress: p.progress,
      color: pick(ACCENTS, i + 2),
      tags: [pick(LABELS, i), pick(LABELS, i + 3)],
      members: [pick(ASSIGNEES, i), pick(ASSIGNEES, i + 1)],
      archived: false,
      createdAt: hoursAgo(24 * (40 + i * 8)),
      updatedAt: hoursAgo(i * 5 + 2),
    };
  });
  await db.insert(s.projects).values(projectRows);

  await db.insert(s.milestones).values(
    projectRows.flatMap((p) =>
      MILESTONES.map((m, k) => ({
        id: id("ms"),
        userId,
        projectId: p.id,
        title: m,
        done: k / MILESTONES.length < p.progress / 100,
        date: dayOffset(-(30 - k * 6) + Math.round(p.progress / 10)),
        position: k,
      })),
    ),
  );

  const taskRows = projectRows.flatMap((p, pi) =>
    Array.from({ length: 6 }, (_, k) => {
      const seed = pi * 6 + k;
      const status =
        p.status === "completed" ? "done" : pick(["todo", "in_progress", "review", "done", "todo", "in_progress"], seed);
      const done = status === "done";
      return {
        id: id("tsk"),
        userId,
        projectId: p.id,
        title: pick(TASK_TITLES, seed),
        description:
          "Deliver this in line with the agreed style guide. Share a preview link in the project thread before marking complete.",
        status,
        priority: pick(["low", "medium", "high", "urgent", "medium", "high"], seed),
        dueDate: dayOffset(-4 + (seed % 18)),
        assignee: pick(ASSIGNEES, seed),
        labels: [pick(LABELS, seed), pick(LABELS, seed + 2)],
        checklist: ["Research", "Draft", "Review", "Ship"].map((c, ci) => ({
          id: id("ck"),
          text: c,
          done: done || ci < seed % 4,
        })),
        estimateMins: 60 * ((seed % 5) + 1),
        actualMins: done ? 60 * ((seed % 5) + 1) + (seed % 3) * 25 : (seed % 4) * 30,
        billable: seed % 5 !== 0,
        position: k,
        createdAt: hoursAgo(24 * (20 - (seed % 18))),
        completedAt: done ? hoursAgo(24 * (seed % 14)) : null,
      };
    }),
  );
  await db.insert(s.tasks).values(taskRows);

  await db.insert(s.taskComments).values(
    taskRows.slice(0, 12).map((t, i) => ({
      id: id("tc"),
      userId,
      taskId: t.id,
      author: pick(ASSIGNEES, i + 1),
      body: pick(
        [
          "Pushed the latest version — take a look when you get a chance.",
          "Client asked for a slightly larger logo here.",
          "Blocked on copy, following up today.",
          "Looks good to me, moving to review.",
        ],
        i,
      ),
      createdAt: hoursAgo(6 * (i + 1)),
    })),
  );

  await db.insert(s.timeEntries).values(
    taskRows
      .filter((t) => t.actualMins > 0)
      .slice(0, 60)
      .map((t, i) => ({
        id: id("te"),
        userId,
        taskId: t.id,
        projectId: t.projectId,
        minutes: t.actualMins,
        billable: t.billable,
        date: dayOffset(-(i % 21)),
        note: "Logged from task timer",
        createdAt: hoursAgo(24 * (i % 21)),
      })),
  );

  // Invoices: 12 months of history + current open ones.
  const invoiceRows: (typeof s.invoices.$inferInsert)[] = [];
  const paymentRows: (typeof s.payments.$inferInsert)[] = [];
  let counter = 1001;
  const invoiceYear = new Date().getFullYear();
  for (let m = 11; m >= 1; m--) {
    const perMonth = 2 + (m % 3);
    for (let k = 0; k < perMonth; k++) {
      const client = pick(clientRows, m + k);
      const project = pick(projectRows, m + k);
      const base = 1800 + ((m * 7 + k * 13) % 9) * 620;
      const items: s.InvoiceItem[] = [
        { id: id("it"), description: `${project.name} — design phase`, quantity: 1, rate: base },
        { id: id("it"), description: "Additional revisions", quantity: 2 + (k % 3), rate: 240 },
      ];
      const subtotal = items.reduce((sum, it) => sum + it.quantity * it.rate, 0);
      const total = Math.round(subtotal * 1.05);
      const issue = monthKeyOffset(m);
      issue.setDate(4 + k * 6);
      const due = new Date(issue);
      due.setDate(due.getDate() + 14);
      const invId = id("inv");
      invoiceRows.push({
        id: invId,
        userId,
        clientId: client.id,
        projectId: project.id,
        number: `INV-${invoiceYear}-${counter++}`,
        status: "paid",
        issueDate: issue.toISOString().slice(0, 10),
        dueDate: due.toISOString().slice(0, 10),
        items,
        taxRate: 5,
        discount: 0,
        currency: "USD",
        terms: "Net 14",
        notes: "Thank you for your business.",
        total,
        paidAt: due.toISOString().slice(0, 10),
        createdAt: issue,
      });
      paymentRows.push({
        id: id("pay"),
        userId,
        invoiceId: invId,
        txnId: `TXN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        method: pick(["Bank Transfer", "UPI", "Card", "PayPal", "Cash"], m + k),
        date: due.toISOString().slice(0, 10),
        amount: total,
        status: "completed",
      });
    }
  }
  const openStatuses = ["sent", "viewed", "overdue", "draft", "sent", "overdue", "paid"];
  openStatuses.forEach((status, i) => {
    const client = pick(clientRows, i + 2);
    const project = pick(projectRows, i + 1);
    const items: s.InvoiceItem[] = [
      { id: id("it"), description: `${project.name} — milestone ${1 + (i % 3)}`, quantity: 1, rate: 2400 + i * 480 },
      { id: id("it"), description: "Project management", quantity: 4, rate: 95 },
    ];
    const subtotal = items.reduce((sum, it) => sum + it.quantity * it.rate, 0);
    const total = Math.round(subtotal * 1.05);
    const invId = id("inv");
    invoiceRows.push({
      id: invId,
      userId,
      clientId: client.id,
      projectId: project.id,
      number: `INV-${invoiceYear}-${counter++}`,
      status,
      issueDate: dayOffset(status === "overdue" ? -32 : -(4 + i)),
      dueDate: dayOffset(status === "overdue" ? -18 : 10 - i),
      items,
      taxRate: 5,
      discount: i === 3 ? 5 : 0,
      currency: "USD",
      terms: "Net 14",
      notes: "Payment via bank transfer or UPI.",
      total,
      paidAt: status === "paid" ? dayOffset(-2) : "",
      createdAt: hoursAgo(24 * (4 + i)),
    });
    if (status === "paid") {
      paymentRows.push({
        id: id("pay"),
        userId,
        invoiceId: invId,
        txnId: `TXN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        method: "Card",
        date: dayOffset(-2),
        amount: total,
        status: "completed",
      });
    }
  });
  await db.insert(s.invoices).values(invoiceRows);
  await db.insert(s.payments).values(paymentRows);

  const meetingTitles = [
    "Client Discovery Call",
    "Website Review",
    "Proposal Meeting",
    "Invoice Follow-up",
    "Design Presentation",
    "Sprint Planning",
    "Quarterly Business Review",
    "Coffee Catch-up",
  ];
  await db.insert(s.meetings).values(
    meetingTitles.map((title, i) => {
      const today = i < 4;
      return {
        id: id("mtg"),
        userId,
        clientId: pick(clientRows, i).id,
        projectId: pick(projectRows, i).id,
        title,
        date: today ? dayOffset(0) : dayOffset(i - 2),
        time: ["10:00", "11:30", "14:00", "17:00", "09:30", "13:00", "15:30", "16:00"][i]!,
        duration: [45, 30, 60, 15, 45, 30, 60, 45][i]!,
        type: pick(["Zoom", "Google Meet", "Phone Call", "Office Meeting", "Coffee Meeting", "Client Visit"], i),
        location: pick(["zoom.us/j/882910", "meet.google.com/kdx-ppa", "Phone", "Studio HQ", "Blue Bottle, SoMa"], i),
        description: "Agenda shared in advance. Bring the latest deliverables and open questions.",
        participants: [userName, pick(ASSIGNEES, i + 1), pick(clientRows, i).contactPerson],
        status: i < 4 ? "upcoming" : i < 6 ? "completed" : "upcoming",
        reminder: pick(["24 hours before", "1 hour before", "15 minutes before"], i),
        notes: {
          agenda: "Review progress, confirm next milestone, agree on timeline.",
          discussion: "Client is happy with direction. Wants stronger hierarchy on the homepage.",
          actionItems: "Send revised homepage by Friday. Share updated budget sheet.",
          decisions: "Approved phase two. Launch moved to end of month.",
          followUp: "Book a follow-up review in two weeks.",
        },
        createdAt: hoursAgo(24 * (i + 1)),
      };
    }),
  );

  await db.insert(s.projectNotes).values(
    projectRows.slice(0, 4).map((p) => ({
      id: id("pn"),
      userId,
      projectId: p.id,
      body: "<p><strong>Working notes</strong></p><ul><li>Client prefers warm neutrals</li><li>Reuse the component library from the last build</li><li>Launch checklist lives in the Files tab</li></ul>",
      updatedAt: hoursAgo(20),
    })),
  );

  await db.insert(s.projectComments).values(
    projectRows.slice(0, 4).flatMap((p, i) => [
      {
        id: id("pc"),
        userId,
        projectId: p.id,
        parentId: "",
        author: pick(ASSIGNEES, i),
        body: "Uploaded the latest deliverables — @Emma Cole can you sanity check the export sizes?",
        createdAt: hoursAgo(8 + i),
      },
      {
        id: id("pc"),
        userId,
        projectId: p.id,
        parentId: "",
        author: pick(ASSIGNEES, i + 1),
        body: "Timeline still looks good for the end of month delivery.",
        createdAt: hoursAgo(4 + i),
      },
    ]),
  );

  await db.insert(s.activities).values(
    [
      "Invoice paid by Pixel Labs.",
      "Proposal sent to Studio Nova.",
      "New client added: Kite Learning.",
      "Project completed: Course Landing Pages.",
      "Task assigned to Emma Cole.",
      "Meeting notes uploaded for Website Review.",
      "Deadline updated on Shopify Store Build.",
      "Lead moved to Negotiation: Tandem Legal.",
      "File uploaded: brand-guidelines-v3.pdf.",
      "Payment received from BluePeak Health.",
      "Comment added on Patient Portal UX.",
      "Milestone completed: Design completed.",
    ].map((text, i) => ({
      id: id("act"),
      userId,
      kind: pick(["invoice", "proposal", "client", "project", "task", "meeting", "deadline", "lead", "file", "payment", "comment", "milestone"], i),
      text,
      actor: pick(ASSIGNEES, i),
      projectId: pick(projectRows, i).id,
      clientId: pick(clientRows, i).id,
      createdAt: hoursAgo(i * 5 + 1),
    })),
  );

  await db.insert(s.notifications).values(
    [
      { kind: "invoice", title: "Invoice paid", body: `Pixel Labs paid INV-${invoiceYear}-1014 · $4,830` },
      { kind: "client", title: "New client added", body: "Kite Learning was added to your workspace" },
      { kind: "meeting", title: "Meeting starting soon", body: "Website Review with Pixel Labs at 11:30 AM" },
      { kind: "deadline", title: "Project deadline tomorrow", body: "Patient Portal UX is due tomorrow" },
      { kind: "task", title: "Task assigned", body: "Emma Cole assigned you “Refine typography scale”" },
      { kind: "proposal", title: "Proposal viewed", body: "Fielder Sports viewed your proposal twice" },
      { kind: "invoice", title: "Invoice overdue", body: `INV-${invoiceYear}-1029 is 18 days overdue · $3,255` },
    ].map((n, i) => ({
      id: id("ntf"),
      userId,
      kind: n.kind,
      title: n.title,
      body: n.body,
      read: i > 3,
      createdAt: hoursAgo(i * 3 + 1),
    })),
  );

  await db.insert(s.teamMembers).values(
    TEAM.map((t, i) => ({
      id: id("tm"),
      userId,
      name: t.name,
      email: t.email,
      role: t.role,
      status: t.status,
      accent: pick(ACCENTS, i + 1),
      joinedAt: dayOffset(-(120 - i * 25)),
    })),
  );

  await db
    .insert(s.userSettings)
    .values({
      userId,
      seeded: true,
      prefs: {
        theme: "system",
        accent: "indigo",
        business: { name: "Independent Studio", currency: "USD", invoiceTerms: "Net 14" },
      },
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({ target: s.userSettings.userId, set: { seeded: true } });
}
