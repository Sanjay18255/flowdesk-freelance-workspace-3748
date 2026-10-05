import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark" | "system";
export const ACCENT_OPTIONS = ["indigo", "violet", "blue", "emerald", "amber", "rose"] as const;
export type AccentOption = (typeof ACCENT_OPTIONS)[number];

type ThemeCtx = {
  theme: Theme;
  resolved: "light" | "dark";
  accent: AccentOption;
  compact: boolean;
  setTheme: (t: Theme) => void;
  setAccent: (a: AccentOption) => void;
  setCompact: (c: boolean) => void;
  toggle: () => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

const THEME_KEY = "flowdesk-theme";
const ACCENT_KEY = "flowdesk-accent";
const COMPACT_KEY = "flowdesk-compact";

function read<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T | null) ?? fallback;
  } catch {
    return fallback;
  }
}

function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  return dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => read<Theme>(THEME_KEY, "system"));
  const [accent, setAccentState] = useState<AccentOption>(() =>
    read<AccentOption>(ACCENT_KEY, "indigo"),
  );
  const [compact, setCompactState] = useState<boolean>(() => read<string>(COMPACT_KEY, "false") === "true");
  const [resolved, setResolved] = useState<"light" | "dark">(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  useEffect(() => {
    setResolved(applyTheme(theme) as "light" | "dark");
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(applyTheme("system") as "light" | "dark");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.classList.toggle("text-[13px]", compact);
  }, [compact]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const setAccent = useCallback((a: AccentOption) => {
    setAccentState(a);
    try {
      localStorage.setItem(ACCENT_KEY, a);
    } catch {
      /* ignore */
    }
  }, []);

  const setCompact = useCallback((c: boolean) => {
    setCompactState(c);
    try {
      localStorage.setItem(COMPACT_KEY, String(c));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<ThemeCtx>(
    () => ({
      theme,
      resolved,
      accent,
      compact,
      setTheme,
      setAccent,
      setCompact,
      toggle: () => setTheme(resolved === "dark" ? "light" : "dark"),
    }),
    [theme, resolved, accent, compact, setTheme, setAccent, setCompact],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
