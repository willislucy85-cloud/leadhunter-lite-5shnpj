'use client'

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="max-w-md text-sm text-muted-foreground">
                That&apos;s on us — please try again in a moment.
            </p>
            <button
                onClick={() => reset()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
                Try again
            </button>
        </div>
    )
}
