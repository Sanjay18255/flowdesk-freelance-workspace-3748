import { useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { authClient } from "../lib/auth";
import { Button, Field, Input } from "../components/ui/kit";
import { Logo } from "../components/logo";
import { BrandPanel } from "./sign-in";
import { cn } from "../lib/utils";

function strengthOf(pw: string) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^\w]/.test(pw)) score++;
  return score;
}

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];

export default function SignUpPage() {
  const { data: session, isPending } = authClient.useSession();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isPending && session) return <Redirect to="/app" />;

  const score = strengthOf(password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const res = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      // additional fields declared on the server config
      businessName: businessName.trim(),
    } as Parameters<typeof authClient.signUp.email>[0]);
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? "Could not create your account. Try again.");
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
          <h1 className="text-[26px] font-semibold leading-tight">Create your workspace</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Free to start. Your account arrives pre-filled with a realistic demo workspace you can clear anytime.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Your name">
              <Input
                required
                autoComplete="name"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Business name" hint="Shown on invoices — you can change it later.">
              <Input
                placeholder="Morgan Studio"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </Field>
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
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
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
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          i < score
                            ? score <= 1
                              ? "bg-danger"
                              : score === 2
                                ? "bg-warning"
                                : "bg-success"
                            : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                  <span className="w-16 text-right text-[11.5px] text-muted-foreground">{LABELS[score]}</span>
                </div>
              )}
            </Field>

            {error && (
              <div className="flex items-start gap-2.5 rounded-[10px] bg-danger-soft px-3.5 py-3 text-[13px] text-danger">
                <AlertCircle size={15} strokeWidth={1.9} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Create account
              <ArrowRight size={16} strokeWidth={2} />
            </Button>
          </form>

          <ul className="mt-6 space-y-2">
            {["No credit card required", "Cancel or export anytime", "Your data stays yours"].map((t) => (
              <li key={t} className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                <Check size={13} strokeWidth={2.5} className="text-success" />
                {t}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-center text-[13.5px] text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
