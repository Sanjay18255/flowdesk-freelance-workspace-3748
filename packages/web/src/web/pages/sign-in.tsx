import { useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { motion } from "motion/react";
import { AlertCircle, ArrowRight, BarChart3, CheckCircle2, Eye, EyeOff, Receipt, Users } from "lucide-react";
import { authClient } from "../lib/auth";
import { Button, Field, Input } from "../components/ui/kit";
import { Logo } from "../components/logo";

const HIGHLIGHTS = [
  { icon: Users, title: "Clients & CRM", body: "Every conversation, contact and note in one profile." },
  { icon: Receipt, title: "Invoices that get paid", body: "Send, track and reconcile without spreadsheets." },
  { icon: BarChart3, title: "Reports that make sense", body: "Revenue, hours and profitability at a glance." },
];

export function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-[#0b0c0f] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="grid-bg absolute inset-0 opacity-[0.07]" />
      <div
        className="absolute -right-32 -top-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--primary) 55%, transparent), transparent 70%)" }}
      />
      <div className="relative">
        <Link href="/" className="inline-flex">
          <Logo size={34} className="text-white" />
        </Link>
      </div>
      <div className="relative max-w-md">
        <h2 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em]">
          The calm workspace behind busy freelance businesses.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-white/60">
          FlowDesk keeps clients, projects, tasks, invoices and reporting in a single place — so you spend your
          day on the work, not the admin.
        </p>
        <ul className="mt-10 space-y-5">
          {HIGHLIGHTS.map((h, i) => (
            <motion.li
              key={h.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.35 }}
              className="flex gap-3.5"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/10">
                <h.icon size={17} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[14px] font-medium">{h.title}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-white/55">{h.body}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
      <div className="relative flex items-center gap-3 text-[13px] text-white/50">
        <CheckCircle2 size={15} strokeWidth={1.75} />
        Trusted by 12,000+ independent studios and consultants
      </div>
    </div>
  );
}

export default function SignInPage() {
  const { data: session, isPending } = authClient.useSession();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isPending && session) return <Redirect to="/app" />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await authClient.signIn.email({ email: email.trim(), password });
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? "Could not sign you in. Check your details and try again.");
      return;
    }
    navigate("/app");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex lg:hidden">
            <Logo size={32} />
          </Link>
          <h1 className="text-[26px] font-semibold leading-tight">Welcome back</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Sign in to pick up where you left off.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Email">
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="you@studio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {show ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                </button>
              </div>
            </Field>

            {error && (
              <div className="flex items-start gap-2.5 rounded-[10px] bg-danger-soft px-3.5 py-3 text-[13px] text-danger">
                <AlertCircle size={15} strokeWidth={1.9} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Sign in
              <ArrowRight size={16} strokeWidth={2} />
            </Button>
          </form>

          <p className="mt-6 text-center text-[13.5px] text-muted-foreground">
            New to FlowDesk?{" "}
            <Link href="/sign-up" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
