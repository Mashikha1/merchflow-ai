import { cn } from '../lib/cn'

export function PageHeader({
  title,
  subtitle,
  description,
  actions,
  className,
  children,
}) {
  const sub = subtitle ?? description
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-content-primary tracking-tight leading-tight">
            {title}
          </h1>
          {sub ? <p className="mt-1 text-sm font-medium text-content-secondary max-w-2xl">{sub}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2 pt-1">{actions}</div> : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  )
}
