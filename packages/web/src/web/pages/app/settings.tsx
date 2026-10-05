import { useEffect, useState } from "react";
import { Check, Laptop, LogOut, Monitor, Moon, Palette, Save, Shield, Sun, Trash2, User } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  PageSkeleton,
  Select,
  Switch,
  Tabs,
  Textarea,
} from "../../components/ui/kit";
import { useSavePrefs, useSessions, useSettings, useUpdateProfile } from "../../queries/account";
import { authClient, clearToken } from "../../lib/auth";
import { ACCENT_OPTIONS, useTheme, type AccentOption } from "../../components/theme";
import { useToast } from "../../components/toast";
import { relative } from "../../lib/format";
import { cn } from "../../lib/utils";

const ACCENT_HEX: Record<AccentOption, string> = {
  indigo: "#4f46e5",
  violet: "#7c3aed",
  blue: "#2563eb",
  emerald: "#059669",
  amber: "#d97706",
  rose: "#e11d48",
};

const NOTIFY_KEYS = [
  { key: "invoicePaid", label: "Invoice paid", body: "When a payment is recorded against an invoice." },
  { key: "invoiceOverdue", label: "Invoice overdue", body: "When an invoice passes its due date." },
  { key: "taskDue", label: "Task due", body: "Morning summary of what's due today." },
  { key: "projectDeadline", label: "Project deadline", body: "Seven days before a project is due." },
  { key: "meetingReminder", label: "Meeting reminder", body: "Before a scheduled meeting starts." },
  { key: "newComment", label: "Comments", body: "When someone comments on a project or task." },
  { key: "weeklyDigest", label: "Weekly digest", body: "Monday summary of revenue, hours and delivery." },
];

export default function SettingsPage() {
  const settings = useSettings();
  const sessions = useSessions();
  const savePrefs = useSavePrefs();
  const updateProfile = useUpdateProfile();
  const { data: session } = authClient.useSession();
  const { theme, setTheme, accent, setAccent, compact, setCompact } = useTheme();
  const toast = useToast();

  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState({
    name: "",
    jobTitle: "",
    bio: "",
    phone: "",
    timezone: "UTC",
    website: "",
    twitter: "",
    linkedin: "",
    dribbble: "",
  });
  const [business, setBusiness] = useState({
    name: "",
    logoText: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    taxNumber: "",
    currency: "USD",
    invoiceTerms: "Net 14",
  });
  const [notify, setNotify] = useState<Record<string, boolean>>({});
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });

  useEffect(() => {
    const prefs = settings.data?.prefs;
    if (!prefs) return;
    setProfile((p) => ({
      ...p,
      name: session?.user?.name ?? p.name,
      jobTitle: prefs.profile?.jobTitle ?? "",
      bio: prefs.profile?.bio ?? "",
      phone: prefs.profile?.phone ?? "",
      timezone: prefs.profile?.timezone ?? "UTC",
      website: prefs.profile?.website ?? "",
      twitter: prefs.profile?.twitter ?? "",
      linkedin: prefs.profile?.linkedin ?? "",
      dribbble: prefs.profile?.dribbble ?? "",
    }));
    setBusiness((b) => ({
      ...b,
      name: prefs.business?.name ?? "",
      logoText: prefs.business?.logoText ?? "",
      email: prefs.business?.email ?? session?.user?.email ?? "",
      phone: prefs.business?.phone ?? "",
      website: prefs.business?.website ?? "",
      address: prefs.business?.address ?? "",
      taxNumber: prefs.business?.taxNumber ?? "",
      currency: prefs.business?.currency ?? "USD",
      invoiceTerms: prefs.business?.invoiceTerms ?? "Net 14",
    }));
    setNotify(
      NOTIFY_KEYS.reduce<Record<string, boolean>>((acc, n) => {
        acc[n.key] = prefs.notify?.[n.key] ?? true;
        return acc;
      }, {}),
    );
  }, [settings.data, session]);

  if (settings.isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Your profile, business details, appearance and notifications" />

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "profile", label: "Profile" },
          { id: "business", label: "Business" },
          { id: "appearance", label: "Appearance" },
          { id: "notifications", label: "Notifications" },
          { id: "security", label: "Security" },
        ]}
      />

      {tab === "profile" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader
              title="Your profile"
              subtitle="Shown on comments, activity and meeting notes"
              action={
                <Button
                  size="sm"
                  loading={updateProfile.isPending || savePrefs.isPending}
                  onClick={async () => {
                    await updateProfile.mutateAsync({ name: profile.name, jobTitle: profile.jobTitle });
                    await savePrefs.mutateAsync({
                      profile: {
                        jobTitle: profile.jobTitle,
                        bio: profile.bio,
                        phone: profile.phone,
                        timezone: profile.timezone,
                        website: profile.website,
                        twitter: profile.twitter,
                        linkedin: profile.linkedin,
                        dribbble: profile.dribbble,
                      },
                    });
                    toast.success("Profile saved");
                  }}
                >
                  <Save size={15} strokeWidth={1.9} />
                  Save
                </Button>
              }
            />
            <div className="grid gap-4 p-5 pt-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
              </Field>
              <Field label="Job title">
                <Input
                  value={profile.jobTitle}
                  onChange={(e) => setProfile((p) => ({ ...p, jobTitle: e.target.value }))}
                  placeholder="Independent designer"
                />
              </Field>
              <Field label="Email" hint="Sign-in email can't be changed here.">
                <Input value={session?.user?.email ?? ""} disabled />
              </Field>
              <Field label="Phone">
                <Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
              </Field>
              <Field label="Timezone">
                <Select value={profile.timezone} onChange={(e) => setProfile((p) => ({ ...p, timezone: e.target.value }))}>
                  {[
                    "UTC",
                    "America/New_York",
                    "America/Chicago",
                    "America/Los_Angeles",
                    "Europe/London",
                    "Europe/Berlin",
                    "Asia/Kolkata",
                    "Asia/Singapore",
                    "Australia/Sydney",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Website">
                <Input value={profile.website} onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))} />
              </Field>
              <Field label="Bio" className="sm:col-span-2">
                <Textarea
                  rows={3}
                  value={profile.bio}
                  onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="A line about what you do."
                />
              </Field>
              <Field label="X / Twitter">
                <Input value={profile.twitter} onChange={(e) => setProfile((p) => ({ ...p, twitter: e.target.value }))} />
              </Field>
              <Field label="LinkedIn">
                <Input value={profile.linkedin} onChange={(e) => setProfile((p) => ({ ...p, linkedin: e.target.value }))} />
              </Field>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar name={profile.name || "You"} size="lg" image={session?.user?.image ?? null} />
              <p className="mt-3 text-[15px] font-semibold">{profile.name || "Your name"}</p>
              <p className="text-[12.5px] text-muted-foreground">{profile.jobTitle || "Add a job title"}</p>
              <Badge tone="primary" className="mt-3">
                Professional plan
              </Badge>
              <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">
                {profile.bio || "Your bio appears here — a short line about the work you do."}
              </p>
            </div>
          </Card>
        </div>
      )}

      {tab === "business" && (
        <Card>
          <CardHeader
            title="Business details"
            subtitle="Used on every invoice you send"
            action={
              <Button
                size="sm"
                loading={savePrefs.isPending}
                onClick={async () => {
                  await savePrefs.mutateAsync({ business });
                  await updateProfile.mutateAsync({ businessName: business.name });
                  toast.success("Business details saved");
                }}
              >
                <Save size={15} strokeWidth={1.9} />
                Save
              </Button>
            }
          />
          <div className="grid gap-4 p-5 pt-4 sm:grid-cols-2">
            <Field label="Business name">
              <Input value={business.name} onChange={(e) => setBusiness((b) => ({ ...b, name: e.target.value }))} placeholder="Morgan Studio" />
            </Field>
            <Field label="Invoice logo text" hint="Shown next to the mark on invoices.">
              <Input value={business.logoText} onChange={(e) => setBusiness((b) => ({ ...b, logoText: e.target.value }))} />
            </Field>
            <Field label="Billing email">
              <Input value={business.email} onChange={(e) => setBusiness((b) => ({ ...b, email: e.target.value }))} />
            </Field>
            <Field label="Phone">
              <Input value={business.phone} onChange={(e) => setBusiness((b) => ({ ...b, phone: e.target.value }))} />
            </Field>
            <Field label="Website">
              <Input value={business.website} onChange={(e) => setBusiness((b) => ({ ...b, website: e.target.value }))} />
            </Field>
            <Field label="Tax / VAT number">
              <Input value={business.taxNumber} onChange={(e) => setBusiness((b) => ({ ...b, taxNumber: e.target.value }))} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea rows={2} value={business.address} onChange={(e) => setBusiness((b) => ({ ...b, address: e.target.value }))} />
            </Field>
            <Field label="Default currency">
              <Select value={business.currency} onChange={(e) => setBusiness((b) => ({ ...b, currency: e.target.value }))}>
                {["USD", "EUR", "GBP", "INR", "AUD", "CAD"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Default payment terms">
              <Select value={business.invoiceTerms} onChange={(e) => setBusiness((b) => ({ ...b, invoiceTerms: e.target.value }))}>
                {["Due on receipt", "Net 7", "Net 14", "Net 30", "Net 45"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>
      )}

      {tab === "appearance" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Theme" subtitle="Applies instantly and remembers your choice" />
            <div className="grid gap-3 p-5 pt-4 sm:grid-cols-3">
              {(
                [
                  { id: "light", label: "Light", icon: Sun },
                  { id: "dark", label: "Dark", icon: Moon },
                  { id: "system", label: "System", icon: Monitor },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setTheme(o.id);
                    void savePrefs.mutateAsync({ theme: o.id });
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                    theme === o.id ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-hover",
                  )}
                >
                  <o.icon size={20} strokeWidth={1.75} />
                  <span className="text-[13px] font-medium">{o.label}</span>
                  {theme === o.id && <Check size={13} strokeWidth={2.5} />}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Accent colour" subtitle="Buttons, links and active states" />
            <div className="p-5 pt-4">
              <div className="flex flex-wrap gap-3">
                {ACCENT_OPTIONS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    aria-label={a}
                    onClick={() => {
                      setAccent(a);
                      void savePrefs.mutateAsync({ accent: a });
                    }}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-all",
                      accent === a && "ring-2 ring-primary",
                    )}
                    style={{ background: ACCENT_HEX[a] }}
                  >
                    {accent === a && <Check size={16} strokeWidth={3} className="text-white" />}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-border p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-primary-soft text-primary">
                  <Palette size={17} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">Preview</p>
                  <p className="text-[12.5px] text-muted-foreground">Accent applies across the whole workspace.</p>
                </div>
                <Button size="sm">Button</Button>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Density" subtitle="Fit more on screen" />
            <div className="space-y-4 p-5 pt-4">
              <Switch
                checked={compact}
                onChange={(v) => {
                  setCompact(v);
                  void savePrefs.mutateAsync({ compact: v });
                }}
                label="Compact mode"
                description="Slightly smaller type and tighter rows across tables and lists."
              />
            </div>
          </Card>
        </div>
      )}

      {tab === "notifications" && (
        <Card>
          <CardHeader
            title="Notifications"
            subtitle="Choose what shows up in your notification centre"
            action={
              <Button
                size="sm"
                loading={savePrefs.isPending}
                onClick={async () => {
                  await savePrefs.mutateAsync({ notify });
                  toast.success("Notification settings saved");
                }}
              >
                <Save size={15} strokeWidth={1.9} />
                Save
              </Button>
            }
          />
          <div className="divide-y divide-border p-5 pt-4">
            {NOTIFY_KEYS.map((n) => (
              <div key={n.key} className="py-4 first:pt-0 last:pb-0">
                <Switch
                  checked={notify[n.key] ?? true}
                  onChange={(v) => setNotify((s) => ({ ...s, [n.key]: v }))}
                  label={n.label}
                  description={n.body}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "security" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Change password" subtitle="At least 6 characters" />
            <div className="space-y-4 p-5 pt-4">
              <Field label="Current password">
                <Input
                  type="password"
                  value={password.current}
                  onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))}
                />
              </Field>
              <Field label="New password">
                <Input
                  type="password"
                  value={password.next}
                  onChange={(e) => setPassword((p) => ({ ...p, next: e.target.value }))}
                />
              </Field>
              <Field label="Confirm new password">
                <Input
                  type="password"
                  value={password.confirm}
                  onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
                />
              </Field>
              <Button
                onClick={async () => {
                  if (password.next.length < 6) {
                    toast.error("Password too short", "Use at least 6 characters.");
                    return;
                  }
                  if (password.next !== password.confirm) {
                    toast.error("Passwords don't match");
                    return;
                  }
                  const res = await authClient.changePassword({
                    currentPassword: password.current,
                    newPassword: password.next,
                  });
                  if (res.error) {
                    toast.error("Could not change password", res.error.message ?? "Check your current password.");
                    return;
                  }
                  setPassword({ current: "", next: "", confirm: "" });
                  toast.success("Password updated");
                }}
              >
                <Shield size={15} strokeWidth={1.9} />
                Update password
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Active sessions" subtitle="Devices signed in to your account" />
            <div className="p-5 pt-4">
              <ul className="divide-y divide-border">
                {(sessions.data ?? []).map((s) => (
                  <li key={s.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Laptop size={16} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {s.userAgent.slice(0, 48)}
                        {s.current && (
                          <Badge tone="success" className="ml-2">
                            This device
                          </Badge>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                        {s.ipAddress} · started {relative(s.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
                {(sessions.data ?? []).length === 0 && (
                  <li className="py-4 text-[13px] text-muted-foreground">No active sessions found.</li>
                )}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2.5 border-t border-border pt-5">
                <Button
                  variant="outline"
                  onClick={async () => {
                    await authClient.signOut();
                    clearToken();
                    window.location.href = "/";
                  }}
                >
                  <LogOut size={15} strokeWidth={1.9} />
                  Sign out
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => toast.error("Account deletion is disabled in this workspace")}
                  className="text-danger hover:bg-danger-soft"
                >
                  <Trash2 size={15} strokeWidth={1.9} />
                  Delete account
                </Button>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Account" subtitle="Plan and identity" />
            <div className="grid gap-4 p-5 pt-4 sm:grid-cols-3">
              {[
                ["Signed in as", session?.user?.email ?? "—"],
                ["Plan", "Professional"],
                ["Member since", session?.user?.createdAt ? relative(session.user.createdAt) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border p-4">
                  <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <User size={12} strokeWidth={1.9} />
                    {k}
                  </p>
                  <p className="mt-1.5 truncate text-[13.5px] font-medium">{v}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
