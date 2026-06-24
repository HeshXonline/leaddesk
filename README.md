# LeadDesk

A lightweight CRM for small businesses to track customer inquiries (leads) across
channels — WhatsApp, Instagram, Facebook, phone calls and walk-ins — through a
simple pipeline (New → Contacted → Quoted → Won/Lost).

## Tech stack

- **React 18** + **TypeScript**
- **Vite 5** (dev server & build)
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Supabase** (auth + Postgres data layer)
- **React Router 6**, **Recharts**, **lucide-react** / **react-icons**

## Features

- Email/password auth with per-business data isolation (`AuthContext`)
- **Dashboard** — pipeline metrics and charts
- **Inbox** — Kanban board of inquiries with detail/edit modals
- **Templates** — reusable quick-reply messages
- **Settings** — business profile management

## Getting started

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
```

Other scripts:

```bash
npm run build      # typecheck (tsc) + production build to dist/
npm run preview    # serve the production build locally
npm run typecheck  # tsc only
npm test           # run the Vitest suite once
npm run test:watch # run Vitest in watch mode
```

## Testing

Tests run on **Vitest** + **React Testing Library** (jsdom). Coverage focuses on
pure logic and presentational components:

- [`lib/metrics.test.ts`](lib/metrics.test.ts) — dashboard metric derivation
  (conversion rate, monthly trend, averages) via the pure
  [`computeDashboardMetrics`](lib/metrics.ts) helper.
- [`components/StatusBadge.test.tsx`](components/StatusBadge.test.tsx) — status
  label + color mapping.

## CI / Deployment

- **CI** — [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs typecheck,
  tests and build on every push/PR to `main`.
- **Deploy** — configured for **Vercel** via [`vercel.json`](vercel.json)
  (Vite preset, `dist/` output, SPA rewrite so client-side routes resolve on
  deep links / refresh). Import the repo in Vercel and it deploys on push.

## Configuration

The Supabase project URL and **anon** (public) key are set in
[`lib/supabase.ts`](lib/supabase.ts). The anon key is safe to ship in the client;
data access is enforced server-side by Supabase Row Level Security.

## Project structure

```
App.tsx            Routes (public: /login, /signup — protected: /dashboard, /inbox, /templates, /settings)
main.tsx           App entry
index.css          Tailwind import + theme tokens
contexts/          AuthContext (session + businessId)
components/         AppShell, KanbanBoard, Inquiry modals, StatusBadge, ProtectedRoute
pages/             Dashboard, Inbox, Templates, Settings, Login, Signup
lib/               supabase client, api helpers, generated database.types
```
