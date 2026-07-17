'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Users2, Sparkles, Crosshair, Send, CalendarClock, Clock, ArrowRight } from 'lucide-react'
import { getScores, timeAgo, daysAgo } from '@/lib/scoring'
import { STATUSES, STATUS_COLOR } from '@/lib/constants'
import { Badge, ScoreGauge, EmptyState, IconButton } from './primitives'
import type { Lead } from '@/lib/types'
import type { TimelineEntry } from '@/lib/types'

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number | string; accent?: string }) {
    return (
        <div className="lh-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
                <Icon size={15} style={{ color: accent || 'var(--lh-muted)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--lh-muted)' }}>{label}</span>
            </div>
            <p className="lh-mono text-2xl font-bold">{value}</p>
        </div>
    )
}

export function DashboardClient({ leads, timeline }: { leads: Lead[]; timeline: (TimelineEntry & { leads: { name: string } | null })[] }) {
    const activeLeads = leads.filter((l) => l.status !== 'Won' && l.status !== 'Lost')
    const topLead = useMemo(() => {
        if (activeLeads.length === 0) return null
        return [...activeLeads].sort((a, b) => getScores(b).final - getScores(a).final)[0]
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leads])

    const newThisWeek = leads.filter((l) => daysAgo(l.createdAt) <= 7).length
    const avgScore = leads.length ? Math.round(leads.reduce((s, l) => s + getScores(l).final, 0) / leads.length) : 0
    const followUpsDue = leads.filter((l) => l.followUpDueAt && new Date(l.followUpDueAt) <= new Date() && l.status !== 'Won' && l.status !== 'Lost').length

    const chartData = STATUSES.map((s) => ({ status: s, count: leads.filter((l) => l.status === s).length }))

    return (
        <div className="flex flex-col gap-5">
            {topLead && (
                <div className="lh-card rounded-xl p-5 flex flex-col sm:flex-row items-center gap-5">
                    <ScoreGauge {...getScores(topLead)} size={104} />
                    <div className="flex-1 text-center sm:text-left">
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--lh-accent-deep)' }}>Today&apos;s focus</p>
                        <p className="font-bold text-lg mt-0.5">{topLead.name} <span className="font-normal" style={{ color: 'var(--lh-muted)' }}>— {topLead.company}</span></p>
                        <p className="text-sm mt-1" style={{ color: 'var(--lh-muted)' }}>
                            {topLead.category} · {topLead.city}, {topLead.state} · <Badge color={STATUS_COLOR[topLead.status]}>{topLead.status}</Badge>
                        </p>
                    </div>
                    <Link href={`/app/leads?lead=${topLead.id}`}>
                        <IconButton icon={ArrowRight} label="Open lead" variant="accent" />
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={Users2} label="Total leads" value={leads.length} />
                <StatCard icon={Sparkles} label="New this week" value={newThisWeek} accent="var(--lh-accent)" />
                <StatCard icon={Crosshair} label="Avg final score" value={avgScore} accent="var(--lh-blue)" />
                <StatCard icon={CalendarClock} label="Follow-ups due" value={followUpsDue} accent="var(--lh-amber)" />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
                <div className="lh-card rounded-xl p-4">
                    <h3 className="font-bold text-sm mb-3">Pipeline by status</h3>
                    <div style={{ height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--lh-border)" vertical={false} />
                                <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#6B6F76' }} axisLine={{ stroke: 'var(--lh-border)' }} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#6B6F76' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#FF5A1F" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lh-card rounded-xl p-4">
                    <h3 className="font-bold text-sm mb-3">Recent activity</h3>
                    {timeline.length === 0 ? (
                        <EmptyState icon={Clock} title="Nothing yet" body="Activity across your leads will show up here." />
                    ) : (
                        <div className="flex flex-col gap-3">
                            {timeline.map((e) => (
                                <Link key={e.id} href={`/app/leads?lead=${e.lead_id}`} className="lh-focus flex items-start gap-2 text-left">
                                    <Clock size={13} className="mt-1 flex-shrink-0" style={{ color: 'var(--lh-muted)' }} />
                                    <div className="text-sm">
                                        <span className="font-semibold">{e.leads?.name || 'Unknown lead'}</span>{' '}
                                        <span style={{ color: 'var(--lh-muted)' }}>— {e.text}</span>
                                        <span className="lh-mono block text-xs mt-0.5" style={{ color: 'var(--lh-muted)' }}>{timeAgo(e.created_at)}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
