'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard, Users2, Send, Inbox as InboxIcon, Zap, UserCog, CreditCard, Crosshair,
} from 'lucide-react'

const NAV_ITEMS = [
    { key: 'dashboard', href: '/app', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'leads', href: '/app/leads', label: 'Leads', icon: Users2 },
    { key: 'sequences', href: '/app/sequences', label: 'Sequences', icon: Send },
    { key: 'inbox', href: '/app/inbox', label: 'Inbox', icon: InboxIcon },
    { key: 'automations', href: '/app/automations', label: 'Automations', icon: Zap },
    { key: 'team', href: '/app/team', label: 'Team', icon: UserCog },
    { key: 'billing', href: '/app/billing', label: 'Billing', icon: CreditCard },
]

export function Sidebar({ counts }: { counts: Record<string, number | undefined> }) {
    const pathname = usePathname()

    return (
        <div
            className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible sm:w-56 flex-shrink-0 px-3 py-3 sm:py-5 sm:h-screen sm:sticky sm:top-0"
            style={{ background: 'var(--lh-sidebar)' }}
        >
            <div className="hidden sm:flex items-center gap-2 px-2 mb-5">
                <Crosshair size={20} style={{ color: 'var(--lh-accent)' }} />
                <span className="font-extrabold text-white text-base tracking-tight">
                    LeadHunter <span style={{ color: 'var(--lh-accent)' }}>Lite</span>
                </span>
            </div>
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = item.href === '/app' ? pathname === '/app' : pathname.startsWith(item.href)
                const count = counts[item.key]
                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        className="lh-btn lh-focus flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium flex-shrink-0 whitespace-nowrap"
                        style={{
                            background: isActive ? 'var(--lh-sidebar-soft)' : 'transparent',
                            color: isActive ? '#fff' : '#9A9DA6',
                        }}
                    >
                        <Icon size={17} style={{ color: isActive ? 'var(--lh-accent)' : '#7A7D85' }} />
                        <span>{item.label}</span>
                        {typeof count === 'number' && count > 0 && (
                            <span className="lh-mono ml-auto text-xs px-1.5 rounded-full" style={{ background: '#2A2D36', color: '#C7C9CF' }}>
                                {count}
                            </span>
                        )}
                    </Link>
                )
            })}
        </div>
    )
}
