import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import api from '../../lib/api'

const ROLES = ['ADMIN', 'MERCHANDISER', 'SALES', 'DESIGNER', 'VIEWER']
const ROLE_COLORS = { ADMIN: 'warning', MERCHANDISER: 'info', SALES: 'success', DESIGNER: 'default', VIEWER: 'default' }

export function SettingsTeamPage() {
  const qc = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('VIEWER')

  const teamQ = useQuery({ queryKey: ['team'], queryFn: () => api('/auth/team') })
  const users = teamQ.data?.users || []
  const invitations = teamQ.data?.invitations || []

  const inviteM = useMutation({
    mutationFn: (data) => api('/auth/invite', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Invitation sent!'); setShowInvite(false); setInviteEmail(''); qc.invalidateQueries({ queryKey: ['team'] }) },
    onError: (e) => toast.error(e.message || 'Failed to send invite')
  })

  const roleM = useMutation({
    mutationFn: ({ id, role }) => api(`/auth/team/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries({ queryKey: ['team'] }) }
  })

  const removeM = useMutation({
    mutationFn: (id) => api(`/auth/team/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Member removed'); qc.invalidateQueries({ queryKey: ['team'] }) },
    onError: (e) => toast.error(e.message || 'Cannot remove')
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">Team Management</h1>
          <p className="text-sm text-content-secondary mt-1">Manage team members, roles, and invitations.</p>
        </div>
        <Button onClick={() => setShowInvite(!showInvite)}>{showInvite ? 'Cancel' : '+ Invite Member'}</Button>
      </div>

      {showInvite && (
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_200px_auto]">
              <div><label className="text-sm font-medium">Email</label><Input className="mt-1" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" /></div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-border-subtle px-3 text-sm outline-none focus:ring-2 focus:ring-brand">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={() => inviteM.mutate({ email: inviteEmail, role: inviteRole })} disabled={!inviteEmail || inviteM.isPending}>
                  {inviteM.isPending ? 'Sending…' : 'Send Invite'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Team Members ({users.length})</CardTitle></CardHeader>
        <CardContent>
          {teamQ.isLoading ? <><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></> : (
            <div className="divide-y divide-border-subtle">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center text-sm font-bold">{u.name?.[0]?.toUpperCase()}</div>
                    <div>
                      <div className="text-sm font-semibold text-content-primary">{u.name}</div>
                      <div className="text-xs text-content-tertiary">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select value={u.role} onChange={e => roleM.mutate({ id: u.id, role: e.target.value })}
                      className="h-8 rounded-lg border border-border-subtle px-2 text-xs outline-none focus:ring-2 focus:ring-brand">
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <Button variant="secondary" size="sm" onClick={() => { if (confirm('Remove this member?')) removeM.mutate(u.id) }}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Pending Invitations ({invitations.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-border-subtle">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-content-primary">{inv.email}</div>
                    <div className="text-xs text-content-tertiary">Expires {new Date(inv.expiresAt).toLocaleDateString()}</div>
                  </div>
                  <Badge variant={ROLE_COLORS[inv.role] || 'default'}>{inv.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
