import { requireWorkspace } from '@/lib/workspace'
import { fetchLeads } from '@/lib/data'
import { TopBar } from '@/components/leadhunter/TopBar'
import { Badge, EmptyState } from '@/components/leadhunter/primitives'
import { UserCog, Users2 } from 'lucide-react'
import { timeAgo } from '@/lib/scoring'

type Member = {
    user_id: string
    role: 'Owner' | 'Admin' | 'Member'
    created_at?: string | null
}

export default async function TeamPage() {
    const { supabase, workspaceId, workspace } = await requireWorkspace()
    const [leads, membersRes] = await Promise.all([
        fetchLeads(supabase, workspaceId),
        supabase.from('workspace_members').select('user_id, role, created_at').eq('workspace_id', workspaceId),
    ])

    const members = ((membersRes.data || []) as Member[]).sort((a, b) => {
        const aTs = new Date(a.created_at || 0).getTime()
        const bTs = new Date(b.created_at || 0).getTime()
        return aTs - bTs
    })

    const roleCounts = members.reduce(
        (acc, member) => {
            acc[member.role] += 1
            return acc
        },
        { Owner: 0, Admin: 0, Member: 0 } as Record<'Owner' | 'Admin' | 'Member', number>
    )

    const roleColor: Record<'Owner' | 'Admin' | 'Member', string> = {
        Owner: '#FF5A1F',
        Admin: '#1F6FB2',
        Member: '#6B6F76',
    }

    return (
        <>
            <TopBar title="Team" subtitle="Who's working which leads." tier={workspace.subscription_tier} leadsUsed={leads.length} />
            <main className="flex-1 p-5 sm:p-7 lh-scroll" style={{ overflowY: 'auto' }}>
                <div className="grid gap-4 sm:grid-cols-4">
                    <div className="rounded-xl border bg-white p-4" style={{ borderColor: 'var(--lh-border)' }}>
                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>Members</p>
                        <p className="mt-2 text-2xl font-extrabold">{members.length}</p>
                    </div>
                    <div className="rounded-xl border bg-white p-4" style={{ borderColor: 'var(--lh-border)' }}>
                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>Owners</p>
                        <p className="mt-2 text-2xl font-extrabold">{roleCounts.Owner}</p>
                    </div>
                    <div className="rounded-xl border bg-white p-4" style={{ borderColor: 'var(--lh-border)' }}>
                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>Admins</p>
                        <p className="mt-2 text-2xl font-extrabold">{roleCounts.Admin}</p>
                    </div>
                    <div className="rounded-xl border bg-white p-4" style={{ borderColor: 'var(--lh-border)' }}>
                        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>Members</p>
                        <p className="mt-2 text-2xl font-extrabold">{roleCounts.Member}</p>
                    </div>
                </div>

                <section className="mt-4 rounded-xl border bg-white p-4" style={{ borderColor: 'var(--lh-border)' }}>
                    <h2 className="mb-3 text-sm font-bold">Workspace access</h2>
                    {members.length === 0 ? (
                        <EmptyState icon={Users2} title="No team members found" body="No workspace memberships were returned for this workspace." />
                    ) : (
                        <div className="space-y-2">
                            {members.map((member) => (
                                <div key={member.user_id} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: 'var(--lh-border)' }}>
                                    <div>
                                        <p className="text-sm font-semibold">{member.user_id}</p>
                                        <p className="text-xs" style={{ color: 'var(--lh-muted)' }}>
                                            Added {member.created_at ? timeAgo(member.created_at) : 'unknown'}
                                        </p>
                                    </div>
                                    <Badge color={roleColor[member.role]} soft>
                                        <UserCog size={12} className="mr-1 inline-block" />
                                        {member.role}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </>
    )
}
