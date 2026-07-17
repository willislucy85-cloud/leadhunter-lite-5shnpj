-- Stripe billing fields on workspaces, consumed by:
--   app/api/stripe/checkout/route.ts
--   app/api/stripe/portal/route.ts
--   app/api/webhooks/stripe/route.ts
-- Safe to re-run: every statement is guarded so it's a no-op if already applied.

alter table public.workspaces
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text not null default 'active',
  add column if not exists subscription_tier text not null default 'Free';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workspaces_subscription_tier_check'
  ) then
    alter table public.workspaces
      add constraint workspaces_subscription_tier_check
      check (subscription_tier in ('Free', 'Pro', 'Business', 'Enterprise'));
  end if;
end $$;

-- One Stripe customer maps to at most one workspace; also serves the
-- customer-id lookup the webhook handler does on every subscription event.
create unique index if not exists workspaces_stripe_customer_id_idx
  on public.workspaces (stripe_customer_id)
  where stripe_customer_id is not null;
