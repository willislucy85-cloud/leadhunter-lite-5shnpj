// Pure, framework-agnostic scoring engine — ported unchanged from the
// LeadHunter Lite prototype. engagement*0.4 + intent*0.4 + activity*0.2

export type LeadMetrics = {
    opens: number
    clicks: number
    replies: number
    sequenceProgress: number
    followUpsCompleted: number
    followUpsTotal: number
    lastInteractionAt: string | null
    interactionCount: number
}

export type ScorableLead = {
    metrics: LeadMetrics
    aiIntent: { score: number } | null
}

export function clamp(n: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, n))
}

export function daysAgo(iso: string | null) {
    if (!iso) return 999
    const diff = Date.now() - new Date(iso).getTime()
    return Math.max(0, Math.floor(diff / 86400000))
}

export function timeAgo(iso: string | null) {
    const d = daysAgo(iso)
    if (d === 0) return 'today'
    if (d === 1) return '1 day ago'
    return `${d} days ago`
}

export function computeEngagement(m: LeadMetrics) {
    const raw = m.opens * 4 + m.clicks * 8 + m.replies * 15 + m.sequenceProgress * 20 + m.followUpsCompleted * 4
    return clamp(Math.round(raw), 0, 100)
}

export function fallbackIntent(lead: ScorableLead) {
    if (lead.metrics.replies > 0) return 58
    if (lead.metrics.clicks > 0) return 45
    return 32
}

export function computeActivity(m: LeadMetrics) {
    const days = m.lastInteractionAt ? daysAgo(m.lastInteractionAt) : 999
    const recency = clamp(100 - days * 7, 0, 100)
    const followRatio = m.followUpsTotal > 0 ? m.followUpsCompleted / m.followUpsTotal : 0
    const raw = recency * 0.5 + Math.min(m.interactionCount, 10) * 3 + followRatio * 20
    return clamp(Math.round(raw), 0, 100)
}

export function getScores(lead: ScorableLead) {
    const engagement = computeEngagement(lead.metrics)
    const activity = computeActivity(lead.metrics)
    const intent = lead.aiIntent && typeof lead.aiIntent.score === 'number' ? lead.aiIntent.score : fallbackIntent(lead)
    const final = Math.round(engagement * 0.4 + intent * 0.4 + activity * 0.2)
    return { engagement, intent, activity, final }
}
