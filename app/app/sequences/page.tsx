import { requireWorkspace } from '@/lib/workspace'
import { fetchLeads } from '@/lib/data'
import { TopBar } from '@/components/leadhunter/TopBar'
import Link from 'next/link'
import { Send, ArrowRight } from 'lucide-react'
import { Badge, EmptyState } from '@/components/leadhunter/primitives'
import { getScores } from '@/lib/scoring'

export default async function SequencesPage() {
    const { supabase, workspaceId, workspace } = await requireWorkspace()
    const leads = await fetchLeads(supabase, workspaceId)

    const enrollable = leads
        .map((lead) => ({ lead, score: getScores(lead).final }))
        .filter(({ lead, score }) => lead.status !== 'Won' && lead.status !== 'Lost' && score >= 55)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)

    const hot = enrollable.filter((item) => item.score >= 70).length

    return (
        <>
            <TopBar title="Sequences" subtitle="Multi-step outreach that runs itself." tier={workspace.subscription_tier} leadsUsed={leads.length} />
            <main className="flex-1 p-5 sm:p-7 lh-scroll" style={{ overflowY: 'auto' }}>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="lh-card rounded-xl p-4">
                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>Enrollable now</p>
                        <p className="mt-2 text-2xl font-extrabold">{enrollable.length}</p>
                        <p className="mt-1 text-sm" style={{ color: 'var(--lh-muted)' }}>Score 55+ and still open.</p>
                    </div>
                    <div className="lh-card rounded-xl p-4">
                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>Hot leads</p>
                        <p className="mt-2 text-2xl font-extrabold">{hot}</p>
                        <p className="mt-1 text-sm" style={{ color: 'var(--lh-muted)' }}>Score 70+ ready for rapid follow-up.</p>
                    </div>
                    <div className="lh-card rounded-xl p-4">
                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>Sequence health</p>
                        <p className="mt-2 text-2xl font-extrabold">MVP</p>
                        <p className="mt-1 text-sm" style={{ color: 'var(--lh-muted)' }}>Use this list to prioritize outreach enrollment.</p>
                    </div>
                </div>

                <section className="lh-card mt-4 rounded-xl p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="text-sm font-bold">Recommended enrollments</h2>
                        <Badge color="#FF5A1F" soft>
                            <Send size={12} className="mr-1 inline-block" />
                            Prioritized
                        </Badge>
                    </div>
                    {enrollable.length === 0 ? (
                        <EmptyState icon={Send} title="No eligible leads yet" body="Add leads or move statuses to start enrolling sequence candidates." />
                    ) : (
                        <div className="space-y-2">
                            {enrollable.map(({ lead, score }) => (
                                <Link
                                    key={lead.id}
                                    href={`/app/leads?lead=${lead.id}`}
                                    className="lh-focus lh-row flex items-center justify-between rounded-lg border p-3"
                                    style={{ borderColor: 'var(--lh-border)' }}
                                >
                                    <div>
                                        <p className="text-sm font-semibold">{lead.name}</p>
                                        <p className="text-xs" style={{ color: 'var(--lh-muted)' }}>
                                            {lead.company || 'No company'} · {lead.category} · {lead.status}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge color={score >= 70 ? '#FF5A1F' : '#1F6FB2'} soft>Score {score}</Badge>
                                        <ArrowRight size={15} style={{ color: 'var(--lh-muted)' }} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </>
    )
}
