import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function BuyerRequestQuotePage() {
  return (
    <div className="max-w-xl mx-auto px-6 py-12 space-y-6">
      <div>
        <div className="text-2xl font-bold tracking-tight">Request a Quote</div>
        <div className="text-muted mt-1">Share your details and we’ll follow up with pricing.</div>
      </div>
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted">Company</label>
          <Input className="mt-1" placeholder="Your company name" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted">Name</label>
            <Input className="mt-1" placeholder="Your name" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Email</label>
            <Input className="mt-1" placeholder="you@company.com" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Products or notes</label>
          <textarea className="mt-1 h-28 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-3 text-sm outline-none" placeholder="List SKUs or describe what you need…" />
        </div>
        <div className="flex justify-end">
          <Button>Send Request</Button>
        </div>
      </div>
    </div>
  )
}
