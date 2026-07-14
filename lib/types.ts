import type { LeadMetrics } from './scoring'
import type { LeadStatus } from './constants'

// UI-facing shape (camelCase), mapped from the snake_case `leads` table row.
export type Lead = {
    id: string
    name: string
    company: string
    email: string
    phone: string
    category: string
    city: string
    state: string
    source: string
    tags: string[]
    status: LeadStatus
    assignedTo: string
    createdAt: string
    followUpDueAt: string | null
    metrics: LeadMetrics
    aiEnrichment: { summary: string; generatedAt: string } | null
    aiIntent: { score: number; sentiment: string; urgency: string; signals: string[]; summary: string; at: string } | null
}

export type LeadRow = {
    id: string
    workspace_id: string
    name: string
    company: string | null
    email: string | null
    phone: string | null
    category: string | null
    city: string | null
    state: string | null
    source: string | null
    tags: string[] | null
    status: LeadStatus
    assigned_to: string | null
    follow_up_due_at: string | null
    ai_enrichment: Lead['aiEnrichment']
    ai_intent: Lead['aiIntent']
    metrics: LeadMetrics
    created_at: string
    updated_at: string
}

export function rowToLead(row: LeadRow): Lead {
    return {
        id: row.id,
        name: row.name,
        company: row.company || '',
        email: row.email || '',
        phone: row.phone || '',
        category: row.category || 'Other',
        city: row.city || '',
        state: row.state || '',
        source: row.source || 'Manual entry',
        tags: row.tags || [],
        status: row.status,
        assignedTo: row.assigned_to || 'Unassigned',
        createdAt: row.created_at,
        followUpDueAt: row.follow_up_due_at,
        metrics: row.metrics,
        aiEnrichment: row.ai_enrichment,
        aiIntent: row.ai_intent,
    }
}

export type TimelineEntry = {
    id: string
    lead_id: string
    type: string
    text: string
    created_at: string
}

export type Note = {
    id: string
    lead_id: string
    text: string
    created_at: string
}
