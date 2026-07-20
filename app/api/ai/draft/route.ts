import { NextResponse } from 'next/server'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { getWorkspaceContext } from '@/lib/workspace'
import { fetchLeadById } from '@/lib/data'
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic'

export const runtime = 'nodejs'

const EmailDraftSchema = z.object({ subject: z.string(), body: z.string() })
const SmsDraftSchema = z.object({ body: z.string() })

export async function POST(request: Request) {
    const context = await getWorkspaceContext()
    if (!context) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { supabase, workspaceId } = context
    const body = await request.json().catch(() => null)
    const leadId = body?.leadId
    const channel = body?.channel === 'sms' ? 'sms' : 'email'
    const instructions = typeof body?.instructions === 'string' ? body.instructions : ''

    if (!leadId || typeof leadId !== 'string') {
        return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }

    const lead = await fetchLeadById(supabase, workspaceId, leadId)
    if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const leadContext = [
        `Name: ${lead.name}`,
        `Company: ${lead.company || 'unknown'}`,
        `Category: ${lead.category}`,
        `Status: ${lead.status}`,
        lead.aiIntent ? `Known intent: ${lead.aiIntent.sentiment} sentiment, ${lead.aiIntent.urgency} urgency, ${lead.aiIntent.summary}` : null,
        lead.aiEnrichment ? `Research notes: ${lead.aiEnrichment.summary}` : null,
        instructions ? `Sender instructions: ${instructions}` : null,
    ]
        .filter(Boolean)
        .join('\n')

    try {
        const anthropic = getAnthropicClient()

        if (channel === 'sms') {
            const message = await anthropic.messages.parse({
                model: CLAUDE_MODEL,
                max_tokens: 512,
                system:
                    'You draft short outbound SMS outreach for a sales rep. Keep it under 320 characters, no markdown, no emoji, friendly and specific to the lead.',
                messages: [{ role: 'user', content: leadContext }],
                output_config: { format: zodOutputFormat(SmsDraftSchema) },
            })

            if (!message.parsed_output) {
                return NextResponse.json({ error: 'AI draft returned no content' }, { status: 502 })
            }
            return NextResponse.json({ data: message.parsed_output })
        }

        const message = await anthropic.messages.parse({
            model: CLAUDE_MODEL,
            max_tokens: 1024,
            system:
                'You draft outbound sales emails. Write a short, specific subject line and a concise, plain-text body (no markdown) with a clear single call to action.',
            messages: [{ role: 'user', content: leadContext }],
            output_config: { format: zodOutputFormat(EmailDraftSchema) },
        })

        if (!message.parsed_output) {
            return NextResponse.json({ error: 'AI draft returned no content' }, { status: 502 })
        }
        return NextResponse.json({ data: message.parsed_output })
    } catch (error) {
        const messageText = error instanceof Error ? error.message : 'AI draft failed'
        return NextResponse.json({ error: messageText }, { status: 502 })
    }
}
