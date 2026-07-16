import Link from 'next/link'
import { ArrowRight, Check, Crosshair, Sparkles, Target, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StripePricingTable } from '@/components/marketing/StripePricingTable'

export default function LandingPage() {
    return (
        <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_10%_0%,#fff2e8_0%,transparent_40%),radial-gradient(circle_at_95%_10%,#e6f4ff_0%,transparent_35%),linear-gradient(180deg,#fff,#fff)] text-zinc-900">
            <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
                <div className="flex items-center gap-2">
                    <Crosshair className="h-6 w-6 text-orange-600" />
                    <span className="text-xl font-black tracking-tight">LeadHunter Lite</span>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/login"><Button variant="outline">Log in</Button></Link>
                    <Link href="/signup"><Button>Get started</Button></Link>
                </div>
            </header>

            <main>
                <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-12 pt-8 sm:px-6 md:grid-cols-2 md:items-center md:pb-16 md:pt-16">
                    <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                            <Sparkles className="h-3.5 w-3.5" />
                            AI-powered CRM for local service teams
                        </div>
                        <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                            Capture, score, and close more leads without spreadsheet chaos.
                        </h1>
                        <p className="mt-4 max-w-xl text-base text-zinc-600 sm:text-lg">
                            LeadHunter Lite helps contractors and agencies track pipeline, prioritize hot leads, and launch outreach with confidence.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link href="/signup">
                                <Button className="gap-2">
                                    Start free
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="#pricing"><Button variant="outline">View pricing</Button></Link>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,.08)] sm:p-6">
                        <p className="text-sm font-semibold text-zinc-500">What teams get in week one</p>
                        <ul className="mt-4 space-y-3 text-sm sm:text-base">
                            <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />Centralized lead workspace by source, status, and intent</li>
                            <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />AI enrichment and scoring to surface high-priority opportunities</li>
                            <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />Sequence-ready pipeline to keep follow-up on track</li>
                        </ul>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-zinc-200 bg-white p-4">
                            <Target className="h-5 w-5 text-orange-600" />
                            <h2 className="mt-2 text-lg font-bold">Lead prioritization</h2>
                            <p className="mt-1 text-sm text-zinc-600">Score and rank leads so your team focuses on deals most likely to close.</p>
                        </div>
                        <div className="rounded-xl border border-zinc-200 bg-white p-4">
                            <Users className="h-5 w-5 text-blue-600" />
                            <h2 className="mt-2 text-lg font-bold">Team collaboration</h2>
                            <p className="mt-1 text-sm text-zinc-600">Shared workflows keep handoffs clean across sales reps and operations.</p>
                        </div>
                        <div className="rounded-xl border border-zinc-200 bg-white p-4">
                            <Sparkles className="h-5 w-5 text-violet-600" />
                            <h2 className="mt-2 text-lg font-bold">Automation-ready</h2>
                            <p className="mt-1 text-sm text-zinc-600">Build repeatable outreach and follow-up motions as you scale.</p>
                        </div>
                    </div>
                </section>

                <section id="pricing" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
                    <div className="mb-6">
                        <h2 className="text-3xl font-black tracking-tight">Simple pricing</h2>
                        <p className="mt-2 text-zinc-600">Start free, then upgrade as your lead volume grows.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <article className="rounded-2xl border border-zinc-200 bg-white p-5">
                            <h3 className="text-lg font-bold">Free</h3>
                            <p className="mt-1 text-sm text-zinc-600">Best for trying the workflow</p>
                            <p className="mt-4 text-3xl font-black">$0<span className="text-base font-medium text-zinc-500">/mo</span></p>
                            <ul className="mt-4 space-y-2 text-sm text-zinc-700">
                                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />Up to 50 leads</li>
                                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />20 AI enrichments</li>
                                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />1 active sequence</li>
                            </ul>
                            <Link href="/signup" className="mt-5 inline-flex"><Button variant="outline" className="w-full">Start free</Button></Link>
                        </article>

                        <article className="rounded-2xl border-2 border-orange-300 bg-white p-5 shadow-[0_16px_40px_rgba(255,90,31,.15)]">
                            <h3 className="text-lg font-bold">Pro</h3>
                            <p className="mt-1 text-sm text-zinc-600">For growth-focused teams</p>
                            <p className="mt-4 text-3xl font-black">$29<span className="text-base font-medium text-zinc-500">/mo</span></p>
                            <ul className="mt-4 space-y-2 text-sm text-zinc-700">
                                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />Unlimited leads</li>
                                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />Unlimited AI enrichments</li>
                                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />Unlimited sequences</li>
                            </ul>
                            <Link href="/signup" className="mt-5 inline-flex"><Button className="w-full">Choose Pro</Button></Link>
                        </article>

                        <article className="rounded-2xl border border-zinc-200 bg-white p-5">
                            <h3 className="text-lg font-bold">Business</h3>
                            <p className="mt-1 text-sm text-zinc-600">For collaborative sales ops</p>
                            <p className="mt-4 text-3xl font-black">$79<span className="text-base font-medium text-zinc-500">/mo</span></p>
                            <ul className="mt-4 space-y-2 text-sm text-zinc-700">
                                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />Everything in Pro</li>
                                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />Shared inbox</li>
                                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" />Advanced analytics</li>
                            </ul>
                            <Link href="/signup" className="mt-5 inline-flex"><Button variant="outline" className="w-full">Choose Business</Button></Link>
                        </article>
                    </div>

                    <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5">
                        <p className="text-sm font-semibold text-zinc-700">Stripe-hosted pricing table</p>
                        <p className="mt-1 text-sm text-zinc-600">
                            Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID to enable your live Stripe pricing table here.
                        </p>
                        <StripePricingTable />
                    </div>
                </section>
            </main>

            <footer className="border-t border-zinc-200 bg-white/70">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p>LeadHunter Lite</p>
                    <div className="flex gap-4">
                        <Link href="/login" className="hover:text-zinc-900">Login</Link>
                        <Link href="/signup" className="hover:text-zinc-900">Signup</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
