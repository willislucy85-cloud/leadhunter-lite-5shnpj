'use client'

import { useState, useTransition } from 'react'
import { UserCog, Mail, Plus, X, Clock } from 'lucide-react'
import { Badge, IconButton, Modal, EmptyState } from './primitives'
import { useToast } from './toast'
import { timeAgo } from '@/lib/scoring'
import { inviteMember, revokeInvite, updateMemberRole, removeMember } from '@/app/app/team/actions'
import type { WorkspaceMember, WorkspaceInvite, WorkspaceRole } from '@/lib/types'

const ROLES: WorkspaceRole[] = ['Owner', 'Admin', 'Member']

const ROLE_COLOR: Record<WorkspaceRole, string> = {
    Owner: '#FF5A1F',
    Admin: '#1F6FB2',
    Member: '#6B6F76',
}

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
    const { pushToast } = useToast()
    const [pending, startTransition] = useTransition()
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<WorkspaceRole>('Member')
    const inputCls = 'lh-focus w-full px-3 py-2 rounded-md text-sm border'
    const inputStyle = { borderColor: 'var(--lh-border)' }

    const submit = () => {
        if (!email.trim()) return
        startTransition(async () => {
            const result = await inviteMember(email, role)
            if (result.error) {
                pushToast(result.error)
                return
            }
            pushToast(result.warning || `Invite sent to ${email}.`)
            onInvited()
            onClose()
        })
    }

    return (
        <Modal title="Invite a teammate" onClose={onClose} width={420}>
            <div className="flex flex-col gap-3">
                <input className={inputCls} style={inputStyle} type="email" placeholder="Email address *" value={email} onChange={(e) => setEmail(e.target.value)} />
                <select className={inputCls} style={inputStyle} value={role} onChange={(e) => setRole(e.target.value as WorkspaceRole)}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="flex justify-end gap-2 mt-1">
                    <IconButton label="Cancel" variant="outline" onClick={onClose} />
                    <IconButton label={pending ? 'Sending...' : 'Send invite'} icon={Mail} variant="accent" onClick={submit} disabled={pending} />
                </div>
            </div>
        </Modal>
    )
}

export function TeamClient({
    members,
    invites,
    currentUserId,
    canManage,
}: {
    members: WorkspaceMember[]
    invites: WorkspaceInvite[]
    currentUserId: string
    canManage: boolean
}) {
    const { pushToast } = useToast()
    const [pending, startTransition] = useTransition()
    const [showInvite, setShowInvite] = useState(false)

    const handleRoleChange = (memberId: string, role: WorkspaceRole) => {
        startTransition(async () => {
            const result = await updateMemberRole(memberId, role)
            if (result.error) pushToast(result.error)
        })
    }

    const handleRemove = (memberId: string) => {
        startTransition(async () => {
            const result = await removeMember(memberId)
            if (result.error) pushToast(result.error)
        })
    }

    const handleRevoke = (inviteId: string) => {
        startTransition(async () => {
            const result = await revokeInvite(inviteId)
            if (result.error) pushToast(result.error)
        })
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-4">
                <div className="lh-card rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>Members</p>
                    <p className="mt-2 text-2xl font-extrabold">{members.length}</p>
                </div>
                <div className="lh-card rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>Owners</p>
                    <p className="mt-2 text-2xl font-extrabold">{members.filter((m) => m.role === 'Owner').length}</p>
                </div>
                <div className="lh-card rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>Admins</p>
                    <p className="mt-2 text-2xl font-extrabold">{members.filter((m) => m.role === 'Admin').length}</p>
                </div>
                <div className="lh-card rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--lh-muted)' }}>Pending invites</p>
                    <p className="mt-2 text-2xl font-extrabold">{invites.length}</p>
                </div>
            </div>

            <section className="lh-card rounded-xl p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold">Workspace access</h2>
                    {canManage && <IconButton icon={Plus} label="Invite member" variant="accent" onClick={() => setShowInvite(true)} />}
                </div>
                {members.length === 0 ? (
                    <EmptyState icon={UserCog} title="No team members found" body="No workspace memberships were returned for this workspace." />
                ) : (
                    <div className="space-y-2">
                        {members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: 'var(--lh-border)' }}>
                                <div>
                                    <p className="text-sm font-semibold">
                                        {member.email}
                                        {member.userId === currentUserId && <span style={{ color: 'var(--lh-muted)' }}> (you)</span>}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--lh-muted)' }}>Added {timeAgo(member.createdAt)}</p>
                                </div>
                                {canManage ? (
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleRoleChange(member.id, e.target.value as WorkspaceRole)}
                                            disabled={pending}
                                            className="lh-focus text-xs font-medium rounded-full px-2 py-1 border-0"
                                            style={{ background: `${ROLE_COLOR[member.role]}1A`, color: ROLE_COLOR[member.role] }}
                                        >
                                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <button type="button" className="lh-focus" onClick={() => handleRemove(member.id)} disabled={pending} aria-label="Remove member">
                                            <X size={14} style={{ color: 'var(--lh-muted)' }} />
                                        </button>
                                    </div>
                                ) : (
                                    <Badge color={ROLE_COLOR[member.role]} soft>
                                        <UserCog size={12} className="mr-1 inline-block" />
                                        {member.role}
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {invites.length > 0 && (
                <section className="lh-card rounded-xl p-4">
                    <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5"><Clock size={14} />Pending invites</h2>
                    <div className="space-y-2">
                        {invites.map((invite) => (
                            <div key={invite.id} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: 'var(--lh-border)' }}>
                                <div>
                                    <p className="text-sm font-semibold">{invite.email}</p>
                                    <p className="text-xs" style={{ color: 'var(--lh-muted)' }}>Invited {timeAgo(invite.createdAt)} as {invite.role}</p>
                                </div>
                                {canManage && (
                                    <IconButton label="Revoke" variant="outline" onClick={() => handleRevoke(invite.id)} disabled={pending} />
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvited={() => {}} />}
        </div>
    )
}
