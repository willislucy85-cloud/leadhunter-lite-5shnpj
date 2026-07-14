import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Crosshair } from 'lucide-react'

// Placeholder landing page — the real marketing/pricing page (with live
// Stripe pricing) is built in a later phase.
export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-[100dvh] items-center justify-center gap-6 text-center px-4">
            <div className="flex items-center gap-2">
                <Crosshair className="h-7 w-7 text-orange-600" />
                <span className="font-extrabold text-2xl tracking-tight">
                    LeadHunter <span className="text-orange-600">Lite</span>
                </span>
            </div>
            <p className="text-muted-foreground max-w-md">
                AI-powered lead CRM for local-service contractors and agencies. Marketing page coming soon.
            </p>
            <div className="flex gap-3">
                <Link href="/login"><Button variant="outline">Log in</Button></Link>
                <Link href="/signup"><Button>Get started</Button></Link>
            </div>
        </div>
    )
}
