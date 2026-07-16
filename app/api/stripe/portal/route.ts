import { NextResponse } from 'next/server'
import { getStripeServerClient } from '@/lib/stripe'
import { getWorkspaceContext } from '@/lib/workspace'

export const runtime = 'nodejs'

function getBaseUrl(request: Request) {
    return process.env.NEXT_PUBLIC_WEBSITE_URL || new URL(request.url).origin
}

export async function POST(request: Request) {
    const context = await getWorkspaceContext()
    if (!context) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!context.workspace.stripe_customer_id) {
        return NextResponse.redirect(`${getBaseUrl(request)}/app/billing?portal=missing_customer`, { status: 303 })
    }

    try {
        const stripe = getStripeServerClient()
        const session = await stripe.billingPortal.sessions.create({
            customer: context.workspace.stripe_customer_id,
            return_url: `${getBaseUrl(request)}/app/billing`,
        })

        return NextResponse.redirect(session.url, { status: 303 })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to open billing portal'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
