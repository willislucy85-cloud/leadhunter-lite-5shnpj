'use client'

import { useState } from 'react'
import { useToast } from '@/components/leadhunter/toast'

export function TwilioTestCard() {
    const { pushToast } = useToast()
    const [to, setTo] = useState('')
    const [body, setBody] = useState('')
    const [loading, setLoading] = useState(false)

    async function sendTestSms() {
        setLoading(true)
        try {
            const response = await fetch('/api/twilio/test-sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, body }),
            })

            const json = await response.json().catch(() => ({}))

            if (!response.ok) {
                pushToast(json.error || 'Failed to send test SMS.')
                return
            }

            if (json.ok) {
                pushToast(`Test SMS sent. SID: ${json.sid}`)
                return
            }

            if (json.skipped) {
                pushToast(json.reason || 'Twilio credentials are missing.')
                return
            }

            pushToast(json.error || 'Twilio send failed.')
        } catch {
            pushToast('Network error sending test SMS.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="lh-card mt-4 rounded-xl p-4">
            <h2 className="text-sm font-bold">Twilio test SMS</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--lh-muted)' }}>
                Send a one-off SMS to verify your Twilio credentials and sender number.
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="Recipient phone, ex: +15551234567"
                    className="lh-focus rounded-md border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--lh-border)' }}
                />
                <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Optional custom message"
                    className="lh-focus rounded-md border px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--lh-border)' }}
                    maxLength={500}
                />
            </div>

            <div className="mt-3">
                <button
                    type="button"
                    onClick={sendTestSms}
                    disabled={loading || !to.trim()}
                    className="lh-btn lh-focus inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'var(--lh-accent)' }}
                >
                    {loading ? 'Sending...' : 'Send test SMS'}
                </button>
            </div>
        </section>
    )
}
