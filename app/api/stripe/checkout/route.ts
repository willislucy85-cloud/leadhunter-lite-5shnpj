import { NextResponse } from 'next/server'
import type { Tier } from '@/lib/constants'
import { getWorkspaceContext } from '@/lib/workspace'
import { createAdminClient } from '@/utils/supabase/admin'
import { getPriceIdForTier, getStripeServerClient } from '@/lib/stripe'

export const runtime = 'nodejs'

const ALLOWED_PLANS: Tier[] = ['Pro', 'Business']

function getBaseUrl(request: Request) {
    return process.env.NEXT_PUBLIC_WEBSITE_URL || new URL(request.url).origin
}

export async function POST(request: Request) {
    const context = await getWorkspaceContext()
    if (!context) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const plan = String(formData.get('plan') || '') as Tier

    if (!ALLOWED_PLANS.includes(plan)) {
        return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    const priceId = getPriceIdForTier(plan)
    if (!priceId) {
        return NextResponse.json({ error: `Missing Stripe price id for ${plan}` }, { status: 500 })
    }

    try {
        const stripe = getStripeServerClient()
        const admin = createAdminClient()
        const baseUrl = getBaseUrl(request)

        let customerId = context.workspace.stripe_customer_id

        if (!customerId) {
            const customer = await stripe.customers.create({
                metadata: {
                    workspaceId: context.workspaceId,
                    userId: context.user.id,
                },
            })
            customerId = customer.id

            await admin
                .from('workspaces')
                .update({ stripe_customer_id: customerId })
                .eq('id', context.workspaceId)
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${baseUrl}/app/billing?checkout=success`,
            cancel_url: `${baseUrl}/app/billing?checkout=cancel`,
            allow_promotion_codes: true,
            client_reference_id: context.workspaceId,
            metadata: {
                workspaceId: context.workspaceId,
                tier: plan,
            },
            subscription_data: {
                metadata: {
                    workspaceId: context.workspaceId,
                    tier: plan,
                },
            },
        })

        if (!session.url) {
            return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
        }

        return NextResponse.redirect(session.url, { status: 303 })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to start checkout'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
