import { requireWorkspace } from '@/lib/workspace'
import { fetchLeads, fetchAutomations } from '@/lib/data'
import { TopBar } from '@/components/leadhunter/TopBar'
import { AutomationsClient } from '@/components/leadhunter/AutomationsClient'

export default async function AutomationsPage() {
    const { supabase, workspaceId, workspace } = await requireWorkspace()
    const [leads, automations] = await Promise.all([
        fetchLeads(supabase, workspaceId),
        fetchAutomations(supabase, workspaceId),
    ])

    return (
        <>
            <TopBar title="Automations" subtitle="Set the rules. Let them run." tier={workspace.subscription_tier} leadsUsed={leads.length} />
            <main className="flex-1 p-5 sm:p-7 lh-scroll" style={{ overflowY: 'auto' }}>
                <AutomationsClient automations={automations} leads={leads} />
            </main>
        </>
    )
}
