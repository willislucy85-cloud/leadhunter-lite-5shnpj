import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getWorkspaceContext } from '@/lib/workspace'
import { searchPlacesSafe } from '@/lib/google-places'

export const runtime = 'nodejs'

const SearchSchema = z.object({
    category: z.string().min(1),
    city: z.string().optional().default(''),
    state: z.string().optional().default(''),
})

export async function POST(request: Request) {
    const context = await getWorkspaceContext()
    if (!context) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsed = SearchSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: 'category is required' }, { status: 400 })
    }

    const { category, city, state } = parsed.data
    if (!city.trim() && !state.trim()) {
        return NextResponse.json({ error: 'Enter a city or state to search.' }, { status: 400 })
    }

    const result = await searchPlacesSafe(category, city, state)

    if (result.ok) return NextResponse.json({ data: result.results })
    if (result.skipped) return NextResponse.json({ skipped: true, reason: result.reason }, { status: 200 })
    return NextResponse.json({ error: result.error }, { status: 502 })
}
