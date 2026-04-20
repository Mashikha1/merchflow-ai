import { cn } from '../../lib/cn'

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'bg-app-card shadow-card border border-border-subtle rounded-lg',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('p-6 pb-0', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return (
    <div
      className={cn('text-[16px] font-semibold tracking-tight text-content-primary', className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }) {
  return <div className={cn('mt-1 text-sm text-content-secondary', className)} {...props} />
}
