import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Clock,
  FileText,
  FolderKanban,
  Globe,
  Mail,
  MapPin,
  MessageSquarePlus,
  Phone,
  Plus,
  Receipt,
  StickyNote,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  PageSkeleton,
  Progress,
  STATUS_TONE,
  Select,
  Tabs,
  Textarea,
} from "../../components/ui/kit";
import {
  useAddContact,
  useClient,
  useLogCommunication,
  useRemoveClientNote,
  useRemoveCommunication,
  useRemoveContact,
  useSaveClientNote,
} from "../../queries/clients";
import { useToast } from "../../components/toast";
import { money, relative, shortDate, timeLabel, titleCase } from "../../lib/format";

const COMM_TYPES = ["Phone Call", "Email", "Meeting", "WhatsApp", "Zoom", "Feedback"];

export default function ClientDetailPage() {
  const { id = "" } = useParams();
  const { data, isLoading, error } = useClient(id);
  const addContact = useAddContact();
  const removeContact = useRemoveContact();
  const saveNote = useSaveClientNote();
  const removeNote = useRemoveClientNote();
  const logComm = useLogCommunication();
  const removeComm = useRemoveCommunication();
  const toast = useToast();

  const [tab, setTab] = useState("overview");
  const [contactOpen, setContactOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [commOpen, setCommOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", position: "", email: "", phone: "", linkedin: "" });
  const [noteForm, setNoteForm] = useState({ id: "", title: "", body: "" });
  const [commForm, setCommForm] = useState({
    type: "Email",
    summary: "",
    date: new Date().toISOString().slice(0, 10),
    followUpDate: "",
  });

  if (isLoading) return <PageSkeleton />;
  if (error || !data) {
    return (
      <Card>
        <EmptyState
          icon={Users}
          title="Client not found"
          body="This client may have been deleted."
          action={
            <Link href="/app/clients">
              <Button variant="outline">Back to clients</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const { client, stats, contacts, notes, communications, projects, invoices, meetings, files, activities } = data;

  return (
    <div className="space-y-6">
      <Link
        href="/app/clients"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} strokeWidth={2} />
        All clients
      </Link>

      {/* header */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={client.name} accent={client.accent ?? "indigo"} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[24px] font-semibold leading-tight">{client.name}</h1>
              <Badge tone={STATUS_TONE[client.status] ?? "neutral"} dot>
                {client.status}
              </Badge>
              <Badge tone={stats.paymentStatus === "Overdue" ? "danger" : stats.paymentStatus === "Pending" ? "warning" : "success"}>
                {stats.paymentStatus}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
              {client.contactPerson && (
                <span className="flex items-center gap-1.5">
                  <Users size={13} strokeWidth={1.9} />
                  {client.contactPerson}
                </span>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-foreground">
                  <Mail size={13} strokeWidth={1.9} />
                  {client.email}
                </a>
              )}
              {client.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={13} strokeWidth={1.9} />
                  {client.phone}
                </span>
              )}
              {client.website && (
                <span className="flex items-center gap-1.5">
                  <Globe size={13} strokeWidth={1.9} />
                  {client.website}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Building2 size={13} strokeWidth={1.9} />
                {client.industry}
              </span>
              {client.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} strokeWidth={1.9} />
                  {client.address}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="outline" size="sm" onClick={() => setCommOpen(true)}>
              <MessageSquarePlus size={15} strokeWidth={1.9} />
              Log contact
            </Button>
            <Link href="/app/projects?new=1">
              <Button size="sm">
                <Plus size={15} strokeWidth={2.2} />
                New project
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Lifetime value", value: money(stats.lifetimeValue) },
            { label: "Outstanding", value: money(stats.outstanding) },
            { label: "Projects", value: `${stats.activeProjects} / ${stats.totalProjects}` },
            { label: "Avg project", value: money(stats.avgProjectSize) },
            { label: "Client since", value: shortDate(client.clientSince) },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-[17px] font-semibold tnum">{s.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "projects", label: "Projects", count: projects.length },
          { id: "invoices", label: "Invoices", count: invoices.length },
          { id: "contacts", label: "Contacts", count: contacts.length },
          { id: "communication", label: "Communication", count: communications.length },
          { id: "notes", label: "Notes", count: notes.length },
          { id: "meetings", label: "Meetings", count: meetings.length },
          { id: "files", label: "Files", count: files.length },
        ]}
      />

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Card>
            <CardHeader title="Activity" subtitle="Everything logged against this client" />
            <div className="p-5 pt-4">
              {activities.length === 0 ? (
                <EmptyState icon={Clock} title="No activity yet" body="Actions on this client will appear here." />
              ) : (
                <ul className="space-y-3.5">
                  {activities.map((a) => (
                    <li key={a.id} className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <div>
                        <p className="text-[13.5px] leading-snug">{a.text}</p>
                        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                          {a.actor} · {relative(a.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardHeader title="Preferences" />
              <dl className="space-y-3 p-5 pt-4 text-[13.5px]">
                {[
                  ["Preferred contact", client.prefContact],
                  ["Timezone", client.timezone],
                  ["Last contact", shortDate(client.lastContact)],
                  ["Industry", client.industry],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card>
              <CardHeader title="Latest note" />
              <div className="p-5 pt-4">
                {notes[0] ? (
                  <>
                    <p className="text-[13.5px] font-medium">{notes[0].title}</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                      {notes[0].body}
                    </p>
                    <p className="mt-3 text-[11.5px] text-muted-foreground">{relative(notes[0].updatedAt)}</p>
                  </>
                ) : (
                  <EmptyState icon={StickyNote} title="No notes" body="Capture context you don't want to forget." />
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "projects" && (
        <Card>
          <CardHeader title="Projects" subtitle={`${projects.length} total`} />
          <div className="p-5 pt-4">
            {projects.length === 0 ? (
              <EmptyState icon={FolderKanban} title="No projects" body="Create a project for this client." />
            ) : (
              <ul className="divide-y divide-border">
                {projects.map((p) => (
                  <li key={p.id} className="py-3.5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Link href={`/app/projects/${p.id}`} className="text-[14px] font-medium hover:text-primary">
                        {p.name}
                      </Link>
                      <div className="flex items-center gap-3">
                        <Badge tone={STATUS_TONE[p.status] ?? "neutral"}>{titleCase(p.status)}</Badge>
                        <span className="text-[13px] font-medium tnum">{money(p.budget)}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <Progress value={p.progress} className="flex-1" showLabel />
                      <span className="shrink-0 text-[12px] text-muted-foreground">Due {shortDate(p.deadline)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {tab === "invoices" && (
        <Card className="overflow-hidden">
          <CardHeader title="Invoices" subtitle={`${invoices.length} issued`} />
          <div className="mt-4 overflow-x-auto">
            {invoices.length === 0 ? (
              <EmptyState icon={Receipt} title="No invoices" body="Invoice this client from the invoices page." />
            ) : (
              <table className="w-full min-w-[640px] text-left text-[13.5px]">
                <thead className="border-y border-border bg-muted/40">
                  <tr>
                    {["Invoice", "Issued", "Due", "Amount", "Status"].map((h) => (
                      <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-hover">
                      <td className="px-5 py-3">
                        <Link href={`/app/invoices/${inv.id}`} className="font-medium hover:text-primary">
                          {inv.number}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{shortDate(inv.issueDate)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{shortDate(inv.dueDate)}</td>
                      <td className="px-5 py-3 font-medium tnum">{money(inv.total, inv.currency ?? "USD")}</td>
                      <td className="px-5 py-3">
                        <Badge tone={STATUS_TONE[inv.status] ?? "neutral"}>{inv.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {tab === "contacts" && (
        <Card>
          <CardHeader
            title="Contacts"
            subtitle="People you work with at this company"
            action={
              <Button size="sm" variant="outline" onClick={() => setContactOpen(true)}>
                <UserPlus size={15} strokeWidth={1.9} />
                Add contact
              </Button>
            }
          />
          <div className="p-5 pt-4">
            {contacts.length === 0 ? (
              <EmptyState icon={Users} title="No contacts" body="Add the people you actually talk to." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {contacts.map((c) => (
                  <div key={c.id} className="group flex items-start gap-3 rounded-xl border border-border p-4">
                    <Avatar name={c.name} accent={client.accent ?? "indigo"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{c.name}</p>
                      <p className="truncate text-[12.5px] text-muted-foreground">{c.position}</p>
                      {c.email && <p className="mt-1.5 truncate text-[12.5px] text-muted-foreground">{c.email}</p>}
                      {c.phone && <p className="truncate text-[12.5px] text-muted-foreground">{c.phone}</p>}
                    </div>
                    <button
                      type="button"
                      aria-label="Remove contact"
                      onClick={async () => {
                        await removeContact.mutateAsync({ id: c.id });
                        toast.success("Contact removed");
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
                    >
                      <Trash2 size={14} strokeWidth={1.9} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === "communication" && (
        <Card>
          <CardHeader
            title="Communication log"
            subtitle="Every call, email and message you logged"
            action={
              <Button size="sm" variant="outline" onClick={() => setCommOpen(true)}>
                <MessageSquarePlus size={15} strokeWidth={1.9} />
                Log contact
              </Button>
            }
          />
          <div className="p-5 pt-4">
            {communications.length === 0 ? (
              <EmptyState icon={MessageSquarePlus} title="Nothing logged" body="Log a call or email to build history." />
            ) : (
              <ul className="space-y-4">
                {communications.map((c) => (
                  <li key={c.id} className="group relative border-l border-border pl-5">
                    <span className="absolute -left-[4.5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Badge tone="primary">{c.type}</Badge>
                      <span className="text-[12.5px] text-muted-foreground">{shortDate(c.date)}</span>
                      {c.followUpDate && <Badge tone="warning">Follow up {shortDate(c.followUpDate)}</Badge>}
                      <button
                        type="button"
                        aria-label="Remove entry"
                        onClick={() => removeComm.mutate({ id: c.id })}
                        className="ml-auto rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
                      >
                        <Trash2 size={13.5} strokeWidth={1.9} />
                      </button>
                    </div>
                    <p className="mt-2 text-[13.5px] leading-relaxed">{c.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {tab === "notes" && (
        <Card>
          <CardHeader
            title="Notes"
            subtitle="Context, preferences and things worth remembering"
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNoteForm({ id: "", title: "", body: "" });
                  setNoteOpen(true);
                }}
              >
                <Plus size={15} strokeWidth={2.2} />
                New note
              </Button>
            }
          />
          <div className="p-5 pt-4">
            {notes.length === 0 ? (
              <EmptyState icon={StickyNote} title="No notes" body="Write down what you learn about this client." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {notes.map((n) => (
                  <div key={n.id} className="group rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13.5px] font-semibold">{n.title}</p>
                      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          aria-label="Edit note"
                          onClick={() => {
                            setNoteForm({ id: n.id, title: n.title ?? "", body: n.body ?? "" });
                            setNoteOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-hover hover:text-foreground"
                        >
                          <FileText size={13.5} strokeWidth={1.9} />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete note"
                          onClick={() => removeNote.mutate({ id: n.id })}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 size={13.5} strokeWidth={1.9} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">{n.body}</p>
                    <p className="mt-3 text-[11.5px] text-muted-foreground">
                      {n.author} · {relative(n.updatedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === "meetings" && (
        <Card>
          <CardHeader title="Meetings" subtitle={`${meetings.length} scheduled or held`} />
          <div className="p-5 pt-4">
            {meetings.length === 0 ? (
              <EmptyState icon={CalendarClock} title="No meetings" body="Schedule a call from the meetings page." />
            ) : (
              <ul className="divide-y divide-border">
                {meetings.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium">{m.title}</p>
                      <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                        {shortDate(m.date)} · {timeLabel(m.time)} · {m.duration}m · {m.type}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[m.status] ?? "neutral"}>{titleCase(m.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {tab === "files" && (
        <Card>
          <CardHeader title="Files" subtitle={`${files.length} shared with this client`} />
          <div className="p-5 pt-4">
            {files.length === 0 ? (
              <EmptyState icon={FileText} title="No files" body="Upload deliverables from the files page." />
            ) : (
              <ul className="divide-y divide-border">
                {files.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <FileText size={16} strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium">{f.name}</p>
                        <p className="text-[12px] text-muted-foreground">
                          {f.folder} · v{f.version} · {(f.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[12px] text-muted-foreground">{relative(f.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {/* modals */}
      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="Add contact"
        subtitle={`A new person at ${client.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setContactOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={addContact.isPending}
              onClick={async () => {
                if (!contactForm.name.trim()) return;
                await addContact.mutateAsync({ clientId: client.id, ...contactForm });
                setContactForm({ name: "", position: "", email: "", phone: "", linkedin: "" });
                setContactOpen(false);
                toast.success("Contact added");
              }}
            >
              Add contact
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2">
            <Input
              value={contactForm.name}
              onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Jamie Fox"
            />
          </Field>
          <Field label="Position">
            <Input
              value={contactForm.position}
              onChange={(e) => setContactForm((f) => ({ ...f, position: e.target.value }))}
              placeholder="Marketing Director"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={contactForm.email}
              onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={contactForm.phone}
              onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </Field>
          <Field label="LinkedIn">
            <Input
              value={contactForm.linkedin}
              onChange={(e) => setContactForm((f) => ({ ...f, linkedin: e.target.value }))}
              placeholder="linkedin.com/in/…"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title={noteForm.id ? "Edit note" : "New note"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saveNote.isPending}
              onClick={async () => {
                if (!noteForm.title.trim()) return;
                await saveNote.mutateAsync({
                  id: noteForm.id || undefined,
                  clientId: client.id,
                  title: noteForm.title,
                  body: noteForm.body,
                });
                setNoteOpen(false);
                toast.success("Note saved");
              }}
            >
              Save note
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title">
            <Input
              value={noteForm.title}
              onChange={(e) => setNoteForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Brand guidelines feedback"
            />
          </Field>
          <Field label="Note">
            <Textarea
              rows={7}
              value={noteForm.body}
              onChange={(e) => setNoteForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="What did you learn?"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={commOpen}
        onClose={() => setCommOpen(false)}
        title="Log communication"
        subtitle="Keep the history complete"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCommOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={logComm.isPending}
              onClick={async () => {
                if (!commForm.summary.trim()) return;
                await logComm.mutateAsync({ clientId: client.id, ...commForm });
                setCommForm({ type: "Email", summary: "", date: new Date().toISOString().slice(0, 10), followUpDate: "" });
                setCommOpen(false);
                toast.success("Logged");
              }}
            >
              Save entry
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select value={commForm.type} onChange={(e) => setCommForm((f) => ({ ...f, type: e.target.value }))}>
              {COMM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={commForm.date} onChange={(e) => setCommForm((f) => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Summary" className="sm:col-span-2">
            <Textarea
              rows={5}
              value={commForm.summary}
              onChange={(e) => setCommForm((f) => ({ ...f, summary: e.target.value }))}
              placeholder="Discussed the revised timeline and next milestone."
            />
          </Field>
          <Field label="Follow up on" hint="Optional" className="sm:col-span-2">
            <Input
              type="date"
              value={commForm.followUpDate}
              onChange={(e) => setCommForm((f) => ({ ...f, followUpDate: e.target.value }))}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
