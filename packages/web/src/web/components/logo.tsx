import { cn } from "../lib/utils";

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-[10px]", className)}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(140deg, var(--primary) 0%, color-mix(in oklab, var(--primary) 65%, #000) 100%)",
        boxShadow: "0 2px 8px -2px color-mix(in oklab, var(--primary) 55%, transparent)",
      }}
    >
      <svg
        width={size * 0.56}
        height={size * 0.56}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="text-white"
      >
        <path
          d="M4 6.5C4 5.67 4.67 5 5.5 5H20L16.5 9.5H8.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path d="M4 12h11l-3.5 4.5H4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
        <path d="M4 19h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
      </svg>
    </span>
  );
}

export function Logo({
  size = 32,
  className,
  hideWordmark,
}: {
  size?: number;
  className?: string;
  hideWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {!hideWordmark && (
        <span className="text-[17px] font-semibold tracking-[-0.02em]">FlowDesk</span>
      )}
    </span>
  );
}
