import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { isAuthorizedCronRequest } from '@/lib/cron'
import { sendEmailSafe } from '@/lib/resend'
import { sendSmsSafe } from '@/lib/twilio'
import type { LeadMetrics } from '@/lib/scoring'
import type { SequenceStep, LeadRow } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type EnrollmentRow = {
    id: string
    sequence_id: string
    lead_id: string
    step_index: number
    status: 'active' | 'completed' | 'paused'
    enrolled_at: string
}

export async function GET(request: Request) {
    if (!isAuthorizedCronRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: enrollments } = await admin
        .from('sequence_enrollments')
        .select('id, sequence_id, lead_id, step_index, status, enrolled_at')
        .eq('status', 'active')

    if (!enrollments || enrollments.length === 0) {
        return NextResponse.json({ processed: 0, executed: 0 })
    }

    const sequenceIds = Array.from(new Set(enrollments.map((e: EnrollmentRow) => e.sequence_id)))
    const leadIds = Array.from(new Set(enrollments.map((e: EnrollmentRow) => e.lead_id)))

    const [stepsRes, leadsRes] = await Promise.all([
        admin.from('sequence_steps').select('*').in('sequence_id', sequenceIds).order('step_index', { ascending: true }),
        admin.from('leads').select('*').in('id', leadIds),
    ])

    const stepsBySequence = new Map<string, SequenceStep[]>()
    for (const step of (stepsRes.data || []) as SequenceStep[]) {
        const list = stepsBySequence.get(step.sequence_id) || []
        list.push(step)
        stepsBySequence.set(step.sequence_id, list)
    }

    const leadsById = new Map<string, LeadRow>()
    for (const lead of (leadsRes.data || []) as LeadRow[]) {
        leadsById.set(lead.id, lead)
    }

    let executed = 0
    const now = Date.now()

    for (const enrollment of enrollments as EnrollmentRow[]) {
        const steps = stepsBySequence.get(enrollment.sequence_id) || []
        if (steps.length === 0) continue

        if (enrollment.step_index >= steps.length) {
            await admin.from('sequence_enrollments').update({ status: 'completed' }).eq('id', enrollment.id)
            continue
        }

        const dueDelayDays = steps.slice(0, enrollment.step_index + 1).reduce((sum, s) => sum + s.delay_days, 0)
        const dueAt = new Date(enrollment.enrolled_at).getTime() + dueDelayDays * 86400000
        if (dueAt > now) continue

        const lead = leadsById.get(enrollment.lead_id)
        if (!lead) continue

        const step = steps[enrollment.step_index]
        let logText = ''

        if (step.type === 'email') {
            if (lead.email) {
                const result = await sendEmailSafe(lead.email, step.subject || '(no subject)', step.body || '')
                logText = result.ok ? `Sequence email sent: ${step.subject || ''}` : `Sequence email not sent: ${'reason' in result ? result.reason : result.error}`
            } else {
                logText = 'Sequence email skipped: lead has no email address'
            }
            await admin.from('timeline_entries').insert({ workspace_id: lead.workspace_id, lead_id: lead.id, type: 'email', text: logText })
        } else if (step.type === 'sms') {
            if (lead.phone) {
                const result = await sendSmsSafe(lead.phone, step.body || '')
                logText = result.ok ? 'Sequence SMS sent' : `Sequence SMS not sent: ${'reason' in result ? result.reason : result.error}`
            } else {
                logText = 'Sequence SMS skipped: lead has no phone number'
            }
            await admin.from('timeline_entries').insert({ workspace_id: lead.workspace_id, lead_id: lead.id, type: 'sms', text: logText })
        } else if (step.type === 'status_change' && step.new_status) {
            await admin.from('leads').update({ status: step.new_status, updated_at: new Date().toISOString() }).eq('id', lead.id)
            await admin.from('timeline_entries').insert({
                workspace_id: lead.workspace_id,
                lead_id: lead.id,
                type: 'status',
                text: `Status changed to ${step.new_status} by sequence`,
            })
        } else if (step.type === 'follow_up') {
            await admin.from('leads').update({ follow_up_due_at: new Date().toISOString() }).eq('id', lead.id)
            await admin.from('timeline_entries').insert({
                workspace_id: lead.workspace_id,
                lead_id: lead.id,
                type: 'followup',
                text: step.follow_up_note || 'Follow-up reminder set by sequence',
            })
        }

        const metrics: LeadMetrics = lead.metrics
        const nextStepIndex = enrollment.step_index + 1
        await admin
            .from('leads')
            .update({
                metrics: {
                    ...metrics,
                    interactionCount: metrics.interactionCount + 1,
                    sequenceProgress: Math.round((nextStepIndex / steps.length) * 100),
                    lastInteractionAt: new Date().toISOString(),
                },
            })
            .eq('id', lead.id)

        await admin
            .from('sequence_enrollments')
            .update({ step_index: nextStepIndex, status: nextStepIndex >= steps.length ? 'completed' : 'active' })
            .eq('id', enrollment.id)

        executed += 1
    }

    return NextResponse.json({ processed: enrollments.length, executed })
}
