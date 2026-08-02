'use client'

import { useState, useTransition } from 'react'
import { Compass, Phone, Globe, MapPin, CheckSquare, Square } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'
import { Modal, IconButton, Spinner, EmptyState } from './primitives'
import { useToast } from './toast'
import { importFoundLeads } from '@/app/app/leads/actions'
import type { PlaceResult } from '@/lib/google-places'

export function FindLeadsModal({ onClose }: { onClose: () => void }) {
    const { pushToast } = useToast()
    const [pending, startTransition] = useTransition()
    const [searching, setSearching] = useState(false)
    const [form, setForm] = useState({ category: 'Roofing', city: '', state: '' })
    const [results, setResults] = useState<PlaceResult[] | null>(null)
    const [selected, setSelected] = useState<Set<string>>(new Set())

    const inputCls = 'lh-focus w-full px-3 py-2 rounded-md text-sm border'
    const inputStyle = { borderColor: 'var(--lh-border)' }
    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

    const toggle = (placeId: string) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(placeId)) next.delete(placeId)
            else next.add(placeId)
            return next
        })
    }

    const runSearch = async () => {
        if (!form.city.trim() && !form.state.trim()) {
            pushToast('Enter a city or state to search.')
            return
        }
        setSearching(true)
        setResults(null)
        try {
            const res = await fetch('/api/places/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const json = await res.json()
            if (json.skipped) {
                pushToast(json.reason || 'Google Places is not configured.')
                return
            }
            if (!res.ok) {
                pushToast(json.error || 'Search failed.')
                return
            }
            const found = (json.data as PlaceResult[]) || []
            setResults(found)
            setSelected(new Set(found.map((r) => r.placeId)))
        } catch {
            pushToast('Search failed.')
        } finally {
            setSearching(false)
        }
    }

    const runImport = () => {
        if (!results) return
        const toImport = results
            .filter((r) => selected.has(r.placeId))
            .map((r) => ({
                placeId: r.placeId,
                name: r.name,
                phone: r.phone || undefined,
                website: r.website || undefined,
                address: r.formattedAddress || undefined,
                category: form.category,
                city: r.city || form.city || undefined,
                state: r.state || form.state || undefined,
            }))
        if (toImport.length === 0) return
        startTransition(async () => {
            const result = await importFoundLeads(toImport)
            if (result.error) {
                pushToast(result.error)
                return
            }
            const parts = [`Imported ${result.imported} lead${result.imported === 1 ? '' : 's'}.`]
            if (result.duplicates) parts.push(`${result.duplicates} already in your leads.`)
            if (result.truncated) parts.push('Some rows were skipped due to the Free plan limit.')
            pushToast(parts.join(' '))
            onClose()
        })
    }

    return (
        <Modal title="Find leads" onClose={onClose} width={620}>
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-3">
                    <select className={inputCls} style={inputStyle} value={form.category} onChange={(e) => set('category', e.target.value)}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input className={inputCls} style={inputStyle} placeholder="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
                    <input className={inputCls} style={inputStyle} placeholder="State" value={form.state} onChange={(e) => set('state', e.target.value)} />
                </div>
                <div className="flex justify-end">
                    <IconButton icon={Compass} label={searching ? 'Searching...' : 'Search'} variant="accent" onClick={runSearch} disabled={searching} />
                </div>

                {searching && (
                    <div className="flex justify-center py-8">
                        <Spinner size={22} />
                    </div>
                )}

                {!searching && results && results.length === 0 && (
                    <EmptyState icon={Compass} title="No businesses found" body="Try a different category, city, or state." />
                )}

                {!searching && results && results.length > 0 && (
                    <div className="flex flex-col gap-2 max-h-80 overflow-y-auto lh-scroll">
                        {results.map((r) => {
                            const isSelected = selected.has(r.placeId)
                            return (
                                <button
                                    type="button"
                                    key={r.placeId}
                                    onClick={() => toggle(r.placeId)}
                                    className="lh-focus lh-row text-left rounded-lg border px-3 py-2.5 flex items-start gap-2.5"
                                    style={{ borderColor: 'var(--lh-border)' }}
                                >
                                    {isSelected ? <CheckSquare size={16} style={{ color: 'var(--lh-accent)' }} className="mt-0.5 flex-shrink-0" /> : <Square size={16} style={{ color: 'var(--lh-muted)' }} className="mt-0.5 flex-shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm">{r.name}</p>
                                        <div className="text-xs flex flex-col gap-0.5 mt-1" style={{ color: 'var(--lh-muted)' }}>
                                            {r.formattedAddress && <span className="flex items-center gap-1.5"><MapPin size={11} />{r.formattedAddress}</span>}
                                            {r.phone && <span className="flex items-center gap-1.5"><Phone size={11} />{r.phone}</span>}
                                            {r.website && <span className="flex items-center gap-1.5"><Globe size={11} />{r.website}</span>}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}

                {results && results.length > 0 && (
                    <div className="flex justify-end gap-2 mt-2 pt-3 border-t" style={{ borderColor: 'var(--lh-border)' }}>
                        <IconButton label="Cancel" variant="outline" onClick={onClose} />
                        <IconButton
                            label={pending ? 'Importing...' : `Import selected (${selected.size})`}
                            variant="accent" onClick={runImport} disabled={pending || selected.size === 0}
                        />
                    </div>
                )}
            </div>
        </Modal>
    )
}
