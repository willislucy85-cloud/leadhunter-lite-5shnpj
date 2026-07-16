import twilio from 'twilio'

export type SendSmsResult =
    | { ok: true; sid: string }
    | { ok: false; skipped: true; reason: string }
    | { ok: false; skipped: false; error: string }

function getTwilioConfig() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    const hasConfig = Boolean(
        accountSid &&
        authToken &&
        fromNumber &&
        accountSid !== 'demo' &&
        authToken !== 'demo' &&
        fromNumber !== 'demo'
    )

    return { accountSid, authToken, fromNumber, hasConfig }
}

export async function sendSmsSafe(to: string, body: string): Promise<SendSmsResult> {
    const { accountSid, authToken, fromNumber, hasConfig } = getTwilioConfig()

    if (!hasConfig) {
        return {
            ok: false,
            skipped: true,
            reason: 'Twilio credentials are missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.',
        }
    }

    try {
        const client = twilio(accountSid as string, authToken as string)
        const message = await client.messages.create({
            from: fromNumber,
            to,
            body,
        })

        return { ok: true, sid: message.sid }
    } catch (error) {
        return {
            ok: false,
            skipped: false,
            error: error instanceof Error ? error.message : 'Failed to send SMS',
        }
    }
}
