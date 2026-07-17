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
            className="relative z-10 flex flex-shrink-0 gap-1 overflow-x-auto px-3 py-3 sm:sticky sm:top-0 sm:h-screen sm:w-64 sm:flex-col sm:overflow-visible sm:py-6"
            style={{
                background:
                    'linear-gradient(180deg, rgba(17,19,26,0.98) 0%, rgba(15,17,23,0.98) 100%)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            <div className="hidden sm:block absolute inset-x-0 top-0 h-28" style={{ background: 'radial-gradient(circle at 20% 0%, rgba(255,90,31,.18), transparent 60%)' }} />

            <div className="relative mb-5 hidden sm:flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(140deg, #ff6a37, #ff4d17)' }}>
                    <Crosshair size={18} style={{ color: '#fff' }} />
                </div>
                <div>
                    <p className="text-xs uppercase tracking-[0.18em]" style={{ color: '#8d92a0' }}>Pipeline OS</p>
                    <span className="text-base font-extrabold tracking-tight text-white">
                        LeadHunter <span style={{ color: '#ff9a72' }}>Lite</span>
                    </span>
                </div>
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
                            background: isActive ? 'linear-gradient(135deg, rgba(255,90,31,.16), rgba(255,90,31,.06))' : 'transparent',
                            border: isActive ? '1px solid rgba(255, 132, 88, .45)' : '1px solid transparent',
                            color: isActive ? '#fff' : '#9ca2af',
                        }}
                    >
                        <Icon size={17} style={{ color: isActive ? '#ff8a5f' : '#757b89' }} />
                        <span>{item.label}</span>
                        {typeof count === 'number' && count > 0 && (
                            <span className="lh-mono ml-auto rounded-full px-1.5 text-xs" style={{ background: '#2a2f3a', color: '#d7dce7' }}>
                                {count}
                            </span>
                        )}
                    </Link>
                )
            })}
        </div>
    )
}
