import { requireWorkspace } from '@/lib/workspace'
import { fetchLeads, fetchRecentTimeline } from '@/lib/data'
import { TopBar } from '@/components/leadhunter/TopBar'
import { DashboardClient } from '@/components/leadhunter/DashboardClient'

export default async function DashboardPage() {
    const { supabase, workspaceId, workspace } = await requireWorkspace()
    const [leads, timeline] = await Promise.all([
        fetchLeads(supabase, workspaceId),
        fetchRecentTimeline(supabase, workspaceId),
    ])

    return (
        <>
            <TopBar title="Dashboard" subtitle="Today's pipeline at a glance." tier={workspace.subscription_tier} leadsUsed={leads.length} />
            <main className="flex-1 p-5 sm:p-7 lh-scroll" style={{ overflowY: 'auto' }}>
                <DashboardClient leads={leads} timeline={timeline} />
            </main>
        </>
    )
}
