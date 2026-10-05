import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { cn } from "../../lib/utils";

/* ---------------------------------- Button --------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "soft";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:brightness-110 shadow-[var(--shadow-card)]",
  secondary: "bg-muted text-foreground hover:bg-hover border border-border",
  ghost: "text-muted-foreground hover:bg-hover hover:text-foreground",
  outline: "border border-border bg-card text-foreground hover:bg-hover",
  danger: "bg-danger text-white hover:brightness-110",
  soft: "bg-primary-soft text-primary hover:brightness-[0.98]",
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
  icon: "h-9 w-9 justify-center",
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
  }
>(({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={cn(
      "inline-flex select-none items-center justify-center rounded-[10px] font-medium transition-all duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
      "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
      BUTTON_VARIANT[variant],
      BUTTON_SIZE[size],
      className,
    )}
    {...props}
  >
    {loading && <Loader2 size={15} className="animate-spin" />}
    {children}
  </button>
));
Button.displayName = "Button";

/* ----------------------------------- Card ---------------------------------- */

export function Card({
  className,
  hover,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-border bg-card shadow-[var(--shadow-card)]",
        hover && "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold leading-tight">{title}</h3>
        {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------- Badge ---------------------------------- */

type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "outline";

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  outline: "border border-border text-muted-foreground",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  dot,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium capitalize leading-none",
        BADGE_TONE[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<string, BadgeTone> = {
  active: "success",
  vip: "primary",
  inactive: "neutral",
  paid: "success",
  sent: "primary",
  viewed: "warning",
  draft: "neutral",
  overdue: "danger",
  cancelled: "neutral",
  todo: "neutral",
  in_progress: "primary",
  review: "warning",
  done: "success",
  planning: "neutral",
  on_hold: "warning",
  completed: "success",
  upcoming: "primary",
  low: "neutral",
  medium: "primary",
  high: "warning",
  urgent: "danger",
  online: "success",
  away: "warning",
  offline: "neutral",
};

/* ---------------------------------- Input ---------------------------------- */

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-[10px] border border-input bg-card px-3 text-sm text-foreground",
        "placeholder:text-muted-foreground/70 transition-all duration-150",
        "focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-ring/15",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-[10px] border border-input bg-card px-3 py-2.5 text-sm leading-relaxed text-foreground",
        "placeholder:text-muted-foreground/70 transition-all duration-150",
        "focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-ring/15",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-10 w-full appearance-none rounded-[10px] border border-input bg-card pl-3 pr-9 text-sm text-foreground",
          "transition-all duration-150 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-ring/15",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        strokeWidth={1.75}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  ),
);
Select.displayName = "Select";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("block", className)}>
      <span className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] text-muted-foreground/80">{hint}</span>}
    </label>
  );
}

/* ---------------------------------- Switch --------------------------------- */

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="min-w-0">
          {label && <p className="text-sm font-medium">{label}</p>}
          {description && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label ?? "Toggle"}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200",
          checked ? "border-primary bg-primary" : "border-border bg-muted",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={cn(
            "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-sm",
            checked ? "left-[1.4rem]" : "left-0.5",
          )}
          style={{ height: 18, width: 18 }}
        />
      </button>
    </div>
  );
}

/* ---------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const width = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
          <motion.button
            type="button"
            aria-label="Close dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b0c0f]/45 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative my-auto w-full rounded-2xl border border-border bg-card shadow-[var(--shadow-pop)]",
              width,
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div className="min-w-0">
                <h2 className="text-[17px] font-semibold leading-tight">{title}</h2>
                {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="thin-scrollbar max-h-[min(70vh,640px)] overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2.5 border-t border-border px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------- Confirm --------------------------------- */

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Delete",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </Modal>
  );
}

/* -------------------------------- Dropdown -------------------------------- */

export function Dropdown({
  trigger,
  children,
  align = "right",
  className,
}: {
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="block">
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-border bg-elevated p-1.5 shadow-[var(--shadow-pop)]",
              align === "right" ? "right-0" : "left-0",
              className,
            )}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MenuItem({
  icon: Icon,
  children,
  onClick,
  tone = "default",
}: {
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  children: React.ReactNode;
  onClick?: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] font-medium transition-colors",
        tone === "danger"
          ? "text-danger hover:bg-danger-soft"
          : "text-foreground hover:bg-hover",
      )}
    >
      {Icon && <Icon size={15} strokeWidth={1.75} className="shrink-0 opacity-80" />}
      <span className="truncate">{children}</span>
    </button>
  );
}

/* ---------------------------------- Tabs ---------------------------------- */

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("no-scrollbar flex gap-1 overflow-x-auto border-b border-border", className)}>
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "relative shrink-0 px-3.5 py-2.5 text-[13.5px] font-medium transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-1.5">
              {t.label}
              {t.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tnum",
                    isActive ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {t.count}
                </span>
              )}
            </span>
            {isActive && (
              <motion.span
                layoutId={`tab-underline-${tabs.map((x) => x.id).join("")}`}
                className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 480, damping: 34 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- Segmented -------------------------------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; icon?: React.ComponentType<{ size?: number; strokeWidth?: number }> }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-[10px] border border-border bg-muted p-0.5", className)}>
      {options.map((o) => {
        const isActive = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`seg-${options.map((x) => x.value).join("")}`}
                className="absolute inset-0 rounded-lg bg-card shadow-[var(--shadow-card)]"
                transition={{ type: "spring", stiffness: 480, damping: 34 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {Icon && <Icon size={14} strokeWidth={1.75} />}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- Avatar --------------------------------- */

const AVATAR_SIZE = { xs: "h-6 w-6 text-[10px]", sm: "h-8 w-8 text-[11px]", md: "h-10 w-10 text-[13px]", lg: "h-14 w-14 text-base" };

export function Avatar({
  name,
  accent = "indigo",
  size = "sm",
  className,
  image,
}: {
  name: string;
  accent?: string;
  size?: keyof typeof AVATAR_SIZE;
  className?: string;
  image?: string | null;
}) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const tone: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  };
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover", AVATAR_SIZE[size], className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        AVATAR_SIZE[size],
        tone[accent] ?? tone.indigo,
        className,
      )}
      title={name}
    >
      {letters || "?"}
    </span>
  );
}

/* -------------------------------- Progress -------------------------------- */

export function Progress({
  value,
  className,
  tone = "primary",
  showLabel,
}: {
  value: number;
  className?: string;
  tone?: "primary" | "success" | "warning" | "danger";
  showLabel?: boolean;
}) {
  const color = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }[tone];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
      {showLabel && <span className="w-9 shrink-0 text-right text-[12px] font-medium tnum text-muted-foreground">{Math.round(value)}%</span>}
    </div>
  );
}

/* ------------------------------- Empty state ------------------------------ */

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon size={22} strokeWidth={1.6} />
      </span>
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* -------------------------------- Skeleton -------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    </div>
  );
}

/* ------------------------------- Checkbox --------------------------------- */

export function Checkbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn("group flex items-center gap-2.5 text-left", className)}
    >
      <span
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-all duration-150",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card group-hover:border-muted-foreground/50",
        )}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      {label && <span className="min-w-0 text-sm">{label}</span>}
    </button>
  );
}

/* ------------------------------- Page header ------------------------------ */

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="text-[25px] font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[14px] text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/* --------------------------------- Motion --------------------------------- */

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};

export const rise = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
