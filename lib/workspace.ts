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

export type WorkspaceContext = {
    supabase: ReturnType<typeof createClient>
    user: { id: string }
    workspaceId: string
    role: 'Owner' | 'Admin' | 'Member'
    workspace: Workspace
}

export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
    const supabase = createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: membership, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, workspaces(*)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

    if (error || !membership || !membership.workspaces) {
        return null
    }

    return {
        supabase,
        user: { id: user.id },
        workspaceId: membership.workspace_id as string,
        role: membership.role as 'Owner' | 'Admin' | 'Member',
        workspace: membership.workspaces as unknown as Workspace,
    }
}

// Every Server Action/route handler that touches workspace-scoped data should
// go through this instead of trusting a client-supplied workspace id. RLS
// (via my_workspace_ids()) still enforces the boundary server-side either way.
export async function requireWorkspace() {
    const context = await getWorkspaceContext()
    if (!context) {
        redirect('/login')
    }

    return context
}
