import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ChevronLeft, Save, MoreHorizontal, Sparkles, Image as ImageIcon, Tag, DollarSign,
  Box, LayoutGrid, Globe, Clock, CheckCircle2, AlertCircle, Book, Plus, Trash2
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../lib/api'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Tag },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'variants', label: 'Variants', icon: LayoutGrid },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'inventory', label: 'Inventory', icon: Box },
  { id: 'ai', label: 'AI Assets', icon: Sparkles },
  { id: 'publishing', label: 'Publishing', icon: Globe },
  { id: 'activity', label: 'Activity', icon: Clock },
]

// ─── Variants Tab ─────────────────────────────────────────────────────────────
function VariantsTab({ productId }) {
  const qc = useQueryClient()
  const [editingRow, setEditingRow] = useState(null)
  const [newVariant, setNewVariant] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['variants', productId],
    queryFn: () => api.get(`/variants?productId=${productId}`),
    enabled: !!productId,
  })
  const variants = Array.isArray(data) ? data : []

  const updateM = useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/variants/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['variants', productId] }); setEditingRow(null); toast.success('Variant saved') }
  })

  const deleteM = useMutation({
    mutationFn: (id) => api.delete(`/variants/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['variants', productId] }); toast.success('Variant deleted') }
  })

  const createM = useMutation({
    mutationFn: (body) => api.post('/variants', { ...body, productId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['variants', productId] }); setNewVariant(null); toast.success('Variant added') }
  })

  if (isLoading) return <div className="p-6 space-y-3"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Variant Matrix</h3>
          <p className="text-sm text-gray-500 mt-0.5">{variants.length} variants configured</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setNewVariant({ sku: '', price: '', stock: '', attributes: {} })}>
          <Plus className="h-4 w-4 mr-1" /> Add Variant
        </Button>
      </div>

      {variants.length === 0 && !newVariant ? (
        <div className="p-12 text-center text-gray-500">
          <LayoutGrid className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-700 mb-1">No variants yet</p>
          <p className="text-xs text-gray-500 mb-4">Add variants like different sizes, colors, or styles.</p>
          <Button variant="outline" size="sm" onClick={() => setNewVariant({ sku: '', price: '', stock: '', attributes: {} })}>
            <Plus className="h-4 w-4 mr-1" /> Add First Variant
          </Button>
        </div>
      ) : (
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 font-medium text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-6 py-3">Attributes</th>
              <th className="px-6 py-3">SKU</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Stock</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {variants.map((v) => {
              const isEditing = editingRow?.id === v.id
              return (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800">
                    {typeof v.attributes === 'object'
                      ? Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(' • ')
                      : v.attributes || '—'}
                  </td>
                  <td className="px-6 py-3">
                    {isEditing
                      ? <Input value={editingRow.sku} onChange={e => setEditingRow({ ...editingRow, sku: e.target.value })} className="h-8 text-xs" />
                      : v.sku || '—'}
                  </td>
                  <td className="px-6 py-3">
                    {isEditing
                      ? <Input type="number" value={editingRow.price} onChange={e => setEditingRow({ ...editingRow, price: e.target.value })} className="h-8 text-xs w-24" />
                      : `$${v.price ?? '—'}`}
                  </td>
                  <td className="px-6 py-3">
                    {isEditing
                      ? <Input type="number" value={editingRow.stock} onChange={e => setEditingRow({ ...editingRow, stock: e.target.value })} className="h-8 text-xs w-24" />
                      : v.stock ?? '—'}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={() => updateM.mutate(editingRow)} disabled={updateM.isPending}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingRow(null)}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setEditingRow({ id: v.id, sku: v.sku || '', price: v.price || '', stock: v.stock || '' })}>Edit</Button>
                          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => deleteM.mutate(v.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}

            {/* New variant row */}
            {newVariant && (
              <tr className="bg-blue-50/30">
                <td className="px-6 py-3">
                  <Input value={newVariant.attributes?.label || ''} onChange={e => setNewVariant({ ...newVariant, attributes: { label: e.target.value } })} className="h-8 text-xs" placeholder="e.g. Red / Large" />
                </td>
                <td className="px-6 py-3"><Input value={newVariant.sku} onChange={e => setNewVariant({ ...newVariant, sku: e.target.value })} className="h-8 text-xs" placeholder="SKU" /></td>
                <td className="px-6 py-3"><Input type="number" value={newVariant.price} onChange={e => setNewVariant({ ...newVariant, price: e.target.value })} className="h-8 text-xs w-24" placeholder="0.00" /></td>
                <td className="px-6 py-3"><Input type="number" value={newVariant.stock} onChange={e => setNewVariant({ ...newVariant, stock: e.target.value })} className="h-8 text-xs w-24" placeholder="0" /></td>
                <td className="px-6 py-3 flex gap-2">
                  <Button size="sm" onClick={() => createM.mutate({ sku: newVariant.sku, price: Number(newVariant.price), stock: Number(newVariant.stock), attributes: newVariant.attributes })} disabled={createM.isPending}>Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setNewVariant(null)}>Cancel</Button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isNew = id === 'new'
  const [activeTab, setActiveTab] = useState('overview')

  const { data: product, isLoading } = useQuery({
    queryKey: ['products', id],
    queryFn: () => api.get(`/products/${id}`),
    enabled: !!id && !isNew,
  })

  const updateM = useMutation({
    mutationFn: (body) => api.patch(`/products/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Product saved') }
  })

  const [form, setForm] = useState({})
  const data = { ...product, ...form }

  if (isLoading) return (
    <div className="max-w-[1400px] mx-auto pb-20 space-y-4">
      <Skeleton className="h-12 w-64" /><Skeleton className="h-10 w-full" /><Skeleton className="h-96 w-full" />
    </div>
  )

  return (
    <div className="max-w-[1400px] mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/products">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><ChevronLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">{isNew ? 'New Product' : (data.name || 'Loading…')}</h1>
          {!isNew && <p className="text-sm text-gray-500">SKU: {data.sku || '—'}</p>}
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="outline" className="text-gray-600" onClick={() => navigate('/ai/try-on')}>
              <Sparkles className="h-4 w-4 mr-2 text-indigo-500" /> Generate AI Try-On
            </Button>
          )}
          <Button variant="outline" className="hidden sm:flex" onClick={() => navigate('/ai/descriptions')}>
            <Book className="h-4 w-4 mr-2" /> AI Descriptions
          </Button>
          {!isNew && (
            <Button onClick={() => updateM.mutate(form)} disabled={updateM.isPending}>
              <Save className="h-4 w-4 mr-2" /> {updateM.isPending ? 'Saving…' : 'Save Product'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-3/4 space-y-6">
          <div className="flex overflow-x-auto border-b border-gray-200 hide-scrollbar">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 px-1 border-b-2 mr-6 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}>
                  <Icon className="h-4 w-4" />{tab.label}
                </button>
              )
            })}
          </div>

          <div className="min-h-[500px]">
            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <Input value={form.name ?? (data.name || '')} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Product name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                        <Input value={form.sku ?? (data.sku || '')} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select value={form.status ?? (data.status || 'DRAFT')} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                          className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black">
                          <option value="ACTIVE">Active</option>
                          <option value="DRAFT">Draft</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={form.description ?? (data.description || '')} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black min-h-[80px] resize-y" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                      <Input value={form.tags?.join?.(',') ?? (Array.isArray(data.tags) ? data.tags.join(',') : '')} onChange={e => setForm(f => ({ ...f, tags: e.target.value.split(',').map(s => s.trim()) }))} placeholder="comma separated" />
                    </div>
                  </div>
                </Card>
                <Card className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-4">Pricing</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price (MSRP)</label>
                      <Input type="number" value={form.price ?? (data.price || '')} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                      <Input type="number" value={form.cost ?? (data.cost || '')} onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))} placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock on Hand</label>
                      <Input type="number" value={form.stock ?? (data.stock || '')} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} placeholder="0" />
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Media */}
            {activeTab === 'media' && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold border-b pb-4 mb-6">Product Media</h3>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer mb-6">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <ImageIcon className="h-10 w-10 mb-3 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">Click or drag images to upload</p>
                    <p className="text-xs mt-1">Supports JPG, PNG up to 10MB</p>
                  </div>
                </div>
                {(data.images || []).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(data.images || []).map((url, i) => (
                      <div key={i} className="aspect-[3/4] bg-gray-100 rounded-lg relative overflow-hidden group">
                        {i === 0 && <div className="absolute top-2 left-2 bg-black text-white text-[10px] uppercase px-2 py-0.5 rounded font-bold z-10">Primary</div>}
                        <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Variants — REAL API */}
            {activeTab === 'variants' && (
              isNew
                ? <div className="p-12 text-center text-gray-500">Save the product first to manage variants.</div>
                : <VariantsTab productId={id} />
            )}

            {/* Other tabs */}
            {activeTab !== 'overview' && activeTab !== 'media' && activeTab !== 'variants' && (
              <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed">
                <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400"><LayoutGrid /></div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{TABS.find(t => t.id === activeTab)?.label}</h3>
                <p className="text-sm text-gray-500 max-w-sm">This tab is managed from the main product overview. Save changes above to persist updates.</p>
              </Card>
            )}
          </div>
        </div>

        {/* Sticky right panel */}
        <div className="lg:w-1/4">
          <div className="sticky top-24 space-y-6">
            <Card className="p-5 border border-indigo-100 bg-indigo-50/30">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Product Readiness</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-medium text-gray-700">Completeness Score</span>
                    <span className="font-bold text-indigo-600">
                      {[data.name, data.sku, data.description, (data.images || []).length > 0, data.price, data.stock].filter(Boolean).length * 17}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${[data.name, data.sku, data.description, (data.images || []).length > 0, data.price, data.stock].filter(Boolean).length * 17}%` }} />
                  </div>
                </div>
                <ul className="text-xs space-y-2 mt-4 text-gray-600">
                  <li className={`flex items-center gap-2 ${data.name ? 'text-green-600' : 'text-amber-600'}`}>
                    {data.name ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {data.name ? 'Name set' : 'Missing product name'}
                  </li>
                  <li className={`flex items-center gap-2 ${data.description ? 'text-green-600' : 'text-amber-600'}`}>
                    {data.description ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {data.description ? 'Description added' : 'No description'}
                  </li>
                  <li className={`flex items-center gap-2 ${(data.images || []).length > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    {(data.images || []).length > 0 ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {(data.images || []).length > 0 ? 'Images uploaded' : 'No images'}
                  </li>
                  <li className={`flex items-center gap-2 ${data.price ? 'text-green-600' : 'text-amber-600'}`}>
                    {data.price ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {data.price ? 'Price set' : 'Missing price'}
                  </li>
                </ul>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Status & Visibility</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select value={form.status ?? (data.status || 'DRAFT')} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black">
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <span className="block text-xs font-medium text-gray-500 mb-2">Publishing Channels</span>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="rounded text-black" /> Buyer Showrooms</label>
                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="rounded text-black" /> Catalog PDF Export</label>
                  </div>
                </div>
              </div>
            </Card>

            {!isNew && (
              <div className="text-xs text-center text-gray-400">
                Last updated {data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : '—'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
