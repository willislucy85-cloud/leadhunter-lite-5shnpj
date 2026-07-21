import type { SupabaseClient } from '@supabase/supabase-js'
import {
    rowToLead,
    rowToAutomation,
    type Lead,
    type LeadRow,
    type TimelineEntry,
    type Note,
    type Sequence,
    type SequenceStep,
    type Automation,
    type AutomationRow,
    type WorkspaceMember,
    type WorkspaceInvite,
    type WorkspaceRole,
} from './types'

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

export async function fetchSequences(supabase: SupabaseClient, workspaceId: string): Promise<Sequence[]> {
    const { data: seqRows } = await supabase
        .from('sequences')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

    if (!seqRows || seqRows.length === 0) return []

    const sequenceIds = seqRows.map((row) => row.id as string)

    const [stepsRes, enrollmentsRes] = await Promise.all([
        supabase.from('sequence_steps').select('*').in('sequence_id', sequenceIds).order('step_index', { ascending: true }),
        supabase.from('sequence_enrollments').select('sequence_id').in('sequence_id', sequenceIds).eq('status', 'active'),
    ])

    const stepsBySequence = new Map<string, SequenceStep[]>()
    for (const step of (stepsRes.data || []) as SequenceStep[]) {
        const list = stepsBySequence.get(step.sequence_id) || []
        list.push(step)
        stepsBySequence.set(step.sequence_id, list)
    }

    const activeCountBySequence = new Map<string, number>()
    for (const row of (enrollmentsRes.data || []) as { sequence_id: string }[]) {
        activeCountBySequence.set(row.sequence_id, (activeCountBySequence.get(row.sequence_id) || 0) + 1)
    }

    return seqRows.map((row) => ({
        id: row.id,
        workspace_id: row.workspace_id,
        name: row.name,
        description: row.description || '',
        category: row.category || '',
        createdAt: row.created_at,
        steps: stepsBySequence.get(row.id) || [],
        activeEnrollments: activeCountBySequence.get(row.id) || 0,
    }))
}

export async function fetchAutomations(supabase: SupabaseClient, workspaceId: string): Promise<Automation[]> {
    const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

    if (error || !data) return []
    return (data as AutomationRow[]).map(rowToAutomation)
}

// Member emails live in auth.users, which RLS-scoped clients can't read —
// the caller must pass a service-role client alongside the regular one.
export async function fetchWorkspaceMembers(
    supabase: SupabaseClient,
    adminClient: SupabaseClient,
    workspaceId: string
): Promise<WorkspaceMember[]> {
    const { data, error } = await supabase
        .from('workspace_members')
        .select('id, user_id, role, created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true })

    if (error || !data) return []

    const rows = data as { id: string; user_id: string; role: WorkspaceRole; created_at: string }[]

    const members = await Promise.all(
        rows.map(async (row) => {
            const { data: userRes } = await adminClient.auth.admin.getUserById(row.user_id)
            return {
                id: row.id,
                userId: row.user_id,
                email: userRes?.user?.email || 'Unknown',
                role: row.role,
                createdAt: row.created_at,
            }
        })
    )

    return members
}

export async function fetchPendingInvites(supabase: SupabaseClient, workspaceId: string): Promise<WorkspaceInvite[]> {
    const { data, error } = await supabase
        .from('workspace_invites')
        .select('id, email, role, created_at')
        .eq('workspace_id', workspaceId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })

    if (error || !data) return []
    return (data as { id: string; email: string; role: WorkspaceRole; created_at: string }[]).map((row) => ({
        id: row.id,
        email: row.email,
        role: row.role,
        createdAt: row.created_at,
    }))
}
