import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { RightDrawer } from '../components/RightDrawer'
import { customerService } from '../services/customerService'
import { quoteService } from '../services/quoteService'

const SEGMENTS = [
  'Wholesale Buyer',
  'Retail Partner',
  'Distributor',
  'Boutique',
  'Internal Lead',
]

function statusVariant(status) {
  if (status === 'Active') return 'success'
  if (status === 'Inactive' || status === 'Archived') return 'danger'
  return 'warning' // Prospect, etc.
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

function CustomerSummary({ customers, quotes }) {
  const activeBuyers = customers.filter((c) => c.status === 'Active').length
  const now = Date.now()
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000
  const newThisMonth = customers.filter(
    (c) => new Date(c.createdAt).getTime() >= monthAgo,
  ).length

  const openQuotes = quotes.filter((q) =>
    ['Draft', 'Sent', 'Viewed', 'Negotiating'].includes(q.status),
  ).length

  const ordersPlaced = customers.reduce(
    (acc, c) => acc + (c.metrics?.ordersPlaced || 0),
    0,
  )
  const highValue = customers.filter(
    (c) => (c.metrics?.lifetimeValue || 0) >= 100000,
  ).length

  const cards = [
    { label: 'Total Customers', value: customers.length },
    { label: 'Active Buyers', value: activeBuyers },
    { label: 'New This Month', value: newThisMonth },
    { label: 'Open Quotes', value: openQuotes },
    { label: 'Orders Placed', value: ordersPlaced },
    { label: 'High-Value Accounts', value: highValue },
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
            <div className="mt-1 text-xs text-muted">Live demo data</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CustomerDetailDrawer({
  customer,
  quotes,
  onAddNote,
  onCreateQuote,
  onViewOrders,
}) {
  if (!customer) return null

  const quoteHistory = quotes.filter((q) => q.buyer?.email === customer.email)
  const showroomActivity = (customer.activity || []).filter((a) => a.type === 'showroom')
  const catalogActivity = (customer.activity || []).filter((a) => a.type === 'catalog')
  const orderActivity = (customer.activity || []).filter((a) => a.type === 'order')
  const lastActivity = customer.lastActivityAt
    ? formatDistanceToNow(new Date(customer.lastActivityAt), { addSuffix: true })
    : '—'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Contact Info</CardTitle>
          <CardDescription>Primary contact and region.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
            <div className="text-xs text-muted">Contact</div>
            <div className="mt-1 text-sm font-semibold">{customer.name}</div>
            <div className="mt-3 text-xs text-muted">Company</div>
            <div className="mt-1 text-sm font-medium">{customer.company}</div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
              <div className="text-xs text-muted">Email</div>
              <div className="mt-1 text-sm font-medium">{customer.email}</div>
              <div className="mt-3 text-xs text-muted">Phone</div>
              <div className="mt-1 text-sm">{customer.phone || '—'}</div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
              <div className="text-xs text-muted">Country / region</div>
              <div className="mt-1 text-sm font-medium">
                {customer.country}
                {customer.region ? ` • ${customer.region}` : ''}
              </div>
              <div className="mt-3 text-xs text-muted">Source</div>
              <div className="mt-1 text-sm">{customer.source}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
          <CardDescription>Segment, owner, and customer value.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Segment</span>
              <span className="font-medium">{customer.segment}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted">Assigned owner</span>
              <span className="font-medium">{customer.assignedOwner}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted">Last activity</span>
              <span className="font-medium">{lastActivity}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Lifetime value</span>
              <span className="font-semibold">
                {money(customer.metrics?.lifetimeValue || 0, 'USD')}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted">Open quotes</span>
              <span className="font-medium">{customer.metrics?.openQuotes || 0}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted">Orders placed</span>
              <span className="font-medium">{customer.metrics?.ordersPlaced || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>What they buy and how they buy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
              <div className="text-xs text-muted">Preferred order type</div>
              <div className="mt-1 text-sm font-medium">
                {customer.preferredOrderType || '—'}
              </div>
              <div className="mt-3 text-xs text-muted">MOQ expectations</div>
              <div className="mt-1 text-sm">{customer.moqExpectations || '—'}</div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
              <div className="text-xs text-muted">Preferred categories</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(customer.preferredCategories || []).length ? (
                  customer.preferredCategories.map((t) => (
                    <Badge key={t} variant="default">
                      {t}
                    </Badge>
                  ))
                ) : (
                  <div className="text-sm text-muted">—</div>
                )}
              </div>
              <div className="mt-3 text-xs text-muted">Preferred collections</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(customer.preferredCollections || []).length ? (
                  customer.preferredCollections.map((t) => (
                    <Badge key={t} variant="default">
                      {t}
                    </Badge>
                  ))
                ) : (
                  <div className="text-sm text-muted">—</div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onCreateQuote}>Create Quote</Button>
            <Button variant="secondary" onClick={onViewOrders}>
              View Orders
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Showroom/catalog visits, quotes, and orders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
              <div className="text-xs text-muted">Showroom activity</div>
              <div className="mt-2 space-y-2">
                {showroomActivity.length ? (
                  showroomActivity.slice(0, 4).map((a, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium">{a.label}</div>
                      <div className="text-xs text-muted">
                        {formatDistanceToNow(new Date(a.at), { addSuffix: true })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted">No showroom events yet.</div>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
              <div className="text-xs text-muted">Catalog activity</div>
              <div className="mt-2 space-y-2">
                {catalogActivity.length ? (
                  catalogActivity.slice(0, 4).map((a, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium">{a.label}</div>
                      <div className="text-xs text-muted">
                        {formatDistanceToNow(new Date(a.at), { addSuffix: true })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted">No catalog events yet.</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
              <div className="text-xs text-muted">Quote history</div>
              <div className="mt-2 space-y-2">
                {quoteHistory.length ? (
                  quoteHistory.slice(0, 5).map((q) => (
                    <div key={q.id} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <div className="font-mono text-xs">{q.id}</div>
                        <div className="text-xs text-muted">
                          {formatDistanceToNow(new Date(q.updatedAt), { addSuffix: true })}
                        </div>
                      </div>
                      <Badge variant={q.status === 'Approved' ? 'success' : 'default'}>
                        {q.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted">No quotes yet.</div>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
              <div className="text-xs text-muted">Order history</div>
              <div className="mt-2 space-y-2">
                {orderActivity.length ? (
                  orderActivity.slice(0, 4).map((a, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium">{a.label}</div>
                      <div className="text-xs text-muted">
                        {formatDistanceToNow(new Date(a.at), { addSuffix: true })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted">
                    No order events yet .
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes & Reminders</CardTitle>
          <CardDescription>Internal notes, reminders, and next action.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onAddNote}>
              Add Note
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.message('Reminder', {
                  description: 'Reminder creation is a placeholder in this build.',
                })
              }
            >
              Add Reminder
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
              <div className="text-xs text-muted">Internal notes</div>
              <div className="mt-3 space-y-2">
                {(customer.internalNotes || []).length ? (
                  customer.internalNotes.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">{n.by}</div>
                        <div className="text-xs text-muted">
                          {formatDistanceToNow(new Date(n.at), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted">{n.body}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted">No notes yet.</div>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
              <div className="text-xs text-muted">Reminders</div>
              <div className="mt-3 space-y-2">
                {(customer.reminders || []).length ? (
                  customer.reminders.slice(0, 4).map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3 text-sm"
                    >
                      <div className="font-medium">{r.body}</div>
                      <div className="mt-1 text-xs text-muted">
                        Due{' '}
                        {formatDistanceToNow(new Date(r.dueAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted">No reminders.</div>
                )}

                <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] p-3 text-sm text-muted">
                  Next action (V2): assign follow-up + link to quote/order.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function CustomersPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [detailId, setDetailId] = useState(null)
  const [addOpen, setAddOpen] = useState(false)

  const customersQ = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.listCustomers,
  })

  const quotesQ = useQuery({
    queryKey: ['quotes'],
    queryFn: quoteService.listQuotes,
  })

  const detailQ = useQuery({
    queryKey: ['customers', detailId],
    enabled: !!detailId,
    queryFn: () => customerService.getCustomer(detailId),
  })

  const addM = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: (c) => {
      toast.success('Customer added', { description: c.company })
      qc.invalidateQueries({ queryKey: ['customers'] })
      setAddOpen(false)
      setDetailId(c.id)
    },
    onError: () => toast.error('Could not add customer'),
  })

  const noteM = useMutation({
    mutationFn: customerService.addNote,
    onSuccess: () => {
      toast.success('Note added')
      qc.invalidateQueries({ queryKey: ['customers'] })
      if (detailId) qc.invalidateQueries({ queryKey: ['customers', detailId] })
    },
    onError: () => toast.error('Could not add note'),
  })

  const archiveM = useMutation({
    mutationFn: customerService.archiveCustomer,
    onSuccess: () => {
      toast.message('Archived')
      qc.invalidateQueries({ queryKey: ['customers'] })
      setDetailId(null)
    },
  })

  const rows = useMemo(() => {
    const list = (customersQ.data || []).filter((c) => !c.archived)
    const q = query.trim().toLowerCase()
    return list.filter((c) => {
      const matchesQuery =
        !q ||
        c.company.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      const matchesSegment = segmentFilter === 'All' || c.segment === segmentFilter
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter
      return matchesQuery && matchesSegment && matchesStatus
    })
  }, [customersQ.data, query, segmentFilter, statusFilter])

  const quotes = quotesQ.data || []
  const quoteCountsByEmail = useMemo(() => {
    const map = new Map()
    for (const q of quotes) {
      const email = q.buyer?.email
      if (!email) continue
      map.set(email, (map.get(email) || 0) + 1)
    }
    return map
  }, [quotes])

  const openQuotesByEmail = useMemo(() => {
    const openStatuses = new Set(['Draft', 'Sent', 'Viewed', 'Negotiating'])
    const map = new Map()
    for (const q of quotes) {
      const email = q.buyer?.email
      if (!email) continue
      if (!openStatuses.has(q.status)) continue
      map.set(email, (map.get(email) || 0) + 1)
    }
    return map
  }, [quotes])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Manage buyers, wholesale partners, and customer activity across showrooms, quotes, and orders"
        actions={
          <>
            <Button onClick={() => setAddOpen(true)}>Add Customer</Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.message('Import customers', {
                  description: 'CSV import wizard is a placeholder in this build.',
                })
              }
            >
              Import Customers
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.message('Filters', {
                  description: 'Use search + segment/status dropdowns.',
                })
              }
            >
              Filters
            </Button>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, companies, emails…"
          />
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]"
          >
            <option value="All">All segments</option>
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]"
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Prospect">Prospect</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </PageHeader>

      {customersQ.isLoading || quotesQ.isLoading ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[86px]" />
            ))}
          </div>
          <Skeleton className="h-[420px]" />
        </div>
      ) : customersQ.isError ? (
        <ErrorState onRetry={() => customersQ.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No customers match your filters"
          description="Add a customer or clear filters to see seeded CRM data."
          primaryAction={{ label: 'Add Customer', onClick: () => setAddOpen(true) }}
          secondaryAction={{
            label: 'Clear filters',
            onClick: () => {
              setQuery('')
              setSegmentFilter('All')
              setStatusFilter('All')
            },
          }}
        />
      ) : (
        <>
          <CustomerSummary customers={rows} quotes={quotes} />

          <Card>
            <CardHeader>
              <CardTitle>Customer management</CardTitle>
              <CardDescription>
                Click a row to open a customer profile drawer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted">
                    <tr className="border-b border-[rgb(var(--border))]">
                      <th className="py-2 text-left font-medium">Customer Name</th>
                      <th className="py-2 text-left font-medium">Company</th>
                      <th className="py-2 text-left font-medium">Segment</th>
                      <th className="py-2 text-left font-medium">Country</th>
                      <th className="py-2 text-left font-medium">Source</th>
                      <th className="py-2 text-left font-medium">Last Activity</th>
                      <th className="py-2 text-right font-medium">Quotes</th>
                      <th className="py-2 text-right font-medium">Orders</th>
                      <th className="py-2 text-left font-medium">Status</th>
                      <th className="py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => {
                      const quotesCount = quoteCountsByEmail.get(c.email) || 0
                      const openCount = openQuotesByEmail.get(c.email) || 0
                      const last = c.lastActivityAt
                        ? formatDistanceToNow(new Date(c.lastActivityAt), {
                            addSuffix: true,
                          })
                        : '—'
                      return (
                        <tr
                          key={c.id}
                          className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-muted))] cursor-pointer"
                          onClick={() => setDetailId(c.id)}
                        >
                          <td className="py-3 pr-4">
                            <div className="font-medium">{c.name}</div>
                            <div className="text-xs text-muted">{c.email}</div>
                          </td>
                          <td className="py-3 pr-4 font-medium">{c.company}</td>
                          <td className="py-3 pr-4">{c.segment}</td>
                          <td className="py-3 pr-4">{c.country}</td>
                          <td className="py-3 pr-4">{c.source}</td>
                          <td className="py-3 pr-4 text-xs text-muted">{last}</td>
                          <td className="py-3 pr-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <span>{quotesCount}</span>
                              {openCount ? (
                                <Badge variant="warning">{openCount} open</Badge>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {c.metrics?.ordersPlaced || 0}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                          </td>
                          <td
                            className="py-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex flex-wrap justify-end gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setDetailId(c.id)}
                              >
                                View Profile
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  navigate('/quotes/new', {
                                    state: {
                                      prefillBuyer: {
                                        id: c.id,
                                        name: c.name,
                                        company: c.company,
                                        email: c.email,
                                        country: c.country,
                                        phone: c.phone,
                                      },
                                    },
                                  })
                                }}
                              >
                                Create Quote
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  archiveM.mutate(c.id)
                                }}
                              >
                                Archive
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
        title={
          detailQ.data ? (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate">{detailQ.data.company}</div>
                <div className="mt-1 text-xs text-muted truncate">
                  {detailQ.data.name} • {detailQ.data.email}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Badge variant="default">{detailQ.data.segment}</Badge>
                <Badge variant={statusVariant(detailQ.data.status)}>
                  {detailQ.data.status}
                </Badge>
              </div>
            </div>
          ) : (
            'Customer profile'
          )
        }
        subtitle={
          detailQ.data
            ? `Owner ${detailQ.data.assignedOwner} • Last activity ${
                detailQ.data.lastActivityAt
                  ? formatDistanceToNow(new Date(detailQ.data.lastActivityAt), {
                      addSuffix: true,
                    })
                  : '—'
              }`
            : 'CRM inspection drawer'
        }
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
                  toast.message('Edit ', {
                    description:
                      'Profile editing route is a future enhancement.',
                  })
                }
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const c = detailQ.data
                  navigate('/quotes/new', {
                    state: {
                      prefillBuyer: {
                        id: c.id,
                        name: c.name,
                        company: c.company,
                        email: c.email,
                        country: c.country,
                        phone: c.phone,
                      },
                    },
                  })
                }}
              >
                Create Quote
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  toast.message('View Orders', {
                    description:
                      'Orders page integration is a placeholder in this build.',
                  })
                }
              >
                View Orders
              </Button>
            </>
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
          <CustomerDetailDrawer
            customer={detailQ.data}
            quotes={quotes}
            onCreateQuote={() => {
              const c = detailQ.data
              navigate('/quotes/new', {
                state: {
                  prefillBuyer: {
                    id: c.id,
                    name: c.name,
                    company: c.company,
                    email: c.email,
                    country: c.country,
                    phone: c.phone,
                  },
                },
              })
            }}
            onAddNote={() => {
              const body = prompt('Add an internal note :', 'Follow up next week.')
              if (!body) return
              noteM.mutate({ id: detailId, body })
            }}
            onViewOrders={() =>
              toast.message('View Orders', {
                description:
                  'Orders page integration is a placeholder in this build.',
              })
            }
          />
        )}
      </RightDrawer>

      <RightDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add customer"
        subtitle="Create a buyer or wholesale partner (saved to localStorage)."
        widthClassName="w-[min(42.5vw,900px)]"
        backdropClassName="bg-black/5"
        className="bg-white shadow-lg"
      >
        <AddCustomerForm
          onSubmit={(payload) => addM.mutate(payload)}
          loading={addM.isPending}
        />
      </RightDrawer>
    </div>
  )
}

function AddCustomerForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    segment: 'Wholesale Buyer',
    country: 'US',
    source: 'Import',
    status: 'Prospect',
    assignedOwner: 'Unassigned',
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer details</CardTitle>
        <CardDescription>Use realistic data to keep the demo feeling alive.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted">Company</label>
          <Input
            className="mt-1"
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            placeholder="e.g. Nimbus Wholesale"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Customer name</label>
          <Input
            className="mt-1"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Jordan Lee"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Email</label>
          <Input
            className="mt-1"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="buyer@company.com"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Phone</label>
          <Input
            className="mt-1"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+1 (555) 555-5555"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Segment</label>
          <select
            value={form.segment}
            onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
            className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]"
          >
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]"
          >
            <option>Prospect</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Country</label>
          <Input
            className="mt-1"
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            placeholder="US"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">Assigned owner</label>
          <select
            value={form.assignedOwner}
            onChange={(e) =>
              setForm((f) => ({ ...f, assignedOwner: e.target.value }))
            }
            className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]"
          >
            <option>Unassigned</option>
            <option>Sarah M.</option>
            <option>Alex D.</option>
          </select>
        </div>
        <div className="md:col-span-2 flex gap-2">
          <Button
            onClick={() => {
              if (!form.company || !form.name || !form.email) {
                toast.message('Missing required fields', {
                  description: 'Company, name, and email are required.',
                })
                return
              }
              onSubmit?.(form)
            }}
            disabled={loading}
          >
            {loading ? 'Adding…' : 'Add Customer'}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.message('Import placeholder', {
                description: 'Use “Import Customers” on the page header.',
              })
            }
          >
            Import instead
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
