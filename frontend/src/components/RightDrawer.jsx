import { cn } from '../lib/cn'
import { Button } from './ui/Button'

export function RightDrawer({
  open,
  title,
  subtitle,
  ariaLabel,
  headerActions,
  children,
  footer,
  onClose,
  className,
  widthClassName = 'w-[min(760px,calc(100%-24px))]',
  backdropClassName = 'bg-black/40',
}) {
  if (!open) return null

  const computedAriaLabel =
    ariaLabel || (typeof title === 'string' ? title : 'Drawer')

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={computedAriaLabel}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        className={cn('absolute inset-0 backdrop-blur-none', backdropClassName)}
      />
      <div
        className={cn(
          'absolute right-0 top-0 h-[100svh] bg-white border-l border-border-subtle shadow-card',
          widthClassName,
          className,
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border-subtle bg-white p-4">
          <div className="min-w-0">
            {title ? (
              <div className="text-sm font-semibold tracking-[-0.02em] text-content-primary">
                {title}
              </div>
            ) : null}
            {subtitle ? <div className="mt-1 text-xs text-content-secondary">{subtitle}</div> : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {headerActions ? headerActions : null}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="h-[calc(100svh-124px)] overflow-auto p-4 bg-white">
          {children}
        </div>

        <div className="sticky bottom-0 border-t border-border-subtle bg-white p-4">
          {footer ? footer : <div className="text-xs text-content-secondary"> </div>}
        </div>
      </div>
    </div>
  )
}

