import { Button } from './ui/Button'

export function EmptyState({
  title = 'Nothing here yet',
  description = 'Create your first item to get started.',
  primaryAction,
  secondaryAction,
  children,
}) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-8 shadow-card">
      <div className="max-w-xl">
        <div className="text-base font-semibold tracking-[-0.02em]">{title}</div>
        <div className="mt-2 text-sm text-muted">{description}</div>
        <div className="mt-5 flex flex-wrap gap-2">
          {primaryAction ? (
            <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button>
          ) : null}
          {secondaryAction ? (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </div>
  )
}

