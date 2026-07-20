'use server'

import { requireWorkspace } from '@/lib/workspace'
import { revalidatePath } from 'next/cache'
import type { AutomationAction, AutomationTrigger } from '@/lib/types'

export async function createAutomation(input: {
    name: string
    trigger: AutomationTrigger
    staleDays?: number
    actions: AutomationAction[]
}) {
    const { supabase, workspaceId } = await requireWorkspace()

    if (!input.name?.trim()) {
        return { error: 'Name is required.' }
    }
    if (!input.actions?.length) {
        return { error: 'At least one action is required.' }
    }

    const { error } = await supabase.from('automations').insert({
        workspace_id: workspaceId,
        name: input.name.trim(),
        trigger: input.trigger,
        conditions: input.trigger === 'stalled_lead' ? { staleDays: input.staleDays || 7 } : {},
        actions: input.actions,
        active: true,
    })

    if (error) return { error: error.message }

    revalidatePath('/app/automations')
    return { ok: true }
}

export async function toggleAutomation(automationId: string, active: boolean) {
    const { supabase, workspaceId } = await requireWorkspace()

    const { error } = await supabase
        .from('automations')
        .update({ active })
        .eq('id', automationId)
        .eq('workspace_id', workspaceId)

    if (error) return { error: error.message }

    revalidatePath('/app/automations')
    return { ok: true }
}

export async function deleteAutomation(automationId: string) {
    const { supabase, workspaceId } = await requireWorkspace()

    const { error } = await supabase.from('automations').delete().eq('id', automationId).eq('workspace_id', workspaceId)
    if (error) return { error: error.message }

    revalidatePath('/app/automations')
    return { ok: true }
}
