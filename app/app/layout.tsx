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
        <div className="lh-root relative flex min-h-screen flex-col sm:flex-row overflow-hidden">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(circle at 85% -5%, rgba(255, 90, 31, .16), transparent 36%), radial-gradient(circle at 10% 25%, rgba(31, 111, 178, .12), transparent 34%)',
                }}
            />
            <BrandStyles />
            <ToastProvider>
                <Sidebar
                    counts={{
                        leads: leadsCount || 0,
                        inbox: threadsCount || 0,
                        automations: automationsCount || 0,
                    }}
                />
                <div className="relative z-10 flex min-w-0 flex-1 flex-col sm:p-3">
                    <div
                        className="lh-surface flex min-h-full flex-1 flex-col overflow-hidden border border-white/60 sm:rounded-2xl"
                        style={{ boxShadow: '0 14px 36px rgba(17, 20, 26, 0.08)' }}
                    >
                        {children}
                    </div>
                </div>
            </ToastProvider>
        </div>
    )
}
