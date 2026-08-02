-- Google Places integration columns on leads, consumed by:
--   lib/google-places.ts
--   app/api/places/search/route.ts
--   app/app/leads/actions.ts (importFoundLeads)
--   components/leadhunter/FindLeadsModal.tsx
-- Safe to re-run: every statement is guarded so it's a no-op if already applied.

alter table public.leads
  add column if not exists website text,
  add column if not exists address text,
  add column if not exists place_id text;

-- Prevents importing the same Google Place twice into the same workspace;
-- place_id is not unique across workspaces since two different customers
-- may legitimately import the same real-world business.
create unique index if not exists leads_workspace_id_place_id_idx
  on public.leads (workspace_id, place_id)
  where place_id is not null;
