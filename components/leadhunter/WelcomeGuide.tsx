'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Sparkles, Send, UserPlus } from 'lucide-react'
import { Modal, IconButton } from './primitives'

const STEPS = [
    {
        icon: Users,
        title: 'Add your first lead',
        body: 'Import leads from a CSV or find real businesses to target via Google Places search.',
        href: '/app/leads',
    },
    {
        icon: Sparkles,
        title: 'Try AI enrich',
        body: 'Open a lead and enrich it to get an AI-generated score, summary, and suggested next step.',
        href: '/app/leads',
    },
    {
        icon: Send,
        title: 'Build a sequence',
        body: 'Set up a multi-step follow-up sequence so no lead falls through the cracks.',
        href: '/app/sequences',
    },
    {
        icon: UserPlus,
        title: 'Invite your team',
        body: 'Bring in teammates as Owner, Admin, or Member so everyone can work the pipeline together.',
        href: '/app/team',
    },
]

function storageKey(workspaceId: string) {
    return `lh_welcome_seen_${workspaceId}`
}

export function WelcomeGuide({ workspaceId }: { workspaceId: string }) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const seen = window.localStorage.getItem(storageKey(workspaceId))
        if (!seen) setOpen(true)
    }, [workspaceId])

    const dismiss = () => {
        window.localStorage.setItem(storageKey(workspaceId), '1')
        setOpen(false)
    }

    if (!open) return null

    return (
        <Modal title="Welcome to LeadHunter Lite" onClose={dismiss} width={480}>
            <div className="flex flex-col gap-4">
                <p className="text-sm" style={{ color: 'var(--lh-muted)' }}>
                    Here&apos;s how to get moving in your first few minutes.
                </p>
                <div className="flex flex-col gap-3">
                    {STEPS.map((step) => (
                        <Link
                            key={step.title}
                            href={step.href}
                            onClick={dismiss}
                            className="lh-focus flex items-start gap-3 rounded-lg border p-3 hover:bg-black/[.02]"
                            style={{ borderColor: 'var(--lh-border)' }}
                        >
                            <step.icon size={18} className="mt-0.5 shrink-0" style={{ color: '#FF5A1F' }} />
                            <div>
                                <p className="text-sm font-semibold">{step.title}</p>
                                <p className="text-sm" style={{ color: 'var(--lh-muted)' }}>{step.body}</p>
                            </div>
                        </Link>
                    ))}
                </div>
                <div className="flex justify-end">
                    <IconButton label="Got it" variant="accent" onClick={dismiss} />
                </div>
            </div>
        </Modal>
    )
}
