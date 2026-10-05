import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, useLocation } from "wouter";
import {
  Bell,
  Check,
  ChevronLeft,
  CircleUser,
  HelpCircle,
  LifeBuoy,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { authClient, clearToken } from "../../lib/auth";
import { cn } from "../../lib/utils";
import { relative } from "../../lib/format";
import { Avatar, Badge, Dropdown, MenuItem } from "../ui/kit";
import { Logo, LogoMark } from "../logo";
import { GROUP_LABEL, NAV_ITEMS, type NavItem } from "./nav-items";
import { CommandPalette } from "./command-palette";
import {
  useClearNotifications,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useRemoveNotification,
} from "../../queries/notifications";
import { useTheme } from "../theme";

const SIDEBAR_KEY = "flowdesk-sidebar-collapsed";

function NavLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const [location] = useLocation();
  const active = item.href === "/app" ? location === "/app" : location.startsWith(item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-colors duration-150",
        active ? "text-primary" : "text-muted-foreground hover:bg-hover hover:text-foreground",
        collapsed && "justify-center px-0",
      )}
      title={collapsed ? item.label : undefined}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          transition={{ type: "spring", stiffness: 480, damping: 36 }}
          className="absolute inset-0 rounded-[10px] bg-primary-soft"
        />
      )}
      {active && (
        <motion.span
          layoutId="nav-indicator"
          transition={{ type: "spring", stiffness: 480, damping: 36 }}
          className="absolute -left-2 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary"
        />
      )}
      <Icon size={17} strokeWidth={1.75} className="relative shrink-0" />
      {!collapsed && <span className="relative truncate">{item.label}</span>}
    </Link>
  );
}

function SidebarBody({
  collapsed,
  onNavigate,
  onCollapse,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  onCollapse?: () => void;
}) {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const groups: NavItem["group"][] = ["workspace", "business", "account"];

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center border-b border-border px-4", collapsed && "justify-center px-0")}>
        <Link href="/app" onClick={onNavigate} className="flex items-center">
          {collapsed ? <LogoMark size={30} /> : <Logo size={30} />}
        </Link>
        {onCollapse && !collapsed && (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            className="ml-auto hidden rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-hover hover:text-foreground lg:block"
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </button>
        )}
      </div>

      <nav className="thin-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {groups.map((group, gi) => (
          <div key={group} className={cn(gi > 0 && "mt-6")}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {GROUP_LABEL[group]}
              </p>
            )}
            <div className="space-y-0.5">
              {NAV_ITEMS.filter((n) => n.group === group).map((item) => (
                <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/app/help"
          onClick={onNavigate}
          className={cn(
            "mb-2 flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
          title={collapsed ? "Help" : undefined}
        >
          <LifeBuoy size={17} strokeWidth={1.75} />
          {!collapsed && "Help & support"}
        </Link>
        <div className={cn("flex items-center gap-3 rounded-[10px] px-2 py-2", collapsed && "justify-center px-0")}>
          <Avatar name={user?.name ?? "You"} image={user?.image ?? null} size="sm" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium leading-tight">{user?.name ?? "You"}</p>
              <p className="truncate text-[11.5px] text-muted-foreground">Professional plan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationBell() {
  const { data } = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const removeOne = useRemoveNotification();
  const clearAll = useClearNotifications();
  const items = data ?? [];
  const unread = items.filter((n) => !n.read).length;

  return (
    <Dropdown
      align="right"
      className="w-[min(380px,calc(100vw-2rem))] p-0"
      trigger={
        <span className="relative flex h-9 w-9 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-hover hover:text-foreground">
          <Bell size={17} strokeWidth={1.75} />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9.5px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
      }
    >
      {() => (
        <div>
          <div className="flex items-center justify-between gap-3 border-b border-border px-3.5 py-3">
            <p className="text-[13.5px] font-semibold">Notifications</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => markAll.mutate({})}
                className="rounded-md px-2 py-1 text-[11.5px] font-medium text-primary transition-colors hover:bg-primary-soft"
              >
                Mark all read
              </button>
              <button
                type="button"
                onClick={() => clearAll.mutate({})}
                aria-label="Clear all"
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-hover hover:text-danger"
              >
                <Trash2 size={13.5} strokeWidth={1.75} />
              </button>
            </div>
          </div>
          <div className="thin-scrollbar max-h-[380px] overflow-y-auto py-1">
            {items.length === 0 && (
              <p className="px-3.5 py-8 text-center text-[13px] text-muted-foreground">You're all caught up.</p>
            )}
            {items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "group flex gap-3 px-3.5 py-3 transition-colors hover:bg-hover",
                  !n.read && "bg-primary-soft/40",
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    n.read ? "bg-transparent" : "bg-primary",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-snug">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground/80">{relative(n.createdAt)}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {!n.read && (
                    <button
                      type="button"
                      aria-label="Mark read"
                      onClick={() => markRead.mutate({ id: n.id })}
                      className="rounded-md p-1 text-muted-foreground hover:text-success"
                    >
                      <Check size={13} strokeWidth={2} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => removeOne.mutate({ id: n.id })}
                    className="rounded-md p-1 text-muted-foreground hover:text-danger"
                  >
                    <X size={13} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Dropdown>
  );
}

function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme();
  return (
    <Dropdown
      trigger={
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-hover hover:text-foreground">
          {resolved === "dark" ? <Moon size={17} strokeWidth={1.75} /> : <Sun size={17} strokeWidth={1.75} />}
        </span>
      }
    >
      {(close) => (
        <>
          {(
            [
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
              { id: "system", label: "System", icon: Monitor },
            ] as const
          ).map((o) => (
            <MenuItem
              key={o.id}
              icon={o.icon}
              onClick={() => {
                setTheme(o.id);
                close();
              }}
            >
              <span className="flex items-center gap-2">
                {o.label}
                {theme === o.id && <Check size={12} strokeWidth={2.5} className="text-primary" />}
              </span>
            </MenuItem>
          ))}
        </>
      )}
    </Dropdown>
  );
}

function ProfileMenu() {
  const { data: session } = authClient.useSession();
  const [, navigate] = useLocation();
  const user = session?.user;
  return (
    <Dropdown
      trigger={
        <span className="flex items-center gap-2 rounded-[10px] p-1 pr-2 transition-colors hover:bg-hover">
          <Avatar name={user?.name ?? "You"} image={user?.image ?? null} size="sm" />
        </span>
      }
    >
      {(close) => (
        <>
          <div className="border-b border-border px-2.5 pb-2.5 pt-1.5">
            <p className="truncate text-[13.5px] font-semibold">{user?.name ?? "You"}</p>
            <p className="truncate text-[12px] text-muted-foreground">{user?.email}</p>
            <Badge tone="primary" className="mt-2">
              Professional
            </Badge>
          </div>
          <div className="pt-1">
            <MenuItem
              icon={CircleUser}
              onClick={() => {
                navigate("/app/settings");
                close();
              }}
            >
              Profile
            </MenuItem>
            <MenuItem
              icon={Settings}
              onClick={() => {
                navigate("/app/settings");
                close();
              }}
            >
              Settings
            </MenuItem>
            <MenuItem
              icon={HelpCircle}
              onClick={() => {
                navigate("/app/help");
                close();
              }}
            >
              Help & support
            </MenuItem>
            <MenuItem
              icon={LogOut}
              tone="danger"
              onClick={async () => {
                close();
                await authClient.signOut();
                clearToken();
                window.location.href = "/";
              }}
            >
              Sign out
            </MenuItem>
          </div>
        </>
      )}
    </Dropdown>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [location, navigate] = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => setDrawer(false), [location]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-sidebar transition-[width] duration-200 lg:block",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <SidebarBody collapsed={collapsed} onCollapse={() => setCollapsed(true)} />
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-[var(--shadow-card)] transition-colors hover:text-foreground lg:flex"
          >
            <ChevronLeft size={13} strokeWidth={2} className="rotate-180" />
          </button>
        )}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-[90] lg:hidden">
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
              className="absolute inset-0 bg-[#0b0c0f]/45"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
              className="absolute inset-y-0 left-0 w-64 border-r border-border bg-sidebar"
            >
              <SidebarBody collapsed={false} onNavigate={() => setDrawer(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-hover hover:text-foreground lg:hidden"
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={() => setPalette(true)}
              className="group flex h-9 flex-1 items-center gap-2.5 rounded-[10px] border border-border bg-card px-3 text-left text-muted-foreground transition-colors hover:border-muted-foreground/30 sm:max-w-md"
            >
              <Search size={16} strokeWidth={1.75} />
              <span className="flex-1 truncate text-[13px]">Search or jump to…</span>
              <kbd className="hidden shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[10.5px] font-medium sm:block">
                ⌘K
              </kbd>
            </button>

            <div className="ml-auto flex items-center gap-1.5">
              <Dropdown
                trigger={
                  <span className="hidden h-9 items-center gap-1.5 rounded-[10px] bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-all hover:brightness-110 sm:flex">
                    <Plus size={15} strokeWidth={2.25} />
                    Create
                  </span>
                }
              >
                {(close) => (
                  <>
                    {[
                      { label: "New client", href: "/app/clients?new=1" },
                      { label: "New project", href: "/app/projects?new=1" },
                      { label: "New task", href: "/app/tasks?new=1" },
                      { label: "New invoice", href: "/app/invoices?new=1" },
                      { label: "Schedule meeting", href: "/app/meetings?new=1" },
                      { label: "New lead", href: "/app/pipeline?new=1" },
                    ].map((a) => (
                      <MenuItem
                        key={a.href}
                        icon={Plus}
                        onClick={() => {
                          navigate(a.href);
                          close();
                        }}
                      >
                        {a.label}
                      </MenuItem>
                    ))}
                  </>
                )}
              </Dropdown>
              <NotificationBell />
              <ThemeToggle />
              <ProfileMenu />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>

      {/* Mobile quick create */}
      <div className="fixed bottom-5 right-5 z-40 sm:hidden">
        <Dropdown
          align="right"
          trigger={
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-pop)]">
              <Plus size={20} strokeWidth={2.25} />
            </span>
          }
        >
          {(close) => (
            <>
              {[
                { label: "New client", href: "/app/clients?new=1" },
                { label: "New project", href: "/app/projects?new=1" },
                { label: "New task", href: "/app/tasks?new=1" },
                { label: "New invoice", href: "/app/invoices?new=1" },
              ].map((a) => (
                <MenuItem
                  key={a.href}
                  icon={Plus}
                  onClick={() => {
                    navigate(a.href);
                    close();
                  }}
                >
                  {a.label}
                </MenuItem>
              ))}
            </>
          )}
        </Dropdown>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
