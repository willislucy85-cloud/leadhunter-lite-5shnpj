import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export type Workspace = {
    id: string
    name: string
    subscription_tier: 'Free' | 'Pro' | 'Business' | 'Enterprise'
    subscription_status: string
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
}

// Every Server Action/route handler that touches workspace-scoped data should
// go through this instead of trusting a client-supplied workspace id. RLS
// (via my_workspace_ids()) still enforces the boundary server-side either way.
export async function requireWorkspace() {
    const supabase = createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: membership, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, workspaces(*)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

    if (error || !membership || !membership.workspaces) {
        redirect('/login')
    }

    return {
        supabase,
        user,
        workspaceId: membership.workspace_id as string,
        role: membership.role as 'Owner' | 'Admin' | 'Member',
        workspace: membership.workspaces as unknown as Workspace,
    }
}
