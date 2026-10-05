# FlowDesk build — complete

Stack: managed template (Bun/Vite/React 19/Hono/oRPC/Drizzle/Turso). Web port 4200.
Decisions: real backend + Better Auth email/password only (no OAuth), no AI page.
New accounts auto-seeded with a rich demo workspace. Files -> real Tigris/S3 presigned uploads.
Charts: hand-coded SVG. Font Inter. Palette per design.md.

## Done — backend
- [x] schema.ts: 20 app tables + Better Auth tables, all scoped by userId, db:push applied
- [x] auth.ts (email/password, bearer plugin, extra user fields) + handler mounted in api/index.ts
- [x] lib: ids.ts, activity.ts (logActivity/notify), seed.ts (idempotent demo workspace), s3.ts
- [x] routes: account, clients, leads, projects, tasks, invoices, meetings, files, upload,
      dashboard, reports, team, notifications, search — all composed in api/index.ts

## Done — frontend
- [x] index.html: Inter + no-flash theme/accent boot; styles.css: light/dark tokens + 6 accents
- [x] lib/auth.ts (bearer + cookie session), lib/api.ts (Authorization header), lib/format.ts
- [x] theme provider, toast system, provider.tsx, logo, protected-route (gates on seeding)
- [x] ui/kit.tsx primitives + charts.tsx (Area/Bar/Donut/Sparkline/Ring/RankBars/countUp) + kpi.tsx
- [x] shell: 256px collapsible sidebar w/ sliding indicator, sticky topbar, ⌘K palette,
      notification centre, theme menu, profile menu, mobile drawer + FAB
- [x] pages: landing, sign-in, sign-up, dashboard, clients, client detail, pipeline, projects,
      project detail, tasks (board/list/calendar + timer), invoices, invoice detail (printable),
      meetings, files, reports, team, settings, help, 404

## Verified
- [x] `bun run build` passes (tsc -b clean, vite build clean)
- [x] dev server running on port 4200
- [x] API smoke: sign-up -> bootstrap -> every route returns seeded data; S3 presign works
- [x] Browser smoke (headless Chrome): all 14 top-level pages + 3 detail pages render,
      0 console/page errors; create client, create task, add checklist item all persist;
      real file upload to Tigris succeeds; dark mode + emerald accent + ⌘K palette work;
      mobile 390px viewport renders (drawer, stacked KPIs)

## Notes
- `oxlint` crashes in this sandbox on ANY input (oxc_allocator panic) — environment issue, not code.
- Root `bun run lint` also fails on a pre-existing template check in
  packages/mobile/app/_layout.tsx (expects `components/ErrorBoundary`, template ships
  `components/__ErrorBoundary`). Untouched by this build; mobile package not used.
- Fixed during QA: nested wildcard route swallowed `/app/*/:id` detail pages — app.tsx now
  branches on location prefix and renders one flat Switch inside a persistent shell.
- Seeded invoice numbers aligned to `INV-<year>-<n>` so nextNumber continues the sequence.
