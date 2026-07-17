import { requireWorkspace } from '@/lib/workspace'
import { fetchLeads } from '@/lib/data'
import { TopBar } from '@/components/leadhunter/TopBar'
import { Badge } from '@/components/leadhunter/primitives'
import { Zap, CheckCircle2 } from 'lucide-react'
import { getScores } from '@/lib/scoring'

export default async function AutomationsPage() {
    const { supabase, workspaceId, workspace } = await requireWorkspace()
    const leads = await fetchLeads(supabase, workspaceId)

    const stalledLeads = leads.filter((lead) => {
        const ageMs = Date.now() - new Date(lead.metrics.lastInteractionAt || lead.createdAt).getTime()
        const days = ageMs / (1000 * 60 * 60 * 24)
        return lead.status !== 'Won' && lead.status !== 'Lost' && days >= 7
    }).length

    const followUpOverdue = leads.filter((lead) => {
        if (!lead.followUpDueAt) return false
        return new Date(lead.followUpDueAt) <= new Date() && lead.status !== 'Won' && lead.status !== 'Lost'
    }).length

    const highIntentUncontacted = leads.filter((lead) => {
        const score = getScores(lead).final
        return score >= 70 && lead.status === 'New'
    }).length

    const rules = [
        {
            title: 'Follow-up overdue nudges',
            description: 'When follow-up date is due, create a timeline reminder and move to Contacted if untouched.',
            impact: followUpOverdue,
        },
        {
            title: 'High-intent first-touch',
            description: 'When score is 70+ and status is New, queue immediate outreach and flag as priority.',
            impact: highIntentUncontacted,
        },
        {
            title: 'Stalled lead revival',
            description: 'When no activity for 7+ days, generate re-engagement task for owner.',
            impact: stalledLeads,
        },
    ]

    return (
        <>
            <TopBar title="Automations" subtitle="Set the rules. Let them run." tier={workspace.subscription_tier} leadsUsed={leads.length} />
            <main className="flex-1 p-5 sm:p-7 lh-scroll" style={{ overflowY: 'auto' }}>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="lh-card rounded-xl p-4">
                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>Overdue follow-ups</p>
                        <p className="mt-2 text-2xl font-extrabold">{followUpOverdue}</p>
                    </div>
                    <div className="lh-card rounded-xl p-4">
                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>High-intent new leads</p>
                        <p className="mt-2 text-2xl font-extrabold">{highIntentUncontacted}</p>
                    </div>
                    <div className="lh-card rounded-xl p-4">
                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>Stalled opportunities</p>
                        <p className="mt-2 text-2xl font-extrabold">{stalledLeads}</p>
                    </div>
                </div>

                <section className="lh-card mt-4 rounded-xl p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="text-sm font-bold">Suggested automation rules</h2>
                        <Badge color="#FF5A1F" soft>
                            <Zap size={12} className="mr-1 inline-block" />
                            Ready to configure
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        {rules.map((rule) => (
                            <div key={rule.title} className="rounded-lg border p-3" style={{ borderColor: 'var(--lh-border)' }}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold">{rule.title}</p>
                                        <p className="mt-1 text-sm" style={{ color: 'var(--lh-muted)' }}>{rule.description}</p>
                                    </div>
                                    <Badge color={rule.impact > 0 ? '#1F8A6F' : '#6B6F76'} soft>
                                        <CheckCircle2 size={12} className="mr-1 inline-block" />
                                        {rule.impact} impacted
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </>
    )
}
