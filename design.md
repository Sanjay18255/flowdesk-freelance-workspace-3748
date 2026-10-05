# FlowDesk — Design

FlowDesk is an all-in-one workspace for freelancers, consultants and small creative studios: clients, CRM pipeline, projects, tasks, time tracking, invoices, meetings, files and reports in one premium web app. Platform: **web only** (desktop-first, fully responsive). Visual direction: Linear × Notion × Framer × Raycast — minimal, calm, expensive, fast. Not futuristic, not crypto, not corporate.

## Brand

- Name: **FlowDesk**
- Tagline: **Everything your freelance business needs.**
- Logo: rounded-square mark with a subtle indigo gradient + `FlowDesk` wordmark (semibold, -0.02em tracking).

## Colors (CSS variables in `packages/web/src/web/styles.css`)

| Token | Light | Dark | Use |
|---|---|---|---|
| background | #F8F9FB | #0B0C0F | Page background |
| card | #FFFFFF | #14161B | Cards, surfaces, modals |
| elevated | #FFFFFF | #1A1D24 | Popovers, dropdowns |
| primary | #4F46E5 | #6D67F0 | Buttons, active nav, accents |
| primary-soft | #EEF0FE | #1E1E3A | Active nav bg, chips |
| success | #22C55E | #34D399 | Paid, completed, up-trends |
| warning | #F59E0B | #FBBF24 | Pending, due soon |
| danger | #EF4444 | #F87171 | Overdue, delete, down-trends |
| foreground | #111827 | #F3F4F6 | Primary text |
| secondary-fg | #6B7280 | #9AA1AC | Secondary text, labels |
| border | #E5E7EB | #23262E | Hairline borders |
| hover | #F3F4F6 | #1C1F26 | Row/card hover |
| sidebar | #FFFFFF | #0F1115 | Sidebar surface |

Accent color is user-selectable in Settings → Appearance (indigo, violet, blue, emerald, amber, rose) and overrides `--primary` at runtime. Theme supports light / dark / system, persisted in `localStorage` with a no-flash boot script.

Avoid saturated fills, avoid heavy gradients. Colored surfaces only at 8–12% opacity.

## Typography

**Inter** (Google Fonts, weights 400/500/600/700) for everything — display and body, as specified.

- Page title: 24–28px / 600 / -0.02em
- Section title: 16–18px / 600
- Body: 14px / 400 / 1.6
- Label / meta: 12–13px / 500, `secondary-fg`, uppercase tracking-wide for table heads
- Numbers in KPIs: 28–32px / 600, tabular-nums

Never cram: min 12px gap between related items, 24–32px between sections.

## Surfaces & spacing

- Card: `bg-card`, 1px `border`, radius 14px, padding 20–24px, shadow `0 1px 2px rgb(16 24 40 / .04), 0 1px 3px rgb(16 24 40 / .06)`; hover lifts `-2px` with a slightly stronger shadow.
- Buttons: radius 10px, height 36 (sm) / 40 (md) / 44 (lg), `active:scale-[.98]`, focus ring 2px primary/30.
- Inputs: height 40, radius 10px, 1px border, focus ring primary/20 + primary border.
- Icons: **lucide-react only**, 16/18/20px, `stroke-width 1.75`. No emoji anywhere except the dashboard greeting wave.
- Content max width 1440px, page padding 24–32px.

## Layout

App shell: fixed left sidebar (256px, collapsible to 72px) + sticky topbar (global search, ⌘K hint, notification bell, theme toggle, profile menu) + scrollable content.

Sidebar nav: Dashboard, Clients, Projects, Pipeline, Invoices, Tasks, Meetings, Files, Reports, Team, Settings. Active item = primary-soft pill with a sliding 3px indicator (layout animation). Footer: avatar, name, plan badge, logout.

Mobile: sidebar becomes a drawer, KPI cards stack, tables become cards, a floating action button opens quick-create.

## Pages

Public: `/` landing (hero with a live recreated dashboard preview, logo wall, features, how it works, testimonials, pricing, FAQ, footer), `/sign-in`, `/sign-up` (split layout, brand panel left, form right).

App (protected): `/app` dashboard (draggable widgets), `/app/clients` + `/app/clients/:id` (tabbed profile), `/app/pipeline` (kanban CRM), `/app/projects` + `/app/projects/:id` (tabbed workspace w/ timeline, tasks, files, invoices, meetings, activity, notes), `/app/tasks` (kanban / list / calendar + timer), `/app/invoices` + `/app/invoices/:id` (printable preview), `/app/meetings`, `/app/files`, `/app/reports`, `/app/team`, `/app/settings`, `/app/help`, 404.

## Motion (motion/react)

One orchestrated entrance per page: content fades up 8px with 40ms stagger. Cards lift on hover. Modals fade + scale from .97. Charts draw once (path length / bar height). KPI numbers count up. Sidebar indicator uses shared layout. Skeleton shimmer while loading. Toasts slide in bottom-right. Nothing flashy, everything ≤ 300ms.

## Data & architecture

- Real backend: Turso (SQLite) + Drizzle, oRPC procedures in `packages/web/src/api/routes/`, TanStack Query hooks in `src/web/queries/`.
- Auth: Better Auth **email + password only** (no OAuth). Every table is scoped by `userId`; every query filters on the session user.
- New accounts are seeded with a realistic demo workspace (clients, leads, projects, tasks, invoices, meetings, activity) so the app is alive on first login.
- Files: real uploads to Tigris/S3 via presigned URLs, with version history.
- Charts: hand-coded SVG components (area, bar, donut, sparkline, ring) — no chart dependency.
