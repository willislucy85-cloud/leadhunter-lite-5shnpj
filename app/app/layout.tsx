import { requireWorkspace } from '@/lib/workspace'
import { Sidebar } from '@/components/leadhunter/Sidebar'
import { BrandStyles } from '@/components/leadhunter/brand-styles'
import { ToastProvider } from '@/components/leadhunter/toast'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const { supabase, workspaceId } = await requireWorkspace()

    const [{ count: leadsCount }, { count: threadsCount }, { count: automationsCount }] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
        supabase.from('threads').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
        supabase.from('automations').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('active', true),
    ])

    return (
        <div className="lh-root flex flex-col sm:flex-row" style={{ minHeight: '100vh' }}>
            <BrandStyles />
            <ToastProvider>
                <Sidebar
                    counts={{
                        leads: leadsCount || 0,
                        inbox: threadsCount || 0,
                        automations: automationsCount || 0,
                    }}
                />
                <div className="flex-1 flex flex-col min-w-0">{children}</div>
            </ToastProvider>
        </div>
    )
}
