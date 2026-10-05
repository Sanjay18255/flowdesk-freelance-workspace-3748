import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { authClient } from "../lib/auth";
import { orpc } from "../lib/api";
import { LogoMark } from "./logo";

function Booting({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <LogoMark size={40} className="animate-pulse" />
        <p className="text-[13px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/** Guards the /app routes and seeds the demo workspace once per account. */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const bootstrap = useQuery(
    orpc.account.bootstrap.queryOptions({
      enabled: !!session,
      staleTime: Number.POSITIVE_INFINITY,
      retry: 0,
    }),
  );

  if (isPending) return <Booting label="Loading your workspace…" />;
  if (!session) return <Redirect to="/sign-in" />;
  if (bootstrap.isLoading) return <Booting label="Preparing your workspace…" />;
  return <>{children}</>;
}
