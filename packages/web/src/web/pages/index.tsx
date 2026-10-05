import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  Clock,
  FolderKanban,
  Handshake,
  LayoutDashboard,
  ListChecks,
  Menu,
  Minus,
  Moon,
  Receipt,
  Search,
  Sparkles,
  Sun,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Logo, LogoMark } from "../components/logo";
import { Button } from "../components/ui/kit";
import { AreaChart, DonutChart, Ring } from "../components/charts";
import { useTheme } from "../components/theme";
import { authClient } from "../lib/auth";
import { cn } from "../lib/utils";

/* ------------------------------- static data ------------------------------- */

const FEATURES = [
  {
    icon: Users,
    title: "Clients & CRM",
    body: "One profile per client: contacts, communication log, notes, projects, invoices and files — no more digging through inboxes.",
  },
  {
    icon: Handshake,
    title: "Deal pipeline",
    body: "Drag leads through seven stages, track expected value and convert a won deal into a client in a single click.",
  },
  {
    icon: FolderKanban,
    title: "Projects",
    body: "Budgets, deadlines, milestones, team, files and activity — with progress that updates itself from your tasks.",
  },
  {
    icon: ListChecks,
    title: "Tasks & time",
    body: "Kanban, list and calendar views, checklists, labels and a built-in timer that logs billable hours as you work.",
  },
  {
    icon: Receipt,
    title: "Invoices",
    body: "Line items, tax, discounts, payment records and a printable preview. Overdue invoices surface before you forget.",
  },
  {
    icon: CalendarClock,
    title: "Meetings",
    body: "Schedule calls against clients and projects, then capture agenda, decisions and action items in structured notes.",
  },
  {
    icon: BarChart3,
    title: "Reports",
    body: "Revenue trends, client concentration, billable ratio, estimate accuracy and per-project profitability.",
  },
  {
    icon: Sparkles,
    title: "Command palette",
    body: "⌘K from anywhere to search everything you own or create the next thing without touching the mouse.",
  },
];

const STEPS = [
  {
    title: "Bring your work in",
    body: "Add clients, projects and the tasks you already have. Every account starts with a demo workspace so nothing looks empty while you set up.",
  },
  {
    title: "Run your week",
    body: "Move tasks across the board, log hours, take meeting notes and keep the pipeline honest. Everything links back to the client.",
  },
  {
    title: "Get paid and review",
    body: "Invoice from the project, mark payments as they land, and read the reports that tell you which work is actually worth repeating.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I replaced a CRM, a project tool and two spreadsheets with FlowDesk. My monthly admin went from a full day to under an hour.",
    name: "Priya Raman",
    role: "Brand designer, Bengaluru",
    accent: "indigo",
  },
  {
    quote:
      "The reports page is the first analytics screen I actually read. Seeing effective hourly rate per project changed how I quote.",
    name: "Marcus Feld",
    role: "Webflow consultant, Berlin",
    accent: "emerald",
  },
  {
    quote:
      "Client profiles are the killer feature. Every call, note and invoice in one place means I walk into meetings prepared.",
    name: "Danielle Okoye",
    role: "Studio lead, Lagos",
    accent: "amber",
  },
];

const PLANS = [
  {
    name: "Solo",
    price: 0,
    tagline: "For freelancers finding their rhythm.",
    features: ["Up to 5 clients", "10 active projects", "Unlimited tasks", "Basic invoicing", "Core reports"],
  },
  {
    name: "Professional",
    price: 18,
    tagline: "For established independents billing monthly.",
    features: [
      "Unlimited clients & projects",
      "Deal pipeline & CRM",
      "Time tracking & billable hours",
      "Invoices, payments & reminders",
      "Full reporting suite",
      "File storage with versions",
    ],
    featured: true,
  },
  {
    name: "Studio",
    price: 44,
    tagline: "For small teams sharing a workload.",
    features: [
      "Everything in Professional",
      "Up to 10 team members",
      "Workload & team analytics",
      "Client-ready exports",
      "Priority support",
    ],
  },
];

const FAQS = [
  {
    q: "Is FlowDesk really free to start?",
    a: "Yes. The Solo plan is free forever and includes clients, projects, tasks and basic invoicing. You only move up when your business does.",
  },
  {
    q: "What happens to the demo data?",
    a: "Every new account is seeded with a realistic workspace so you can explore a full app instead of empty screens. Delete any record you don't want — it's ordinary data in your own workspace.",
  },
  {
    q: "Can I use FlowDesk with a small team?",
    a: "Yes. Invite teammates, assign tasks and see workload per person. The Studio plan covers up to ten people.",
  },
  {
    q: "Do you support multiple currencies?",
    a: "Invoices and projects each carry their own currency, and reports roll everything up so you always see the whole picture.",
  },
  {
    q: "How does time tracking work?",
    a: "Start the timer on any task or log minutes manually. Hours roll up into the project, the billable ratio and your reports automatically.",
  },
  {
    q: "Can I export my data?",
    a: "Always. Invoices print to PDF straight from the browser and every list can be exported to CSV.",
  },
];

const REVENUE = [
  { label: "Jan", value: 8400 },
  { label: "Feb", value: 10250 },
  { label: "Mar", value: 9600 },
  { label: "Apr", value: 13400 },
  { label: "May", value: 12100 },
  { label: "Jun", value: 16850 },
  { label: "Jul", value: 15400 },
  { label: "Aug", value: 19200 },
];

/* ---------------------------------- header --------------------------------- */

function LandingHeader() {
  const { resolved, setTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-200",
        scrolled ? "border-border bg-background/85 backdrop-blur-md" : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-6 px-5 sm:px-8">
        <Link href="/">
          <Logo size={30} />
        </Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
          >
            {resolved === "dark" ? <Moon size={17} strokeWidth={1.75} /> : <Sun size={17} strokeWidth={1.75} />}
          </button>
          {session ? (
            <Link href="/app">
              <Button size="sm">
                Open workspace
                <ArrowRight size={15} strokeWidth={2} />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">Start free</Button>
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-hover md:hidden"
          >
            {open ? <X size={18} strokeWidth={1.75} /> : <Menu size={18} strokeWidth={1.75} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <div className="space-y-1 px-5 py-4">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-[14px] font-medium text-muted-foreground hover:bg-hover hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ------------------------------ dashboard mock ----------------------------- */

function DashboardPreview() {
  const nav = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Users, label: "Clients" },
    { icon: Handshake, label: "Pipeline" },
    { icon: FolderKanban, label: "Projects" },
    { icon: ListChecks, label: "Tasks" },
    { icon: Receipt, label: "Invoices" },
    { icon: BarChart3, label: "Reports" },
  ];
  const kpis = [
    { label: "Revenue this month", value: "$19,200", delta: "+24%", up: true },
    { label: "Outstanding", value: "$7,450", delta: "3 invoices", up: false },
    { label: "Active projects", value: "6", delta: "2 due soon", up: true },
    { label: "Billable ratio", value: "78%", delta: "+6%", up: true },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-pop)]">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </span>
        <div className="mx-auto flex items-center gap-2 rounded-md bg-muted px-3 py-1 text-[10.5px] text-muted-foreground">
          app.flowdesk.com/app
        </div>
      </div>
      <div className="flex">
        <div className="hidden w-[168px] shrink-0 border-r border-border p-3 sm:block">
          <div className="mb-4 flex items-center gap-2 px-1">
            <LogoMark size={22} />
            <span className="text-[12.5px] font-semibold">FlowDesk</span>
          </div>
          <div className="space-y-0.5">
            {nav.map((n) => (
              <div
                key={n.label}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11.5px] font-medium",
                  n.active ? "bg-primary-soft text-primary" : "text-muted-foreground",
                )}
              >
                <n.icon size={13} strokeWidth={1.75} />
                {n.label}
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1 bg-background p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-[10.5px] text-muted-foreground">
              <Search size={11} strokeWidth={1.75} />
              Search or jump to…
            </div>
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
              <Bell size={12} strokeWidth={1.75} />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-danger" />
            </span>
            <span className="h-7 w-7 rounded-full bg-primary-soft" />
          </div>
          <p className="mb-3 text-[13px] font-semibold">Good morning, Alex 👋</p>
          <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-card p-2.5">
                <p className="truncate text-[9.5px] font-medium uppercase tracking-wide text-muted-foreground">
                  {k.label}
                </p>
                <p className="mt-1 text-[15px] font-semibold tnum">{k.value}</p>
                <p
                  className={cn(
                    "mt-0.5 flex items-center gap-1 text-[9.5px] font-medium",
                    k.up ? "text-success" : "text-warning",
                  )}
                >
                  {k.up ? <TrendingUp size={9} strokeWidth={2.5} /> : <Clock size={9} strokeWidth={2.5} />}
                  {k.delta}
                </p>
              </div>
            ))}
          </div>
          <div className="grid gap-2 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="mb-1 text-[11px] font-semibold">Revenue</p>
              <AreaChart data={REVENUE} height={120} format={(v) => `$${Math.round(v / 1000)}k`} />
            </div>
            <div className="flex items-center justify-center gap-4 rounded-xl border border-border bg-card p-3">
              <Ring value={78} size={72} thickness={8} label="billable" />
              <div className="space-y-1.5">
                {[
                  { l: "Done", v: 42, c: "bg-success" },
                  { l: "Active", v: 18, c: "bg-primary" },
                  { l: "Review", v: 6, c: "bg-warning" },
                ].map((r) => (
                  <div key={r.l} className="flex items-center gap-2 text-[10px]">
                    <span className={cn("h-1.5 w-1.5 rounded-full", r.c)} />
                    <span className="text-muted-foreground">{r.l}</span>
                    <span className="font-semibold tnum">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default function LandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [annual, setAnnual] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
        <div
          className="pointer-events-none absolute left-1/2 top-[-15%] h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-[0.13] blur-3xl"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-[1200px] px-5 pb-16 pt-16 sm:px-8 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <motion.a
              href="#features"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground shadow-[var(--shadow-card)] transition-colors hover:text-foreground"
            >
              <span className="flex h-1.5 w-1.5 rounded-full bg-success" />
              CRM, projects, invoicing and reports in one place
              <ArrowRight size={13} strokeWidth={2} />
            </motion.a>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="mt-6 text-[38px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[56px]"
            >
              Everything your freelance
              <br className="hidden sm:block" /> business needs.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground sm:text-[17px]"
            >
              FlowDesk is the calm workspace where clients, projects, tasks, time, invoices and reporting finally
              live together — so the admin stops eating your billable hours.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              <Link href="/sign-up">
                <Button size="lg">
                  Start free — no card
                  <ArrowRight size={17} strokeWidth={2} />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">
                  See what's inside
                </Button>
              </a>
            </motion.div>
            <p className="mt-4 text-[12.5px] text-muted-foreground">
              Free forever on Solo · Set up in under two minutes
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-14 max-w-5xl"
          >
            <DashboardPreview />
          </motion.div>
        </div>
      </section>

      {/* logo wall */}
      <section className="border-y border-border bg-card/50 py-10">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <p className="text-center text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Powering independent studios in 40+ countries
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 opacity-60">
            {["Northline", "Studio Kade", "Orbit&Co", "Fieldnote", "Maru Digital", "Halcyon"].map((n) => (
              <span key={n} className="text-[16px] font-semibold tracking-[-0.02em] text-muted-foreground">
                {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* stats */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { value: "9.4 hrs", label: "Admin time saved per month", body: "Median across active Professional accounts." },
            { value: "31%", label: "Faster invoice payment", body: "Once reminders and due dates live in one place." },
            { value: "12,000+", label: "Independents onboard", body: "Designers, developers, consultants and studios." },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="rounded-[14px] border border-border bg-card p-6 shadow-[var(--shadow-card)]"
            >
              <p className="text-[30px] font-semibold tracking-[-0.02em] tnum">{s.value}</p>
              <p className="mt-1.5 text-[14px] font-medium">{s.label}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* features */}
      <section id="features" className="scroll-mt-20 border-t border-border bg-card/40 py-20">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">Features</p>
            <h2 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[38px]">
              Eleven tools, one workspace, zero context switching.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-muted-foreground">
              Each module is useful on its own — and every record links to the others, so a client profile shows
              you the projects, invoices, meetings and files that belong to it.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.32, delay: (i % 4) * 0.05 }}
                className="group rounded-[14px] border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-primary-soft text-primary">
                  <f.icon size={18} strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold">{f.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="scroll-mt-20 py-20">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">How it works</p>
            <h2 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]">
              Set up once. Then just run your week.
            </h2>
            <ol className="mt-10 space-y-8">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[13px] font-semibold tnum">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold">{s.title}</p>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/sign-up" className="mt-10 inline-flex">
              <Button>
                Create your workspace
                <ArrowRight size={16} strokeWidth={2} />
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[14px] border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:col-span-2">
              <p className="text-[13px] font-semibold">Revenue, last 8 months</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">Paid invoices only — no optimistic maths.</p>
              <div className="mt-4">
                <AreaChart data={REVENUE} height={160} format={(v) => `$${(v / 1000).toFixed(1)}k`} />
              </div>
            </div>
            <div className="rounded-[14px] border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <p className="mb-4 text-[13px] font-semibold">Task health</p>
              <DonutChart
                size={128}
                thickness={15}
                centerValue="66"
                centerLabel="tasks"
                data={[
                  { label: "done", value: 42, color: "#10b981" },
                  { label: "active", value: 18, color: "var(--primary)" },
                  { label: "review", value: 6, color: "#f59e0b" },
                ]}
              />
            </div>
            <div className="flex flex-col justify-center gap-4 rounded-[14px] border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              {[
                { label: "Billable ratio", value: 78 },
                { label: "On-time delivery", value: 92 },
                { label: "Estimate accuracy", value: 86 },
              ].map((r) => (
                <div key={r.label}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-[12.5px] font-medium">{r.label}</span>
                    <span className="text-[12.5px] font-semibold tnum">{r.value}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${r.value}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7 }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* testimonials */}
      <section className="border-y border-border bg-card/40 py-20">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <h2 className="max-w-2xl text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]">
            The people who bill by the hour notice first.
          </h2>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.figure
                key={t.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.32, delay: i * 0.06 }}
                className="flex flex-col justify-between rounded-[14px] border border-border bg-card p-6 shadow-[var(--shadow-card)]"
              >
                <blockquote className="text-[14.5px] leading-relaxed">“{t.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold",
                      t.accent === "indigo" && "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
                      t.accent === "emerald" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
                      t.accent === "amber" && "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
                    )}
                  >
                    {t.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="text-[13.5px] font-medium">{t.name}</p>
                    <p className="text-[12.5px] text-muted-foreground">{t.role}</p>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">Pricing</p>
            <h2 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[38px]">
              Priced like software, not like an agency retainer.
            </h2>
            <div className="mt-7 inline-flex items-center gap-0.5 rounded-[10px] border border-border bg-muted p-0.5">
              {[
                { id: false, label: "Monthly" },
                { id: true, label: "Annual · save 20%" },
              ].map((o) => (
                <button
                  key={String(o.id)}
                  type="button"
                  onClick={() => setAnnual(o.id)}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                    annual === o.id ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {PLANS.map((p) => {
              const price = annual ? Math.round(p.price * 0.8) : p.price;
              return (
                <div
                  key={p.name}
                  className={cn(
                    "relative flex flex-col rounded-[16px] border bg-card p-6 shadow-[var(--shadow-card)]",
                    p.featured ? "border-primary/50 ring-1 ring-primary/20" : "border-border",
                  )}
                >
                  {p.featured && (
                    <span className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-primary-foreground">
                      Most popular
                    </span>
                  )}
                  <p className="text-[15px] font-semibold">{p.name}</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">{p.tagline}</p>
                  <p className="mt-5 flex items-baseline gap-1.5">
                    <span className="text-[36px] font-semibold tracking-[-0.03em] tnum">${price}</span>
                    <span className="text-[13px] text-muted-foreground">/month</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2.5 text-[13.5px]">
                        <Check size={15} strokeWidth={2.2} className="mt-0.5 shrink-0 text-success" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/sign-up" className="mt-7">
                    <Button variant={p.featured ? "primary" : "outline"} className="w-full">
                      {p.price === 0 ? "Start free" : `Choose ${p.name}`}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="mt-12 overflow-hidden rounded-[14px] border border-border bg-card shadow-[var(--shadow-card)]">
            <table className="w-full text-left text-[13.5px]">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Compare plans
                  </th>
                  {PLANS.map((p) => (
                    <th key={p.name} className="px-5 py-3 text-center text-[12.5px] font-semibold">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Clients", values: ["5", "Unlimited", "Unlimited"] },
                  { label: "Deal pipeline", values: [false, true, true] },
                  { label: "Time tracking", values: [false, true, true] },
                  { label: "Invoices & payments", values: ["Basic", "Full", "Full"] },
                  { label: "Reporting suite", values: ["Core", "Full", "Full + team"] },
                  { label: "Team members", values: ["1", "1", "10"] },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="px-5 py-3 text-center text-muted-foreground">
                        {v === true ? (
                          <Check size={15} strokeWidth={2.2} className="mx-auto text-success" />
                        ) : v === false ? (
                          <Minus size={15} strokeWidth={2} className="mx-auto opacity-40" />
                        ) : (
                          v
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* faq */}
      <section id="faq" className="scroll-mt-20 border-t border-border bg-card/40 py-20">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.02em]">Questions, answered.</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              Still unsure? Everything below is what people ask us most before signing up.
            </p>
          </div>
          <div className="divide-y divide-border overflow-hidden rounded-[14px] border border-border bg-card shadow-[var(--shadow-card)]">
            {FAQS.map((f, i) => (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[14px] font-medium">{f.q}</span>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.9}
                    className={cn(
                      "shrink-0 text-muted-foreground transition-transform duration-200",
                      faqOpen === i && "rotate-180",
                    )}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {faqOpen === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-[13.5px] leading-relaxed text-muted-foreground">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* cta */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-[20px] border border-border bg-[#0b0c0f] px-8 py-14 text-center text-white">
            <div className="grid-bg absolute inset-0 opacity-[0.07]" />
            <div
              className="absolute left-1/2 top-0 h-64 w-[560px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
              style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[38px]">
                Give your business the back office it deserves.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-white/60">
                Start on the free plan, keep your data, and upgrade only when the work does.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/sign-up">
                  <Button size="lg">
                    Start free
                    <ArrowRight size={17} strokeWidth={2} />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="flex flex-wrap justify-between gap-10">
            <div className="max-w-xs">
              <Logo size={30} />
              <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">
                The all-in-one workspace for freelancers, consultants and small creative studios.
              </p>
            </div>
            <div className="grid flex-1 gap-8 sm:grid-cols-3 lg:max-w-xl">
              {[
                { title: "Product", links: ["Features", "Pricing", "FAQ", "Changelog"] },
                { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
                { title: "Legal", links: ["Privacy", "Terms", "Security", "DPA"] },
              ].map((col) => (
                <div key={col.title}>
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {col.title}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {col.links.map((l) => (
                      <li key={l}>
                        <a
                          href={`#${l.toLowerCase()}`}
                          className="text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {l}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-[12.5px] text-muted-foreground">
            <p>© {new Date().getFullYear()} FlowDesk. All rights reserved.</p>
            <p>Built for people who bill by the hour.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
