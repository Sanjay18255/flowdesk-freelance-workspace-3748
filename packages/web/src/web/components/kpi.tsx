import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "../lib/utils";
import { useCountUp } from "./charts";

export function KpiCard({
  label,
  value,
  format = (v: number) => String(Math.round(v)),
  delta,
  deltaLabel,
  icon: Icon,
  tone = "neutral",
  footer,
  className,
  index = 0,
}: {
  label: string;
  value: number;
  format?: (v: number) => string;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
  footer?: React.ReactNode;
  className?: string;
  index?: number;
}) {
  const animated = useCountUp(value);
  const iconTone = {
    neutral: "bg-muted text-muted-foreground",
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-[14px] border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]", iconTone)}>
            <Icon size={16} strokeWidth={1.75} />
          </span>
        )}
      </div>
      <p className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em] tnum">{format(animated)}</p>
      <div className="mt-2.5 flex items-center gap-2 text-[12.5px]">
        {delta !== undefined && delta !== 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
              delta > 0 ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
            )}
          >
            {delta > 0 ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
            {Math.abs(delta)}%
          </span>
        )}
        {deltaLabel && <span className="truncate text-muted-foreground">{deltaLabel}</span>}
      </div>
      {footer}
    </motion.div>
  );
}
