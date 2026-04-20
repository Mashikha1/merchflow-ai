import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NAV_ITEMS, SETTINGS_ITEMS } from '../constants/navigation'
import { useUiStore } from '../store/uiStore'
import { cn } from '../lib/cn'
import { Input } from './ui/Input'
import { Icon } from './Icon'

export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen)
  const close = useUiStore((s) => s.closeCommand)
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const items = useMemo(() => {
    const merged = [
      ...NAV_ITEMS.map((i) => ({ ...i, group: 'Navigate' })),
      ...SETTINGS_ITEMS.map((i) => ({
        ...i,
        icon: 'gear',
        group: 'Settings',
      })),
      { label: 'AI Virtual Try-On', path: '/ai/try-on', icon: 'ai', group: 'AI' },
      {
        label: 'AI Description Writer',
        path: '/ai/descriptions',
        icon: 'ai',
        group: 'AI',
      },
      {
        label: 'AI Jobs',
        path: '/ai/jobs',
        icon: 'ai',
        group: 'AI',
      },
    ]
    const s = q.trim().toLowerCase()
    if (!s) return merged
    return merged.filter((i) => i.label.toLowerCase().includes(s))
  }, [q])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative mx-auto mt-[12svh] w-[min(720px,calc(100%-24px))]">
        <div className="surface shadow-soft border border-[rgb(var(--border))] rounded-[var(--radius)] overflow-hidden">
          <div className="p-4 border-b border-[rgb(var(--border))]">
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search commands, pages, products…"
              onKeyDown={(e) => {
                if (e.key === 'Escape') close()
              }}
            />
            <div className="mt-2 text-xs text-muted">
              Tip: type “try on”, “imports”, “showrooms”… Press Esc to close.
            </div>
          </div>
          <div className="max-h-[55vh] overflow-auto p-2">
            {items.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-sm font-semibold">No results</div>
                <div className="mt-1 text-sm text-muted">
                  Try a different keyword.
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {items.map((i) => (
                  <button
                    key={i.path + i.label}
                    className={cn(
                      'w-full text-left flex items-center gap-3 rounded-2xl px-3 py-3 transition border border-transparent hover:bg-[rgb(var(--bg-muted))]',
                    )}
                    onClick={() => {
                      navigate(i.path)
                      close()
                      setQ('')
                    }}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))]">
                      <Icon name={i.icon || 'spark'} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium">{i.label}</span>
                      <span className="block text-xs text-muted">{i.group}</span>
                    </span>
                    <span className="text-xs text-muted">{i.path}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

