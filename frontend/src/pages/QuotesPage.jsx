import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { RightDrawer } from '../components/RightDrawer'
import { quoteService } from '../services/quoteService'
import { productService } from '../services/productService'

const STATUSES = [
  'Draft',
  'Sent',
  'Viewed',
  'Negotiating',
  'Approved',
  'Rejected',
  'Expired',
  'Converted to Order',
]

function statusVariant(status) {
  if (status === 'Approved' || status === 'Converted to Order') return 'success'
  if (status === 'Rejected' || status === 'Expired') return 'danger'
  if (status === 'Negotiating' || status === 'Viewed' || status === 'Sent')
    return 'warning'
  return 'default'
}

function money(n, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n || 0)
  } catch {
    return `${currency} ${(n || 0).toFixed(0)}`
  }
}

function computeQuoteValue(quotes) {
  return (quotes || []).reduce((acc, q) => acc + (q.totals?.total || 0), 0)
}

function sumItems(q) {
  return (q.items || []).reduce((acc, it) => acc + (it.qty || 0), 0)
}

function QuoteSummaryCards({ quotes }) {
  const total = quotes.length
  const byStatus = (s) => quotes.filter((q) => q.status === s).length
  const value = computeQuoteValue(quotes)

  const cards = [
    { label: 'Total Quotes', value: total },
    { label: 'Draft Quotes', value: byStatus('Draft') },
    { label: 'Sent Quotes', value: byStatus('Sent') },
    { label: 'Approved Quotes', value: byStatus('Approved') },
    { label: 'Expired Quotes', value: byStatus('Expired') },
    { label: 'Quote Value', value: money(value, 'USD') },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <div className="text-xs text-muted">{c.label}</div>
            <div className="mt-2 text-lg font-semibold tracking-[-0.03em]">
              {c.value}
            </div>
            <div className="mt-1 text-xs text-muted">Last 30 days (mock)</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function QuoteDetail({ quote }) {
  if (!quote) return null
  const totals = quote.totals
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Buyer info</CardTitle>
          <CardDescription>Primary contact and location.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
            <div className="text-xs text-muted">Company</div>
            <div className="mt-1 text-sm font-semibold">{quote.buyer.company}</div>
            <div className="mt-3 text-xs text-muted">Contact</div>
            <div className="mt-1 text-sm">{quote.buyer.name}</div>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
            <div className="text-xs text-muted">Email</div>
            <div className="mt-1 text-sm font-medium">{quote.buyer.email}</div>
            <div className="mt-3 text-xs text-muted">Phone</div>
            <div className="mt-1 text-sm">{quote.buyer.phone || '—'}</div>
            <div className="mt-3 text-xs text-muted">Country</div>
            <div className="mt-1 text-sm">{quote.buyer.country || '—'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quote summary</CardTitle>
          <CardDescription>Source, dates, owner, and status.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Source</span>
              <span className="font-medium">{quote.source}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted">Assigned</span>
              <span className="font-medium">{quote.assignedTo}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted">Status</span>
              <Badge variant={statusVariant(quote.status)}>{quote.status}</Badge>
            </div>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Created</span>
              <span className="font-medium">
                {quote.createdAt ? format(new Date(quote.createdAt), 'MMM d, yyyy') : '—'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted">Expiry</span>
              <span className="font-medium">
                {format(new Date(quote.expiryDate), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted">Updated</span>
              <span className="font-medium">
                {format(new Date(quote.updatedAt), 'MMM d, p')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>{quote.items.length} line items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-[rgb(var(--border))]">
                  <th className="py-2 text-left font-medium">SKU</th>
                  <th className="py-2 text-left font-medium">Product</th>
                  <th className="py-2 text-right font-medium">Qty</th>
                  <th className="py-2 text-right font-medium">Unit</th>
                  <th className="py-2 text-right font-medium">Discount</th>
                  <th className="py-2 text-right font-medium">Line total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((it) => {
                  const lineSub = it.qty * it.unitPrice
                  const lineDisc = lineSub * ((it.discountPct || 0) / 100)
                  const lineTotal = lineSub - lineDisc
                  return (
                    <tr
                      key={it.sku}
                      className="border-b border-[rgb(var(--border))]"
                    >
                      <td className="py-3 pr-4 font-mono text-xs">{it.sku}</td>
                      <td className="py-3 pr-4">{it.name}</td>
                      <td className="py-3 pr-4 text-right">{it.qty}</td>
                      <td className="py-3 pr-4 text-right">
                        {money(it.unitPrice, quote.currency)}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {it.discountPct || 0}%
                      </td>
                      <td className="py-3 text-right">
                        {money(lineTotal, quote.currency)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
              <div className="text-xs text-muted">Internal notes</div>
              <div className="mt-1 text-sm">
                {quote.internalNotes || 'No notes yet.'}
              </div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
              <div className="text-xs text-muted">Pricing breakdown</div>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-medium">
                    {money(totals.subtotal, quote.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Discount</span>
                  <span className="font-medium">
                    -{money(totals.discount, quote.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Tax</span>
                  <span className="font-medium">
                    {money(totals.tax, quote.currency)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-[rgb(var(--border))] pt-2">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-sm font-semibold">
                    {money(totals.total, quote.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
            <div className="text-xs text-muted">Approval history</div>
            <div className="mt-2 space-y-2">
              {(quote.approvalHistory || [])
                .slice()
                .reverse()
                .map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium">{h.action}</div>
                      <div className="text-xs text-muted">by {h.by}</div>
                    </div>
                    <div className="text-xs text-muted whitespace-nowrap">
                      {format(new Date(h.at), 'MMM d, p')}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MoreActions({ onDuplicate, onDownloadPdf, onConvert, onArchive }) {
  return (
    <details className="relative">
      <summary className="list-none">
        <Button variant="secondary" size="sm">
          More
        </Button>
      </summary>
      <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-soft overflow-hidden">
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-[rgb(var(--bg-muted))]"
          onClick={(e) => {
            e.preventDefault()
            onDuplicate?.()
          }}
        >
          Duplicate
        </button>
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-[rgb(var(--bg-muted))]"
          onClick={(e) => {
            e.preventDefault()
            onDownloadPdf?.()
          }}
        >
          Download PDF
        </button>
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-[rgb(var(--bg-muted))]"
          onClick={(e) => {
            e.preventDefault()
            onConvert?.()
          }}
        >
          Convert to Order
        </button>
        <div className="h-px bg-[rgb(var(--border))]" />
        <button
          className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-[rgb(var(--bg-muted))]"
          onClick={(e) => {
            e.preventDefault()
            onArchive?.()
          }}
        >
          Archive
        </button>
      </div>
    </details>
  )
}

// CreateQuoteFlow removed: replaced by /quotes/new workspace

export function QuotesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [detailId, setDetailId] = useState(null)

  const quotesQ = useQuery({ queryKey: ['quotes'], queryFn: quoteService.listQuotes })
  const detailQ = useQuery({
    queryKey: ['quotes', detailId],
    enabled: !!detailId,
    queryFn: () => quoteService.getQuote(detailId),
  })

  const actM = useMutation({
    mutationFn: async ({ type, id }) => {
      if (type === 'duplicate') return await quoteService.duplicateQuote(id)
      if (type === 'send') return await quoteService.sendQuote(id)
      if (type === 'approve') return await quoteService.markApproved(id)
      if (type === 'convert') return await quoteService.convertToOrder(id)
      if (type === 'archive') return await quoteService.archiveQuote(id)
      return true
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] })
      if (detailId) qc.invalidateQueries({ queryKey: ['quotes', detailId] })
    },
  })

  const quotes = useMemo(() => {
    const list = (quotesQ.data || []).filter((q) => !q.archived)
    const q = query.trim().toLowerCase()
    return list.filter((row) => {
      const matchesQuery =
        !q ||
        row.id.toLowerCase().includes(q) ||
        row.buyer.company.toLowerCase().includes(q) ||
        row.buyer.name.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'All' || row.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [quotesQ.data, query, statusFilter])

  useEffect(() => {
    const openId = location.state?.openQuoteId
    if (openId) {
      setDetailId(openId)
      // clear state so refresh doesn’t reopen
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        subtitle="Create and manage pricing proposals for buyers and wholesale partners"
        actions={
          <>
            <Button onClick={() => navigate('/quotes/new')}>Create Quote</Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.success('Export started', {
                  description:
                    'CSV export is a placeholder in this frontend-only build.',
                })
              }
            >
              Export
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.message('Filters', {
                  description:
                    'Use search + status dropdown. Advanced filters coming in V2.',
                })
              }
            >
              Filters
            </Button>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Quote ID, buyer, company…"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]"
          >
            <option value="All">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </PageHeader>

      {quotesQ.isLoading ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[86px]" />
            ))}
          </div>
          <Skeleton className="h-[420px]" />
        </div>
      ) : quotesQ.isError ? (
        <ErrorState onRetry={() => quotesQ.refetch()} />
      ) : quotes.length === 0 ? (
        <EmptyState
          title="No quotes match your filters"
          description="Create a new quote or clear filters to see seeded data."
          primaryAction={{ label: 'Create Quote', onClick: () => navigate('/quotes/new') }}
          secondaryAction={{
            label: 'Clear filters',
            onClick: () => {
              setQuery('')
              setStatusFilter('All')
            },
          }}
        />
      ) : (
        <>
          <QuoteSummaryCards quotes={quotes} />

          <Card>
            <CardHeader>
              <CardTitle>Quote management</CardTitle>
              <CardDescription>
                Click a row to open details. Actions persist to localStorage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted">
                    <tr className="border-b border-[rgb(var(--border))]">
                      <th className="py-2 text-left font-medium">Quote ID</th>
                      <th className="py-2 text-left font-medium">Buyer / Company</th>
                      <th className="py-2 text-left font-medium">Source</th>
                      <th className="py-2 text-right font-medium">Items</th>
                      <th className="py-2 text-right font-medium">Total Value</th>
                      <th className="py-2 text-left font-medium">Status</th>
                      <th className="py-2 text-left font-medium">Expiry Date</th>
                      <th className="py-2 text-left font-medium">Assigned To</th>
                      <th className="py-2 text-left font-medium">Updated At</th>
                      <th className="py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((q) => (
                      <tr
                        key={q.id}
                        className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-muted))] cursor-pointer"
                        onClick={() => setDetailId(q.id)}
                      >
                        <td className="py-3 pr-4 font-mono text-xs">{q.id}</td>
                        <td className="py-3 pr-4">
                          <div className="font-medium">{q.buyer.company}</div>
                          <div className="text-xs text-muted">{q.buyer.name}</div>
                        </td>
                        <td className="py-3 pr-4">{q.source}</td>
                        <td className="py-3 pr-4 text-right">{sumItems(q)}</td>
                        <td className="py-3 pr-4 text-right">
                          {money(q.totals?.total, q.currency)}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={statusVariant(q.status)}>{q.status}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted">
                          {format(new Date(q.expiryDate), 'MMM d, yyyy')}
                        </td>
                        <td className="py-3 pr-4">{q.assignedTo}</td>
                        <td className="py-3 pr-4 text-xs text-muted">
                          {format(new Date(q.updatedAt), 'MMM d, p')}
                        </td>
                        <td
                          className="py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setDetailId(q.id)}
                            >
                              View Quote
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                actM.mutate({ type: 'duplicate', id: q.id })
                                toast.success('Duplicated', { description: q.id })
                              }}
                            >
                              Duplicate
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                actM.mutate({ type: 'archive', id: q.id })
                                toast.message('Archived', { description: q.id })
                              }}
                            >
                              Archive
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <RightDrawer
        open={!!detailId}
        onClose={() => setDetailId(null)}
        ariaLabel="Quote details"
        title={
          detailQ.data ? (
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs">{detailQ.data.id}</span>
                <span className="text-xs text-muted">•</span>
                <span className="text-sm font-semibold truncate">
                  {detailQ.data.buyer.name}
                </span>
                <Badge variant={statusVariant(detailQ.data.status)}>
                  {detailQ.data.status}
                </Badge>
              </div>
              <div className="mt-1 text-xs text-muted">
                Expires {format(new Date(detailQ.data.expiryDate), 'MMM d, yyyy')}
              </div>
            </div>
          ) : (
            'Quote details'
          )
        }
        subtitle={null}
        widthClassName="w-[min(42.5vw,900px)]"
        backdropClassName="bg-black/5"
        className="bg-white shadow-lg"
        headerActions={
          detailQ.data ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  toast.message('Edit (mock)', {
                    description: 'Full-page edit route is a future enhancement.',
                  })
                }
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  actM.mutate({ type: 'send', id: detailId })
                  toast.success('Sent', { description: detailId })
                }}
              >
                {detailQ.data.status === 'Sent' ? 'Resend' : 'Send'}
              </Button>
              <MoreActions
                onDuplicate={() => {
                  actM.mutate({ type: 'duplicate', id: detailId })
                  toast.success('Duplicated', { description: detailId })
                }}
                onDownloadPdf={() =>
                  toast.message('PDF download', {
                    description: 'Placeholder in frontend-only build.',
                  })
                }
                onConvert={() => {
                  actM.mutate({ type: 'convert', id: detailId })
                  toast.success('Converted', {
                    description: 'Order created (mock).',
                  })
                }}
                onArchive={() => {
                  actM.mutate({ type: 'archive', id: detailId })
                  toast.message('Archived', { description: detailId })
                  setDetailId(null)
                }}
              />
            </>
          ) : null
        }
        footer={
          detailQ.data ? (
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  actM.mutate({ type: 'approve', id: detailId })
                  toast.success('Approved', { description: detailId })
                }}
              >
                Mark Approved
              </Button>
            </div>
          ) : null
        }
      >
        {detailQ.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-64" />
          </div>
        ) : detailQ.isError ? (
          <ErrorState onRetry={() => detailQ.refetch()} />
        ) : (
          <QuoteDetail
            quote={detailQ.data}
          />
        )}
      </RightDrawer>
    </div>
  )
}
