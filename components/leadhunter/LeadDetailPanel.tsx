'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Mail, Phone, MapPin, Building2, Crosshair, Pencil, Clock, Plus, TrendingUp, Zap, CalendarClock, Sparkles, Send, MessageSquareText, Copy } from 'lucide-react'
import { getScores, timeAgo } from '@/lib/scoring'
import { STATUSES, STATUS_COLOR, type LeadStatus } from '@/lib/constants'
import { Badge, ScoreGauge, ScoreBar, IconButton, Spinner, Modal } from './primitives'
import { useToast } from './toast'
import { getLeadDetail, updateLeadTags, addLeadNote } from '@/app/app/leads/actions'
import type { Lead, Note, TimelineEntry } from '@/lib/types'

type DraftResult = { subject?: string; body: string }

const TIMELINE_ICON: Record<string, any> = {
    created: Plus, status: TrendingUp, automation: Zap, followup: CalendarClock,
    note: Pencil, email: Mail, sms: Mail, enrichment: Crosshair, intent: Crosshair,
}

export function LeadDetailPanel({
    lead,
    onClose,
    onStatusChange,
}: {
    lead: Lead
    onClose: () => void
    onStatusChange: (leadId: string, status: LeadStatus) => void
}) {
    const { pushToast } = useToast()
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [loading, setLoading] = useState(true)
    const [notes, setNotes] = useState<Note[]>([])
    const [timeline, setTimeline] = useState<TimelineEntry[]>([])
    const [tagInput, setTagInput] = useState('')
    const [noteText, setNoteText] = useState('')
    const [tags, setTags] = useState(lead.tags)
    const [aiPending, setAiPending] = useState<'enrich' | 'intent' | 'draft-email' | 'draft-sms' | null>(null)
    const [draftResult, setDraftResult] = useState<DraftResult | null>(null)

    const scores = getScores(lead)

    async function callAiRoute<T>(path: string, payload: Record<string, unknown>): Promise<T | null> {
        try {
            const res = await fetch(path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const json = await res.json()
            if (!res.ok) {
                pushToast(json.error || 'AI request failed.')
                return null
            }
            return json.data as T
        } catch {
            pushToast('AI request failed.')
            return null
        }
    }

    async function runEnrich() {
        setAiPending('enrich')
        const data = await callAiRoute<{ summary: string }>('/api/ai/enrich', { leadId: lead.id })
        setAiPending(null)
        if (data) {
            pushToast('Enrichment generated.')
            reload()
            router.refresh()
        }
    }

    async function runIntent() {
        setAiPending('intent')
        const data = await callAiRoute<{ score: number }>('/api/ai/intent', { leadId: lead.id })
        setAiPending(null)
        if (data) {
            pushToast(`Intent score: ${data.score}.`)
            reload()
            router.refresh()
        }
    }

    async function runDraft(channel: 'email' | 'sms') {
        setAiPending(channel === 'email' ? 'draft-email' : 'draft-sms')
        const data = await callAiRoute<DraftResult>('/api/ai/draft', { leadId: lead.id, channel })
        setAiPending(null)
        if (data) setDraftResult(data)
    }

    async function copyDraft() {
        if (!draftResult) return
        const text = draftResult.subject ? `Subject: ${draftResult.subject}\n\n${draftResult.body}` : draftResult.body
        await navigator.clipboard.writeText(text)
        pushToast('Copied to clipboard.')
    }

    async function reload() {
        setLoading(true)
        const detail = await getLeadDetail(lead.id)
        setNotes(detail.notes as Note[])
        setTimeline(detail.timeline as TimelineEntry[])
        setLoading(false)
    }

    useEffect(() => {
        setTags(lead.tags)
        reload()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lead.id])

    const saveTags = (next: string[]) => {
        setTags(next)
        startTransition(async () => {
            const result = await updateLeadTags(lead.id, next)
            if (result.error) pushToast(result.error)
        })
    }

    const submitNote = () => {
        if (!noteText.trim()) return
        const text = noteText.trim()
        setNoteText('')
        startTransition(async () => {
            const result = await addLeadNote(lead.id, text)
            if (result.error) {
                pushToast(result.error)
                return
            }
            reload()
        })
    }

    return (
        <div className="fixed inset-0 z-30 flex justify-end" style={{ background: 'rgba(14,15,19,0.45)' }} onMouseDown={onClose}>
            <div
                className="lh-fade-in lh-scroll h-full overflow-y-auto"
                style={{ width: 'min(460px, 94vw)', background: 'var(--lh-card)' }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 border-b px-5 py-4 flex items-center justify-between z-10" style={{ borderColor: 'var(--lh-border)', background: 'var(--lh-card)' }}>
                    <div>
                        <p className="font-bold text-lg leading-tight">{lead.name}</p>
                        <p className="text-sm" style={{ color: 'var(--lh-muted)' }}>{lead.company}</p>
                    </div>
                    <button type="button" onClick={onClose} className="lh-focus p-1 rounded-md" aria-label="Close"><X size={18} /></button>
                </div>

                <div className="p-5 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <select
                                value={lead.status} onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                                className="lh-focus text-sm font-medium rounded-full px-3 py-1.5 border-0"
                                style={{ background: `${STATUS_COLOR[lead.status]}1A`, color: STATUS_COLOR[lead.status] }}
                            >
                                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <span className="text-xs" style={{ color: 'var(--lh-muted)' }}>Assigned: {lead.assignedTo}</span>
                        </div>
                        <div className="text-sm flex flex-col gap-1.5 mt-1" style={{ color: 'var(--lh-muted)' }}>
                            {lead.email && <span className="flex items-center gap-2"><Mail size={13} />{lead.email}</span>}
                            {lead.phone && <span className="flex items-center gap-2"><Phone size={13} />{lead.phone}</span>}
                            {(lead.city || lead.state) && <span className="flex items-center gap-2"><MapPin size={13} />{lead.city}{lead.city && lead.state ? ', ' : ''}{lead.state}</span>}
                            <span className="flex items-center gap-2"><Building2 size={13} />{lead.category} · via {lead.source}</span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap mt-1">
                            {tags.map((t) => (
                                <span key={t} className="inline-flex items-center gap-1">
                                    <Badge>{t}</Badge>
                                    <button type="button" className="lh-focus" onClick={() => saveTags(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`}>
                                        <X size={10} style={{ color: 'var(--lh-muted)' }} />
                                    </button>
                                </span>
                            ))}
                            <input
                                value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && tagInput.trim()) { saveTags([...tags, tagInput.trim()]); setTagInput('') } }}
                                placeholder="+ tag" className="lh-focus text-xs px-2 py-0.5 rounded border w-16" style={{ borderColor: 'var(--lh-border)' }}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4" style={{ borderColor: 'var(--lh-border)' }}>
                        <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Crosshair size={14} style={{ color: 'var(--lh-accent)' }} />Lead score</h4>
                        <div className="flex items-center gap-4">
                            <ScoreGauge {...scores} size={88} />
                            <div className="flex-1 flex flex-col gap-2.5">
                                <ScoreBar label="Engagement (40%)" value={scores.engagement} color="var(--lh-accent)" />
                                <ScoreBar label="Intent (40%)" value={scores.intent} color="var(--lh-blue)" />
                                <ScoreBar label="Activity (20%)" value={scores.activity} color="var(--lh-amber)" />
                            </div>
                        </div>
                        {lead.aiIntent && (
                            <div className="mt-3 text-sm rounded-lg p-3" style={{ background: 'var(--lh-canvas)' }}>
                                <p className="font-medium">{lead.aiIntent.summary}</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--lh-muted)' }}>{lead.aiIntent.sentiment} sentiment · {lead.aiIntent.urgency} urgency</p>
                            </div>
                        )}
                        {lead.aiEnrichment && (
                            <div className="mt-2 text-sm rounded-lg p-3" style={{ background: 'var(--lh-canvas)' }}>
                                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--lh-muted)' }}>AI research</p>
                                <p>{lead.aiEnrichment.summary}</p>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            <IconButton
                                icon={Sparkles} label={aiPending === 'enrich' ? 'Enriching...' : 'Enrich'}
                                variant="outline" onClick={runEnrich} disabled={aiPending !== null}
                            />
                            <IconButton
                                icon={Crosshair} label={aiPending === 'intent' ? 'Analyzing...' : 'Analyze intent'}
                                variant="outline" onClick={runIntent} disabled={aiPending !== null}
                            />
                            <IconButton
                                icon={Send} label={aiPending === 'draft-email' ? 'Drafting...' : 'Draft email'}
                                variant="outline" onClick={() => runDraft('email')} disabled={aiPending !== null}
                            />
                            <IconButton
                                icon={MessageSquareText} label={aiPending === 'draft-sms' ? 'Drafting...' : 'Draft SMS'}
                                variant="outline" onClick={() => runDraft('sms')} disabled={aiPending !== null}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4" style={{ borderColor: 'var(--lh-border)' }}>
                        <h4 className="font-bold text-sm mb-2 flex items-center gap-1.5"><Pencil size={14} />Notes</h4>
                        <div className="flex flex-col gap-2 mb-2">
                            <textarea
                                value={noteText} onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Add a note..." rows={2} className="lh-focus w-full text-sm px-3 py-2 rounded-md border resize-none" style={{ borderColor: 'var(--lh-border)' }}
                            />
                            <IconButton icon={Plus} label={pending ? 'Adding...' : 'Add note'} variant="outline" onClick={submitNote} disabled={pending} />
                        </div>
                        {notes.map((n) => (
                            <div key={n.id} className="text-sm py-1.5 border-t" style={{ borderColor: 'var(--lh-border)' }}>
                                <p>{n.text}</p>
                                <p className="lh-mono text-xs mt-0.5" style={{ color: 'var(--lh-muted)' }}>{timeAgo(n.created_at)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t pt-4" style={{ borderColor: 'var(--lh-border)' }}>
                        <h4 className="font-bold text-sm mb-2 flex items-center gap-1.5"><Clock size={14} />Timeline</h4>
                        {loading ? (
                            <Spinner />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {timeline.map((t) => {
                                    const Icon = TIMELINE_ICON[t.type] || Clock
                                    return (
                                        <div key={t.id} className="flex items-start gap-2 text-sm">
                                            <Icon size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--lh-muted)' }} />
                                            <div>
                                                <p>{t.text}</p>
                                                <p className="lh-mono text-xs" style={{ color: 'var(--lh-muted)' }}>{timeAgo(t.created_at)}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {draftResult && (
                <Modal title="AI draft" onClose={() => setDraftResult(null)} width={480}>
                    <div className="flex flex-col gap-3">
                        {draftResult.subject && (
                            <div>
                                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--lh-muted)' }}>Subject</p>
                                <p className="text-sm">{draftResult.subject}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--lh-muted)' }}>Body</p>
                            <p className="text-sm whitespace-pre-wrap">{draftResult.body}</p>
                        </div>
                        <div className="flex justify-end">
                            <IconButton icon={Copy} label="Copy" variant="accent" onClick={copyDraft} />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
