import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { getWorkspaceContext } from '@/lib/workspace'
import { fetchLeadById, fetchLeadNotesAndTimeline } from '@/lib/data'
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic'

export const runtime = 'nodejs'

const IntentSchema = z.object({
    score: z.number().int().min(0).max(100),
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    urgency: z.enum(['low', 'medium', 'high']),
    signals: z.array(z.string()).max(5),
    summary: z.string(),
})

export async function POST(request: Request) {
    const context = await getWorkspaceContext()
    if (!context) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { supabase, workspaceId } = context
    const body = await request.json().catch(() => null)
    const leadId = body?.leadId

    if (!leadId || typeof leadId !== 'string') {
        return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }

    const lead = await fetchLeadById(supabase, workspaceId, leadId)
    if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const { notes, timeline } = await fetchLeadNotesAndTimeline(supabase, workspaceId, leadId)

    let parsed: z.infer<typeof IntentSchema>
    try {
        const anthropic = getAnthropicClient()
        const message = await anthropic.messages.parse({
            model: CLAUDE_MODEL,
            max_tokens: 1024,
            system:
                'You are a sales intent analyst. Score this lead\'s buying intent from 0-100 based on their engagement metrics, notes, and activity timeline. Identify sentiment, urgency, up to 5 concrete signals drawn from the data given, and a one-sentence summary.',
            messages: [
                {
                    role: 'user',
                    content: [
                        `Lead: ${lead.name} at ${lead.company || 'unknown company'} (${lead.category})`,
                        `Status: ${lead.status}`,
                        `Metrics: opens=${lead.metrics.opens}, clicks=${lead.metrics.clicks}, replies=${lead.metrics.replies}, sequenceProgress=${lead.metrics.sequenceProgress}%, interactionCount=${lead.metrics.interactionCount}`,
                        `Notes:\n${notes.map((n) => `- ${n.text}`).join('\n') || 'none'}`,
                        `Timeline:\n${timeline.map((t) => `- [${t.type}] ${t.text}`).join('\n') || 'none'}`,
                    ].join('\n\n'),
                },
            ],
            output_config: { format: zodOutputFormat(IntentSchema) },
        })

        if (!message.parsed_output) {
            return NextResponse.json({ error: 'AI intent analysis returned no content' }, { status: 502 })
        }
        parsed = message.parsed_output
    } catch (error) {
        const messageText = error instanceof Error ? error.message : 'AI intent analysis failed'
        return NextResponse.json({ error: messageText }, { status: 502 })
    }

    const aiIntent = { ...parsed, at: new Date().toISOString() }

    const { error: updateError } = await supabase
        .from('leads')
        .update({ ai_intent: aiIntent, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .eq('workspace_id', workspaceId)

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    await supabase.from('timeline_entries').insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        type: 'intent',
        text: `Intent score updated to ${aiIntent.score}`,
    })

    revalidatePath('/app/leads')
    return NextResponse.json({ data: aiIntent })
}
