import type { SupabaseClient } from '@supabase/supabase-js'
import { rowToLead, type Lead, type LeadRow, type TimelineEntry, type Note } from './types'

export async function fetchLeads(supabase: SupabaseClient, workspaceId: string): Promise<Lead[]> {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

    if (error || !data) return []
    return (data as LeadRow[]).map(rowToLead)
}

export async function fetchLeadById(
    supabase: SupabaseClient,
    workspaceId: string,
    leadId: string
): Promise<Lead | null> {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('id', leadId)
        .maybeSingle()

    if (error || !data) return null
    return rowToLead(data as LeadRow)
}

export async function countEnrichedLeads(supabase: SupabaseClient, workspaceId: string) {
    const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .not('ai_enrichment', 'is', null)

    return count ?? 0
}

export async function fetchRecentTimeline(supabase: SupabaseClient, workspaceId: string, limit = 8) {
    const { data, error } = await supabase
        .from('timeline_entries')
        .select('id, lead_id, type, text, created_at, leads(name)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error || !data) return []
    return (data as unknown as { id: string; lead_id: string; type: string; text: string; created_at: string; leads: { name: string } | { name: string }[] | null }[]).map((row) => ({
        ...row,
        leads: Array.isArray(row.leads) ? row.leads[0] ?? null : row.leads,
    })) as (TimelineEntry & { leads: { name: string } | null })[]
}

export async function fetchLeadNotesAndTimeline(supabase: SupabaseClient, workspaceId: string, leadId: string) {
    const [notesRes, timelineRes] = await Promise.all([
        supabase.from('notes').select('*').eq('workspace_id', workspaceId).eq('lead_id', leadId).order('created_at', { ascending: false }),
        supabase.from('timeline_entries').select('*').eq('workspace_id', workspaceId).eq('lead_id', leadId).order('created_at', { ascending: false }),
    ])
    return {
        notes: (notesRes.data || []) as Note[],
        timeline: (timelineRes.data || []) as TimelineEntry[],
    }
}
