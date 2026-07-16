import { NextResponse } from 'next/server'
import { getWorkspaceContext } from '@/lib/workspace'
import { sendSmsSafe } from '@/lib/twilio'

export const runtime = 'nodejs'

function isLikelyE164(phone: string) {
    return /^\+[1-9]\d{7,14}$/.test(phone)
}

export async function POST(request: Request) {
    const context = await getWorkspaceContext()
    if (!context) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (context.role === 'Member') {
        return NextResponse.json({ error: 'Only Admin or Owner can send test SMS.' }, { status: 403 })
    }

    const payload = await request.json().catch(() => null)
    const to = String(payload?.to || '').trim()
    const bodyInput = String(payload?.body || '').trim()

    if (!to || !isLikelyE164(to)) {
        return NextResponse.json({ error: 'Use E.164 format, for example +15551234567.' }, { status: 400 })
    }

    const body = bodyInput || `LeadHunter Lite test message from workspace ${context.workspace.name}.`
    if (body.length > 500) {
        return NextResponse.json({ error: 'Message must be 500 characters or less.' }, { status: 400 })
    }

    const result = await sendSmsSafe(to, body)

    if (result.ok) {
        return NextResponse.json({ ok: true, sid: result.sid })
    }

    if (result.skipped) {
        return NextResponse.json({ ok: false, skipped: true, reason: result.reason }, { status: 200 })
    }

    return NextResponse.json({ ok: false, skipped: false, error: result.error }, { status: 500 })
}
