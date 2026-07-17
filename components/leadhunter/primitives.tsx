'use client'

import { X, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function Badge({ children, color = '#6B6F76', soft = true }: { children: React.ReactNode; color?: string; soft?: boolean }) {
    return (
        <span
            className="lh-mono inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
            style={soft ? { background: `${color}1A`, color } : { background: color, color: '#fff' }}
        >
            {children}
        </span>
    )
}

export function IconButton({
    icon: Icon,
    label,
    onClick,
    title,
    variant = 'ghost',
    size = 16,
    type = 'button',
    disabled = false,
}: {
    icon?: LucideIcon
    label?: string
    onClick?: () => void
    title?: string
    variant?: 'ghost' | 'accent' | 'outline'
    size?: number
    type?: 'button' | 'submit'
    disabled?: boolean
}) {
    const base = 'lh-btn lh-focus inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed'
    const styles =
        variant === 'accent'
            ? { background: 'var(--lh-accent)', color: '#fff' }
            : variant === 'outline'
                ? { background: 'transparent', color: 'var(--lh-ink)', border: '1px solid var(--lh-border)' }
                : { background: 'transparent', color: 'var(--lh-muted)' }
    return (
        <button type={type} className={base} style={styles} onClick={onClick} title={title || label} disabled={disabled}>
            {Icon && <Icon size={size} />}
            {label && <span>{label}</span>}
        </button>
    )
}

export function ScoreGauge({ engagement, intent, activity, final, size = 96 }: { engagement: number; intent: number; activity: number; final: number; size?: number }) {
    const r = size / 2 - 10
    const cx = size / 2
    const cy = size / 2
    const circumference = 2 * Math.PI * r
    const eLen = ((engagement * 0.4) / 100) * circumference
    const iLen = ((intent * 0.4) / 100) * circumference
    const aLen = ((activity * 0.2) / 100) * circumference
    const track = circumference
    const seg = (len: number, offset: number, color: string) => (
        <circle
            cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={7}
            strokeDasharray={`${len} ${track - len}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
        />
    )
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Final score ${final} of 100`}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--lh-border)" strokeWidth={7} />
            {seg(eLen, 0, 'var(--lh-accent)')}
            {seg(iLen, eLen, 'var(--lh-blue)')}
            {seg(aLen, eLen + iLen, 'var(--lh-amber)')}
            <text x={cx} y={cy - 2} textAnchor="middle" fontSize={size * 0.26} fontWeight="800" fill="var(--lh-ink)">{final}</text>
            <text x={cx} y={cy + size * 0.16} textAnchor="middle" fontSize={size * 0.1} fill="var(--lh-muted)" className="lh-mono">SCORE</text>
        </svg>
    )
}

export function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--lh-muted)' }}>{label}</span>
                <span className="lh-mono text-xs font-semibold">{value}</span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--lh-border)' }}>
                <div className="h-1.5 rounded-full" style={{ width: `${value}%`, background: color }} />
            </div>
        </div>
    )
}

export function Modal({ title, onClose, children, width = 520 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: 'rgba(14,15,19,0.55)' }} onMouseDown={onClose}>
            <div
                className="lh-fade-in lh-scroll lh-card rounded-xl shadow-2xl overflow-y-auto w-full"
                style={{ maxWidth: width, maxHeight: '88vh' }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--lh-border)' }}>
                    <h3 className="font-bold text-base">{title}</h3>
                    <button type="button" onClick={onClose} className="lh-focus rounded-md p-1" style={{ color: 'var(--lh-muted)' }} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    )
}

export function EmptyState({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
    return (
        <div className="flex flex-col items-center text-center py-12 px-4" style={{ color: 'var(--lh-muted)' }}>
            <Icon size={28} className="mb-2" style={{ color: 'var(--lh-border)' }} />
            <p className="font-semibold text-sm" style={{ color: 'var(--lh-ink)' }}>{title}</p>
            <p className="text-sm mt-1 max-w-xs">{body}</p>
        </div>
    )
}

export function Spinner({ size = 16 }: { size?: number }) {
    return <Loader2 size={size} className="animate-spin" />
}
