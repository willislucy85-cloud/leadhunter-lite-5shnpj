# LeadHunter Lite

AI-powered lead CRM for local-service contractors and agencies (roofing, HVAC, solar, plumbing, etc). Built with Next.js App Router, Supabase (auth + Postgres + RLS), Claude, Stripe, Resend, and Twilio.

## Stack

- **Next.js 14** (App Router) — deployed on Vercel
- **Supabase** — Postgres with RLS, `@supabase/ssr` for auth (email/password + Google OAuth)
- **Claude** — server-side lead enrichment, intent scoring, outreach drafting
- **Stripe** — Free / Pro / Business subscription billing
- **Resend** — outbound email
- **Twilio** — outbound/inbound SMS

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase, Stripe, etc.
npm run dev
```

## Project layout

- `app/(marketing)` — public landing page
- `app/login`, `app/signup` — auth pages
- `app/app/*` — the authenticated product, behind `middleware.ts` session checks
- `app/app/leads/actions.ts` — Server Actions for lead CRUD, scoped by workspace via `lib/workspace.ts`
- `lib/scoring.ts` — pure lead-scoring engine (engagement/intent/activity)
- `utils/supabase/*` — browser/server Supabase clients + middleware session refresh

## Status

Foundations + leads core are live (auth, dashboard, leads table/detail, CSV import/export). AI routes, sequences, automations, real messaging, billing, team, and the marketing page are being built out in subsequent phases — see the sidebar for what's wired up vs. coming soon.
