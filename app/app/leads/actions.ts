'use server'

import { requireWorkspace } from '@/lib/workspace'
import { TIERS, type LeadStatus } from '@/lib/constants'
import { revalidatePath } from 'next/cache'

const DEFAULT_METRICS = {
    opens: 0,
    clicks: 0,
    replies: 0,
    sequenceProgress: 0,
    followUpsCompleted: 0,
    followUpsTotal: 0,
    lastInteractionAt: null,
    interactionCount: 0,
}

export type LeadFormInput = {
    name: string
    company?: string
    email?: string
    phone?: string
    category?: string
    city?: string
    state?: string
    source?: string
    tags?: string[]
    assignedTo?: string
}

async function countLeads(supabase: any, workspaceId: string) {
    const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
    return count || 0
}

export async function createLead(input: LeadFormInput) {
    const { supabase, workspaceId, workspace } = await requireWorkspace()

    if (!input.name?.trim()) {
        return { error: 'Name is required.' }
    }

    if (workspace.subscription_tier === 'Free') {
        const existing = await countLeads(supabase, workspaceId)
        if (existing >= TIERS.Free.leadsLimit) {
            return { error: `Free plan limit reached (${TIERS.Free.leadsLimit} leads). Upgrade in Billing to add more.` }
        }
    }

    const { data: lead, error } = await supabase
        .from('leads')
        .insert({
            workspace_id: workspaceId,
            name: input.name.trim(),
            company: input.company || null,
            email: input.email || null,
            phone: input.phone || null,
            category: input.category || 'Other',
            city: input.city || null,
            state: input.state || null,
            source: input.source || 'Manual entry',
            tags: input.tags || [],
            assigned_to: input.assignedTo || 'Unassigned',
            metrics: DEFAULT_METRICS,
        })
        .select()
        .single()

    if (error || !lead) {
        return { error: error?.message || 'Failed to create lead.' }
    }

    await supabase.from('timeline_entries').insert({
        workspace_id: workspaceId,
        lead_id: lead.id,
        type: 'created',
        text: 'Lead created',
    })

    revalidatePath('/app')
    revalidatePath('/app/leads')
    return { data: lead }
}

export async function bulkImportLeads(rows: LeadFormInput[]) {
    const { supabase, workspaceId, workspace } = await requireWorkspace()

    const valid = rows.filter((r) => r.name?.trim())
    if (valid.length === 0) {
        return { error: "No valid rows found — make sure the CSV has a 'name' column.", imported: 0 }
    }

    let room = Infinity
    if (workspace.subscription_tier === 'Free') {
        const existing = await countLeads(supabase, workspaceId)
        room = Math.max(0, TIERS.Free.leadsLimit - existing)
    }
    const truncated = valid.length > room
    const toInsert = valid.slice(0, room).map((r) => ({
        workspace_id: workspaceId,
        name: r.name.trim(),
        company: r.company || null,
        email: r.email || null,
        phone: r.phone || null,
        category: r.category || 'Other',
        city: r.city || null,
        state: r.state || null,
        source: r.source || 'CSV import',
        tags: r.tags || [],
        assigned_to: 'Unassigned',
        metrics: DEFAULT_METRICS,
    }))

    if (toInsert.length === 0) {
        return { error: "You've hit the Free plan's lead limit. Upgrade in Billing to import more.", imported: 0 }
    }

    const { data: inserted, error } = await supabase.from('leads').insert(toInsert).select('id')
    if (error) {
        return { error: error.message, imported: 0 }
    }

    if (inserted?.length) {
        await supabase.from('timeline_entries').insert(
            inserted.map((l: { id: string }) => ({
                workspace_id: workspaceId,
                lead_id: l.id,
                type: 'created',
                text: 'Lead imported',
            }))
        )
    }

    revalidatePath('/app')
    revalidatePath('/app/leads')
    return { imported: inserted?.length || 0, truncated }
}

export async function changeLeadStatus(leadId: string, newStatus: LeadStatus) {
    const { supabase, workspaceId } = await requireWorkspace()

    const { error } = await supabase
        .from('leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .eq('workspace_id', workspaceId)

    if (error) return { error: error.message }

    await supabase.from('timeline_entries').insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        type: 'status',
        text: `Status changed to ${newStatus}`,
    })

    revalidatePath('/app')
    revalidatePath('/app/leads')
    return { ok: true }
}

export async function updateLeadTags(leadId: string, tags: string[]) {
    const { supabase, workspaceId } = await requireWorkspace()
    const { error } = await supabase
        .from('leads')
        .update({ tags, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .eq('workspace_id', workspaceId)
    if (error) return { error: error.message }
    revalidatePath('/app/leads')
    return { ok: true }
}

export async function getLeadDetail(leadId: string) {
    const { supabase, workspaceId } = await requireWorkspace()
    const [notesRes, timelineRes] = await Promise.all([
        supabase.from('notes').select('*').eq('workspace_id', workspaceId).eq('lead_id', leadId).order('created_at', { ascending: false }),
        supabase.from('timeline_entries').select('*').eq('workspace_id', workspaceId).eq('lead_id', leadId).order('created_at', { ascending: false }),
    ])
    return {
        notes: notesRes.data || [],
        timeline: timelineRes.data || [],
    }
}

export async function addLeadNote(leadId: string, text: string) {
    const { supabase, workspaceId } = await requireWorkspace()
    if (!text.trim()) return { error: 'Note text is required.' }

    const { error } = await supabase.from('notes').insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        text: text.trim(),
    })
    if (error) return { error: error.message }

    const short = text.length > 60 ? `${text.slice(0, 60)}...` : text
    await supabase.from('timeline_entries').insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        type: 'note',
        text: `Note added: ${short}`,
    })

    revalidatePath('/app/leads')
    return { ok: true }
}
