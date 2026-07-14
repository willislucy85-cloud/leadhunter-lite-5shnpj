import type { LucideIcon } from 'lucide-react'
import { EmptyState } from './primitives'

export function ComingSoon({ icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
    return (
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: 'var(--lh-border)' }}>
            <EmptyState icon={icon} title={title} body={body} />
        </div>
    )
}
