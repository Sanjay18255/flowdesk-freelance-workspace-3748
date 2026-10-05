import {
  BarChart3,
  CalendarClock,
  FolderKanban,
  FolderOpen,
  Handshake,
  LayoutDashboard,
  ListChecks,
  Receipt,
  Settings,
  Users,
  UsersRound,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  group: "workspace" | "business" | "account";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, group: "workspace" },
  { href: "/app/clients", label: "Clients", icon: Users, group: "workspace" },
  { href: "/app/pipeline", label: "Pipeline", icon: Handshake, group: "workspace" },
  { href: "/app/projects", label: "Projects", icon: FolderKanban, group: "workspace" },
  { href: "/app/tasks", label: "Tasks", icon: ListChecks, group: "workspace" },
  { href: "/app/invoices", label: "Invoices", icon: Receipt, group: "business" },
  { href: "/app/meetings", label: "Meetings", icon: CalendarClock, group: "business" },
  { href: "/app/files", label: "Files", icon: FolderOpen, group: "business" },
  { href: "/app/reports", label: "Reports", icon: BarChart3, group: "business" },
  { href: "/app/team", label: "Team", icon: UsersRound, group: "account" },
  { href: "/app/settings", label: "Settings", icon: Settings, group: "account" },
];

export const GROUP_LABEL: Record<NavItem["group"], string> = {
  workspace: "Workspace",
  business: "Business",
  account: "Organization",
};
