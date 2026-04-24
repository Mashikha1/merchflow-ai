import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import {
  Plus, Filter, Download, Trash2, MessageSquare, CheckCircle2, Search,
  FileText, User, Calendar, History, Box, X, Send, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../lib/cn'

const getStatusColor = (status) => {
  const s = (status || '').toLowerCase()
  if (['new', 'sent'].includes(s)) return 'bg-blue-50 text-blue-700 border-blue-200'
  if (['reviewing', 'negotiating'].includes(s)) return 'bg-amber-50 text-amber-700 border-amber-200'
  if (['quoted', 'viewed'].includes(s)) return 'bg-teal-50 text-teal-700 border-teal-200'
  if (['approved', 'converted_to_order', 'converted to order'].includes(s)) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (['fulfilled'].includes(s)) return 'bg-gray-100 text-gray-700 border-gray-300'
  if (['rejected', 'expired'].includes(s)) return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-gray-50 text-gray-700 border-gray-200'
}

function formatCurrency(val) {
  if (!val && val !== 0) return '—'
  return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function OrdersPage() {
  const user = useAuthStore(s => s.user)
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReq, setSelectedReq] = useState(null)
  const [newNote, setNewNote] = useState('')

  // Real data from backend
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders'),
    refetchInterval: 30000,
  })

  const quotesQ = useQuery({
    queryKey: ['quotes'],
    queryFn: () => api.get('/quotes'),
    refetchInterval: 30000,
  })

  const summary = ordersData?.summary || {}
  const orders = ordersData?.orders || []
  const allQuotes = Array.isArray(quotesQ.data) ? quotesQ.data : []

  // Merge: quotes + converted orders for full pipeline view
  const allRequests = useMemo(() => {
    const quoteRows = allQuotes.map(q => ({
      id: q.number ? `Q-${q.number}` : q.id.slice(0, 8).toUpperCase(),
      _id: q.id,
      buyerName: q.buyerName || q.buyer?.name || '—',
      company: q.buyerCompany || q.buyer?.company || '—',
      email: q.buyerEmail || q.buyer?.email || '',
      source: q.source || 'Direct',
      type: q.status === 'CONVERTED_TO_ORDER' ? 'Order' : 'Quote',
      amount: q.totals?.total ?? q.total,
      status: q.status,
      assignedTo: q.assignedTo?.name || 'Unassigned',
      date: q.createdAt,
      notes: q.internalNotes || '',
      items: q.items || [],
      history: q.history || [],
    }))
    return quoteRows
  }, [allQuotes, orders])

  const filteredRequests = useMemo(() => {
    return allRequests.filter(r => {
      if (activeTab === 'Orders' && r.type !== 'Order') return false
      if (activeTab === 'Quotes' && r.type !== 'Quote') return false
      const q = searchQuery.toLowerCase()
      if (!q) return true
      return (r.buyerName + r.company + r.id).toLowerCase().includes(q)
    })
  }, [allRequests, activeTab, searchQuery])

  const STATS = [
    { label: 'Total Pipeline', value: summary.total ?? allRequests.length },
    { label: 'Converted Orders', value: summary.newOrders ?? orders.length },
    { label: 'Pending Quotes', value: summary.pendingQuotes ?? '—' },
    { label: 'Sample Requests', value: summary.sampleRequests ?? 0 },
    { label: 'Revenue Potential', value: summary.revenuePotential ? `$${(summary.revenuePotential / 1000).toFixed(0)}K` : '—', positive: true },
    { label: 'Avg Ticket', value: allRequests.length ? `$${Math.round((summary.revenuePotential || 0) / Math.max(allRequests.length, 1)).toLocaleString()}` : '—' },
  ]

  // Status update mutation via quotes PATCH
  const updateStatusM = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/quotes/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotes'] }); qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Status updated') }
  })

  const deleteM = useMutation({
    mutationFn: (id) => api.delete(`/quotes/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotes'] }); setSelectedReq(null); toast.success('Deleted') }
  })

  const addNoteM = useMutation({
    mutationFn: ({ id, note }) => api.post(`/quotes/${id}/notes`, { note, user: user?.name || 'Team' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quotes'] }); setNewNote(''); toast.success('Note saved') }
  })

  const handleUpdateStatus = (req, status) => {
    updateStatusM.mutate({ id: req._id, status })
    if (selectedReq?._id === req._id) setSelectedReq(r => ({ ...r, status }))
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden -mx-4 -mt-6">
      <PageHeader
        title="Orders & Requests"
        subtitle="Real-time B2B pipeline: quotes, orders, and sample requests from all your endpoints."
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" className="hidden sm:flex" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
            <Button variant="outline" className="hidden sm:flex" onClick={() => toast.info('CSV export coming soon')}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          </div>
        }
        className="shrink-0 pt-6 px-8 bg-white border-b border-gray-200 z-10"
      />

      <div className="flex-1 overflow-y-auto px-8 py-8 bg-[#F5F5F7] flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 shrink-0">
          {STATS.map((s, i) => (
            <Card key={i} className="p-4 bg-white border-border-subtle shadow-sm">
              <span className="text-[11px] font-bold text-content-tertiary uppercase tracking-wider">{s.label}</span>
              <div className="mt-3 text-2xl font-black tracking-tight text-content-primary">{s.value}</div>
            </Card>
          ))}
        </div>

        {/* Table Card */}
        <Card className="bg-white shadow-sm border-border-subtle overflow-hidden flex-1 flex flex-col min-h-[400px]">
          {/* Tabs */}
          <div className="border-b border-border-subtle bg-gray-50/50">
            <div className="px-5 pt-4 pb-0 flex gap-6">
              {['All', 'Orders', 'Quotes'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn('pb-3 text-sm font-semibold transition-colors border-b-2 relative -bottom-[1px]',
                    activeTab === tab ? 'border-brand text-content-primary' : 'border-transparent text-content-tertiary hover:text-content-secondary')}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search buyer, company, ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-64 h-9 text-sm" />
              </div>
            </div>
            <div className="text-xs font-bold text-content-tertiary">{filteredRequests.length} records</div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            {isLoading || quotesQ.isLoading ? (
              <div className="p-8 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12" />)}</div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-16 text-center text-gray-500">
                <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No requests yet</p>
                <p className="text-sm mt-1">Quotes and orders will appear here once buyers submit requests.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[10px] uppercase tracking-wider font-bold text-content-tertiary bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Buyer / Company</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Assigned</th>
                    <th className="px-5 py-3">Received</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(req => (
                    <tr key={req.id} onClick={() => setSelectedReq(req)}
                      className="border-b border-border-subtle hover:bg-gray-50 transition-colors cursor-pointer group">
                      <td className="px-5 py-3 font-mono text-[13px] font-bold text-gray-900">{req.id}</td>
                      <td className="px-5 py-3">
                        <div className="font-bold text-content-primary">{req.company || req.buyerName}</div>
                        <div className="text-[12px] text-content-tertiary">{req.buyerName}</div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={cn('text-[10px] font-bold uppercase px-2 py-0.5',
                          req.type === 'Order' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' : 'text-amber-600 bg-amber-50 border-amber-100')}>
                          {req.type}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={cn('text-[11px] font-bold px-2.5 shadow-sm', getStatusColor(req.status))}>
                          {req.status?.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-mono font-medium text-content-secondary">
                        {req.amount != null ? formatCurrency(req.amount) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        {req.assignedTo === 'Unassigned'
                          ? <span className="text-gray-400 italic text-xs">Unassigned</span>
                          : <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-700">{req.assignedTo.charAt(0)}</div>
                              <span className="text-gray-700 font-medium text-xs">{req.assignedTo}</span>
                            </div>
                        }
                      </td>
                      <td className="px-5 py-3 text-xs font-medium text-content-tertiary">{timeAgo(req.date)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold text-brand" onClick={e => { e.stopPropagation(); setSelectedReq(req) }}>View</Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-500" onClick={e => { e.stopPropagation(); if (confirm('Delete?')) deleteM.mutate(req._id) }}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* Detail Drawer */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm" onClick={() => setSelectedReq(null)}>
          <div className="w-[600px] bg-white h-full flex flex-col shadow-2xl border-l animate-in slide-in-from-right-full duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-5 border-b bg-gray-50 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold font-mono">{selectedReq.id}</h3>
                  <Badge variant="outline" className={cn('text-[10px] font-bold px-2', getStatusColor(selectedReq.status))}>{selectedReq.status?.replace(/_/g, ' ')}</Badge>
                  <Badge variant="outline" className={cn('text-[10px] font-bold px-2', selectedReq.type === 'Order' ? 'text-indigo-600 bg-indigo-50' : 'text-amber-600 bg-amber-50')}>{selectedReq.type}</Badge>
                </div>
                <p className="text-sm font-medium text-gray-500">{selectedReq.company} — {timeAgo(selectedReq.date)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedReq(null)} className="text-gray-400 hover:text-gray-900 border"><X size={16} /></Button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8 space-y-8">
              {/* Status pipeline */}
              <div className="p-4 bg-white border rounded-xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Update Status</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['SENT', 'NEGOTIATING', 'APPROVED', 'CONVERTED_TO_ORDER', 'REJECTED'].map(s => (
                    <button key={s} onClick={() => handleUpdateStatus(selectedReq, s)}
                      className={cn('px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-colors',
                        selectedReq.status === s ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:border-brand hover:text-brand')}>
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center"><User size={12} className="mr-1.5" /> Buyer Profile</h4>
                  <div className="bg-white border rounded-lg p-4 shadow-sm text-sm space-y-3">
                    <div><span className="block text-xs text-gray-400 font-semibold mb-0.5">Name</span><span className="font-bold">{selectedReq.buyerName}</span></div>
                    <div><span className="block text-xs text-gray-400 font-semibold mb-0.5">Company</span><span className="font-bold">{selectedReq.company || '—'}</span></div>
                    <div><span className="block text-xs text-gray-400 font-semibold mb-0.5">Email</span>
                      {selectedReq.email ? <a href={`mailto:${selectedReq.email}`} className="font-mono text-brand hover:underline">{selectedReq.email}</a> : '—'}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center"><Calendar size={12} className="mr-1.5" /> Details</h4>
                  <div className="bg-white border rounded-lg p-4 shadow-sm text-sm space-y-3">
                    <div><span className="block text-xs text-gray-400 font-semibold mb-0.5">Source</span><span className="font-semibold text-indigo-600 bg-indigo-50 px-1 rounded">{selectedReq.source}</span></div>
                    <div><span className="block text-xs text-gray-400 font-semibold mb-0.5">Value</span><span className="font-mono font-bold text-emerald-600">{selectedReq.amount != null ? formatCurrency(selectedReq.amount) : '—'}</span></div>
                    <div><span className="block text-xs text-gray-400 font-semibold mb-0.5">Assigned To</span><span className="font-semibold">{selectedReq.assignedTo}</span></div>
                  </div>
                </div>
              </div>

              {/* Line items */}
              {selectedReq.items?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center"><Box size={12} className="mr-1.5" /> Line Items ({selectedReq.items.length})</h4>
                  <div className="bg-white border rounded-xl overflow-hidden shadow-sm text-[12px]">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b text-gray-500 font-bold uppercase">
                        <tr><th className="px-4 py-2">Item</th><th className="px-4 py-2">SKU</th><th className="px-4 py-2 text-right">Qty</th><th className="px-4 py-2 text-right">Price</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedReq.items.map((p, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold">{p.name || p.productName || '—'}</td>
                            <td className="px-4 py-3 font-mono text-gray-500">{p.sku || '—'}</td>
                            <td className="px-4 py-3 text-right font-bold">{p.qty}</td>
                            <td className="px-4 py-3 text-right font-mono text-gray-500">{p.unitPrice ? formatCurrency(p.unitPrice) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedReq.notes && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center"><MessageSquare size={12} className="mr-1.5" /> Buyer Remarks</h4>
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-sm italic">"{selectedReq.notes}"</div>
                </div>
              )}

              {/* History + Note entry */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center"><History size={12} className="mr-1.5" /> Audit Trail</h4>
                <div className="flex gap-2 mb-4">
                  <Input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add internal note..."
                    className="bg-white text-sm h-9 flex-1 shadow-sm" onKeyDown={e => e.key === 'Enter' && addNoteM.mutate({ id: selectedReq._id, note: newNote })} />
                  <Button size="sm" className="h-9 px-3 shadow-sm" onClick={() => addNoteM.mutate({ id: selectedReq._id, note: newNote })} disabled={!newNote.trim() || addNoteM.isPending}><Send size={14} /></Button>
                </div>
                {(selectedReq.history || []).length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No history yet</p>
                ) : (
                  <div className="space-y-3">
                    {[...selectedReq.history].reverse().map((h, i) => (
                      <div key={i} className="bg-white border rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-900 text-[11px]">{h.user || h.by || 'System'}</span>
                          <span className="text-[10px] text-gray-400">{timeAgo(h.at || h.date)}</span>
                        </div>
                        <p className="text-xs text-gray-600">{h.action || h.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="h-10" />
            </div>

            <div className="p-5 border-t bg-white flex justify-between shrink-0">
              <Button variant="outline" className="text-red-500 hover:bg-red-50 font-bold text-xs" onClick={() => { if (confirm('Delete?')) deleteM.mutate(selectedReq._id) }}>Delete</Button>
              {selectedReq.type === 'Quote' && (
                <Button className="bg-brand font-bold shadow-md" onClick={() => handleUpdateStatus(selectedReq, 'CONVERTED_TO_ORDER')}>
                  <CheckCircle2 size={14} className="mr-1.5" /> Convert to Order
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
