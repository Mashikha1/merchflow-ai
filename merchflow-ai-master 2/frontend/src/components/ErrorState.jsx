import { Button } from './ui/Button'

export function ErrorState({
  title = 'Something went wrong',
  description = 'We couldn’t load this section. Try again.',
  onRetry,
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 shadow-card">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm text-muted">{description}</div>
      {onRetry ? (
        <div className="mt-4">
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  )
}

