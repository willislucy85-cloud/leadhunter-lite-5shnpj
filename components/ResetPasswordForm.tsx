
"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormState } from 'react-dom'
import { resetPassword } from '@/app/auth/actions'
import { useSearchParams } from "next/navigation";
import { Suspense } from "react"
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

function GetCodeHiddenInput() {
    const searchParams = useSearchParams();
    return <Input type="hidden" name="code" value={searchParams.get('code')!} />
}

export default function ResetPasswordForm() {
    const initialState = {
        message: ''
    }
    const [formState, formAction] = useFormState(resetPassword, initialState)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [capsLockOn, setCapsLockOn] = useState(false)
    const [confirmCapsLockOn, setConfirmCapsLockOn] = useState(false)

    return (<>
        <form action={formAction}>
            <div className="grid gap-2">
                <Label htmlFor="email">Password</Label>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter New Password"
                        name="password"
                        className="pr-10"
                        onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                        onKeyDown={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 px-3 text-muted-foreground"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {capsLockOn && <p className="text-xs text-amber-600">Caps Lock is on.</p>}
                <div className="relative">
                    <Input
                        id="confirm_password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        name="confirm_password"
                        className="pr-10"
                        onKeyUp={(e) => setConfirmCapsLockOn(e.getModifierState('CapsLock'))}
                        onKeyDown={(e) => setConfirmCapsLockOn(e.getModifierState('CapsLock'))}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 px-3 text-muted-foreground"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {confirmCapsLockOn && <p className="text-xs text-amber-600">Caps Lock is on.</p>}
                <Suspense>
                    <GetCodeHiddenInput />
                </Suspense>
            </div>
            <Button className="w-full mt-4" type="submit">Update Password</Button>
            {formState?.message && (
                <p className="text-sm text-red-500 text-center py-2">{formState.message}</p>
            )}
        </form >
    </>)
}