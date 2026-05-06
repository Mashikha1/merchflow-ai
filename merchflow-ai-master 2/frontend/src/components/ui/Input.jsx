import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

export const Input = forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-border-subtle bg-white px-3 text-sm text-content-primary placeholder:text-content-tertiary shadow-sm outline-none transition-all focus:ring-2 focus:ring-brand focus:border-brand',
        className,
      )}
      {...props}
    />
  )
})
Input.displayName = 'Input'
