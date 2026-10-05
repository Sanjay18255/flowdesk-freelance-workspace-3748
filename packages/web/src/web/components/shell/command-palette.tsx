import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  CalendarClock,
  CornerDownLeft,
  FileText,
  FolderKanban,
  Handshake,
  ListChecks,
  Moon,
  Plus,
  Receipt,
  Search,
  Sun,
  Users,
} from "lucide-react";
import { useSearch } from "../../queries/search";
import { NAV_ITEMS } from "./nav-items";
import { useTheme } from "../theme";
import { cn } from "../../lib/utils";

const HIT_ICON = {
  client: Users,
  project: FolderKanban,
  task: ListChecks,
  invoice: Receipt,
  meeting: CalendarClock,
  file: FileText,
  lead: Handshake,
};

type Row = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  run: () => void;
  section: string;
};

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const [, navigate] = useLocation();
  const { resolved, setTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useSearch(q);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const rows = useMemo<Row[]>(() => {
    const go = (href: string) => () => {
      navigate(href);
      onClose();
    };
    const nav: Row[] = NAV_ITEMS.filter((n) => n.label.toLowerCase().includes(q.toLowerCase())).map((n) => ({
      id: `nav-${n.href}`,
      label: n.label,
      hint: "Go to page",
      icon: n.icon,
      run: go(n.href),
      section: "Navigate",
    }));

    const actions: Row[] = [
      { id: "new-client", label: "New client", icon: Plus, run: go("/app/clients?new=1"), section: "Create" },
      { id: "new-project", label: "New project", icon: Plus, run: go("/app/projects?new=1"), section: "Create" },
      { id: "new-task", label: "New task", icon: Plus, run: go("/app/tasks?new=1"), section: "Create" },
      { id: "new-invoice", label: "New invoice", icon: Plus, run: go("/app/invoices?new=1"), section: "Create" },
      { id: "new-meeting", label: "Schedule meeting", icon: Plus, run: go("/app/meetings?new=1"), section: "Create" },
      { id: "new-lead", label: "New lead", icon: Plus, run: go("/app/pipeline?new=1"), section: "Create" },
      {
        id: "theme",
        label: resolved === "dark" ? "Switch to light mode" : "Switch to dark mode",
        icon: resolved === "dark" ? Sun : Moon,
        run: () => {
          setTheme(resolved === "dark" ? "light" : "dark");
          onClose();
        },
        section: "Preferences",
      },
    ].filter((a) => a.label.toLowerCase().includes(q.toLowerCase()));

    const hits: Row[] = (results.data ?? []).map((h) => ({
      id: `hit-${h.kind}-${h.id}`,
      label: h.title,
      hint: h.subtitle,
      icon: HIT_ICON[h.kind] ?? FileText,
      run: go(h.href),
      section: "Results",
    }));

    return [...hits, ...nav, ...actions];
  }, [q, results.data, navigate, onClose, resolved, setTheme]);

  useEffect(() => setCursor(0), [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(rows.length - 1, c + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        rows[cursor]?.run();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, rows, cursor, onClose]);

  let lastSection = "";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[130] flex items-start justify-center p-4 pt-[12vh]">
          <motion.button
            type="button"
            aria-label="Close command palette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b0c0f]/45 backdrop-blur-[3px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-elevated shadow-[var(--shadow-pop)]"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search size={17} strokeWidth={1.75} className="text-muted-foreground" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search clients, projects, invoices or jump to a page…"
                className="h-14 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-muted-foreground/70"
              />
              <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground sm:block">
                ESC
              </kbd>
            </div>
            <div className="thin-scrollbar max-h-[54vh] overflow-y-auto p-2">
              {rows.length === 0 && (
                <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">
                  No matches for “{q}”.
                </p>
              )}
              {rows.map((row, i) => {
                const showSection = row.section !== lastSection;
                lastSection = row.section;
                const Icon = row.icon;
                return (
                  <div key={row.id}>
                    {showSection && (
                      <p className="px-3 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {row.section}
                      </p>
                    )}
                    <button
                      type="button"
                      onMouseEnter={() => setCursor(i)}
                      onClick={row.run}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        cursor === i ? "bg-primary-soft text-primary" : "hover:bg-hover",
                      )}
                    >
                      <Icon size={16} strokeWidth={1.75} className="shrink-0 opacity-80" />
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{row.label}</span>
                      {row.hint && (
                        <span className="hidden shrink-0 truncate text-[12px] capitalize text-muted-foreground sm:block">
                          {row.hint}
                        </span>
                      )}
                      {cursor === i ? (
                        <CornerDownLeft size={13} strokeWidth={2} className="shrink-0" />
                      ) : (
                        <ArrowRight size={13} strokeWidth={2} className="shrink-0 opacity-0" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
