import { useEffect, useMemo, useState } from "react";
import { Link, useSearch as useQueryString } from "wouter";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Building2,
  LayoutGrid,
  List,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  Field,
  Input,
  MenuItem,
  Modal,
  PageHeader,
  PageSkeleton,
  STATUS_TONE,
  Segmented,
  Select,
} from "../../components/ui/kit";
import { useClients, useCreateClient, useDeleteClient, useUpdateClient } from "../../queries/clients";
import { useToast } from "../../components/toast";
import { money, shortDate } from "../../lib/format";
import { cn } from "../../lib/utils";

const INDUSTRIES = [
  "Technology",
  "E-commerce",
  "Finance",
  "Healthcare",
  "Education",
  "Real Estate",
  "Hospitality",
  "Media",
  "Non-profit",
  "Manufacturing",
];

const ACCENTS = ["indigo", "emerald", "amber", "rose", "sky", "violet"];

type ClientRow = ReturnType<typeof useClients>["data"] extends (infer T)[] | undefined ? T : never;

const EMPTY_FORM = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  industry: "Technology",
  website: "",
  address: "",
  timezone: "UTC",
  prefContact: "Email",
  status: "active" as "active" | "inactive" | "vip",
  accent: "indigo",
  clientSince: "",
};

function ClientForm({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: ClientRow | null;
}) {
  const create = useCreateClient();
  const update = useUpdateClient();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        contactPerson: editing.contactPerson ?? "",
        email: editing.email ?? "",
        phone: editing.phone ?? "",
        industry: editing.industry ?? "Technology",
        website: editing.website ?? "",
        address: editing.address ?? "",
        timezone: editing.timezone ?? "UTC",
        prefContact: editing.prefContact ?? "Email",
        status: (editing.status as "active" | "inactive" | "vip") ?? "active",
        accent: editing.accent ?? "indigo",
        clientSince: editing.clientSince ?? "",
      });
    } else {
      setForm({ ...EMPTY_FORM, clientSince: new Date().toISOString().slice(0, 10) });
    }
  }, [open, editing]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      await update.mutateAsync({ id: editing.id, ...form });
      toast.success("Client updated", form.name);
    } else {
      await create.mutateAsync(form);
      toast.success("Client added", `${form.name} is in your workspace.`);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit client" : "New client"}
      subtitle={editing ? "Update the details on this account." : "Add a company you work with."}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending || update.isPending}>
            {editing ? "Save changes" : "Add client"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" className="sm:col-span-2">
          <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Northline Studio" />
        </Field>
        <Field label="Primary contact">
          <Input value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} placeholder="Jamie Fox" />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="hello@company.com" />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 0100" />
        </Field>
        <Field label="Website">
          <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="company.com" />
        </Field>
        <Field label="Industry">
          <Select value={form.industry} onChange={(e) => set("industry", e.target.value)}>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(e) => set("status", e.target.value as "active" | "inactive" | "vip")}
          >
            <option value="active">Active</option>
            <option value="vip">VIP</option>
            <option value="inactive">Inactive</option>
          </Select>
        </Field>
        <Field label="Preferred contact">
          <Select value={form.prefContact} onChange={(e) => set("prefContact", e.target.value)}>
            {["Email", "Phone Call", "WhatsApp", "Slack", "Zoom"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Timezone">
          <Select value={form.timezone} onChange={(e) => set("timezone", e.target.value)}>
            {["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney"].map(
              (t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ),
            )}
          </Select>
        </Field>
        <Field label="Client since">
          <Input type="date" value={form.clientSince} onChange={(e) => set("clientSince", e.target.value)} />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="221B Baker Street, London" />
        </Field>
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[12.5px] font-medium text-muted-foreground">Avatar colour</p>
          <div className="flex gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => set("accent", a)}
                aria-label={a}
                className={cn(
                  "h-8 w-8 rounded-full ring-offset-2 ring-offset-card transition-all",
                  form.accent === a && "ring-2 ring-primary",
                )}
              >
                <Avatar name={form.name || "AB"} accent={a} size="sm" />
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function ClientsPage() {
  const qs = useQueryString();
  const { data, isLoading } = useClients();
  const remove = useDeleteClient();
  const toast = useToast();

  const [view, setView] = useState<"grid" | "table">("grid");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [sort, setSort] = useState("recent");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [deleting, setDeleting] = useState<ClientRow | null>(null);

  useEffect(() => {
    if (new URLSearchParams(qs).get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
    }
  }, [qs]);

  const rows = useMemo(() => {
    let list = data ?? [];
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter((c) =>
        [c.name, c.contactPerson, c.email, c.industry].some((v) => (v ?? "").toLowerCase().includes(needle)),
      );
    }
    if (status !== "all") list = list.filter((c) => c.status === status);
    if (industry !== "all") list = list.filter((c) => c.industry === industry);
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "value") sorted.sort((a, b) => b.lifetimeValue - a.lifetimeValue);
    if (sort === "projects") sorted.sort((a, b) => b.totalProjects - a.totalProjects);
    return sorted;
  }, [data, q, status, industry, sort]);

  if (isLoading) return <PageSkeleton />;

  const all = data ?? [];
  const totals = {
    count: all.length,
    vip: all.filter((c) => c.status === "vip").length,
    value: all.reduce((sum, c) => sum + c.lifetimeValue, 0),
    outstanding: all.reduce((sum, c) => sum + c.outstanding, 0),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        subtitle={`${totals.count} companies · ${money(totals.value, "USD", true)} lifetime revenue · ${money(totals.outstanding, "USD", true)} outstanding`}
        actions={
          <>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "grid", label: "Grid", icon: LayoutGrid },
                { value: "table", label: "Table", icon: List },
              ]}
            />
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus size={16} strokeWidth={2.2} />
              New client
            </Button>
          </>
        }
      />

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…" className="pl-9" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto min-w-[130px]">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="vip">VIP</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-auto min-w-[150px]">
          <option value="all">All industries</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-auto min-w-[150px]">
          <option value="recent">Recently added</option>
          <option value="name">Name A–Z</option>
          <option value="value">Highest value</option>
          <option value="projects">Most projects</option>
        </Select>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={all.length ? "No clients match those filters" : "No clients yet"}
            body={
              all.length
                ? "Try clearing the search or switching the status filter."
                : "Add your first client to start tracking projects, invoices and conversations in one place."
            }
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus size={16} strokeWidth={2.2} />
                New client
              </Button>
            }
          />
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: Math.min(i, 8) * 0.03 }}
            >
              <Card hover className="flex h-full flex-col p-5">
                <div className="flex items-start gap-3.5">
                  <Avatar name={c.name} accent={c.accent ?? "indigo"} size="md" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/app/clients/${c.id}`} className="block truncate text-[15px] font-semibold hover:text-primary">
                      {c.name}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-muted-foreground">
                      <Building2 size={12} strokeWidth={1.9} />
                      {c.industry}
                    </p>
                  </div>
                  <Dropdown
                    trigger={
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground">
                        <MoreHorizontal size={16} strokeWidth={1.9} />
                      </span>
                    }
                  >
                    {(close) => (
                      <>
                        <MenuItem
                          icon={Pencil}
                          onClick={() => {
                            setEditing(c);
                            setFormOpen(true);
                            close();
                          }}
                        >
                          Edit client
                        </MenuItem>
                        <MenuItem
                          icon={Trash2}
                          tone="danger"
                          onClick={() => {
                            setDeleting(c);
                            close();
                          }}
                        >
                          Delete
                        </MenuItem>
                      </>
                    )}
                  </Dropdown>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_TONE[c.status] ?? "neutral"} dot>
                    {c.status}
                  </Badge>
                  {c.overdueCount > 0 && <Badge tone="danger">{c.overdueCount} overdue</Badge>}
                  {c.activeProjects > 0 && <Badge tone="primary">{c.activeProjects} active</Badge>}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Lifetime</p>
                    <p className="mt-0.5 text-[15px] font-semibold tnum">{money(c.lifetimeValue, "USD", true)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Outstanding</p>
                    <p className={cn("mt-0.5 text-[15px] font-semibold tnum", c.outstanding > 0 && "text-warning")}>
                      {money(c.outstanding, "USD", true)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-[12.5px] text-muted-foreground">
                  {c.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail size={12.5} strokeWidth={1.9} />
                      {c.email}
                    </p>
                  )}
                  {c.phone && (
                    <p className="flex items-center gap-2 truncate">
                      <Phone size={12.5} strokeWidth={1.9} />
                      {c.phone}
                    </p>
                  )}
                </div>

                <Link
                  href={`/app/clients/${c.id}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary hover:underline"
                >
                  Open profile
                  <ArrowUpRight size={13} strokeWidth={2} />
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-[13.5px]">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {["Client", "Status", "Projects", "Lifetime", "Outstanding", "Last contact", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-border transition-colors last:border-0 hover:bg-hover">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} accent={c.accent ?? "indigo"} size="sm" />
                        <div className="min-w-0">
                          <Link href={`/app/clients/${c.id}`} className="block truncate font-medium hover:text-primary">
                            {c.name}
                          </Link>
                          <p className="truncate text-[12px] text-muted-foreground">{c.contactPerson || c.industry}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[c.status] ?? "neutral"} dot>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tnum text-muted-foreground">
                      {c.activeProjects} / {c.totalProjects}
                    </td>
                    <td className="px-4 py-3 font-medium tnum">{money(c.lifetimeValue)}</td>
                    <td className={cn("px-4 py-3 tnum", c.outstanding > 0 ? "text-warning" : "text-muted-foreground")}>
                      {money(c.outstanding)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{shortDate(c.lastContact)}</td>
                    <td className="px-4 py-3 text-right">
                      <Dropdown
                        trigger={
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground">
                            <MoreHorizontal size={16} strokeWidth={1.9} />
                          </span>
                        }
                      >
                        {(close) => (
                          <>
                            <MenuItem
                              icon={Pencil}
                              onClick={() => {
                                setEditing(c);
                                setFormOpen(true);
                                close();
                              }}
                            >
                              Edit client
                            </MenuItem>
                            <MenuItem
                              icon={Trash2}
                              tone="danger"
                              onClick={() => {
                                setDeleting(c);
                                close();
                              }}
                            >
                              Delete
                            </MenuItem>
                          </>
                        )}
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ClientForm open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this client?"
        body={`${deleting?.name ?? "This client"} and its contacts, notes and communication log will be permanently removed. Projects and invoices stay in your workspace.`}
        loading={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          await remove.mutateAsync({ id: deleting.id });
          toast.success("Client deleted", deleting.name);
          setDeleting(null);
        }}
      />
    </div>
  );
}
