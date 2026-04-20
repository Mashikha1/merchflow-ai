import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import {
  Plus, Filter, Download, MoreHorizontal, Eye, Edit2, Archive, Trash2,
  MessageSquare, CheckCircle2, XCircle, Search, FileText, User, Calendar, Tag, History, Box, Globe, Truck, DollarSign, X, ChevronRight, Send
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../lib/cn'

const INITIAL_REQUESTS = [
  {
    id: 'REQ-4902',
    buyerName: 'Sarah Jenkins',
    company: 'Nordstrom',
    email: 's.jenkins@nordstrom.com',
    source: 'Fall 2026 Wholesale (Showroom)',
    type: 'Order',
    productsCount: 4,
    quantity: 1200,
    amount: '$45,000',
    status: 'New',
    assignedTo: 'Unassigned',
    date: '2 hours ago',
    notes: 'Looking for prompt delivery by Aug 1st.',
    history: [{ date: '2 hours ago', user: 'System', action: 'Request generated from Showroom ID: SR-190' }],
    products: [
      { name: 'Core Heavyweight Tee', sku: 'TS-CORE-100', qty: 500, price: '$15.00' },
      { name: 'Selvedge Straight Jean', sku: 'DNM-SLV-01', qty: 700, price: '$45.00' }
    ]
  },
  {
    id: 'REQ-4901',
    buyerName: 'Marcus Thorne',
    company: 'KITH',
    email: 'marcus@kith.com',
    source: 'Spring Essentials (Catalog)',
    type: 'Quote',
    productsCount: 12,
    quantity: 0,
    amount: 'N/A',
    status: 'Reviewing',
    assignedTo: 'Alex M.',
    date: '1 day ago',
    notes: 'Can we get custom embroidery on the left chest for the hoodies?',
    history: [
      { date: '1 day ago', user: 'System', action: 'Quote request submitted via Catalog' },
      { date: '4 hours ago', user: 'Alex M.', action: 'Changed status to Reviewing' }
    ],
    products: [
      { name: 'Oversized Washed Hoodie', sku: 'HD-WSH-02', qty: 'TBD', price: 'TBD' }
    ]
  },
  {
    id: 'REQ-4899',
    buyerName: 'Elena Rostova',
    company: 'SSENSE',
    email: 'elena.r@ssense.com',
    source: 'Holiday VIP Capsule (Showroom)',
    type: 'Sample',
    productsCount: 3,
    quantity: 3,
    amount: '$0',
    status: 'Approved',
    assignedTo: 'Sarah K.',
    date: '2 days ago',
    notes: 'Ship overnight to Montreal HQ.',
    history: [
      { date: '2 days ago', user: 'System', action: 'Sample request submitted' },
      { date: '1 day ago', user: 'Sarah K.', action: 'Approved sample fulfillment' }
    ],
    products: [
      { name: 'Leather Chelsea Boot', sku: 'FTW-CHL-01', qty: 1, price: 'Sample' },
      { name: 'Ribbed Beanie', sku: 'ACC-BN-01', qty: 2, price: 'Sample' }
    ]
  },
  {
    id: 'REQ-4890',
    buyerName: 'David Kim',
    company: 'Saks Fifth',
    email: 'dkim@saks.com',
    source: 'Core Basics (Category Link)',
    type: 'Order',
    productsCount: 8,
    quantity: 3500,
    amount: '$112,500',
    status: 'Fulfilled',
    assignedTo: 'Alex M.',
    date: '1 week ago',
    notes: 'Split shipment requested across 3 regions.',
    history: [
      { date: '1 week ago', user: 'System', action: 'Order submitted' },
      { date: '6 days ago', user: 'Alex M.', action: 'Order Approved' },
      { date: '2 days ago', user: 'Warehouse', action: 'Order Fulfilled & Shipped' }
    ],
    products: [
      { name: 'Classic Chino Pant', sku: 'CHN-CLS-01', qty: 1500, price: '$35.00' },
      { name: 'Nylon Active Short', sku: 'SHRT-ACT-05', qty: 2000, price: '$25.00' }
    ]
  },
  {
    id: 'REQ-4885',
    buyerName: 'Jessica Bloom',
    company: 'Fred Segal',
    email: 'j.bloom@fredsegal.com',
    source: 'Direct Inbound',
    type: 'Quote',
    productsCount: 2,
    quantity: 0,
    amount: 'N/A',
    status: 'Quoted',
    assignedTo: 'Sarah K.',
    date: '2 weeks ago',
    notes: 'Awaiting client signature on Net-30 terms.',
    history: [
      { date: '2 weeks ago', user: 'System', action: 'Inbound Request' },
      { date: '1 week ago', user: 'Sarah K.', action: 'Provided Quote Q-10294' }
    ],
    products: [
      { name: 'Vintage Wash Denim Jacket', sku: 'DNM-JKT-01', qty: 250, price: '$75.00' }
    ]
  }
]

// STATS are now populated from real API — see useQuery below

const getStatusColor = (status) => {
  switch (status) {
    case 'New': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Contacted': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'Reviewing': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Quoted': return 'bg-teal-50 text-teal-700 border-teal-200'
    case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Fulfilled': return 'bg-gray-100 text-gray-700 border-gray-300'
    case 'Rejected': return 'bg-red-50 text-red-700 border-red-200'
    case 'Archived': return 'bg-gray-50 text-gray-400 border-gray-200'
    default: return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

const getTypeColor = (type) => {
  switch (type) {
    case 'Order': return 'text-indigo-600 bg-indigo-50 border-indigo-100'
    case 'Quote': return 'text-amber-600 bg-amber-50 border-amber-100'
    case 'Sample': return 'text-emerald-600 bg-emerald-50 border-emerald-100'
    default: return 'text-gray-600 bg-gray-50 border-gray-100'
  }
}

export function OrdersPage() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS)
  const [activeTab, setActiveTab] = useState('All Activity')
  const [searchQuery, setSearchQuery] = useState('')

  // Wire summary stats to real API
  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders'),
  })
  const apiSummary = ordersData?.summary || {}
  const STATS = [
    { label: 'Total Requests', value: apiSummary.total ?? '—', trend: 'All quotes & orders' },
    { label: 'New Orders', value: apiSummary.newOrders ?? '—', trend: 'Converted to order', alert: (apiSummary.newOrders > 0) },
    { label: 'Pending Quotes', value: apiSummary.pendingQuotes ?? '—', trend: 'In negotiation' },
    { label: 'Sample Requests', value: apiSummary.sampleRequests ?? 0, trend: 'Fulfilled 50%' },
    { label: 'Converted Orders', value: apiSummary.newOrders ?? '—', trend: 'Year to date', positive: true },
    { label: 'Revenue Potential', value: apiSummary.revenuePotential ? `$${(apiSummary.revenuePotential/1000).toFixed(0)}K` : '—', trend: 'Active Pipeline', positive: true },
  ]

  // Drawer State
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [newInternalNote, setNewInternalNote] = useState('')

  const filteredRequests = requests.filter(req => {
    const matchesTab = activeTab === 'All Activity'
      || (activeTab === 'Order Requests' && req.type === 'Order')
      || (activeTab === 'Quote Requests' && req.type === 'Quote')
      || (activeTab === 'Sample Requests' && req.type === 'Sample')
    const matchesSearch = req.buyerName.toLowerCase().includes(searchQuery.toLowerCase())
      || req.company.toLowerCase().includes(searchQuery.toLowerCase())
      || req.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const handleRowClick = (req) => {
    setSelectedRequest(req)
    setIsDrawerOpen(true)
  }

  const updateStatus = (id, newStatus) => {
    const newHistory = { date: 'Just now', user: 'Current User', action: `Status changed to ${newStatus}` }
    setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus, history: [newHistory, ...r.history] } : r))
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest(prev => ({ ...prev, status: newStatus, history: [newHistory, ...prev.history] }))
    }
    toast.success(`Request ${id} marked as ${newStatus}`)
  }

  const handleAddNote = () => {
    if (!newInternalNote.trim()) return
    const newHistory = { date: 'Just now', user: 'Current User', action: `Note: ${newInternalNote}` }

    setRequests(requests.map(r => r.id === selectedRequest.id ? { ...r, history: [newHistory, ...r.history] } : r))
    setSelectedRequest(prev => ({ ...prev, history: [newHistory, ...prev.history] }))
    setNewInternalNote('')
    toast.success('Internal note saved')
  }

  const handleAction = (e, action, req) => {
    e.stopPropagation()
    switch (action) {
      case 'archive':
        updateStatus(req.id, 'Archived')
        break
      case 'convert_order':
        setRequests(requests.map(r => r.id === req.id ? { ...r, type: 'Order', status: 'New', amount: '$ Pending' } : r))
        toast.success('Converted to firm order')
        break
      case 'delete':
        setRequests(requests.filter(r => r.id !== req.id))
        toast.error('Record deleted completely')
        break
      default:
        toast.info(`Action ${action} triggered`)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden -mx-4 -mt-6">
      <PageHeader
        title="Orders & Requests"
        subtitle="Track incoming orders, quote negotiations, and sample requests directly from your B2B endpoints."
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" className="hidden sm:flex" onClick={() => toast.success('CSV Download Started')}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
            <Button className="shadow-sm" onClick={() => toast.info('Manual creation flow coming soon')}><Plus className="w-4 h-4 mr-2" /> Create Order</Button>
          </div>
        }
        className="shrink-0 pt-6 px-8 bg-white border-b border-gray-200 z-10"
      />

      <div className="flex-1 overflow-y-auto px-8 py-8 bg-[#F5F5F7] flex flex-col gap-6">

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 shrink-0">
          {STATS.map((stat, i) => (
            <Card key={i} className="p-4 bg-white border-border-subtle shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-content-tertiary uppercase tracking-wider">{stat.label}</span>
              <div className="mt-3 flex items-end justify-between">
                <span className={cn("text-2xl font-black tracking-tight", stat.alert ? "text-red-600" : "text-content-primary")}>{stat.value}</span>
              </div>
              <span className={cn("text-[11px] font-semibold mt-1", stat.positive ? "text-emerald-600" : (stat.alert ? "text-red-500" : "text-content-tertiary"))}>{stat.trend}</span>
            </Card>
          ))}
        </div>

        {/* Main Content Area */}
        <Card className="bg-white shadow-sm border-border-subtle overflow-hidden flex-1 flex flex-col min-h-[500px]">
          {/* Header & Tabs */}
          <div className="border-b border-border-subtle bg-gray-50/50">
            <div className="px-5 pt-4 pb-0 flex gap-6">
              {['All Activity', 'Order Requests', 'Quote Requests', 'Sample Requests'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-3 text-sm font-semibold transition-colors border-b-2 relative -bottom-[1px]",
                    activeTab === tab ? "border-brand text-content-primary" : "border-transparent text-content-tertiary hover:text-content-secondary"
                  )}
                >
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
                <Input placeholder="Search buyer or ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-64 h-9 text-sm focus:ring-1 focus:ring-brand" />
              </div>
              <Button variant="outline" size="sm" className="h-9 font-semibold"><Filter className="w-3.5 h-3.5 mr-2" /> Filter List</Button>
            </div>
            <div className="text-xs font-bold text-content-tertiary">{filteredRequests.length} matching records</div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[10px] uppercase tracking-wider font-bold text-content-tertiary bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3">Req ID</th>
                  <th className="px-5 py-3">Buyer / Company</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Assigned To</th>
                  <th className="px-5 py-3">Received At</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-16 text-center text-gray-500 font-medium">No requests match your current filters.</td>
                  </tr>
                ) : filteredRequests.map(req => (
                  <tr key={req.id} onClick={() => handleRowClick(req)} className="border-b border-border-subtle hover:bg-gray-50 transition-colors cursor-pointer group">
                    <td className="px-5 py-3 font-mono text-[13px] font-bold tracking-tight text-gray-900">{req.id}</td>
                    <td className="px-5 py-3">
                      <div className="font-bold text-content-primary">{req.company}</div>
                      <div className="text-[12px] font-medium text-content-tertiary">{req.buyerName}</div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={cn("text-[10px] font-bold tracking-wide uppercase px-2 py-0.5", getTypeColor(req.type))}>
                        {req.type}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={cn("text-[11px] font-bold px-2.5 shadow-sm", getStatusColor(req.status))}>
                        {req.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-mono font-medium text-content-secondary">{req.amount}</td>
                    <td className="px-5 py-3">
                      {req.assignedTo === 'Unassigned' ? (
                        <span className="text-gray-400 italic text-xs font-semibold">Unassigned</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-700">{req.assignedTo.charAt(0)}</div>
                          <span className="text-gray-700 font-medium text-xs">{req.assignedTo}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-content-tertiary">{req.date}</td>
                    <td className="px-5 py-3 text-right sticky right-0">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold text-brand hover:bg-brand-soft" onClick={(e) => { e.stopPropagation(); handleRowClick(req) }}>View</Button>
                        {req.status === 'New' && <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50" onClick={(e) => { e.stopPropagation(); updateStatus(req.id, 'Reviewing') }}>Claim</Button>}
                        {req.type === 'Quote' && <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50" onClick={(e) => handleAction(e, 'convert_order', req)}>Convert</Button>}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-500" onClick={(e) => handleAction(e, 'delete', req)}><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Inspector Drawer */}
      {isDrawerOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm transition-all" onClick={() => setIsDrawerOpen(false)}>
          <div className="w-[600px] bg-white h-full flex flex-col shadow-2xl border-l transform animate-in slide-in-from-right-full duration-200" onClick={e => e.stopPropagation()}>

            {/* Drawer Header */}
            <div className="px-8 py-5 border-b bg-gray-50 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold font-mono tracking-tight">{selectedRequest.id}</h3>
                  <Badge variant="outline" className={cn("text-[10px] font-bold px-2", getStatusColor(selectedRequest.status))}>{selectedRequest.status}</Badge>
                  <Badge variant="outline" className={cn("text-[10px] font-bold px-2", getTypeColor(selectedRequest.type))}>{selectedRequest.type}</Badge>
                </div>
                <p className="text-sm font-medium text-gray-500">{selectedRequest.company} — Received {selectedRequest.date}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-gray-900 border"><X size={16} /></Button>
            </div>

            {/* CRM Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8 space-y-8">

              {/* Actions / Status Toolbar */}
              <div className="p-4 bg-white border rounded-xl shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Update Pipeline Stage</span>
                  {selectedRequest.assignedTo === 'Unassigned' ? (
                    <Button size="sm" variant="outline" className="h-7 text-xs font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => updateStatus(selectedRequest.id, 'Reviewing')}><User size={12} className="mr-1.5" /> Assign To Me</Button>
                  ) : (
                    <span className="text-xs font-bold text-gray-600 flex items-center bg-gray-100 rounded-lg px-2 py-1"><User size={12} className="mr-1.5" /> Assigned to {selectedRequest.assignedTo}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Contacted', 'Reviewing', 'Quoted', 'Approved', 'Fulfilled', 'Rejected'].map(state => (
                    <button
                      key={state}
                      onClick={() => updateStatus(selectedRequest.id, state)}
                      className={cn("px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-colors", selectedRequest.status === state ? "bg-brand text-white border-brand" : "bg-white text-gray-600 border-gray-200 hover:border-brand hover:text-brand")}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Buyer Info */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center"><User size={12} className="mr-1.5" /> Buyer Profile</h4>
                  <div className="bg-white border rounded-lg p-4 shadow-sm text-sm space-y-3">
                    <div><span className="block text-xs text-gray-400 font-semibold mb-0.5">Contact Name</span><span className="font-bold text-gray-900">{selectedRequest.buyerName}</span></div>
                    <div><span className="block text-xs text-gray-400 font-semibold mb-0.5">Company</span><span className="font-bold text-gray-900">{selectedRequest.company}</span></div>
                    <div><span className="block text-xs text-gray-400 font-semibold mb-0.5">Email</span><a href={`mailto:${selectedRequest.email}`} className="font-mono text-brand hover:underline">{selectedRequest.email}</a></div>
                  </div>
                </div>

                {/* Request Metadata */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center"><Calendar size={12} className="mr-1.5" /> Request Details</h4>
                  <div className="bg-white border rounded-lg p-4 shadow-sm text-sm space-y-3">
                    <div><span className="block text-xs text-gray-400 font-semibold mb-0.5">Source Endpoint</span><span className="font-semibold text-indigo-600 bg-indigo-50 px-1 rounded">{selectedRequest.source}</span></div>
                    <div><span className="block text-xs text-gray-400 font-semibold mb-0.5">Total Quantity Request</span><span className="font-mono font-bold text-gray-900">{selectedRequest.quantity} units</span></div>
                    <div><span className="block text-xs text-gray-400 font-semibold mb-0.5">Estimated Value</span><span className="font-mono font-bold text-emerald-600">{selectedRequest.amount}</span></div>
                  </div>
                </div>
              </div>

              {/* Products Requested Array */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center"><Box size={12} className="mr-1.5" /> Line Items Requested ({selectedRequest.productsCount})</h4>
                <div className="bg-white border text-[12px] border-border-subtle rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b text-gray-500 font-bold uppercase">
                      <tr>
                        <th className="px-4 py-2">Item</th>
                        <th className="px-4 py-2">SKU</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedRequest.products.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-900">{p.name}</td>
                          <td className="px-4 py-3 font-mono text-gray-500">{p.sku}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">{p.qty}</td>
                          <td className="px-4 py-3 text-right font-mono text-gray-500">{p.price}</td>
                        </tr>
                      ))}
                    </tbody>
                    {selectedRequest.amount !== 'N/A' && selectedRequest.amount !== '$0' && (
                      <tfoot className="bg-gray-50 border-t">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-500 uppercase text-[10px]">Total Indicated Value</td>
                          <td className="px-4 py-3 text-right font-bold font-mono text-gray-900">{selectedRequest.amount}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Buyer Message/Notes */}
              {selectedRequest.notes && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center"><MessageSquare size={12} className="mr-1.5" /> Buyer Remarks</h4>
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-sm italic shadow-inner">
                    "{selectedRequest.notes}"
                  </div>
                </div>
              )}

              {/* Workflow History / Internal Notes */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center"><History size={12} className="mr-1.5" /> Internal Audit Trail</h4>

                {/* New Note Box */}
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newInternalNote}
                    onChange={e => setNewInternalNote(e.target.value)}
                    placeholder="Add an internal note or mention team members..."
                    className="bg-white text-sm h-9 flex-1 shadow-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <Button size="sm" onClick={handleAddNote} className="h-9 px-3 shadow-sm"><Send size={14} /></Button>
                </div>

                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                  {selectedRequest.history.map((h, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white bg-gray-300 group-[.is-active]:bg-brand text-slate-500 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow shrink-0 z-10"></div>
                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white p-3 rounded border shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-900 text-[11px]">{h.user}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{h.date}</span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">{h.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spacer */}
              <div className="h-20"></div>
            </div>

            {/* Sticky Footer */}
            <div className="p-5 border-t bg-white flex justify-between shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
              <Button variant="outline" className="text-red-500 hover:bg-red-50 font-bold text-xs"><Archive size={14} className="mr-1.5" /> Archive Ticket</Button>
              {selectedRequest.type === 'Quote' ? (
                <Button className="bg-brand font-bold shadow-md"><FileText size={14} className="mr-1.5" /> Generate PDF Quote</Button>
              ) : (
                <Button className="bg-brand font-bold shadow-md"><CheckCircle2 size={14} className="mr-1.5" /> Save & Close</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
