'use client'

import { useState, useTransition } from 'react'
import { Zap, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { Badge, IconButton, Modal, EmptyState } from './primitives'
import { useToast } from './toast'
import { createAutomation, toggleAutomation, deleteAutomation } from '@/app/app/automations/actions'
import {
    AUTOMATION_TRIGGERS,
    AUTOMATION_TRIGGER_LABEL,
    AUTOMATION_TRIGGER_DESCRIPTION,
    STATUSES,
    type LeadStatus,
} from '@/lib/constants'
import { getScores } from '@/lib/scoring'
import type { Automation, AutomationAction, AutomationTrigger, Lead } from '@/lib/types'

function impactedCount(trigger: AutomationTrigger, staleDays: number | undefined, leads: Lead[]) {
    switch (trigger) {
        case 'follow_up_overdue':
            return leads.filter((l) => l.followUpDueAt && new Date(l.followUpDueAt) <= new Date() && l.status !== 'Won' && l.status !== 'Lost').length
        case 'high_intent_new':
            return leads.filter((l) => getScores(l).final >= 70 && l.status === 'New').length
        case 'stalled_lead': {
            const days = staleDays || 7
            return leads.filter((l) => {
                const ageMs = Date.now() - new Date(l.metrics.lastInteractionAt || l.createdAt).getTime()
                return l.status !== 'Won' && l.status !== 'Lost' && ageMs / 86400000 >= days
            }).length
        }
    }
}

function describeAction(action: AutomationAction) {
    if (action.type === 'change_status') return `Change status to ${action.status}`
    if (action.type === 'add_timeline_note') return `Log note: "${action.text}"`
    return `Set follow-up in ${action.inDays} day${action.inDays === 1 ? '' : 's'}`
}

function NewAutomationModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const { pushToast } = useToast()
    const [pending, startTransition] = useTransition()
    const [name, setName] = useState('')
    const [trigger, setTrigger] = useState<AutomationTrigger>('follow_up_overdue')
    const [staleDays, setStaleDays] = useState(7)
    const [actionType, setActionType] = useState<AutomationAction['type']>('add_timeline_note')
    const [noteText, setNoteText] = useState('')
    const [newStatus, setNewStatus] = useState<LeadStatus>('Contacted')
    const [followUpDays, setFollowUpDays] = useState(1)
    const inputCls = 'lh-focus w-full px-3 py-2 rounded-md text-sm border'
    const inputStyle = { borderColor: 'var(--lh-border)' }

    const submit = () => {
        if (!name.trim()) return

        let action: AutomationAction
        if (actionType === 'change_status') action = { type: 'change_status', status: newStatus }
        else if (actionType === 'set_follow_up') action = { type: 'set_follow_up', inDays: followUpDays }
        else action = { type: 'add_timeline_note', text: noteText || 'Automation triggered' }

        startTransition(async () => {
            const result = await createAutomation({ name, trigger, staleDays, actions: [action] })
            if (result.error) {
                pushToast(result.error)
                return
            }
            pushToast(`Automation "${name}" created.`)
            onCreated()
            onClose()
        })
    }

    return (
        <Modal title="New automation" onClose={onClose} width={480}>
            <div className="flex flex-col gap-3">
                <input className={inputCls} style={inputStyle} placeholder="Automation name *" value={name} onChange={(e) => setName(e.target.value)} />

                <label className="text-xs font-semibold" style={{ color: 'var(--lh-muted)' }}>When</label>
                <select className={inputCls} style={inputStyle} value={trigger} onChange={(e) => setTrigger(e.target.value as AutomationTrigger)}>
                    {AUTOMATION_TRIGGERS.map((t) => <option key={t} value={t}>{AUTOMATION_TRIGGER_LABEL[t]}</option>)}
                </select>
                <p className="text-xs -mt-2" style={{ color: 'var(--lh-muted)' }}>{AUTOMATION_TRIGGER_DESCRIPTION[trigger]}</p>
                {trigger === 'stalled_lead' && (
                    <input
                        className={inputCls} style={inputStyle} type="number" min={1} placeholder="Days inactive"
                        value={staleDays} onChange={(e) => setStaleDays(Math.max(1, Number(e.target.value) || 1))}
                    />
                )}

                <label className="text-xs font-semibold mt-1" style={{ color: 'var(--lh-muted)' }}>Then</label>
                <select className={inputCls} style={inputStyle} value={actionType} onChange={(e) => setActionType(e.target.value as AutomationAction['type'])}>
                    <option value="add_timeline_note">Log a timeline note</option>
                    <option value="change_status">Change lead status</option>
                    <option value="set_follow_up">Set a follow-up reminder</option>
                </select>
                {actionType === 'add_timeline_note' && (
                    <input className={inputCls} style={inputStyle} placeholder="Note text" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                )}
                {actionType === 'change_status' && (
                    <select className={inputCls} style={inputStyle} value={newStatus} onChange={(e) => setNewStatus(e.target.value as LeadStatus)}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                )}
                {actionType === 'set_follow_up' && (
                    <input
                        className={inputCls} style={inputStyle} type="number" min={0} placeholder="Days from now"
                        value={followUpDays} onChange={(e) => setFollowUpDays(Math.max(0, Number(e.target.value) || 0))}
                    />
                )}

                <div className="flex justify-end gap-2 mt-2">
                    <IconButton label="Cancel" variant="outline" onClick={onClose} />
                    <IconButton label={pending ? 'Creating...' : 'Create automation'} icon={Plus} variant="accent" onClick={submit} disabled={pending} />
                </div>
            </div>
        </Modal>
    )
}

export function AutomationsClient({ automations, leads }: { automations: Automation[]; leads: Lead[] }) {
    const { pushToast } = useToast()
    const [pending, startTransition] = useTransition()
    const [showNew, setShowNew] = useState(false)

    const handleToggle = (id: string, active: boolean) => {
        startTransition(async () => {
            const result = await toggleAutomation(id, active)
            if (result.error) pushToast(result.error)
        })
    }

    const handleDelete = (id: string) => {
        startTransition(async () => {
            const result = await deleteAutomation(id)
            if (result.error) pushToast(result.error)
        })
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--lh-muted)' }}>
                    {automations.length} automation{automations.length === 1 ? '' : 's'} configured. Runs daily.
                </p>
                <IconButton icon={Plus} label="New automation" variant="accent" onClick={() => setShowNew(true)} />
            </div>

            {automations.length === 0 ? (
                <div className="lh-card rounded-xl">
                    <EmptyState icon={Zap} title="No automations yet" body="Create a rule to act on leads automatically." />
                </div>
            ) : (
                <div className="lh-card rounded-xl p-4">
                    <div className="space-y-2">
                        {automations.map((automation) => {
                            const impacted = impactedCount(automation.trigger, automation.conditions.staleDays, leads)
                            return (
                                <div key={automation.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--lh-border)' }}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold">{automation.name}</p>
                                                <Badge color={automation.active ? '#1F8A6F' : '#6B6F76'} soft>{automation.active ? 'Active' : 'Paused'}</Badge>
                                            </div>
                                            <p className="mt-1 text-sm" style={{ color: 'var(--lh-muted)' }}>
                                                When {AUTOMATION_TRIGGER_LABEL[automation.trigger].toLowerCase()}: {automation.actions.map(describeAction).join('; ')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Badge color={impacted > 0 ? '#1F8A6F' : '#6B6F76'} soft>
                                                <CheckCircle2 size={12} className="mr-1 inline-block" />
                                                {impacted} impacted
                                            </Badge>
                                            <IconButton
                                                label={automation.active ? 'Pause' : 'Activate'} variant="outline"
                                                onClick={() => handleToggle(automation.id, !automation.active)} disabled={pending}
                                            />
                                            <button type="button" className="lh-focus" onClick={() => handleDelete(automation.id)} disabled={pending} aria-label="Delete automation">
                                                <Trash2 size={14} style={{ color: 'var(--lh-muted)' }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {showNew && <NewAutomationModal onClose={() => setShowNew(false)} onCreated={() => {}} />}
        </div>
    )
}
