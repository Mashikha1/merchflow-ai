import { cn } from '../../lib/cn'

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group'

const variants = {
  primary:
    'bg-brand text-white hover:bg-brand-hover border border-transparent shadow-sm',
  secondary:
    'bg-white border border-border-subtle text-content-primary hover:bg-app-hover shadow-sm',
  outline:
    'bg-transparent border border-border-subtle text-content-primary hover:bg-app-hover',
  ghost:
    'text-content-secondary hover:text-content-primary hover:bg-app-hover border border-transparent',
  danger:
    'bg-semantic-error text-white hover:opacity-90 shadow-sm',
}

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4',
  lg: 'h-11 px-6 text-base',
  icon: 'h-10 w-10',
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
}
