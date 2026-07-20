'use client'

import { useEffect, useState, useTransition } from 'react'
import { Send, Plus, Trash2, Users, X } from 'lucide-react'
import { Badge, IconButton, Modal, EmptyState, Spinner } from './primitives'
import { useToast } from './toast'
import {
    createSequence,
    deleteSequence,
    addSequenceStep,
    deleteSequenceStep,
    enrollLead,
    unenrollLead,
    fetchSequenceEnrollments,
    type StepInput,
} from '@/app/app/sequences/actions'
import { SEQUENCE_STEP_TYPES, SEQUENCE_STEP_LABEL, STATUSES, TIERS, type Tier, type LeadStatus } from '@/lib/constants'
import { getScores } from '@/lib/scoring'
import type { Sequence, Lead } from '@/lib/types'

type EnrollmentRow = {
    id: string
    lead_id: string
    step_index: number
    status: 'active' | 'completed' | 'paused'
    enrolled_at: string
    leads: { name: string; company: string | null } | { name: string; company: string | null }[] | null
}

function NewSequenceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const { pushToast } = useToast()
    const [pending, startTransition] = useTransition()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const inputCls = 'lh-focus w-full px-3 py-2 rounded-md text-sm border'
    const inputStyle = { borderColor: 'var(--lh-border)' }

    const submit = () => {
        if (!name.trim()) return
        startTransition(async () => {
            const result = await createSequence({ name, description })
            if (result.error) {
                pushToast(result.error)
                return
            }
            pushToast(`Sequence "${name}" created.`)
            onCreated()
            onClose()
        })
    }

    return (
        <Modal title="New sequence" onClose={onClose} width={420}>
            <div className="flex flex-col gap-3">
                <input className={inputCls} style={inputStyle} placeholder="Sequence name *" value={name} onChange={(e) => setName(e.target.value)} />
                <textarea className={inputCls} style={inputStyle} placeholder="Description (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
                <div className="flex justify-end gap-2 mt-1">
                    <IconButton label="Cancel" variant="outline" onClick={onClose} />
                    <IconButton label={pending ? 'Creating...' : 'Create sequence'} icon={Plus} variant="accent" onClick={submit} disabled={pending} />
                </div>
            </div>
        </Modal>
    )
}

function AddStepForm({ sequenceId, onAdded }: { sequenceId: string; onAdded: () => void }) {
    const { pushToast } = useToast()
    const [pending, startTransition] = useTransition()
    const [type, setType] = useState<StepInput['type']>('email')
    const [delayDays, setDelayDays] = useState(0)
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [newStatus, setNewStatus] = useState<LeadStatus>('Contacted')
    const [followUpNote, setFollowUpNote] = useState('')
    const inputCls = 'lh-focus w-full px-3 py-2 rounded-md text-sm border'
    const inputStyle = { borderColor: 'var(--lh-border)' }

    const submit = () => {
        startTransition(async () => {
            const result = await addSequenceStep(sequenceId, {
                type,
                delay_days: delayDays,
                subject,
                body,
                new_status: newStatus,
                follow_up_note: followUpNote,
            })
            if (result.error) {
                pushToast(result.error)
                return
            }
            setSubject('')
            setBody('')
            setFollowUpNote('')
            setDelayDays(0)
            onAdded()
        })
    }

    return (
        <div className="rounded-lg border p-3 flex flex-col gap-2" style={{ borderColor: 'var(--lh-border)' }}>
            <div className="flex gap-2">
                <select className={inputCls} style={inputStyle} value={type} onChange={(e) => setType(e.target.value as StepInput['type'])}>
                    {SEQUENCE_STEP_TYPES.map((t) => (
                        <option key={t} value={t}>{SEQUENCE_STEP_LABEL[t]}</option>
                    ))}
                </select>
                <input
                    className={`${inputCls} w-28`} style={inputStyle} type="number" min={0} placeholder="Delay (days)"
                    value={delayDays} onChange={(e) => setDelayDays(Math.max(0, Number(e.target.value) || 0))}
                />
            </div>
            {type === 'email' && (
                <input className={inputCls} style={inputStyle} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            )}
            {(type === 'email' || type === 'sms') && (
                <textarea className={inputCls} style={inputStyle} placeholder="Message body" rows={2} value={body} onChange={(e) => setBody(e.target.value)} />
            )}
            {type === 'status_change' && (
                <select className={inputCls} style={inputStyle} value={newStatus} onChange={(e) => setNewStatus(e.target.value as LeadStatus)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
            )}
            {type === 'follow_up' && (
                <input className={inputCls} style={inputStyle} placeholder="Follow-up note" value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} />
            )}
            <div className="flex justify-end">
                <IconButton icon={Plus} label={pending ? 'Adding...' : 'Add step'} variant="outline" onClick={submit} disabled={pending} />
            </div>
        </div>
    )
}

function SequenceDetail({ sequence, leads, onClose, onChanged }: { sequence: Sequence; leads: Lead[]; onClose: () => void; onChanged: () => void }) {
    const { pushToast } = useToast()
    const [pending, startTransition] = useTransition()
    const [loading, setLoading] = useState(true)
    const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([])

    async function reload() {
        setLoading(true)
        const rows = await fetchSequenceEnrollments(sequence.id)
        setEnrollments(rows as EnrollmentRow[])
        setLoading(false)
    }

    useEffect(() => {
        reload()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sequence.id])

    const activeLeadIds = new Set(enrollments.filter((e) => e.status === 'active').map((e) => e.lead_id))
    const enrollable = leads
        .filter((l) => l.status !== 'Won' && l.status !== 'Lost' && getScores(l).final >= 55 && !activeLeadIds.has(l.id))
        .sort((a, b) => getScores(b).final - getScores(a).final)
        .slice(0, 20)

    const handleEnroll = (leadId: string) => {
        startTransition(async () => {
            const result = await enrollLead(sequence.id, leadId)
            if (result.error) {
                pushToast(result.error)
                return
            }
            pushToast('Lead enrolled.')
            reload()
            onChanged()
        })
    }

    const handleUnenroll = (enrollmentId: string) => {
        startTransition(async () => {
            const result = await unenrollLead(enrollmentId)
            if (result.error) {
                pushToast(result.error)
                return
            }
            reload()
            onChanged()
        })
    }

    const handleDeleteStep = (stepId: string) => {
        startTransition(async () => {
            const result = await deleteSequenceStep(stepId, sequence.id)
            if (result.error) pushToast(result.error)
            onChanged()
        })
    }

    return (
        <Modal title={sequence.name} onClose={onClose} width={640}>
            <div className="flex flex-col gap-5">
                <div>
                    <h4 className="font-bold text-sm mb-2">Steps</h4>
                    <div className="flex flex-col gap-2 mb-2">
                        {sequence.steps.length === 0 && (
                            <p className="text-sm" style={{ color: 'var(--lh-muted)' }}>No steps yet — add one below.</p>
                        )}
                        {sequence.steps.map((step, i) => (
                            <div key={step.id} className="flex items-center justify-between rounded-lg border p-2.5" style={{ borderColor: 'var(--lh-border)' }}>
                                <div className="text-sm">
                                    <span className="lh-mono font-semibold mr-2">{i + 1}.</span>
                                    <span className="font-medium">{SEQUENCE_STEP_LABEL[step.type]}</span>
                                    <span style={{ color: 'var(--lh-muted)' }}> · +{step.delay_days}d</span>
                                    {step.subject && <span style={{ color: 'var(--lh-muted)' }}> · {step.subject}</span>}
                                    {step.new_status && <span style={{ color: 'var(--lh-muted)' }}> · → {step.new_status}</span>}
                                </div>
                                <button type="button" className="lh-focus" onClick={() => handleDeleteStep(step.id)} disabled={pending} aria-label="Delete step">
                                    <Trash2 size={14} style={{ color: 'var(--lh-muted)' }} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <AddStepForm sequenceId={sequence.id} onAdded={onChanged} />
                </div>

                <div className="border-t pt-4" style={{ borderColor: 'var(--lh-border)' }}>
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-1.5"><Users size={14} />Active enrollments ({enrollments.filter((e) => e.status === 'active').length})</h4>
                    {loading ? (
                        <Spinner />
                    ) : enrollments.filter((e) => e.status === 'active').length === 0 ? (
                        <p className="text-sm" style={{ color: 'var(--lh-muted)' }}>No leads enrolled yet.</p>
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            {enrollments.filter((e) => e.status === 'active').map((e) => {
                                const leadInfo = Array.isArray(e.leads) ? e.leads[0] : e.leads
                                return (
                                    <div key={e.id} className="flex items-center justify-between rounded-lg border p-2.5" style={{ borderColor: 'var(--lh-border)' }}>
                                        <div className="text-sm">
                                            <span className="font-medium">{leadInfo?.name || 'Unknown lead'}</span>
                                            <span style={{ color: 'var(--lh-muted)' }}> · step {e.step_index + 1}/{sequence.steps.length || 1}</span>
                                        </div>
                                        <IconButton label="Pause" variant="outline" onClick={() => handleUnenroll(e.id)} disabled={pending} />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="border-t pt-4" style={{ borderColor: 'var(--lh-border)' }}>
                    <h4 className="font-bold text-sm mb-2">Enrollable leads (score 55+)</h4>
                    {enrollable.length === 0 ? (
                        <p className="text-sm" style={{ color: 'var(--lh-muted)' }}>No eligible leads right now.</p>
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            {enrollable.map((lead) => (
                                <div key={lead.id} className="flex items-center justify-between rounded-lg border p-2.5" style={{ borderColor: 'var(--lh-border)' }}>
                                    <div className="text-sm">
                                        <span className="font-medium">{lead.name}</span>
                                        <span style={{ color: 'var(--lh-muted)' }}> · {lead.company || 'No company'} · score {getScores(lead).final}</span>
                                    </div>
                                    <IconButton icon={Plus} label="Enroll" variant="accent" onClick={() => handleEnroll(lead.id)} disabled={pending} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}

export function SequencesClient({ sequences, leads, tier }: { sequences: Sequence[]; leads: Lead[]; tier: Tier }) {
    const { pushToast } = useToast()
    const [pending, startTransition] = useTransition()
    const [showNew, setShowNew] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const selected = sequences.find((s) => s.id === selectedId) || null
    const atLimit = tier === 'Free' && sequences.length >= TIERS.Free.sequenceLimit

    const handleDelete = (sequenceId: string) => {
        startTransition(async () => {
            const result = await deleteSequence(sequenceId)
            if (result.error) pushToast(result.error)
            if (selectedId === sequenceId) setSelectedId(null)
        })
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--lh-muted)' }}>
                    {sequences.length} sequence{sequences.length === 1 ? '' : 's'}
                </p>
                <IconButton
                    icon={Plus} label="New sequence" variant="accent"
                    onClick={() => (atLimit ? pushToast(`Free plan limit reached (${TIERS.Free.sequenceLimit} sequence). Upgrade in Billing to add more.`) : setShowNew(true))}
                />
            </div>

            {sequences.length === 0 ? (
                <div className="lh-card rounded-xl">
                    <EmptyState icon={Send} title="No sequences yet" body="Create a sequence to automate multi-step outreach." />
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {sequences.map((seq) => (
                        <button
                            key={seq.id} type="button" onClick={() => setSelectedId(seq.id)}
                            className="lh-focus lh-row lh-card rounded-xl p-4 text-left"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-sm">{seq.name}</p>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(seq.id) }}
                                    className="lh-focus"
                                    aria-label="Delete sequence"
                                >
                                    <Trash2 size={14} style={{ color: 'var(--lh-muted)' }} />
                                </button>
                            </div>
                            {seq.description && <p className="mt-1 text-xs" style={{ color: 'var(--lh-muted)' }}>{seq.description}</p>}
                            <div className="mt-3 flex items-center gap-2">
                                <Badge color="#1F6FB2" soft>{seq.steps.length} step{seq.steps.length === 1 ? '' : 's'}</Badge>
                                <Badge color="#1F8A6F" soft>{seq.activeEnrollments} active</Badge>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {showNew && <NewSequenceModal onClose={() => setShowNew(false)} onCreated={() => setRefreshKey((k) => k + 1)} />}
            {selected && (
                <SequenceDetail
                    key={refreshKey}
                    sequence={selected}
                    leads={leads}
                    onClose={() => setSelectedId(null)}
                    onChanged={() => setRefreshKey((k) => k + 1)}
                />
            )}
        </div>
    )
}
