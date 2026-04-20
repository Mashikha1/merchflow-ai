import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../lib/cn'
import { quoteService } from '../../services/quoteService'
import { productService } from '../../services/productService'
import { readJson, writeJson } from '../../utils/storage'

const DRAFT_KEY = 'merchflow_quote_builder_draft_v1'

const STEPS = [
  { id: 'buyer', label: 'Buyer' },
  { id: 'products', label: 'Products' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'settings', label: 'Settings' },
  { id: 'preview', label: 'Preview & Send' },
]

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

function computeTotals(items) {
  const subtotal = (items || []).reduce((a, it) => a + it.qty * it.unitPrice, 0)
  const discount = (items || []).reduce(
    (a, it) => a + it.qty * it.unitPrice * ((it.discountPct || 0) / 100),
    0,
  )
  const total = Math.max(0, subtotal - discount)
  return { subtotal, discount, total }
}

export function QuoteCreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()

  const [activeStep, setActiveStep] = useState('buyer')
  const [buyerQuery, setBuyerQuery] = useState('')
  const [showNewBuyer, setShowNewBuyer] = useState(false)

  const [draft, setDraft] = useState(() => {
    return (
      readJson(DRAFT_KEY, null) || {
        buyer: null,
        source: 'Sales',
        assignedTo: 'Sarah M.',
        currency: 'USD',
        expiryDays: 14,
        discountPct: 5,
        selectedQtyByProductId: {},
      }
    )
  })

  useEffect(() => {
    // lightweight autosave so it feels “workspace-like”
    writeJson(DRAFT_KEY, draft)
  }, [draft])

  useEffect(() => {
    const prefillBuyer = location.state?.prefillBuyer
    if (prefillBuyer?.company && prefillBuyer?.email) {
      setDraft((d) => ({
        ...d,
        buyer: {
          id: prefillBuyer.id || d.buyer?.id,
          name: prefillBuyer.name || prefillBuyer.contactName || d.buyer?.name,
          company: prefillBuyer.company,
          email: prefillBuyer.email,
          country: prefillBuyer.country || d.buyer?.country || 'US',
          phone: prefillBuyer.phone || d.buyer?.phone,
        },
      }))
      setActiveStep('products')
      navigate('/quotes/new', { replace: true, state: {} })
      toast.message('Buyer prefilled', { description: prefillBuyer.company })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const buyersQ = useQuery({
    queryKey: ['quotes', 'buyers'],
    queryFn: quoteService.listBuyers,
  })
  const productsQ = useQuery({
    queryKey: ['products'],
    queryFn: productService.getProducts,
  })

  const buyers = buyersQ.data || []
  const products = productsQ.data || []

  const recentBuyers = useMemo(() => buyers.slice(0, 4), [buyers])

  const filteredBuyers = useMemo(() => {
    const q = buyerQuery.trim().toLowerCase()
    if (!q) return buyers
    return buyers.filter((b) => {
      return (
        b.company.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q)
      )
    })
  }, [buyers, buyerQuery])

  const items = useMemo(() => {
    const entries = Object.entries(draft.selectedQtyByProductId || {}).filter(
      ([, qty]) => Number(qty) > 0,
    )
    return entries
      .map(([productId, qty]) => {
        const p = products.find((x) => x.id === productId)
        if (!p) return null
        return {
          productId,
          sku: p.sku,
          name: p.name,
          qty: Number(qty),
          unitPrice: Math.round(p.price * 0.55 * 10) / 10,
          discountPct: draft.discountPct || 0,
        }
      })
      .filter(Boolean)
  }, [draft.selectedQtyByProductId, draft.discountPct, products])

  const totals = useMemo(() => computeTotals(items), [items])
  const totalUnits = useMemo(
    () => items.reduce((a, it) => a + (it.qty || 0), 0),
    [items],
  )

  const expiryDate = useMemo(() => {
    const ms = Date.now() + (draft.expiryDays || 14) * 24 * 60 * 60 * 1000
    return new Date(ms)
  }, [draft.expiryDays])

  const createM = useMutation({
    mutationFn: quoteService.createQuote,
    onSuccess: (q) => {
      toast.success('Quote created', { description: q.id })
      qc.invalidateQueries({ queryKey: ['quotes'] })
      navigate('/quotes', { state: { openQuoteId: q.id } })
    },
    onError: () => toast.error('Could not create quote'),
  })

  const sendM = useMutation({
    mutationFn: async () => {
      const q = await quoteService.createQuote({
        buyer: draft.buyer,
        source: draft.source,
        items,
        currency: draft.currency,
        expiryDate: expiryDate.toISOString(),
        assignedTo: draft.assignedTo,
      })
      await quoteService.sendQuote(q.id)
      return q.id
    },
    onSuccess: (id) => {
      toast.success('Quote sent', { description: id })
      qc.invalidateQueries({ queryKey: ['quotes'] })
      navigate('/quotes', { state: { openQuoteId: id } })
    },
    onError: () => toast.error('Could not send quote'),
  })

  const canPreview = !!draft.buyer && items.length > 0

  return (
    <div className="space-y-4">
      {/* Top workspace header */}
      <div className="surface shadow-card border border-[rgb(var(--border))] rounded-[var(--radius)] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-xs text-muted">Quotes</div>
            <div className="text-lg font-semibold tracking-[-0.03em]">
              Create Quote
            </div>
            <div className="mt-1 text-sm text-muted">
              Professional B2B quote builder—clean, spacious, step-driven.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate('/quotes')}>
              Back to Quotes
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                writeJson(DRAFT_KEY, draft)
                toast.success('Draft saved', { description: 'Saved locally.' })
              }}
            >
              Save Draft
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (!canPreview) {
                  toast.message('Not ready', {
                    description: 'Select a buyer and at least 1 product.',
                  })
                  return
                }
                setActiveStep('preview')
              }}
            >
              Preview
            </Button>
            <Button
              onClick={() => {
                if (!draft.buyer || items.length === 0) {
                  toast.message('Missing info', {
                    description: 'Select a buyer and add products first.',
                  })
                  return
                }
                createM.mutate({
                  buyer: draft.buyer,
                  source: draft.source,
                  items,
                  currency: draft.currency,
                  expiryDate: expiryDate.toISOString(),
                  assignedTo: draft.assignedTo,
                })
              }}
              disabled={!draft.buyer || items.length === 0 || createM.isPending}
            >
              {createM.isPending ? 'Creating…' : 'Create Quote'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (!canPreview) {
                  toast.message('Not ready', {
                    description: 'Select a buyer and at least 1 product.',
                  })
                  return
                }
                sendM.mutate()
              }}
              disabled={!canPreview || sendM.isPending}
            >
              {sendM.isPending ? 'Sending…' : 'Send Quote'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr_360px]">
        {/* Left step nav */}
        <div className="surface shadow-card border border-[rgb(var(--border))] rounded-[var(--radius)] p-3 h-fit lg:sticky lg:top-[84px]">
          <div className="px-2 py-2 text-xs text-muted">Steps</div>
          <div className="space-y-1">
            {STEPS.map((s) => {
              const active = activeStep === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(s.id)}
                  className={cn(
                    'w-full rounded-2xl border px-3 py-2.5 text-left transition',
                    active
                      ? 'border-[rgba(var(--accent),0.25)] bg-[rgba(var(--accent),0.10)]'
                      : 'border-transparent hover:bg-[rgb(var(--bg-muted))]',
                  )}
                >
                  <div className="text-xs text-muted">
                    {STEPS.findIndex((x) => x.id === s.id) + 1}
                  </div>
                  <div className="text-sm font-semibold">{s.label}</div>
                </button>
              )
            })}
          </div>

          <div className="mt-3 rounded-2xl border border-dashed border-[rgb(var(--border))] p-3 text-xs text-muted">
            Tip: keep the left nav stable; focus changes happen in the main workspace.
          </div>
        </div>

        {/* Main step content */}
        <div className="space-y-4">
          {activeStep === 'buyer' ? (
            <Card>
              <CardHeader>
                <CardTitle>Buyer</CardTitle>
                <CardDescription>
                  Search buyers, pick recent, or create a new buyer record .
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <Input
                    value={buyerQuery}
                    onChange={(e) => setBuyerQuery(e.target.value)}
                    placeholder="Search by company, buyer name, email…"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => setShowNewBuyer((v) => !v)}
                  >
                    {showNewBuyer ? 'Close' : 'Create new buyer'}
                  </Button>
                </div>

                {showNewBuyer ? (
                  <div className="grid gap-3 rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4 md:grid-cols-2">
                    <div className="md:col-span-2 text-sm font-semibold">
                      New buyer 
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted">Company</label>
                      <Input
                        className="mt-1"
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            buyer: { ...(d.buyer || {}), company: e.target.value },
                          }))
                        }
                        placeholder="e.g. Nimbus Wholesale"
                        value={draft.buyer?.company || ''}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted">Buyer name</label>
                      <Input
                        className="mt-1"
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            buyer: { ...(d.buyer || {}), name: e.target.value },
                          }))
                        }
                        placeholder="e.g. Jordan Lee"
                        value={draft.buyer?.name || ''}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted">Email</label>
                      <Input
                        className="mt-1"
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            buyer: { ...(d.buyer || {}), email: e.target.value },
                          }))
                        }
                        placeholder="buyer@company.com"
                        value={draft.buyer?.email || ''}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted">Country</label>
                      <Input
                        className="mt-1"
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            buyer: { ...(d.buyer || {}), country: e.target.value },
                          }))
                        }
                        placeholder="US"
                        value={draft.buyer?.country || ''}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Button
                        onClick={() => {
                          if (!draft.buyer?.company || !draft.buyer?.name) {
                            toast.message('Add required fields', {
                              description: 'Company and buyer name are required.',
                            })
                            return
                          }
                          toast.success('Buyer set', {
                            description: 'This buyer is stored in the draft .',
                          })
                          setShowNewBuyer(false)
                        }}
                      >
                        Use this buyer
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                    <div className="text-xs text-muted">Recent buyers</div>
                    <div className="mt-3 space-y-2">
                      {buyersQ.isLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-12" />
                          <Skeleton className="h-12" />
                        </div>
                      ) : (
                        recentBuyers.map((b) => (
                          <button
                            key={b.id}
                            className={cn(
                              'w-full rounded-2xl border px-3 py-2 text-left transition',
                              draft.buyer?.email === b.email
                                ? 'border-[rgba(var(--accent),0.25)] bg-[rgba(var(--accent),0.10)]'
                                : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-muted))]',
                            )}
                            onClick={() => {
                              setDraft((d) => ({ ...d, buyer: b }))
                              toast.success('Buyer selected', { description: b.company })
                            }}
                          >
                            <div className="text-sm font-semibold">{b.company}</div>
                            <div className="text-xs text-muted">
                              {b.name} • {b.email}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                    <div className="text-xs text-muted">Search results</div>
                    <div className="mt-3 max-h-[320px] overflow-auto space-y-2">
                      {buyersQ.isLoading ? (
                        <Skeleton className="h-12" />
                      ) : (
                        filteredBuyers.slice(0, 12).map((b) => (
                          <button
                            key={b.id}
                            className={cn(
                              'w-full rounded-2xl border px-3 py-2 text-left transition',
                              draft.buyer?.email === b.email
                                ? 'border-[rgba(var(--accent),0.25)] bg-[rgba(var(--accent),0.10)]'
                                : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-muted))]',
                            )}
                            onClick={() => {
                              setDraft((d) => ({ ...d, buyer: b }))
                              toast.success('Buyer selected', { description: b.company })
                            }}
                          >
                            <div className="text-sm font-semibold">{b.company}</div>
                            <div className="text-xs text-muted">
                              {b.name} • {b.country}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {draft.buyer ? (
                  <div className="rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-muted">Selected buyer</div>
                        <div className="mt-1 text-sm font-semibold">
                          {draft.buyer.company}
                        </div>
                        <div className="text-sm text-muted">
                          {draft.buyer.name} • {draft.buyer.email}
                        </div>
                      </div>
                      <Badge variant="success">Selected</Badge>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {activeStep === 'products' ? (
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>
                  Select products and quantities for this quote.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {productsQ.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">
                            {p.name}
                          </div>
                          <div className="text-xs text-muted">
                            {p.sku} • {p.category} • {money(p.price, 'USD')}
                          </div>
                        </div>
                        <div className="w-28">
                          <Input
                            type="number"
                            min={0}
                            value={draft.selectedQtyByProductId?.[p.id] || 0}
                            onChange={(e) => {
                              const v = Math.max(0, Number(e.target.value || 0))
                              setDraft((d) => ({
                                ...d,
                                selectedQtyByProductId: {
                                  ...(d.selectedQtyByProductId || {}),
                                  [p.id]: v,
                                },
                              }))
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] p-4 text-sm text-muted">
                  Selected: {items.length} products • {totalUnits} total units
                </div>
              </CardContent>
            </Card>
          ) : null}

          {activeStep === 'pricing' ? (
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>
                  Set discount and review quote-level totals.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted">
                    Quote discount %
                  </label>
                  <Input
                    className="mt-1"
                    type="number"
                    min={0}
                    max={40}
                    value={draft.discountPct}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        discountPct: Number(e.target.value || 0),
                      }))
                    }
                  />
                  <div className="mt-2 text-xs text-muted">
                    Applies to selected items .
                  </div>
                </div>
                <div className="rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
                  <div className="text-xs text-muted">Totals</div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Subtotal</span>
                      <span className="font-medium">
                        {money(totals.subtotal, draft.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Discount</span>
                      <span className="font-medium">
                        -{money(totals.discount, draft.currency)}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-[rgb(var(--border))] pt-2">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold">
                        {money(totals.total, draft.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {activeStep === 'settings' ? (
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Source, owner, currency, and expiry.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted">Currency</label>
                  <select
                    value={draft.currency}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, currency: e.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Expiry (days)</label>
                  <Input
                    className="mt-1"
                    type="number"
                    min={1}
                    max={60}
                    value={draft.expiryDays}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        expiryDays: Number(e.target.value || 14),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Source</label>
                  <select
                    value={draft.source}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, source: e.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]"
                  >
                    <option>Sales</option>
                    <option>Showroom</option>
                    <option>Inbound</option>
                    <option>API</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Assigned to</label>
                  <select
                    value={draft.assignedTo}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, assignedTo: e.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]"
                  >
                    <option>Sarah M.</option>
                    <option>Alex D.</option>
                    <option>Unassigned</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {activeStep === 'preview' ? (
            <Card>
              <CardHeader>
                <CardTitle>Preview & Send</CardTitle>
                <CardDescription>
                  Review the proposal. (PDF rendering + email send are supported.)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!draft.buyer ? (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                    Select a buyer to continue.
                  </div>
                ) : null}
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                    Add at least one product.
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
                    <div className="text-xs text-muted">Buyer</div>
                    <div className="mt-1 text-sm font-semibold">
                      {draft.buyer?.company || '—'}
                    </div>
                    <div className="text-sm text-muted">
                      {draft.buyer?.name || '—'} • {draft.buyer?.email || '—'}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
                    <div className="text-xs text-muted">Quote settings</div>
                    <div className="mt-1 text-sm">
                      <span className="text-muted">Expiry:</span>{' '}
                      <span className="font-medium">
                        {format(expiryDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="mt-1 text-sm">
                      <span className="text-muted">Owner:</span>{' '}
                      <span className="font-medium">{draft.assignedTo}</span>
                    </div>
                    <div className="mt-1 text-sm">
                      <span className="text-muted">Source:</span>{' '}
                      <span className="font-medium">{draft.source}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Line items</div>
                    <Badge variant="default">{items.length}</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {items.map((it) => (
                      <div
                        key={it.sku}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{it.name}</div>
                          <div className="text-xs text-muted">{it.sku}</div>
                        </div>
                        <div className="text-xs text-muted whitespace-nowrap">
                          {it.qty} × {money(it.unitPrice, draft.currency)} ({it.discountPct}
                          %)
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3 text-sm">
                      <div className="text-xs text-muted">Subtotal</div>
                      <div className="mt-1 font-semibold">
                        {money(totals.subtotal, draft.currency)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3 text-sm">
                      <div className="text-xs text-muted">Discount</div>
                      <div className="mt-1 font-semibold">
                        -{money(totals.discount, draft.currency)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3 text-sm">
                      <div className="text-xs text-muted">Total</div>
                      <div className="mt-1 font-semibold">
                        {money(totals.total, draft.currency)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 text-sm text-muted">
                  Preview-only: PDF generation + email delivery will map to future
                  Express endpoints.
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Right sticky summary */}
        <div className="space-y-4 lg:sticky lg:top-[84px] h-fit">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Always-visible quote totals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
                <div className="text-xs text-muted">Buyer</div>
                <div className="mt-1 text-sm font-semibold">
                  {draft.buyer?.company || 'Not selected'}
                </div>
                <div className="text-xs text-muted">
                  {draft.buyer ? `${draft.buyer.name}` : 'Pick a buyer to continue.'}
                </div>
              </div>

              <div className="grid gap-2 grid-cols-2">
                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
                  <div className="text-xs text-muted">Products</div>
                  <div className="mt-1 text-sm font-semibold">{items.length}</div>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
                  <div className="text-xs text-muted">Quantity</div>
                  <div className="mt-1 text-sm font-semibold">{totalUnits}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-medium">
                    {money(totals.subtotal, draft.currency)}
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted">Discount</span>
                  <span className="font-medium">
                    -{money(totals.discount, draft.currency)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-[rgb(var(--border))] pt-2">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">
                    {money(totals.total, draft.currency)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
                <div className="text-xs text-muted">Expiry</div>
                <div className="mt-1 text-sm font-semibold">
                  {format(expiryDate, 'MMM d, yyyy')}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    writeJson(DRAFT_KEY, draft)
                    toast.success('Draft saved')
                  }}
                >
                  Save Draft
                </Button>
                <Button
                  onClick={() => {
                    if (!canPreview) {
                      toast.message('Not ready', {
                        description: 'Select a buyer and at least 1 product.',
                      })
                      return
                    }
                    setActiveStep('preview')
                  }}
                >
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-sm text-muted">
              This page is frontend-only but structured to map cleanly to future
              endpoints like <span className="font-mono">POST /api/quotes</span>{' '}
              and <span className="font-mono">POST /api/quotes/:id/send</span>.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

