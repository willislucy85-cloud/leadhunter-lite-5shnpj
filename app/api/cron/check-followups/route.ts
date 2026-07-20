import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { isAuthorizedCronRequest } from '@/lib/cron'
import { rowToLead, rowToAutomation, type LeadRow, type AutomationRow, type AutomationTrigger } from '@/lib/types'
import { getScores } from '@/lib/scoring'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isOpen(status: string) {
    return status !== 'Won' && status !== 'Lost'
}

function matchesTrigger(trigger: AutomationTrigger, staleDays: number | undefined, row: LeadRow) {
    const lead = rowToLead(row)
    if (trigger === 'follow_up_overdue') {
        return Boolean(lead.followUpDueAt) && new Date(lead.followUpDueAt as string) <= new Date() && isOpen(lead.status)
    }
    if (trigger === 'high_intent_new') {
        return getScores(lead).final >= 70 && lead.status === 'New'
    }
    if (trigger === 'stalled_lead') {
        const days = staleDays || 7
        const ageMs = Date.now() - new Date(lead.metrics.lastInteractionAt || lead.createdAt).getTime()
        return isOpen(lead.status) && ageMs / 86400000 >= days
    }
    return false
}

export async function GET(request: Request) {
    if (!isAuthorizedCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    let flagged = 0
    let automationRuns = 0

    // 1. Flag leads with an overdue follow-up (once per calendar day).
    const { data: overdueLeads } = await admin
        .from('leads')
        .select('id, workspace_id, status, follow_up_due_at')
        .lte('follow_up_due_at', new Date().toISOString())
        .not('follow_up_due_at', 'is', null)
        .not('status', 'in', '("Won","Lost")')

    for (const lead of overdueLeads || []) {
        const { data: alreadyFlagged } = await admin
            .from('timeline_entries')
            .select('id')
            .eq('lead_id', lead.id)
            .eq('type', 'followup_due')
            .gte('created_at', todayStart.toISOString())
            .maybeSingle()

        if (alreadyFlagged) continue

        await admin.from('timeline_entries').insert({
            workspace_id: lead.workspace_id,
            lead_id: lead.id,
            type: 'followup_due',
            text: 'Follow-up is overdue',
        })
        flagged += 1
    }

    // 2. Evaluate active automations against current lead state.
    const { data: automationRows } = await admin.from('automations').select('*').eq('active', true)

    for (const row of (automationRows || []) as AutomationRow[]) {
        const automation = rowToAutomation(row)

        const { data: workspaceLeads } = await admin.from('leads').select('*').eq('workspace_id', automation.workspace_id)

        for (const leadRow of (workspaceLeads || []) as LeadRow[]) {
            if (!matchesTrigger(automation.trigger, automation.conditions.staleDays, leadRow)) continue

            const { data: existingRun } = await admin
                .from('automation_runs')
                .select('id')
                .eq('automation_id', automation.id)
                .eq('lead_id', leadRow.id)
                .maybeSingle()
            if (existingRun) continue

            for (const action of automation.actions) {
                if (action.type === 'change_status') {
                    await admin.from('leads').update({ status: action.status, updated_at: new Date().toISOString() }).eq('id', leadRow.id)
                    await admin.from('timeline_entries').insert({
                        workspace_id: automation.workspace_id,
                        lead_id: leadRow.id,
                        type: 'automation',
                        text: `${automation.name}: status changed to ${action.status}`,
                    })
                } else if (action.type === 'add_timeline_note') {
                    await admin.from('timeline_entries').insert({
                        workspace_id: automation.workspace_id,
                        lead_id: leadRow.id,
                        type: 'automation',
                        text: `${automation.name}: ${action.text}`,
                    })
                } else if (action.type === 'set_follow_up') {
                    const dueAt = new Date(Date.now() + action.inDays * 86400000).toISOString()
                    await admin.from('leads').update({ follow_up_due_at: dueAt }).eq('id', leadRow.id)
                    await admin.from('timeline_entries').insert({
                        workspace_id: automation.workspace_id,
                        lead_id: leadRow.id,
                        type: 'automation',
                        text: `${automation.name}: follow-up set for ${action.inDays} day${action.inDays === 1 ? '' : 's'} from now`,
                    })
                }
            }

            await admin.from('automation_runs').insert({
                workspace_id: automation.workspace_id,
                automation_id: automation.id,
                lead_id: leadRow.id,
            })
            automationRuns += 1
        }
    }

    return NextResponse.json({ flagged, automationRuns })
}
