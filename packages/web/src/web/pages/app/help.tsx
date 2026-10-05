import { useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  ChevronDown,
  Command,
  FolderKanban,
  Handshake,
  LifeBuoy,
  ListChecks,
  Mail,
  Receipt,
  Send,
  Users,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Textarea,
} from "../../components/ui/kit";
import { useToast } from "../../components/toast";
import { cn } from "../../lib/utils";

const GUIDES = [
  {
    icon: Users,
    title: "Set up your clients",
    body: "Add a company, then attach contacts, notes and a communication log. Everything else in FlowDesk links back to the client.",
    href: "/app/clients",
    cta: "Open clients",
  },
  {
    icon: Handshake,
    title: "Work the pipeline",
    body: "Drag deals between the seven stages. When one is won, convert it into a client in a single click.",
    href: "/app/pipeline",
    cta: "Open pipeline",
  },
  {
    icon: FolderKanban,
    title: "Run a project",
    body: "Every new project gets eight standard milestones. Progress recalculates from the tasks attached to it.",
    href: "/app/projects",
    cta: "Open projects",
  },
  {
    icon: ListChecks,
    title: "Track tasks and time",
    body: "Board, list and calendar views share the same data. Start the timer on a task and the hours roll into reports.",
    href: "/app/tasks",
    cta: "Open tasks",
  },
  {
    icon: Receipt,
    title: "Invoice and get paid",
    body: "Build line items, add tax or discount, then mark it sent and paid. Payments and overdue flags update automatically.",
    href: "/app/invoices",
    cta: "Open invoices",
  },
  {
    icon: Command,
    title: "Move faster with ⌘K",
    body: "Press ⌘K (or Ctrl+K) anywhere to search every record you own or create the next thing without the mouse.",
    href: "/app",
    cta: "Back to dashboard",
  },
];

const FAQS = [
  {
    q: "Where did my demo data come from?",
    a: "Every new workspace is seeded once with a realistic set of clients, projects, tasks, invoices and meetings so nothing looks empty while you explore. It's ordinary data in your account — delete anything you don't want.",
  },
  {
    q: "How is project progress calculated?",
    a: "Progress is the share of completed tasks attached to the project. If a project has no tasks yet, it falls back to the percentage you set manually when creating it.",
  },
  {
    q: "When does an invoice become overdue?",
    a: "Any invoice marked as sent or viewed flips to overdue automatically once its due date passes. Marking it paid records a payment and clears the flag.",
  },
  {
    q: "How does the timer work?",
    a: "Start a timer from a task's menu, then hit Save & stop. The elapsed minutes are logged as a time entry, added to the task's actual time and counted in your billable ratio.",
  },
  {
    q: "Are uploaded files really stored?",
    a: "Yes. Files upload directly from your browser to object storage with a presigned URL, and every re-upload of the same file is kept as a new version you can download.",
  },
  {
    q: "Can I export my data?",
    a: "Reports export to CSV from the Reports page, and every invoice prints to PDF through your browser's print dialog.",
  },
  {
    q: "Does changing the accent colour affect invoices?",
    a: "Only the app interface. Invoices keep a neutral, print-friendly layout so they read the same for every client.",
  },
];

const SHORTCUTS = [
  ["⌘K / Ctrl+K", "Open the command palette"],
  ["↑ ↓", "Move through palette results"],
  ["Enter", "Run the selected result"],
  ["Esc", "Close any modal or the palette"],
];

export default function HelpPage() {
  const toast = useToast();
  const [open, setOpen] = useState<number | null>(0);
  const [message, setMessage] = useState({ subject: "", body: "" });

  return (
    <div className="space-y-6">
      <PageHeader title="Help & support" subtitle="Guides, answers and a way to reach a human" />

      <Card className="overflow-hidden">
        <div className="relative p-8">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative flex flex-wrap items-center gap-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-[13px] bg-primary-soft text-primary">
              <LifeBuoy size={22} strokeWidth={1.7} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[19px] font-semibold">New to FlowDesk?</h2>
              <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground">
                Start with a client, add a project, then work the tasks. Invoices, meetings and reports all read from
                that same data — so the more you use it, the more useful it gets.
              </p>
            </div>
            <Link href="/app/clients">
              <Button>
                <Users size={16} strokeWidth={1.9} />
                Start with clients
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {GUIDES.map((g, i) => (
          <motion.div
            key={g.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, delay: i * 0.04 }}
          >
            <Card hover className="flex h-full flex-col p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-primary-soft text-primary">
                <g.icon size={18} strokeWidth={1.8} />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold">{g.title}</h3>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">{g.body}</p>
              <Link href={g.href} className="mt-4 text-[12.5px] font-medium text-primary hover:underline">
                {g.cta} →
              </Link>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Frequently asked" subtitle="The questions we get most" />
          <div className="divide-y divide-border px-5 pb-2">
            {FAQS.map((f, i) => (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                >
                  <span className="text-[13.5px] font-medium">{f.q}</span>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.9}
                    className={cn("shrink-0 text-muted-foreground transition-transform", open === i && "rotate-180")}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-4 text-[13px] leading-relaxed text-muted-foreground">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Keyboard shortcuts" subtitle="Keep your hands on the keys" />
            <ul className="divide-y divide-border p-5 pt-4">
              {SHORTCUTS.map(([keys, what]) => (
                <li key={keys} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <span className="text-[13px] text-muted-foreground">{what}</span>
                  <kbd className="shrink-0 rounded-md border border-border bg-muted px-2 py-1 text-[11px] font-medium">
                    {keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Contact support" subtitle="We reply within one business day" />
            <div className="space-y-4 p-5 pt-4">
              <Field label="Subject">
                <Input
                  value={message.subject}
                  onChange={(e) => setMessage((m) => ({ ...m, subject: e.target.value }))}
                  placeholder="I need help with…"
                />
              </Field>
              <Field label="Message">
                <Textarea
                  rows={5}
                  value={message.body}
                  onChange={(e) => setMessage((m) => ({ ...m, body: e.target.value }))}
                  placeholder="Tell us what's happening."
                />
              </Field>
              <Button
                className="w-full"
                onClick={() => {
                  if (!message.subject.trim() || !message.body.trim()) {
                    toast.error("Add a subject and message");
                    return;
                  }
                  setMessage({ subject: "", body: "" });
                  toast.success("Message sent", "Support will reply to your account email.");
                }}
              >
                <Send size={15} strokeWidth={1.9} />
                Send message
              </Button>
              <div className="flex items-center gap-2 border-t border-border pt-4 text-[12.5px] text-muted-foreground">
                <Mail size={13} strokeWidth={1.9} />
                Or email support@flowdesk.com
              </div>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-muted text-muted-foreground">
              <BookOpen size={18} strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold">Release notes</p>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                Reports, file versioning and the command palette shipped this month.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
