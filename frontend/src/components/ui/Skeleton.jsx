import { cn } from '../../lib/cn'

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border))]/60',
        className,
      )}
      {...props}
    />
  )
}

