import { requireWorkspace } from '@/lib/workspace'
import { fetchLeads } from '@/lib/data'
import { TopBar } from '@/components/leadhunter/TopBar'
import { LeadsClient } from '@/components/leadhunter/LeadsClient'

export default async function LeadsPage({ searchParams }: { searchParams: { lead?: string } }) {
    const { supabase, workspaceId, workspace } = await requireWorkspace()
    const leads = await fetchLeads(supabase, workspaceId)

    return (
        <>
            <TopBar title="Leads" subtitle="Every lead, scored and ready to work." tier={workspace.subscription_tier} leadsUsed={leads.length} />
            <main className="flex-1 p-5 sm:p-7 lh-scroll" style={{ overflowY: 'auto' }}>
                <LeadsClient leads={leads} tier={workspace.subscription_tier} initialSelectedLeadId={searchParams.lead || null} />
            </main>
        </>
    )
}
