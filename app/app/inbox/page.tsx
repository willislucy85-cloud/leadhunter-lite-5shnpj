import { requireWorkspace } from '@/lib/workspace'
import { fetchLeads, fetchRecentTimeline } from '@/lib/data'
import { TopBar } from '@/components/leadhunter/TopBar'
import Link from 'next/link'
import { EmptyState, Badge } from '@/components/leadhunter/primitives'
import { Inbox, Clock3 } from 'lucide-react'
import { timeAgo } from '@/lib/scoring'

export default async function InboxPage() {
    const { supabase, workspaceId, workspace } = await requireWorkspace()
    const [leads, timeline] = await Promise.all([
        fetchLeads(supabase, workspaceId),
        fetchRecentTimeline(supabase, workspaceId, 30),
    ])

    const typeColor: Record<string, string> = {
        created: '#6B6F76',
        status: '#1F6FB2',
        note: '#FF5A1F',
    }

    return (
        <>
            <TopBar title="Inbox" subtitle="Every email and text, in one place." tier={workspace.subscription_tier} leadsUsed={leads.length} />
            <main className="flex-1 p-5 sm:p-7 lh-scroll" style={{ overflowY: 'auto' }}>
                <div className="lh-card rounded-xl p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-bold">Activity inbox</h2>
                            <p className="text-xs" style={{ color: 'var(--lh-muted)' }}>
                                Unified lead activity now. Email and SMS threads can layer on top of this feed.
                            </p>
                        </div>
                        <Badge color="#1F6FB2" soft>{timeline.length} events</Badge>
                    </div>

                    {timeline.length === 0 ? (
                        <EmptyState icon={Inbox} title="No activity yet" body="As your team updates leads, this inbox will populate." />
                    ) : (
                        <div className="space-y-2">
                            {timeline.map((entry) => (
                                <Link
                                    key={entry.id}
                                    href={`/app/leads?lead=${entry.lead_id}`}
                                    className="lh-focus lh-row flex items-start justify-between gap-3 rounded-lg border p-3"
                                    style={{ borderColor: 'var(--lh-border)' }}
                                >
                                    <div>
                                        <p className="text-sm font-semibold">{entry.leads?.name || 'Unknown lead'}</p>
                                        <p className="mt-1 text-sm" style={{ color: 'var(--lh-muted)' }}>{entry.text}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge color={typeColor[entry.type] || '#6B6F76'} soft>{entry.type}</Badge>
                                        <span className="lh-mono text-xs" style={{ color: 'var(--lh-muted)' }}>
                                            <Clock3 size={11} className="mr-1 inline-block" />
                                            {timeAgo(entry.created_at)}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}
