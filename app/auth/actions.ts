'use server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const PUBLIC_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'

export async function resetPassword(currentState: { message: string }, formData: FormData) {
    const supabase = createClient()
    const passwordData = {
        password: formData.get('password') as string,
        confirm_password: formData.get('confirm_password') as string,
        code: formData.get('code') as string,
    }
    if (passwordData.password !== passwordData.confirm_password) {
        return { message: 'Passwords do not match' }
    }

    await supabase.auth.exchangeCodeForSession(passwordData.code)

    const { error } = await supabase.auth.updateUser({
        password: passwordData.password,
    })
    if (error) {
        return { message: error.message }
    }
    redirect(`/forgot-password/reset/success`)
}

export async function forgotPassword(currentState: { message: string }, formData: FormData) {
    const supabase = createClient()
    const email = formData.get('email') as string
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${PUBLIC_URL}/forgot-password/reset`,
    })

    if (error) {
        return { message: error.message }
    }
    redirect(`/forgot-password/success`)
}

export async function signup(currentState: { message: string }, formData: FormData) {
    const supabase = createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        name: formData.get('name') as string,
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            emailRedirectTo: `${PUBLIC_URL}/auth/callback`,
            data: {
                full_name: data.name,
            },
        },
    })

    if (signUpError) {
        if (signUpError.message.includes('already registered')) {
            return { message: 'An account with this email already exists. Please login instead.' }
        }
        return { message: signUpError.message }
    }

    if (!signUpData?.user) {
        return { message: 'Failed to create user' }
    }

    // A `handle_new_user()` trigger on auth.users provisions the workspace
    // and Owner membership server-side — nothing else to do here.

    revalidatePath('/', 'layout')

    if (!signUpData.session) {
        redirect('/signup/check-email')
    }
    redirect('/app')
}

export async function loginUser(currentState: { message: string }, formData: FormData) {
    const supabase = createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { message: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/app')
}

export async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

export async function signInWithGoogle() {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${PUBLIC_URL}/auth/callback`,
        },
    })

    if (error) {
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }
    if (data.url) {
        redirect(data.url)
    }
}
