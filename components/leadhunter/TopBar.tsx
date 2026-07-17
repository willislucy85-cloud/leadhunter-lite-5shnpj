import { Badge } from './primitives'
import { TIERS, type Tier } from '@/lib/constants'

export function TopBar({
    title,
    subtitle,
    tier,
    leadsUsed,
}: {
    title: string
    subtitle?: string
    tier: Tier
    leadsUsed: number
}) {
    const limits = TIERS[tier]
    const leadsPct = limits.leadsLimit === Infinity ? 0 : Math.min(100, (leadsUsed / limits.leadsLimit) * 100)

    return (
        <div
            className="relative flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-7"
            style={{
                borderColor: 'var(--lh-border)',
                background: 'linear-gradient(180deg, rgba(255,255,255,.68), rgba(255,255,255,.52))',
                backdropFilter: 'blur(2px)',
            }}
        >
            <div>
                <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
                {subtitle && <p className="text-sm mt-0.5" style={{ color: 'var(--lh-muted)' }}>{subtitle}</p>}
            </div>
            <div className="flex flex-shrink-0 items-center gap-3">
                {limits.leadsLimit !== Infinity && (
                    <div className="hidden w-40 rounded-lg border px-3 py-2 md:flex md:flex-col" style={{ borderColor: 'var(--lh-border)', background: 'rgba(255,255,255,.72)' }}>
                        <span className="text-xs" style={{ color: 'var(--lh-muted)' }}>{leadsUsed}/{limits.leadsLimit} leads used</span>
                        <div className="mt-1 h-1.5 w-full rounded-full" style={{ background: '#eadfce' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${leadsPct}%`, background: leadsPct > 85 ? 'var(--lh-red)' : 'var(--lh-accent)' }} />
                        </div>
                    </div>
                )}
                <Badge color={tier === 'Free' ? '#6B6F76' : tier === 'Pro' ? '#1F8A6F' : '#FF5A1F'} soft>
                    {tier} plan
                </Badge>
            </div>
        </div>
    )
}
