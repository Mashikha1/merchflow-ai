import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'

export function BuyerRequestQuotePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', company: '', phone: '',
    country: '', notes: '', minOrderQty: '50'
  })

  const [searchParams] = useSearchParams()
  const catalogId = searchParams.get('catalogId')
  const productId = searchParams.get('productId')

  const wishlistQ = useQuery({ queryKey: ['wishlist'], queryFn: () => api('/wishlist') })
  const wishlistItems = Array.isArray(wishlistQ.data) ? wishlistQ.data : []

  const catalogQ = useQuery({
    queryKey: ['catalogs', catalogId],
    queryFn: () => api(`/catalogs/${catalogId}`),
    enabled: !!catalogId
  })

  const productQ = useQuery({
    queryKey: ['products', productId],
    queryFn: () => api(`/products/${productId}`),
    enabled: !!productId
  })
  
  // Normalize catalog items to match wishlist item structure for the quote payload
  const catalogItems = catalogId && catalogQ.data?.items 
    ? catalogQ.data.items.map(item => ({
        id: `cat_item_${item.id}`,
        productId: item.id,
        product: { id: item.id, sku: item.sku, name: item.name, price: item.price || 0 }
      }))
    : []

  const singleProductItem = productId && productQ.data
    ? [{
        id: `single_item_${productQ.data.id}`,
        productId: productQ.data.id,
        product: productQ.data
      }]
    : []

  const requestItems = catalogId ? catalogItems : (productId ? singleProductItem : wishlistItems)

  const submitM = useMutation({
    mutationFn: (data) => api('/quotes', {
      method: 'POST',
      body: JSON.stringify({
        buyerName: data.name, buyerEmail: data.email, buyerCompany: data.company,
        buyerPhone: data.phone, buyerCountry: data.country, source: 'Buyer Portal',
        items: requestItems.map(wi => ({
          productId: wi.productId, sku: wi.product?.sku, name: wi.product?.name,
          qty: parseInt(data.minOrderQty) || 50, unitPrice: wi.product?.price || 0
        })),
        internalNotes: data.notes
      })
    }),
    onSuccess: () => setSubmitted(true),
    onError: (e) => toast.error(e.message || 'Failed to submit quote request')
  })

  if (submitted) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="text-5xl">✅</div>
      <h1 className="text-2xl font-bold text-content-primary">Quote Request Submitted</h1>
      <p className="text-sm text-content-secondary max-w-sm">Thank you, {form.name}! Our team will review your request and respond shortly.</p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate('/buyer/home')}>Go Home</Button>
        <Button onClick={() => navigate('/buyer/catalogs')}>Browse More</Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-content-primary">Request a Quote</h1>
        <p className="text-sm text-content-secondary mt-1">Fill in your details and we'll prepare a personalized wholesale quote.</p>
      </div>

      {requestItems.length > 0 && (
        <div className="p-4 rounded-xl border border-border-subtle bg-app-card-muted">
          <div className="text-sm font-medium text-content-primary mb-2">
            Items included in this quote request ({requestItems.length})
            {catalogId && <span className="ml-2 text-xs text-brand">(From Catalog)</span>}
          </div>
          <div className="space-y-1">
            {requestItems.map(wi => (
              <div key={wi.id} className="text-xs text-content-secondary flex justify-between">
                <span>{wi.product?.name || 'Product'}</span>
                <span className="text-content-tertiary">{wi.product?.sku}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="text-sm font-medium text-content-primary">Full Name *</label><Input className="mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="text-sm font-medium text-content-primary">Email *</label><Input className="mt-1" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
        <div><label className="text-sm font-medium text-content-primary">Company</label><Input className="mt-1" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
        <div><label className="text-sm font-medium text-content-primary">Phone</label><Input className="mt-1" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        <div><label className="text-sm font-medium text-content-primary">Country</label><Input className="mt-1" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
        <div><label className="text-sm font-medium text-content-primary">Min. Order Qty</label><Input className="mt-1" type="number" value={form.minOrderQty} onChange={e => setForm({ ...form, minOrderQty: e.target.value })} /></div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-content-primary">Notes</label>
          <textarea className="mt-1 w-full rounded-xl border border-border-subtle px-3 py-2 text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-brand resize-none" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any specific requirements, sizes, colours…" />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        <Button onClick={() => submitM.mutate(form)} disabled={!form.name || !form.email || submitM.isPending}>
          {submitM.isPending ? 'Submitting…' : 'Submit Quote Request'}
        </Button>
      </div>
    </div>
  )
}
