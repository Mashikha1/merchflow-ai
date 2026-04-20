import { cn } from '../../lib/cn'

const variants = {
  default:
    'bg-app-card-muted text-content-secondary border border-border-subtle',
  success: 'bg-semantic-success-bg text-semantic-success border border-semantic-success/20',
  warning: 'bg-semantic-warning-bg text-semantic-warning border border-semantic-warning/20',
  danger: 'bg-semantic-error-bg text-semantic-error border border-semantic-error/20',
  ai: 'bg-brand-soft text-brand-strong border border-brand-soft/30',
}

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium leading-none',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
