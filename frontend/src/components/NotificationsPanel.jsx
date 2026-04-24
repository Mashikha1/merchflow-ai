import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'
import { cn } from '../lib/cn'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Skeleton } from './ui/Skeleton'
import { formatDistanceToNow } from 'date-fns'
import api from '../lib/api'
import { toast } from 'sonner'

const KIND_ICON = {
  ai_job_done: '🤖', ai: '🤖',
  quote_sent: '📄', quote_viewed: '👁️', quote_approved: '✅', quote_rejected: '❌',
  import_done: '📦', low_stock: '⚠️', invite_accepted: '👋',
  warning: '⚠️', success: '✅',
}

const KIND_VARIANT = {
  ai_job_done: 'ai', ai: 'ai',
  quote_sent: 'default', quote_approved: 'success', quote_rejected: 'error',
  import_done: 'default', low_stock: 'warning', warning: 'warning', success: 'success',
}

export function NotificationsPanel() {
  const open = useUiStore((s) => s.notificationsOpen)
  const setOpen = useUiStore((s) => s.setNotificationsOpen)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api('/notifications'),
    enabled: open,
    refetchInterval: open ? 30000 : false,
  })

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  const markReadM = useMutation({
    mutationFn: (id) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] })
  })

  const markAllM = useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All notifications marked as read') }
  })

  const deleteM = useMutation({
    mutationFn: (id) => api(`/notifications/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] })
  })

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
    >
      <div className="absolute inset-0 bg-black/5" />
      <div className="absolute right-0 top-0 h-[100svh] w-[min(36vw,480px)] bg-white border-l border-[rgb(var(--border))] shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgb(var(--border))] bg-white px-4 py-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold">{unreadCount}</span>
              )}
            </div>
            <div className="text-xs text-muted">Latest updates and alerts.</div>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={() => markAllM.mutate()} disabled={markAllM.isPending}>
                Mark all read
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <div className="text-4xl">🔔</div>
              <p className="text-sm text-muted">You're all caught up!</p>
              <p className="text-xs text-muted">Notifications for AI jobs, quotes, imports, and more will appear here.</p>
            </div>
          )}

          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'rounded-xl border p-3 transition-colors',
                n.readAt
                  ? 'border-[rgb(var(--border))] bg-[rgb(var(--surface))]'
                  : 'border-brand/20 bg-brand/5'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="text-xl shrink-0 mt-0.5">{KIND_ICON[n.type] || '🔔'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className={cn('text-sm font-semibold truncate', !n.readAt && 'text-content-primary')}>{n.title}</div>
                    <span className="text-[11px] text-muted whitespace-nowrap shrink-0">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {n.body && <div className="mt-0.5 text-xs text-muted">{n.body}</div>}
                  <div className="mt-2 flex gap-2">
                    {n.link && (
                      <Button variant="ghost" size="sm" onClick={() => { navigate(n.link); setOpen(false) }}>View</Button>
                    )}
                    {!n.readAt && (
                      <Button variant="secondary" size="sm" onClick={() => markReadM.mutate(n.id)}>Mark read</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteM.mutate(n.id)} className="text-red-400 hover:text-red-600">Delete</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-[rgb(var(--border))] p-3 flex items-center justify-between shrink-0">
          <Button variant="ghost" size="sm" onClick={() => { navigate('/settings/notifications'); setOpen(false) }}>Notification settings</Button>
        </div>
      </div>
    </div>
  )
}
