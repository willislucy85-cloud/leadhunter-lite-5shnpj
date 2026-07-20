import Anthropic from '@anthropic-ai/sdk'

export const CLAUDE_MODEL = 'claude-opus-4-8'

let anthropicClient: Anthropic | null = null

export function getAnthropicClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'demo') {
        throw new Error('Missing ANTHROPIC_API_KEY')
    }

    if (!anthropicClient) {
        anthropicClient = new Anthropic({ apiKey })
    }

    return anthropicClient
}
