import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import api from '../../lib/api'

export function ShowroomNewPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', description: '', slug: '', coverImage: '',
    settings: { allowWishlist: true, allowQuoteRequest: true, showPrices: true }
  })

  const mutation = useMutation({
    mutationFn: (data) => api('/showrooms', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (sr) => {
      toast.success('Showroom created', { description: sr.name })
      qc.invalidateQueries({ queryKey: ['showrooms'] })
      navigate(`/showrooms/${sr.id}`)
    },
    onError: () => toast.error('Failed to create showroom')
  })

  const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">Create Showroom</h1>
          <p className="text-sm text-content-secondary mt-1">Set up a public-facing product showroom for buyers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/showrooms')}>Cancel</Button>
          <Button onClick={() => mutation.mutate(form)} disabled={!form.name || mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create Showroom'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle><CardDescription>Basic showroom information.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-content-primary">Showroom Name</label>
              <Input className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: autoSlug(e.target.value) })} placeholder="e.g. Spring/Summer 2026" />
            </div>
            <div>
              <label className="text-sm font-medium text-content-primary">URL Slug</label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-content-tertiary">/s/</span>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="spring-summer-2026" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-content-primary">Description</label>
              <textarea className="mt-1 w-full rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-brand" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A brief description for buyers…" />
            </div>
            <div>
              <label className="text-sm font-medium text-content-primary">Cover Image URL</label>
              <Input className="mt-1" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://…" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Settings</CardTitle><CardDescription>Configure buyer features.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'allowWishlist', label: 'Allow Wishlist', desc: 'Buyers can save products to a wishlist' },
              { key: 'allowQuoteRequest', label: 'Allow Quote Requests', desc: 'Buyers can request a quote directly' },
              { key: 'showPrices', label: 'Show Prices', desc: 'Display product prices publicly' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:bg-app-card-muted transition cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-content-primary">{label}</div>
                  <div className="text-xs text-content-tertiary">{desc}</div>
                </div>
                <input type="checkbox" checked={form.settings[key]} onChange={(e) => setForm({ ...form, settings: { ...form.settings, [key]: e.target.checked } })} className="w-4 h-4 accent-brand" />
              </label>
            ))}
            {form.coverImage && (
              <div className="rounded-xl overflow-hidden border border-border-subtle">
                <img src={form.coverImage} alt="Cover preview" className="w-full h-40 object-cover" onError={(e) => { e.target.style.display = 'none' }} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
