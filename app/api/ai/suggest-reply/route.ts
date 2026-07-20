import { NextResponse } from 'next/server'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { getWorkspaceContext } from '@/lib/workspace'
import { fetchLeadById } from '@/lib/data'
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic'

export const runtime = 'nodejs'

const ReplySchema = z.object({ body: z.string() })

export async function POST(request: Request) {
    const context = await getWorkspaceContext()
    if (!context) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { supabase, workspaceId } = context
    const body = await request.json().catch(() => null)
    const leadId = body?.leadId
    const incomingMessage = body?.incomingMessage
    const channel = body?.channel === 'sms' ? 'sms' : 'email'

    if (!leadId || typeof leadId !== 'string') {
        return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }
    if (!incomingMessage || typeof incomingMessage !== 'string') {
        return NextResponse.json({ error: 'incomingMessage is required' }, { status: 400 })
    }

    const lead = await fetchLeadById(supabase, workspaceId, leadId)
    if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    try {
        const anthropic = getAnthropicClient()
        const message = await anthropic.messages.parse({
            model: CLAUDE_MODEL,
            max_tokens: channel === 'sms' ? 512 : 1024,
            system: `You draft ${channel === 'sms' ? 'a short SMS' : 'an email'} reply for a sales rep responding to an inbound message from a lead. Match the tone of the incoming message, address it directly, and keep a clear next step. Plain text only, no markdown.${channel === 'sms' ? ' Keep it under 320 characters.' : ''}`,
            messages: [
                {
                    role: 'user',
                    content: [
                        `Lead: ${lead.name} at ${lead.company || 'unknown'} (${lead.category}, status: ${lead.status})`,
                        `Their message:\n${incomingMessage}`,
                    ].join('\n\n'),
                },
            ],
            output_config: { format: zodOutputFormat(ReplySchema) },
        })

        if (!message.parsed_output) {
            return NextResponse.json({ error: 'AI reply suggestion returned no content' }, { status: 502 })
        }

        return NextResponse.json({ data: message.parsed_output })
    } catch (error) {
        const messageText = error instanceof Error ? error.message : 'AI reply suggestion failed'
        return NextResponse.json({ error: messageText }, { status: 502 })
    }
}
