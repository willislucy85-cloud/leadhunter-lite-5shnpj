import { requireWorkspace } from '@/lib/workspace'
import { fetchLeads } from '@/lib/data'
import { TopBar } from '@/components/leadhunter/TopBar'
import { TIERS } from '@/lib/constants'
import { Badge } from '@/components/leadhunter/primitives'
import { TwilioTestCard } from '@/components/leadhunter/TwilioTestCard'

export default async function BillingPage() {
    const { supabase, workspaceId, workspace } = await requireWorkspace()
    const hasTwilioConfigured = Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER &&
        process.env.TWILIO_ACCOUNT_SID !== 'demo' &&
        process.env.TWILIO_AUTH_TOKEN !== 'demo' &&
        process.env.TWILIO_PHONE_NUMBER !== 'demo'
    )
    const leads = await fetchLeads(supabase, workspaceId)
    const tier = TIERS[workspace.subscription_tier]
    const leadsLimit = tier.leadsLimit
    const usagePct = leadsLimit === Infinity ? 0 : Math.min(100, Math.round((leads.length / leadsLimit) * 100))

    const enrichUsed = leads.filter((lead) => lead.aiEnrichment).length
    const enrichLimit = tier.enrichLimit
    const enrichPct = enrichLimit === Infinity ? 0 : Math.min(100, Math.round((enrichUsed / enrichLimit) * 100))

    const planPrice = tier.price === 'Custom' ? 'Custom' : `$${tier.price}/mo`

    return (
        <>
            <TopBar title="Billing" subtitle="Plan, usage, and limits." tier={workspace.subscription_tier} leadsUsed={leads.length} />
            <main className="flex-1 p-5 sm:p-7 lh-scroll" style={{ overflowY: 'auto' }}>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border bg-white p-4" style={{ borderColor: 'var(--lh-border)' }}>
                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>Current plan</p>
                        <p className="mt-2 text-xl font-extrabold">{workspace.subscription_tier}</p>
                        <p className="mt-1 text-sm" style={{ color: 'var(--lh-muted)' }}>{planPrice}</p>
                        <div className="mt-3">
                            <Badge color={workspace.subscription_tier === 'Free' ? '#6B6F76' : '#1F8A6F'} soft>
                                {workspace.subscription_status || 'active'}
                            </Badge>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-white p-4" style={{ borderColor: 'var(--lh-border)' }}>
                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>Lead usage</p>
                        <p className="mt-2 text-xl font-extrabold">
                            {leads.length}
                            {leadsLimit === Infinity ? '' : ` / ${leadsLimit}`}
                        </p>
                        {leadsLimit !== Infinity && (
                            <>
                                <div className="mt-3 h-2 w-full rounded-full" style={{ background: 'var(--lh-border)' }}>
                                    <div className="h-2 rounded-full" style={{ width: `${usagePct}%`, background: usagePct >= 90 ? 'var(--lh-red)' : 'var(--lh-accent)' }} />
                                </div>
                                <p className="mt-1 text-xs" style={{ color: 'var(--lh-muted)' }}>{usagePct}% used</p>
                            </>
                        )}
                    </div>

                    <div className="rounded-xl border bg-white p-4" style={{ borderColor: 'var(--lh-border)' }}>
                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>AI enrichments</p>
                        <p className="mt-2 text-xl font-extrabold">
                            {enrichUsed}
                            {enrichLimit === Infinity ? '' : ` / ${enrichLimit}`}
                        </p>
                        {enrichLimit !== Infinity && (
                            <>
                                <div className="mt-3 h-2 w-full rounded-full" style={{ background: 'var(--lh-border)' }}>
                                    <div className="h-2 rounded-full" style={{ width: `${enrichPct}%`, background: enrichPct >= 90 ? 'var(--lh-red)' : 'var(--lh-blue)' }} />
                                </div>
                                <p className="mt-1 text-xs" style={{ color: 'var(--lh-muted)' }}>{enrichPct}% used</p>
                            </>
                        )}
                    </div>
                </div>

                <section className="mt-4 rounded-xl border bg-white p-4" style={{ borderColor: 'var(--lh-border)' }}>
                    <h2 className="text-sm font-bold">Plan entitlements</h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--lh-border)' }}>
                            <p className="text-xs" style={{ color: 'var(--lh-muted)' }}>Sequences</p>
                            <p className="mt-1 font-semibold">{tier.sequenceLimit === Infinity ? 'Unlimited' : tier.sequenceLimit}</p>
                        </div>
                        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--lh-border)' }}>
                            <p className="text-xs" style={{ color: 'var(--lh-muted)' }}>Shared inbox</p>
                            <p className="mt-1 font-semibold">{tier.sharedInbox ? 'Included' : 'Not included'}</p>
                        </div>
                        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--lh-border)' }}>
                            <p className="text-xs" style={{ color: 'var(--lh-muted)' }}>Analytics</p>
                            <p className="mt-1 font-semibold">{tier.analytics ? 'Advanced' : 'Basic'}</p>
                        </div>
                        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--lh-border)' }}>
                            <p className="text-xs" style={{ color: 'var(--lh-muted)' }}>Stripe customer</p>
                            <p className="mt-1 font-semibold">{workspace.stripe_customer_id ? 'Connected' : 'Not connected yet'}</p>
                        </div>
                    </div>
                </section>

                <section className="mt-4 rounded-xl border bg-white p-4" style={{ borderColor: 'var(--lh-border)' }}>
                    <h2 className="text-sm font-bold">Manage subscription</h2>
                    <p className="mt-1 text-sm" style={{ color: 'var(--lh-muted)' }}>
                        Upgrade or manage your billing directly with Stripe.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {workspace.subscription_tier === 'Free' && (
                            <>
                                <form action="/api/stripe/checkout" method="post">
                                    <input type="hidden" name="plan" value="Pro" />
                                    <button
                                        type="submit"
                                        className="lh-btn lh-focus inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white"
                                        style={{ background: 'var(--lh-accent)' }}
                                    >
                                        Upgrade to Pro
                                    </button>
                                </form>

                                <form action="/api/stripe/checkout" method="post">
                                    <input type="hidden" name="plan" value="Business" />
                                    <button
                                        type="submit"
                                        className="lh-btn lh-focus inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
                                        style={{ borderColor: 'var(--lh-border)', color: 'var(--lh-ink)' }}
                                    >
                                        Upgrade to Business
                                    </button>
                                </form>
                            </>
                        )}

                        {workspace.subscription_tier !== 'Free' && workspace.stripe_customer_id && (
                            <form action="/api/stripe/portal" method="post">
                                <button
                                    type="submit"
                                    className="lh-btn lh-focus inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold"
                                    style={{ borderColor: 'var(--lh-border)', color: 'var(--lh-ink)' }}
                                >
                                    Open Stripe Billing Portal
                                </button>
                            </form>
                        )}
                    </div>
                </section>

                {hasTwilioConfigured && <TwilioTestCard />}
            </main>
        </>
    )
}
