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
        <div className="flex items-center justify-between gap-4 px-5 sm:px-7 py-4 border-b" style={{ borderColor: 'var(--lh-border)', background: 'var(--lh-canvas)' }}>
            <div>
                <h1 className="font-extrabold text-xl tracking-tight">{title}</h1>
                {subtitle && <p className="text-sm mt-0.5" style={{ color: 'var(--lh-muted)' }}>{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                {limits.leadsLimit !== Infinity && (
                    <div className="hidden md:flex flex-col w-32">
                        <span className="text-xs" style={{ color: 'var(--lh-muted)' }}>{leadsUsed}/{limits.leadsLimit} leads</span>
                        <div className="w-full h-1 rounded-full mt-1" style={{ background: 'var(--lh-border)' }}>
                            <div className="h-1 rounded-full" style={{ width: `${leadsPct}%`, background: leadsPct > 85 ? 'var(--lh-red)' : 'var(--lh-accent)' }} />
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
