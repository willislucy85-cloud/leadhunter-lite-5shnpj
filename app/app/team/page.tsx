import { requireWorkspace } from '@/lib/workspace'
import { fetchLeads, fetchWorkspaceMembers, fetchPendingInvites } from '@/lib/data'
import { createAdminClient } from '@/utils/supabase/admin'
import { TopBar } from '@/components/leadhunter/TopBar'
import { TeamClient } from '@/components/leadhunter/TeamClient'

export default async function TeamPage() {
    const { supabase, workspaceId, workspace, user, role } = await requireWorkspace()
    const adminClient = createAdminClient()

    const [leads, members, invites] = await Promise.all([
        fetchLeads(supabase, workspaceId),
        fetchWorkspaceMembers(supabase, adminClient, workspaceId),
        fetchPendingInvites(supabase, workspaceId),
    ])

    return (
        <>
            <TopBar title="Team" subtitle="Who's working which leads." tier={workspace.subscription_tier} leadsUsed={leads.length} />
            <main className="flex-1 p-5 sm:p-7 lh-scroll" style={{ overflowY: 'auto' }}>
                <TeamClient
                    members={members}
                    invites={invites}
                    currentUserId={user.id}
                    canManage={role === 'Owner' || role === 'Admin'}
                />
            </main>
        </>
    )
}
