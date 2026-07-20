'use server'

import { requireWorkspace } from '@/lib/workspace'
import { TIERS } from '@/lib/constants'
import { revalidatePath } from 'next/cache'
import type { SequenceStepType } from '@/lib/types'
import type { LeadStatus } from '@/lib/constants'

async function countSequences(supabase: Awaited<ReturnType<typeof requireWorkspace>>['supabase'], workspaceId: string) {
    const { count } = await supabase
        .from('sequences')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
    return count || 0
}

export async function createSequence(input: { name: string; description?: string; category?: string }) {
    const { supabase, workspaceId, workspace } = await requireWorkspace()

    if (!input.name?.trim()) {
        return { error: 'Name is required.' }
    }

    const limit = TIERS[workspace.subscription_tier].sequenceLimit
    if (limit !== Infinity) {
        const existing = await countSequences(supabase, workspaceId)
        if (existing >= limit) {
            return { error: `${workspace.subscription_tier} plan limit reached (${limit} sequence${limit === 1 ? '' : 's'}). Upgrade in Billing to add more.` }
        }
    }

    const { data, error } = await supabase
        .from('sequences')
        .insert({
            workspace_id: workspaceId,
            name: input.name.trim(),
            description: input.description || null,
            category: input.category || null,
        })
        .select()
        .single()

    if (error || !data) {
        return { error: error?.message || 'Failed to create sequence.' }
    }

    revalidatePath('/app/sequences')
    return { data }
}

export async function deleteSequence(sequenceId: string) {
    const { supabase, workspaceId } = await requireWorkspace()

    const { error } = await supabase.from('sequences').delete().eq('id', sequenceId).eq('workspace_id', workspaceId)
    if (error) return { error: error.message }

    revalidatePath('/app/sequences')
    return { ok: true }
}

export type StepInput = {
    type: SequenceStepType
    delay_days: number
    subject?: string
    body?: string
    new_status?: LeadStatus
    follow_up_note?: string
}

export async function addSequenceStep(sequenceId: string, input: StepInput) {
    const { supabase, workspaceId } = await requireWorkspace()

    const { data: sequence } = await supabase
        .from('sequences')
        .select('id')
        .eq('id', sequenceId)
        .eq('workspace_id', workspaceId)
        .maybeSingle()
    if (!sequence) return { error: 'Sequence not found.' }

    const { count } = await supabase
        .from('sequence_steps')
        .select('id', { count: 'exact', head: true })
        .eq('sequence_id', sequenceId)

    const { error } = await supabase.from('sequence_steps').insert({
        sequence_id: sequenceId,
        step_index: count || 0,
        type: input.type,
        delay_days: Math.max(0, input.delay_days || 0),
        subject: input.type === 'email' ? input.subject || null : null,
        body: input.type === 'email' || input.type === 'sms' ? input.body || null : null,
        new_status: input.type === 'status_change' ? input.new_status || null : null,
        follow_up_note: input.type === 'follow_up' ? input.follow_up_note || null : null,
    })

    if (error) return { error: error.message }

    revalidatePath('/app/sequences')
    return { ok: true }
}

export async function deleteSequenceStep(stepId: string, sequenceId: string) {
    const { supabase, workspaceId } = await requireWorkspace()

    const { data: sequence } = await supabase
        .from('sequences')
        .select('id')
        .eq('id', sequenceId)
        .eq('workspace_id', workspaceId)
        .maybeSingle()
    if (!sequence) return { error: 'Sequence not found.' }

    const { error } = await supabase.from('sequence_steps').delete().eq('id', stepId).eq('sequence_id', sequenceId)
    if (error) return { error: error.message }

    const { data: remaining } = await supabase
        .from('sequence_steps')
        .select('id')
        .eq('sequence_id', sequenceId)
        .order('step_index', { ascending: true })

    if (remaining) {
        await Promise.all(
            remaining.map((step: { id: string }, index: number) =>
                supabase.from('sequence_steps').update({ step_index: index }).eq('id', step.id)
            )
        )
    }

    revalidatePath('/app/sequences')
    return { ok: true }
}

export async function enrollLead(sequenceId: string, leadId: string) {
    const { supabase, workspaceId } = await requireWorkspace()

    const { data: lead } = await supabase.from('leads').select('id').eq('id', leadId).eq('workspace_id', workspaceId).maybeSingle()
    if (!lead) return { error: 'Lead not found.' }

    const { data: existing } = await supabase
        .from('sequence_enrollments')
        .select('id')
        .eq('sequence_id', sequenceId)
        .eq('lead_id', leadId)
        .eq('status', 'active')
        .maybeSingle()
    if (existing) return { error: 'Lead is already enrolled in this sequence.' }

    const { error } = await supabase.from('sequence_enrollments').insert({
        sequence_id: sequenceId,
        lead_id: leadId,
        step_index: 0,
        status: 'active',
    })
    if (error) return { error: error.message }

    await supabase.from('timeline_entries').insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        type: 'automation',
        text: 'Enrolled in sequence',
    })

    revalidatePath('/app/sequences')
    revalidatePath('/app/leads')
    return { ok: true }
}

export async function unenrollLead(enrollmentId: string) {
    const { supabase } = await requireWorkspace()

    const { error } = await supabase.from('sequence_enrollments').update({ status: 'paused' }).eq('id', enrollmentId)
    if (error) return { error: error.message }

    revalidatePath('/app/sequences')
    return { ok: true }
}

export async function fetchSequenceEnrollments(sequenceId: string) {
    const { supabase, workspaceId } = await requireWorkspace()

    const { data: sequence } = await supabase
        .from('sequences')
        .select('id')
        .eq('id', sequenceId)
        .eq('workspace_id', workspaceId)
        .maybeSingle()
    if (!sequence) return []

    const { data } = await supabase
        .from('sequence_enrollments')
        .select('id, lead_id, step_index, status, enrolled_at, leads(name, company)')
        .eq('sequence_id', sequenceId)
        .order('enrolled_at', { ascending: false })

    return data || []
}
