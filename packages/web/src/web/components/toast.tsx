import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; title: string; body?: string };

type ToastCtx = {
  toast: (title: string, opts?: { kind?: ToastKind; body?: string }) => void;
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const TONE = {
  success: "text-success",
  error: "text-danger",
  info: "text-primary",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((title: string, opts?: { kind?: ToastKind; body?: string }) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-3), { id, kind: opts?.kind ?? "info", title, body: opts?.body }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);

  const value = useMemo<ToastCtx>(
    () => ({
      toast,
      success: (title, body) => toast(title, { kind: "success", body }),
      error: (title, body) => toast(title, { kind: "error", body }),
    }),
    [toast],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[120] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const Icon = ICONS[t.kind];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 24, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-elevated p-3.5 shadow-[var(--shadow-pop)]"
              >
                <Icon size={18} strokeWidth={1.75} className={`mt-0.5 shrink-0 ${TONE[t.kind]}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight">{t.title}</p>
                  {t.body && <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{t.body}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
