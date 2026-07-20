import { Resend } from 'resend'

export type SendEmailResult =
    | { ok: true; id: string }
    | { ok: false; skipped: true; reason: string }
    | { ok: false; skipped: false; error: string }

function getResendConfig() {
    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL

    const hasConfig = Boolean(
        apiKey &&
        fromEmail &&
        apiKey !== 'demo' &&
        fromEmail !== 'demo'
    )

    return { apiKey, fromEmail, hasConfig }
}

export async function sendEmailSafe(to: string, subject: string, body: string): Promise<SendEmailResult> {
    const { apiKey, fromEmail, hasConfig } = getResendConfig()

    if (!hasConfig) {
        return {
            ok: false,
            skipped: true,
            reason: 'Resend credentials are missing. Set RESEND_API_KEY and RESEND_FROM_EMAIL.',
        }
    }

    try {
        const resend = new Resend(apiKey)
        const { data, error } = await resend.emails.send({
            from: fromEmail as string,
            to,
            subject,
            text: body,
        })

        if (error || !data) {
            return { ok: false, skipped: false, error: error?.message || 'Failed to send email' }
        }

        return { ok: true, id: data.id }
    } catch (error) {
        return {
            ok: false,
            skipped: false,
            error: error instanceof Error ? error.message : 'Failed to send email',
        }
    }
}
