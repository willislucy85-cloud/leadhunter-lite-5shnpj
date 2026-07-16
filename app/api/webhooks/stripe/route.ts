import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import type { Tier } from '@/lib/constants'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTierFromPriceId } from '@/lib/stripe'

export const runtime = 'nodejs'

const acceptedEventTypes = new Set([
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
])

async function findWorkspaceIdByCustomerId(customerId: string | null | undefined) {
    if (!customerId) return null

    const admin = createAdminClient()
    const { data } = await admin
        .from('workspaces')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .limit(1)
        .maybeSingle()

    return data?.id || null
}

function resolveTier(subscription: Stripe.Subscription): Tier | null {
    const fromPrice = getTierFromPriceId(subscription.items.data[0]?.price?.id)
    if (fromPrice) return fromPrice

    const fromMetadata = subscription.metadata?.tier
    if (fromMetadata === 'Pro' || fromMetadata === 'Business' || fromMetadata === 'Enterprise' || fromMetadata === 'Free') {
        return fromMetadata
    }

    return null
}

async function updateWorkspaceBilling(workspaceId: string, patch: Record<string, string | null>) {
    const admin = createAdminClient()
    await admin.from('workspaces').update(patch).eq('id', workspaceId)
}

export async function POST(request: Request) {
    const signingSecret = process.env.STRIPE_WEBHOOK_SECRET
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY

    if (!signingSecret) {
        return NextResponse.json(
            { error: 'Missing STRIPE_WEBHOOK_SECRET' },
            { status: 500 }
        )
    }

    if (!stripeSecretKey) {
        return NextResponse.json(
            { error: 'Missing STRIPE_SECRET_KEY' },
            { status: 500 }
        )
    }

    const signature = request.headers.get('stripe-signature')
    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    const body = await request.text()
    const stripe = new Stripe(stripeSecretKey)

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(body, signature, signingSecret)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid webhook signature'
        return NextResponse.json({ error: message }, { status: 400 })
    }

    if (!acceptedEventTypes.has(event.type)) {
        return NextResponse.json({ received: true, ignored: true, type: event.type })
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session
            const workspaceId = session.client_reference_id || session.metadata?.workspaceId || null
            const tier = session.metadata?.tier

            if (workspaceId) {
                await updateWorkspaceBilling(workspaceId, {
                    stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
                    stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
                    subscription_status: 'active',
                    subscription_tier: tier === 'Pro' || tier === 'Business' ? tier : 'Free',
                })
            }
        }

        if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as Stripe.Subscription
            const tier = resolveTier(subscription)
            const workspaceId = subscription.metadata?.workspaceId || (await findWorkspaceIdByCustomerId(typeof subscription.customer === 'string' ? subscription.customer : null))

            if (workspaceId) {
                const isDeleted = event.type === 'customer.subscription.deleted'
                await updateWorkspaceBilling(workspaceId, {
                    stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : null,
                    stripe_subscription_id: isDeleted ? null : subscription.id,
                    subscription_status: isDeleted ? 'canceled' : subscription.status,
                    subscription_tier: isDeleted ? 'Free' : tier || 'Free',
                })
            }
        }

        if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.payment_failed') {
            const invoice = event.data.object as Stripe.Invoice
            const workspaceId = await findWorkspaceIdByCustomerId(typeof invoice.customer === 'string' ? invoice.customer : null)

            if (workspaceId) {
                await updateWorkspaceBilling(workspaceId, {
                    subscription_status: event.type === 'invoice.payment_succeeded' ? 'active' : 'past_due',
                })
            }
        }

        return NextResponse.json({ received: true, type: event.type })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Webhook processing error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
