'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import Papa from 'papaparse'
import { Search, Upload, Download, Plus, ChevronRight, Flame, AlertCircle } from 'lucide-react'
import { getScores, timeAgo } from '@/lib/scoring'
import { STATUSES, STATUS_COLOR, CATEGORIES, TIERS, type Tier, type LeadStatus } from '@/lib/constants'
import { Badge, IconButton, Modal, EmptyState } from './primitives'
import { useToast } from './toast'
import { createLead, bulkImportLeads, changeLeadStatus } from '@/app/app/leads/actions'
import { LeadDetailPanel } from './LeadDetailPanel'
import type { Lead } from '@/lib/types'

const QUICK_VIEWS = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'hot', label: 'Hot (70+)' },
    { key: 'followup', label: 'Needs follow-up' },
    { key: 'won', label: 'Won' },
]

function applyQuickView(leads: Lead[], key: string) {
    switch (key) {
        case 'new': return leads.filter((l) => l.status === 'New')
        case 'hot': return leads.filter((l) => getScores(l).final >= 70)
        case 'followup': return leads.filter((l) => l.followUpDueAt && new Date(l.followUpDueAt) <= new Date())
        case 'won': return leads.filter((l) => l.status === 'Won')
        default: return leads
    }
}

function AddLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const { pushToast } = useToast()
    const [pending, startTransition] = useTransition()
    const [form, setForm] = useState({
        name: '', company: '', email: '', phone: '', category: 'Roofing', city: '', state: '', source: 'Manual entry', tagsText: '',
    })
    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
    const inputCls = 'lh-focus w-full px-3 py-2 rounded-md text-sm border'
    const inputStyle = { borderColor: 'var(--lh-border)' }

    const submit = () => {
        if (!form.name.trim()) return
        startTransition(async () => {
            const result = await createLead({
                ...form,
                tags: form.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
            })
            if (result.error) {
                pushToast(result.error)
                return
            }
            pushToast(`Lead "${form.name}" added.`)
            onCreated()
            onClose()
        })
    }

    return (
        <Modal title="Add lead" onClose={onClose} width={520}>
            <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                    <input className={inputCls} style={inputStyle} placeholder="Full name *" value={form.name} onChange={(e) => set('name', e.target.value)} />
                    <input className={inputCls} style={inputStyle} placeholder="Company" value={form.company} onChange={(e) => set('company', e.target.value)} />
                    <input className={inputCls} style={inputStyle} placeholder="Email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                    <input className={inputCls} style={inputStyle} placeholder="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                    <select className={inputCls} style={inputStyle} value={form.category} onChange={(e) => set('category', e.target.value)}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input className={inputCls} style={inputStyle} placeholder="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
                    <input className={inputCls} style={inputStyle} placeholder="State" value={form.state} onChange={(e) => set('state', e.target.value)} />
                    <input className={inputCls} style={inputStyle} placeholder="Source" value={form.source} onChange={(e) => set('source', e.target.value)} />
                    <input className={`${inputCls} col-span-2`} style={inputStyle} placeholder="Tags (comma separated)" value={form.tagsText} onChange={(e) => set('tagsText', e.target.value)} />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    <IconButton label="Cancel" variant="outline" onClick={onClose} />
                    <IconButton label={pending ? 'Adding...' : 'Add lead'} icon={Plus} variant="accent" onClick={submit} disabled={pending} />
                </div>
            </div>
        </Modal>
    )
}

export function LeadsClient({ leads, tier, initialSelectedLeadId }: { leads: Lead[]; tier: Tier; initialSelectedLeadId: string | null }) {
    const { pushToast } = useToast()
    const [search, setSearch] = useState('')
    const [quickView, setQuickView] = useState('all')
    const [showAdd, setShowAdd] = useState(false)
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialSelectedLeadId)
    const [, startTransition] = useTransition()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const filtered = useMemo(() => {
        let r = applyQuickView(leads, quickView)
        if (search.trim()) {
            const q = search.toLowerCase()
            r = r.filter((l) => l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.tags.some((t) => t.toLowerCase().includes(q)))
        }
        return [...r].sort((a, b) => getScores(b).final - getScores(a).final)
    }, [leads, search, quickView])

    const selectedLead = leads.find((l) => l.id === selectedLeadId) || null
    const atLimit = tier === 'Free' && leads.length >= TIERS.Free.leadsLimit

    const handleImport = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (parsed) => {
                const rows = (parsed.data as Record<string, string>[]).map((row) => ({
                    name: row.name || row.Name || '',
                    company: row.company || row.Company || '',
                    email: row.email || row.Email || '',
                    phone: row.phone || row.Phone || '',
                    category: row.category || row.Category || 'Other',
                    city: row.city || row.City || '',
                    state: row.state || row.State || '',
                    source: row.source || row.Source || 'CSV import',
                    tags: (row.tags || row.Tags || '').split(',').map((t) => t.trim()).filter(Boolean),
                }))
                startTransition(async () => {
                    const result = await bulkImportLeads(rows)
                    if (result.error) {
                        pushToast(result.error)
                        return
                    }
                    pushToast(`Imported ${result.imported} lead${result.imported === 1 ? '' : 's'}.${result.truncated ? ' Some rows were skipped due to the Free plan limit.' : ''}`)
                })
            },
            error: () => pushToast('Could not read that CSV file.'),
        })
    }

    const handleExport = () => {
        const rows = leads.map((l) => {
            const s = getScores(l)
            return {
                Name: l.name, Company: l.company, Email: l.email, Phone: l.phone, Category: l.category,
                City: l.city, State: l.state, Status: l.status, Tags: l.tags.join('; '), AssignedTo: l.assignedTo,
                EngagementScore: s.engagement, IntentScore: s.intent, ActivityScore: s.activity, FinalScore: s.final,
                CreatedAt: l.createdAt,
            }
        })
        const csv = Papa.unparse(rows)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'leadhunter-leads-export.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        pushToast(`Exported ${rows.length} leads.`)
    }

    const handleStatusChange = (leadId: string, status: LeadStatus) => {
        startTransition(async () => {
            const result = await changeLeadStatus(leadId, status)
            if (result.error) pushToast(result.error)
        })
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                    {QUICK_VIEWS.map((qv) => (
                        <button
                            type="button" key={qv.key} onClick={() => setQuickView(qv.key)}
                            className="lh-btn lh-focus text-xs font-medium px-3 py-1.5 rounded-full border"
                            style={{
                                borderColor: quickView === qv.key ? 'var(--lh-accent)' : 'var(--lh-border)',
                                background: quickView === qv.key ? '#FFF1EB' : 'transparent',
                                color: quickView === qv.key ? 'var(--lh-accent-deep)' : 'var(--lh-muted)',
                            }}
                        >
                            {qv.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-2.5" style={{ color: 'var(--lh-muted)' }} />
                        <input
                            className="lh-focus pl-8 pr-3 py-2 rounded-md text-sm border w-44"
                            style={{ borderColor: 'var(--lh-border)' }}
                            placeholder="Search leads" value={search} onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImport(e.target.files[0]); e.target.value = '' }} />
                    <IconButton icon={Upload} label="Import" variant="outline" onClick={() => fileInputRef.current?.click()} />
                    <IconButton icon={Download} label="Export" variant="outline" onClick={handleExport} />
                    <IconButton icon={Plus} label="Add lead" variant="accent" onClick={() => setShowAdd(true)} />
                </div>
            </div>

            {atLimit && (
                <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-2" style={{ background: '#FFF1EB', color: 'var(--lh-accent-deep)' }}>
                    <AlertCircle size={15} />
                    <span>You&apos;ve hit the Free plan&apos;s {TIERS.Free.leadsLimit}-lead limit. Upgrade in Billing to add more.</span>
                </div>
            )}

            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'var(--lh-border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left" style={{ color: 'var(--lh-muted)' }}>
                                <th className="px-4 py-3 font-medium">Lead</th>
                                <th className="px-4 py-3 font-medium hidden md:table-cell">Category</th>
                                <th className="px-4 py-3 font-medium hidden lg:table-cell">Location</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium hidden sm:table-cell">Tags</th>
                                <th className="px-4 py-3 font-medium">Score</th>
                                <th className="px-4 py-3 font-medium hidden lg:table-cell">Assigned</th>
                                <th className="px-4 py-3 font-medium hidden md:table-cell">Last activity</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((lead) => {
                                const scores = getScores(lead)
                                return (
                                    <tr key={lead.id} className="lh-row border-t" style={{ borderColor: 'var(--lh-border)' }}>
                                        <td className="px-4 py-3">
                                            <button type="button" className="lh-focus text-left" onClick={() => setSelectedLeadId(lead.id)}>
                                                <p className="font-semibold">{lead.name}</p>
                                                <p className="text-xs" style={{ color: 'var(--lh-muted)' }}>{lead.company}</p>
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">{lead.category}</td>
                                        <td className="px-4 py-3 hidden lg:table-cell" style={{ color: 'var(--lh-muted)' }}>{lead.city}{lead.city && lead.state ? ', ' : ''}{lead.state}</td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={lead.status} onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                                                className="lh-focus text-xs font-medium rounded-full px-2 py-1 border-0"
                                                style={{ background: `${STATUS_COLOR[lead.status]}1A`, color: STATUS_COLOR[lead.status] }}
                                            >
                                                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <div className="flex gap-1 flex-wrap" style={{ maxWidth: 160 }}>
                                                {lead.tags.slice(0, 2).map((t) => <Badge key={t}>{t}</Badge>)}
                                                {lead.tags.length > 2 && <span className="text-xs" style={{ color: 'var(--lh-muted)' }}>+{lead.tags.length - 2}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                {scores.final >= 70 && <Flame size={13} style={{ color: 'var(--lh-accent)' }} />}
                                                <span className="lh-mono font-semibold">{scores.final}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell" style={{ color: 'var(--lh-muted)' }}>{lead.assignedTo}</td>
                                        <td className="px-4 py-3 hidden md:table-cell lh-mono text-xs" style={{ color: 'var(--lh-muted)' }}>{timeAgo(lead.metrics.lastInteractionAt || lead.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            <button type="button" className="lh-focus" onClick={() => setSelectedLeadId(lead.id)} aria-label="Open lead">
                                                <ChevronRight size={16} style={{ color: 'var(--lh-muted)' }} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <EmptyState icon={Search} title="No leads here" body="Try a different filter, or add your first lead." />}
                </div>
            </div>

            {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onCreated={() => {}} />}

            {selectedLead && (
                <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLeadId(null)} onStatusChange={handleStatusChange} />
            )}
        </div>
    )
}
