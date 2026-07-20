import { requireWorkspace } from '@/lib/workspace'
import { fetchLeads, fetchSequences } from '@/lib/data'
import { TopBar } from '@/components/leadhunter/TopBar'
import { SequencesClient } from '@/components/leadhunter/SequencesClient'

export default async function SequencesPage() {
    const { supabase, workspaceId, workspace } = await requireWorkspace()
    const [leads, sequences] = await Promise.all([
        fetchLeads(supabase, workspaceId),
        fetchSequences(supabase, workspaceId),
    ])

    return (
        <>
            <TopBar title="Sequences" subtitle="Multi-step outreach that runs itself." tier={workspace.subscription_tier} leadsUsed={leads.length} />
            <main className="flex-1 p-5 sm:p-7 lh-scroll" style={{ overflowY: 'auto' }}>
                <SequencesClient sequences={sequences} leads={leads} tier={workspace.subscription_tier} />
            </main>
        </>
    )
}
