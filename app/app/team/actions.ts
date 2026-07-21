'use server'

import { requireWorkspace } from '@/lib/workspace'
import { sendEmailSafe } from '@/lib/resend'
import { revalidatePath } from 'next/cache'
import type { WorkspaceRole } from '@/lib/types'

function siteUrl() {
    return process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'
}

function canManageTeam(role: WorkspaceRole) {
    return role === 'Owner' || role === 'Admin'
}

export async function inviteMember(email: string, role: WorkspaceRole) {
    const { supabase, workspaceId, workspace, role: currentRole, user } = await requireWorkspace()

    if (!canManageTeam(currentRole)) {
        return { error: 'Only Owners and Admins can invite members.' }
    }

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
        return { error: 'A valid email is required.' }
    }

    const { error } = await supabase.from('workspace_invites').insert({
        workspace_id: workspaceId,
        email: trimmedEmail,
        role,
        invited_by: user.id,
    })

    if (error) {
        if (error.code === '23505') {
            return { error: `${trimmedEmail} already has a pending invite.` }
        }
        return { error: error.message }
    }

    const emailResult = await sendEmailSafe(
        trimmedEmail,
        `You're invited to ${workspace.name} on LeadHunter Lite`,
        `You've been invited to join ${workspace.name} as ${role}.\n\nCreate your account to accept: ${siteUrl()}/signup\n\nUse this email address (${trimmedEmail}) when you sign up.`
    )

    revalidatePath('/app/team')

    if (!emailResult.ok) {
        return { ok: true, warning: 'Invite created, but the email could not be sent. Share the signup link with them directly.' }
    }

    return { ok: true }
}

export async function revokeInvite(inviteId: string) {
    const { supabase, workspaceId, role } = await requireWorkspace()

    if (!canManageTeam(role)) {
        return { error: 'Only Owners and Admins can manage invites.' }
    }

    const { error } = await supabase.from('workspace_invites').delete().eq('id', inviteId).eq('workspace_id', workspaceId)
    if (error) return { error: error.message }

    revalidatePath('/app/team')
    return { ok: true }
}

export async function updateMemberRole(memberId: string, newRole: WorkspaceRole) {
    const { supabase, workspaceId, role } = await requireWorkspace()

    if (!canManageTeam(role)) {
        return { error: 'Only Owners and Admins can change roles.' }
    }

    const { data: member } = await supabase.from('workspace_members').select('role').eq('id', memberId).eq('workspace_id', workspaceId).maybeSingle()
    if (!member) return { error: 'Member not found.' }

    if (member.role === 'Owner' && newRole !== 'Owner') {
        const { count } = await supabase
            .from('workspace_members')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)
            .eq('role', 'Owner')
        if ((count || 0) <= 1) {
            return { error: 'A workspace needs at least one Owner.' }
        }
    }

    const { error } = await supabase.from('workspace_members').update({ role: newRole }).eq('id', memberId).eq('workspace_id', workspaceId)
    if (error) return { error: error.message }

    revalidatePath('/app/team')
    return { ok: true }
}

export async function removeMember(memberId: string) {
    const { supabase, workspaceId, role } = await requireWorkspace()

    if (!canManageTeam(role)) {
        return { error: 'Only Owners and Admins can remove members.' }
    }

    const { data: member } = await supabase.from('workspace_members').select('role').eq('id', memberId).eq('workspace_id', workspaceId).maybeSingle()
    if (!member) return { error: 'Member not found.' }

    if (member.role === 'Owner') {
        const { count } = await supabase
            .from('workspace_members')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)
            .eq('role', 'Owner')
        if ((count || 0) <= 1) {
            return { error: 'A workspace needs at least one Owner.' }
        }
    }

    const { error } = await supabase.from('workspace_members').delete().eq('id', memberId).eq('workspace_id', workspaceId)
    if (error) return { error: error.message }

    revalidatePath('/app/team')
    return { ok: true }
}
