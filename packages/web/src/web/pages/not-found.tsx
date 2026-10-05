import { Link } from "wouter";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "../components/ui/kit";
import { Logo } from "../components/logo";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <Link href="/" className="mb-12">
        <Logo size={32} />
      </Link>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Compass size={24} strokeWidth={1.6} />
      </span>
      <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Error 404
      </p>
      <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.02em]">
        This page took the day off.
      </h1>
      <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-muted-foreground">
        The link is broken or the record was deleted. Head back to your workspace and pick up where you left off.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/app">
          <Button>
            <ArrowLeft size={16} strokeWidth={2} />
            Back to dashboard
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Go to homepage</Button>
        </Link>
      </div>
    </div>
  );
}
