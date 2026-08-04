'use client'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="max-w-md text-sm text-muted-foreground">
                We couldn&apos;t load your workspace. This is usually a temporary issue — try again in a moment.
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
