'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { Bell, X } from 'lucide-react'

type Toast = { id: string; text: string }
type ToastContextValue = { pushToast: (text: string) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within ToastProvider')
    return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const pushToast = useCallback((text: string) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`
        setToasts((prev) => [...prev, { id, text }])
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000)
    }, [])

    const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

    return (
        <ToastContext.Provider value={{ pushToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs sm:max-w-sm">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className="lh-fade-in flex items-start gap-2 rounded-lg shadow-lg px-3 py-2.5 text-sm"
                        style={{ background: 'var(--lh-ink)', color: '#fff' }}
                    >
                        <Bell size={15} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--lh-accent)' }} />
                        <span className="flex-1">{t.text}</span>
                        <button type="button" onClick={() => dismiss(t.id)} className="lh-focus flex-shrink-0" aria-label="Dismiss">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
