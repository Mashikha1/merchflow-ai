import { useMemo } from 'react'
import { useUiStore } from '../store/uiStore'
import { cn } from '../lib/cn'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { formatDistanceToNow } from 'date-fns'

export function NotificationsPanel() {
  const open = useUiStore((s) => s.notificationsOpen)
  const setOpen = useUiStore((s) => s.setNotificationsOpen)

  const items = useMemo(() => {
    const now = Date.now()
    return [
      {
        id: 'n1',
        title: 'AI Try-On completed',
        body: '3 outputs generated for “Aurora Satin Bomber”.',
        kind: 'ai',
        at: now - 12 * 60 * 1000,
      },
      {
        id: 'n2',
        title: 'Low stock alert',
        body: '6 variants dropped below threshold in “SS26 Core”.',
        kind: 'warning',
        at: now - 2.1 * 60 * 60 * 1000,
      },
      {
        id: 'n3',
        title: 'Showroom published',
        body: '“Buyers — North America” is now live.',
        kind: 'success',
        at: now - 22 * 60 * 60 * 1000,
      },
    ]
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
    >
      <div className="absolute inset-0 bg-black/5" />
      <div className="absolute right-0 top-0 h-[100svh] w-[min(36vw,680px)] bg-white border-l border-[rgb(var(--border))] shadow-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[rgb(var(--border))] bg-white p-4">
          <div>
            <div className="text-sm font-semibold">Notifications</div>
            <div className="text-xs text-muted">Latest updates and alerts.</div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => {/* mock mark all read */}}>
              Mark all read
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>

        <div className="p-3 space-y-2 overflow-auto h-[calc(100svh-124px)]">
          {items.map((n) => (
            <div
              key={n.id}
              className={cn(
                'rounded-[var(--radius)] border border-[rgb(var(--border))] p-4 bg-[rgb(var(--surface))]',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold truncate">
                      {n.title}
                    </div>
                    <Badge
                      variant={
                        n.kind === 'ai'
                          ? 'ai'
                          : n.kind === 'warning'
                            ? 'warning'
                            : 'success'
                      }
                    >
                      {n.kind}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted">{n.body}</div>
                </div>
                <div className="text-[11px] text-muted whitespace-nowrap">
                  {formatDistanceToNow(new Date(n.at), { addSuffix: true })}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" size="sm">
                  View
                </Button>
                <Button variant="secondary" size="sm">
                  Mark read
                </Button>
              </div>
            </div>
          ))}

          <div className="sticky bottom-0 bg-white border-t border-[rgb(var(--border))] p-3 flex items-center justify-between">
            <Button variant="ghost" size="sm">View all activity</Button>
            <Button variant="secondary" size="sm">Notification settings</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
