'use client'

import { useEffect } from 'react'

declare global {
    interface Window {
        __stripePricingScriptLoaded?: boolean
    }
}

export function StripePricingTable() {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const pricingTableId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID

    useEffect(() => {
        if (!publishableKey || !pricingTableId) return

        const container = document.getElementById('stripe-pricing-table-container')
        if (!container) return

        if (!window.__stripePricingScriptLoaded) {
            const script = document.createElement('script')
            script.src = 'https://js.stripe.com/v3/pricing-table.js'
            script.async = true
            script.onload = () => {
                window.__stripePricingScriptLoaded = true
            }
            document.body.appendChild(script)
        }

        container.innerHTML = ''
        const table = document.createElement('stripe-pricing-table')
        table.setAttribute('pricing-table-id', pricingTableId)
        table.setAttribute('publishable-key', publishableKey)
        container.appendChild(table)
    }, [pricingTableId, publishableKey])

    if (!publishableKey || !pricingTableId) {
        return (
            <div className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
                Pricing table is hidden until Stripe variables are set.
            </div>
        )
    }

    return <div id="stripe-pricing-table-container" className="mt-4" />
}
