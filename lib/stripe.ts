import Stripe from 'stripe'
import type { Tier } from '@/lib/constants'

let stripeClient: Stripe | null = null

export function getStripeServerClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
        throw new Error('Missing STRIPE_SECRET_KEY')
    }

    if (!stripeClient) {
        stripeClient = new Stripe(secretKey)
    }

    return stripeClient
}

export function getPriceIdForTier(tier: Tier) {
    if (tier === 'Pro') return process.env.STRIPE_PRICE_PRO || null
    if (tier === 'Business') return process.env.STRIPE_PRICE_BUSINESS || null
    return null
}

export function getTierFromPriceId(priceId: string | null | undefined): Tier | null {
    if (!priceId) return null
    if (priceId === process.env.STRIPE_PRICE_PRO) return 'Pro'
    if (priceId === process.env.STRIPE_PRICE_BUSINESS) return 'Business'
    return null
}
