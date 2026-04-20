import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import {
  Plus, Filter, Download, MoreHorizontal, Eye, Edit2, Copy, Archive, Trash2,
  Link as LinkIcon, Globe, Lock, Play, LayoutGrid, Image as ImageIcon, Box,
  ChevronRight, CheckCircle2, Sliders, List, Users, Palette, Upload, Layers, Save
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../lib/cn'

const INITIAL_SHOWROOMS = [
  { id: '1', name: 'Fall 2026 Wholesale B2B', status: 'published', source: 'Catalog: Fall Core', productsCount: 142, views: 1240, quoteRequests: 8, updatedAt: '2 hours ago', password: true },
  { id: '2', name: 'Spring Essentials PR Seeding', status: 'published', source: 'Collection: Essentials', productsCount: 35, views: 850, quoteRequests: 4, updatedAt: '1 day ago', password: false },
  { id: '3', name: 'Holiday VIP Capsule', status: 'draft', source: 'Manual Selection', productsCount: 12, views: 0, quoteRequests: 0, updatedAt: '3 days ago', password: true },
  { id: '4', name: 'Core Basics Evergreen', status: 'published', source: 'Category: Knits', productsCount: 88, views: 1150, quoteRequests: 3, updatedAt: '1 week ago', password: false },
]

const STATS = [
  { label: 'Total Showrooms', value: '12', trend: '+2 this month' },
  { label: 'Published', value: '8', trend: 'Active' },
  { label: 'Drafts', value: '4', trend: 'Action Needed' },
  { label: 'Total Views', value: '3,240', trend: '+15% vs last month', positive: true },
  { label: 'Quote Requests', value: '15', trend: '4 pending response', positive: true },
  { label: 'Sample Requests', value: '8', trend: 'In fulfillment' }
]

export function ShowroomsPage() {
  const [showrooms, setShowrooms] = useState(INITIAL_SHOWROOMS)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createStep, setCreateStep] = useState(1)

  // Wizard State
  const [formData, setFormData] = useState({
    source: '', name: '', slug: '', description: '', audience: 'Wholesale Buyers', status: 'draft',
    themeColor: '#000000', showPrices: true, quoteRequest: true, sampleRequest: true,
    wishlist: true, passwordProtected: false
  })

  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      const sourceParam = searchParams.get('source') || 'Category'
      const nameParam = searchParams.get('name') || ''

      setFormData(prev => ({
        ...prev,
        source: sourceParam,
        name: nameParam ? `${nameParam} Showroom` : 'Untitled Showroom',
        status: 'draft'
      }))
      setCreateStep(1)
      setIsCreateOpen(true)

      // Cleanup URL params natively so refresh doesn't pop it open again unexpectedly
      searchParams.delete('create')
      searchParams.delete('source')
      searchParams.delete('categoryId')
      searchParams.delete('name')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handleAction = (action, showroom) => {
    switch (action) {
      case 'copy_link':
        toast.success('Showroom link copied to clipboard')
        break
      case 'duplicate': {
        // eslint-disable-next-line react-hooks/purity
        const clone = { ...showroom, id: Date.now().toString(), name: showroom.name + ' (Copy)', status: 'draft', views: 0, quoteRequests: 0 }
        setShowrooms([clone, ...showrooms])
        toast.success('Showroom duplicated successfully')
        break
      }
      case 'delete':
        setShowrooms(showrooms.filter(s => s.id !== showroom.id))
        toast.error('Showroom deleted')
        break
      case 'publish':
        setShowrooms(showrooms.map(s => s.id === showroom.id ? { ...s, status: s.status === 'published' ? 'draft' : 'published' } : s))
        toast.success(`Showroom ${showroom.status === 'published' ? 'unpublished' : 'published'}`)
        break
      default:
        toast.info(`${action} clicked for ${showroom.name}`)
    }
  }

  const startWizard = () => {
    setFormData({
      source: '', name: '', slug: '', description: '', audience: 'Wholesale Buyers', status: 'draft',
      themeColor: '#111111', showPrices: true, quoteRequest: true, sampleRequest: true,
      wishlist: true, passwordProtected: false
    })
    setCreateStep(1)
    setIsCreateOpen(true)
  }

  const finishWizard = (finalStatus) => {
    // eslint-disable-next-line react-hooks/purity
    const newShowroom = {
      id: Date.now().toString(),
      name: formData.name || 'Untitled Showroom',
      status: finalStatus,
      source: formData.source || 'Manual Selection',
      productsCount: 0,
      views: 0, quoteRequests: 0,
      updatedAt: 'Just now',
      password: formData.passwordProtected
    }
    setShowrooms([newShowroom, ...showrooms])
    setIsCreateOpen(false)
    toast.success(`Showroom successfully ${finalStatus === 'published' ? 'published' : 'saved as draft'}`)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden -mx-4 -mt-6">
      <PageHeader
        title="Showrooms"
        subtitle="Create curated, buyer-facing digital spaces to present products and capture interest."
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export Data</Button>
            <Button onClick={startWizard} className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> Create Showroom</Button>
          </div>
        }
        className="shrink-0 pt-6 px-8 bg-white border-b border-gray-200 z-10"
      />

      <div className="flex-1 overflow-y-auto px-8 py-8 bg-[#F5F5F7]">

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {STATS.map((stat, i) => (
            <Card key={i} className="p-4 bg-white border-border-subtle shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-content-tertiary uppercase tracking-wider">{stat.label}</span>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-2xl font-black text-content-primary tracking-tight">{stat.value}</span>
              </div>
              <span className={cn("text-[11px] font-semibold mt-1", stat.positive ? "text-emerald-600" : "text-content-tertiary")}>{stat.trend}</span>
            </Card>
          ))}
        </div>

        {/* Showrooms List */}
        <Card className="bg-white shadow-sm border-border-subtle overflow-hidden">
          <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <Input placeholder="Search showrooms..." className="w-64 h-9 text-sm" />
              <Button variant="outline" size="sm" className="h-9"><Filter className="w-3.5 h-3.5 mr-2" /> Filter Views</Button>
            </div>
            <div className="text-xs font-semibold text-content-tertiary">{showrooms.length} Active Workspaces</div>
          </div>

          {showrooms.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4"><Globe className="w-8 h-8 text-gray-300" /></div>
              <h3 className="text-lg font-bold text-content-primary mb-2">No Showrooms Created Space</h3>
              <p className="text-content-tertiary text-sm mb-6 max-w-sm mx-auto">Build interactive, password-protected presentation portals to share with specific wholesale buyers, press agents, or dropship partners.</p>
              <div className="flex gap-3">
                <Button onClick={startWizard} className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> Create Showroom</Button>
                <Button variant="outline"><Play className="w-4 h-4 mr-2 text-brand" /> Use Demo Template</Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] uppercase tracking-wider font-bold text-content-tertiary bg-app-card-muted border-b border-border-strong">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-lg">Showroom Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Content Source</th>
                    <th className="px-6 py-4">Products</th>
                    <th className="px-6 py-4">Metrics</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4 text-right rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {showrooms.map(room => (
                    <tr key={room.id} className="border-b border-border-subtle hover:bg-app-hover transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-border-subtle flex items-center justify-center text-gray-400">
                            {room.password ? <Lock size={16} /> : <Globe size={16} />}
                          </div>
                          <div>
                            <div className="font-bold text-content-primary flex items-center gap-2">{room.name}</div>
                            <div className="text-[11px] font-semibold text-content-tertiary mt-0.5 flex items-center"><LinkIcon size={10} className="mr-1" /> merchflow.com/s/room-{room.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn(room.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200')}>
                          <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", room.status === 'published' ? "bg-emerald-500" : "bg-gray-400")}></span>
                          {room.status === 'published' ? 'Active Live' : 'Building Draft'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-medium text-content-secondary">{room.source}</td>
                      <td className="px-6 py-4 font-mono text-content-secondary">{room.productsCount} items</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-[11px] font-bold text-content-secondary">
                          <span className="flex items-center"><Eye size={12} className="mr-1.5 text-content-tertiary" /> {room.views} views</span>
                          <span className="flex items-center"><List size={12} className="mr-1.5 text-brand" /> {room.quoteRequests} quotes</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-content-tertiary text-[12px] font-medium">{room.updatedAt}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-content-secondary hover:text-brand" onClick={() => handleAction('copy_link', room)} title="Copy Link"><LinkIcon size={14} /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-content-secondary hover:text-black" onClick={() => handleAction('edit', room)} title="Edit Configuration"><Edit2 size={14} /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-content-secondary hover:text-emerald-600" onClick={() => handleAction('publish', room)} title="Toggle Status"><Globe size={14} /></Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-content-secondary hover:text-red-600 flex items-center text-xs" onClick={() => handleAction('delete', room)}><Trash2 size={14} className="mr-1" /> Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Creation Wizard Drawer Overlay */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm transition-all shadow-2xl">
          <div className="w-[600px] bg-white h-full flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-border-strong transform animate-in slide-in-from-right-full duration-300">
            {/* Drawer Header */}
            <div className="px-8 py-5 border-b border-border-subtle bg-gray-50/50 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-content-primary tracking-tight">Showroom Setup</h3>
                <p className="text-sm font-semibold text-content-tertiary mt-1">Step {createStep} of 5: {
                  createStep === 1 ? 'Data Source Selection' :
                    createStep === 2 ? 'General Configuration' :
                      createStep === 3 ? 'Engagement Settings' :
                        createStep === 4 ? 'Content Selection' : 'Review & Publish'
                }</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold bg-white border shadow-sm">Cancel</Button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-gray-100 flex shrink-0">
              {[1, 2, 3, 4, 5].map(step => (
                <div key={step} className={cn("h-full transition-all duration-300", step <= createStep ? "bg-brand flex-1" : "flex-1")}></div>
              ))}
            </div>

            {/* Drawer Body Sequence */}
            <div className="flex-1 overflow-y-auto p-8 bg-app-body">
              {createStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <h4 className="text-base font-bold text-gray-900 mb-2">How do you want to populate this Showroom?</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'Category', icon: LayoutGrid, desc: 'Sync an existing taxonomy category dynamically.' },
                      { id: 'Collection', icon: Layers, desc: 'Pull a curated list of marketing collections.' },
                      { id: 'Catalog', icon: Box, desc: 'Map an entire built catalog over directly.' },
                      { id: 'Manual Selection', icon: Plus, desc: 'Hand-pick specific standalone items.' }
                    ].map(src => (
                      <div
                        key={src.id} onClick={() => setFormData({ ...formData, source: src.id })}
                        className={cn("p-5 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md", formData.source === src.id ? "border-brand bg-brand-soft/10 ring-4 ring-brand/5" : "border-border-subtle bg-white hover:border-gray-300")}
                      >
                        <src.icon className={cn("w-6 h-6 mb-3", formData.source === src.id ? "text-brand" : "text-gray-400")} />
                        <h5 className="font-bold text-sm text-gray-900 mb-1">{src.id}</h5>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{src.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {createStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                  <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center"><Edit2 size={16} className="mr-2 text-brand" /> General Information</h4>

                  <div className="space-y-4 bg-white p-6 rounded-xl border shadow-sm">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-2">Showroom Name <span className="text-red-500">*</span></label>
                      <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Fall 2026 VIP Review" className="h-10 text-sm font-medium" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-2">Custom URL Slug</label>
                      <div className="flex">
                        <div className="bg-gray-100 border border-border-strong border-r-0 rounded-l-lg px-3 flex items-center text-xs font-semibold text-gray-500 shadow-inner">merchflow.io/view/</div>
                        <Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} placeholder="fall-2026-vip" className="h-10 text-sm font-mono flex-1 rounded-l-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-2">Target Audience</label>
                      <select value={formData.audience} onChange={e => setFormData({ ...formData, audience: e.target.value })} className="w-full h-10 border-border-subtle rounded-lg text-sm font-medium px-3 focus:ring-brand outline-none shadow-sm pb-0 bg-white border">
                        <option>Wholesale Buyers</option>
                        <option>Press & Media</option>
                        <option>Internal Review</option>
                        <option>Public Link</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-2">Description / Intake Notes</label>
                      <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full min-h-[100px] border border-border-subtle rounded-lg p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand shadow-sm bg-white" placeholder="Add welcome text for the landing page..."></textarea>
                    </div>
                  </div>
                </div>
              )}

              {createStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                  <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center"><Sliders size={16} className="mr-2 text-brand" /> Behavior & Settings</h4>

                  <div className="space-y-6">
                    {/* Security */}
                    <div className="bg-white p-5 rounded-xl border shadow-sm">
                      <h5 className="font-bold text-sm mb-4 border-b pb-2 text-gray-800 flex items-center"><Lock size={14} className="mr-2 text-gray-400" /> Security & Access</h5>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-bold text-gray-900 block">Password Protect Showroom</span>
                          <span className="text-xs font-medium text-gray-500">Require an entry code to view products.</span>
                        </div>
                        <input type="checkbox" checked={formData.passwordProtected} onChange={e => setFormData({ ...formData, passwordProtected: e.target.checked })} className="w-4 h-4 text-brand bg-gray-100 border-gray-300 rounded focus:ring-brand" />
                      </label>
                    </div>

                    {/* Toggles */}
                    <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                      <h5 className="font-bold text-sm mb-2 border-b pb-2 text-gray-800 flex items-center"><List size={14} className="mr-2 text-gray-400" /> Presentation Toggles</h5>

                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-bold text-gray-700">Display Pricing Table</span>
                        <input type="checkbox" checked={formData.showPrices} onChange={e => setFormData({ ...formData, showPrices: e.target.checked })} className="w-4 h-4 text-brand bg-gray-100 border-gray-300 rounded" />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-bold text-gray-700">Enable "Request Quote" Buttons</span>
                        <input type="checkbox" checked={formData.quoteRequest} onChange={e => setFormData({ ...formData, quoteRequest: e.target.checked })} className="w-4 h-4 text-brand bg-gray-100 border-gray-300 rounded" />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm font-bold text-gray-700">Enable "Order Samples" Buttons</span>
                        <input type="checkbox" checked={formData.sampleRequest} onChange={e => setFormData({ ...formData, sampleRequest: e.target.checked })} className="w-4 h-4 text-brand bg-gray-100 border-gray-300 rounded" />
                      </label>
                    </div>

                    {/* Aesthetics */}
                    <div className="bg-white p-5 rounded-xl border shadow-sm">
                      <h5 className="font-bold text-sm mb-4 border-b pb-2 text-gray-800 flex items-center"><Palette size={14} className="mr-2 text-gray-400" /> Aesthetics</h5>
                      <label className="text-xs font-bold text-gray-700 block mb-2">Accent Theme Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={formData.themeColor} onChange={e => setFormData({ ...formData, themeColor: e.target.value })} className="w-10 h-10 border-0 p-0 rounded-lg cursor-pointer" />
                        <div className="h-10 flex-1 bg-gray-50 border rounded-lg flex items-center px-3 font-mono text-xs text-gray-500">{formData.themeColor}</div>
                      </div>

                      <label className="text-xs font-bold text-gray-700 block mb-2 mt-4">Hero Banner Image</label>
                      <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-gray-400 cursor-pointer transition-colors shadow-inner">
                        <Upload size={20} className="mb-2" />
                        <span className="text-xs font-bold">Drag image or click to upload</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {createStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300 flex flex-col h-full">
                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-2 flex items-center"><Box size={16} className="mr-2 text-brand" /> Select Content: {formData.source}</h4>
                    <p className="text-sm text-gray-500 font-medium">Use the interface below to assign the data source logic into the showroom view.</p>
                  </div>

                  <div className="flex-1 bg-white border border-gray-200 shadow-inner rounded-xl flex flex-col items-center justify-center min-h-[300px] text-center p-8">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border text-gray-300 mb-4"><LayoutGrid size={28} /></div>
                    <h5 className="font-bold text-gray-800 mb-2">Simulated Content Picker Node</h5>
                    <p className="text-xs font-medium text-gray-500 max-w-xs leading-relaxed">In a production environment, this view queries the database matching your source ({formData.source}) allowing checklist selections.</p>
                    <Button variant="outline" className="mt-6 border-brand text-brand hover:bg-brand-soft/50 shadow-sm"><CheckCircle2 size={16} className="mr-2" /> Auto-Select All Available</Button>
                  </div>
                </div>
              )}

              {createStep === 5 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                  <div className="text-center py-6 mb-2 border-b">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-sm"><CheckCircle2 size={32} /></div>
                    <h4 className="text-2xl font-bold text-gray-900 tracking-tight">Showroom Configured</h4>
                    <p className="text-sm text-gray-500 font-medium mt-1">Review the final logic before compilation.</p>
                  </div>

                  <div className="bg-white border rounded-xl overflow-hidden shadow-sm text-sm">
                    <div className="grid grid-cols-3 border-b">
                      <div className="p-4 border-r bg-gray-50 font-bold text-gray-600 text-xs tracking-wider uppercase">Name</div>
                      <div className="p-4 col-span-2 font-semibold text-gray-900">{formData.name || 'Untitled Showroom'}</div>
                    </div>
                    <div className="grid grid-cols-3 border-b">
                      <div className="p-4 border-r bg-gray-50 font-bold text-gray-600 text-xs tracking-wider uppercase">Data Source</div>
                      <div className="p-4 col-span-2 font-semibold font-mono text-brand">{formData.source || 'Manual Selection'}</div>
                    </div>
                    <div className="grid grid-cols-3 border-b">
                      <div className="p-4 border-r bg-gray-50 font-bold text-gray-600 text-xs tracking-wider uppercase">Security</div>
                      <div className="p-4 col-span-2 font-semibold text-gray-900">{formData.passwordProtected ? 'Password Required' : 'Public Access (Open Mode)'}</div>
                    </div>
                    <div className="grid grid-cols-3">
                      <div className="p-4 border-r bg-gray-50 font-bold text-gray-600 text-xs tracking-wider uppercase">Features</div>
                      <div className="p-4 col-span-2 font-semibold text-gray-500 flex flex-wrap gap-2">
                        {formData.showPrices && <Badge variant="outline" className="bg-gray-50">Pricing</Badge>}
                        {formData.quoteRequest && <Badge variant="outline" className="bg-gray-50">Quotes</Badge>}
                        {formData.sampleRequest && <Badge variant="outline" className="bg-gray-50">Samples</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Footer Controls */}
            <div className="px-8 py-5 border-t border-border-strong bg-white flex justify-between shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
              <Button variant="outline" onClick={() => createStep > 1 ? setCreateStep(createStep - 1) : setIsCreateOpen(false)} className="shadow-sm font-bold min-w-[100px]">
                {createStep === 1 ? 'Cancel' : 'Back'}
              </Button>

              {createStep < 5 ? (
                <Button onClick={() => {
                  if (createStep === 1 && !formData.source) return toast.error('Please select a data source')
                  if (createStep === 2 && !formData.name) return toast.error('Showroom name is required')
                  setCreateStep(createStep + 1)
                }} className="min-w-[120px] shadow-sm font-bold">Continue <ChevronRight size={16} className="ml-1" /></Button>
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => finishWizard('draft')} className="text-gray-600 font-bold shadow-sm"><Save size={16} className="mr-2" /> Save Draft</Button>
                  <Button onClick={() => finishWizard('published')} className="bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold"><Globe size={16} className="mr-2" /> Publish Now</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
