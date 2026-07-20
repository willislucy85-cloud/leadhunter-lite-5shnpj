import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getWorkspaceContext } from '@/lib/workspace'
import { fetchLeadById, countEnrichedLeads } from '@/lib/data'
import { TIERS } from '@/lib/constants'
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic'

export const runtime = 'nodejs'

export async function POST(request: Request) {
    const context = await getWorkspaceContext()
    if (!context) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { supabase, workspaceId, workspace } = context
    const body = await request.json().catch(() => null)
    const leadId = body?.leadId

    if (!leadId || typeof leadId !== 'string') {
        return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }

    const lead = await fetchLeadById(supabase, workspaceId, leadId)
    if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const tier = TIERS[workspace.subscription_tier]
    if (tier.enrichLimit !== Infinity) {
        const used = await countEnrichedLeads(supabase, workspaceId)
        if (used >= tier.enrichLimit) {
            return NextResponse.json(
                { error: `${workspace.subscription_tier} plan limit reached (${tier.enrichLimit} enrichments). Upgrade in Billing to run more.` },
                { status: 403 }
            )
        }
    }

    let summary: string
    try {
        const anthropic = getAnthropicClient()
        const message = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 1024,
            system:
                'You are a B2B sales research assistant. Given sparse lead data, write a concise 2-4 sentence enrichment summary covering likely business context, buying signals, and a recommended angle for outreach. Do not invent specific facts you cannot infer (revenue figures, employee counts), reason from the category, location, and source provided. Respond with plain text only, no headers or markdown.',
            messages: [
                {
                    role: 'user',
                    content: [
                        `Name: ${lead.name}`,
                        `Company: ${lead.company || 'unknown'}`,
                        `Category: ${lead.category}`,
                        `Location: ${[lead.city, lead.state].filter(Boolean).join(', ') || 'unknown'}`,
                        `Source: ${lead.source}`,
                        `Status: ${lead.status}`,
                        `Tags: ${lead.tags.join(', ') || 'none'}`,
                    ].join('\n'),
                },
            ],
        })

        const textBlock = message.content.find((block) => block.type === 'text')
        summary = textBlock && textBlock.type === 'text' ? textBlock.text.trim() : ''

        if (!summary) {
            return NextResponse.json({ error: 'AI enrichment returned no content' }, { status: 502 })
        }
    } catch (error) {
        const messageText = error instanceof Error ? error.message : 'AI enrichment failed'
        return NextResponse.json({ error: messageText }, { status: 502 })
    }

    const enrichment = { summary, generatedAt: new Date().toISOString() }

    const { error: updateError } = await supabase
        .from('leads')
        .update({ ai_enrichment: enrichment, updated_at: new Date().toISOString() })
        .eq('id', leadId)
        .eq('workspace_id', workspaceId)

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    await supabase.from('timeline_entries').insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        type: 'enrichment',
        text: 'AI enrichment generated',
    })

    revalidatePath('/app/leads')
    return NextResponse.json({ data: enrichment })
}
