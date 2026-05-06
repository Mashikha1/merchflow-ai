import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import api from '../../lib/api'

export function ShowroomDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState('overview')

  const { data: showroom, isLoading } = useQuery({
    queryKey: ['showrooms', id],
    queryFn: () => api(`/showrooms/${id}`)
  })

  const updateM = useMutation({
    mutationFn: (data) => api(`/showrooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Showroom updated'); qc.invalidateQueries({ queryKey: ['showrooms'] }) }
  })

  const publishM = useMutation({
    mutationFn: () => api(`/showrooms/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'Published' }) }),
    onSuccess: () => { toast.success('Showroom published!'); qc.invalidateQueries({ queryKey: ['showrooms'] }) }
  })

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /><Skeleton className="h-48" /></div>

  if (!showroom) return <div className="p-8 text-center text-content-secondary">Showroom not found</div>

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'settings', label: 'Settings' },
    { id: 'analytics', label: 'Analytics' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-content-primary">{showroom.name}</h1>
            <Badge variant={showroom.status === 'Published' ? 'success' : 'default'}>{showroom.status}</Badge>
          </div>
          <p className="text-sm text-content-secondary mt-1">
            Public URL: <Link to={`/s/${showroom.slug}`} className="text-brand hover:underline">/s/{showroom.slug}</Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/showrooms')}>Back</Button>
          {showroom.status !== 'Published' && (
            <Button onClick={() => publishM.mutate()} disabled={publishM.isPending}>
              {publishM.isPending ? 'Publishing…' : 'Publish'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-border-subtle">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t.id ? 'text-brand border-brand' : 'text-content-tertiary border-transparent hover:text-content-primary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {showroom.coverImage && (
              <div className="rounded-xl overflow-hidden border border-border-subtle">
                <img src={showroom.coverImage} alt={showroom.name} className="w-full h-56 object-cover" />
              </div>
            )}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-content-primary mb-2">Description</h3>
                <p className="text-sm text-content-secondary">{showroom.description || 'No description added yet.'}</p>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-content-tertiary">Status</span><Badge variant={showroom.status === 'Published' ? 'success' : 'default'}>{showroom.status}</Badge></div>
                <div className="flex justify-between text-sm"><span className="text-content-tertiary">Slug</span><span className="font-medium text-content-primary">{showroom.slug}</span></div>
                <div className="flex justify-between text-sm"><span className="text-content-tertiary">Created</span><span className="text-content-primary">{new Date(showroom.createdAt).toLocaleDateString()}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-content-primary mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="secondary" className="w-full justify-start" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/s/${showroom.slug}`); toast.success('Link copied!') }}>📋 Copy Public Link</Button>
                  <Button variant="secondary" className="w-full justify-start" onClick={() => navigate(`/s/${showroom.slug}`)}>🔗 Preview Showroom</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <ShowroomSettings showroom={showroom} onSave={(data) => updateM.mutate(data)} saving={updateM.isPending} />
      )}

      {tab === 'analytics' && (
        <Card>
          <CardHeader><CardTitle>Analytics</CardTitle><CardDescription>Page views and engagement for this showroom.</CardDescription></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Total Views', value: '—', desc: 'Page views tracked via /api/public/track' },
                { label: 'Wishlist Adds', value: '—', desc: 'Items wishlisted from this showroom' },
                { label: 'Quote Requests', value: '—', desc: 'Quotes submitted from this showroom' },
              ].map(m => (
                <div key={m.label} className="p-4 rounded-xl border border-border-subtle bg-app-card-muted">
                  <div className="text-xs text-content-tertiary">{m.label}</div>
                  <div className="text-2xl font-bold text-content-primary mt-1">{m.value}</div>
                  <div className="text-xs text-content-tertiary mt-1">{m.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ShowroomSettings({ showroom, onSave, saving }) {
  const [form, setForm] = useState({
    name: showroom.name || '', description: showroom.description || '',
    slug: showroom.slug || '', coverImage: showroom.coverImage || '',
    status: showroom.status || 'Draft'
  })

  return (
    <Card>
      <CardHeader><CardTitle>Showroom Settings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="text-sm font-medium">Name</label><Input className="mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-sm font-medium">Slug</label><Input className="mt-1" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
          <div className="md:col-span-2"><label className="text-sm font-medium">Description</label><textarea className="mt-1 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-brand" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div><label className="text-sm font-medium">Cover Image URL</label><Input className="mt-1" value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })} /></div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full h-10 rounded-lg border border-border-subtle px-3 text-sm outline-none focus:ring-2 focus:ring-brand">
              <option>Draft</option><option>Published</option><option>Archived</option>
            </select>
          </div>
        </div>
        <Button onClick={() => onSave(form)} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
      </CardContent>
    </Card>
  )
}
