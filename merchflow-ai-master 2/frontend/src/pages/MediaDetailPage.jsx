import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import api from '../lib/api'

export function MediaDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ filename: '', alt: '', tags: '' })

  const { data: media, isLoading } = useQuery({
    queryKey: ['media', id],
    queryFn: () => api(`/media/${id}`),
    onSuccess: (m) => setForm({ filename: m.filename || '', alt: m.alt || '', tags: (m.tags || []).join(', ') })
  })

  const updateM = useMutation({
    mutationFn: (data) => api(`/media/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Media updated'); setEditing(false); qc.invalidateQueries({ queryKey: ['media'] }) }
  })

  const deleteM = useMutation({
    mutationFn: () => api(`/media/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Media deleted'); navigate('/media') }
  })

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>
  if (!media) return <div className="p-8 text-center text-content-secondary">Media not found</div>

  // Set form on first load
  if (!editing && form.filename === '' && media.filename) {
    setForm({ filename: media.filename, alt: media.alt || '', tags: (media.tags || []).join(', ') })
  }

  const isImage = media.mimeType?.startsWith('image/')
  const isVideo = media.mimeType?.startsWith('video/')
  const sizeKB = media.size ? `${(media.size / 1024).toFixed(1)} KB` : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-content-primary">{media.filename}</h1>
          <p className="text-sm text-content-secondary mt-1">{media.mimeType} • {sizeKB}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/media')}>Back</Button>
          <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(media.url); toast.success('URL copied!') }}>Copy URL</Button>
          <Button variant="secondary" onClick={() => { if (confirm('Delete this file?')) deleteM.mutate() }}>Delete</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="p-4">
            {isImage && <img src={media.url} alt={media.alt || media.filename} className="w-full rounded-lg object-contain max-h-[600px] bg-gray-50" />}
            {isVideo && <video src={media.url} controls className="w-full rounded-lg max-h-[600px]" />}
            {!isImage && !isVideo && (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-content-tertiary">Preview not available for {media.mimeType}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <>
                  <div><label className="text-xs font-medium text-content-tertiary">Filename</label><Input className="mt-1" value={form.filename} onChange={e => setForm({ ...form, filename: e.target.value })} /></div>
                  <div><label className="text-xs font-medium text-content-tertiary">Alt Text</label><Input className="mt-1" value={form.alt} onChange={e => setForm({ ...form, alt: e.target.value })} placeholder="Describe this image…" /></div>
                  <div><label className="text-xs font-medium text-content-tertiary">Tags (comma-separated)</label><Input className="mt-1" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="product, hero, lifestyle" /></div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateM.mutate({ filename: form.filename, alt: form.alt, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) })} disabled={updateM.isPending}>{updateM.isPending ? 'Saving…' : 'Save'}</Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm"><span className="text-content-tertiary">Filename</span><span className="font-medium text-content-primary truncate ml-2">{media.filename}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-content-tertiary">Type</span><span className="text-content-primary">{media.mimeType}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-content-tertiary">Size</span><span className="text-content-primary">{sizeKB}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-content-tertiary">Alt Text</span><span className="text-content-primary">{media.alt || '—'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-content-tertiary">Created</span><span className="text-content-primary">{new Date(media.createdAt).toLocaleDateString()}</span></div>
                  {media.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {media.tags.map(t => <Badge key={t} variant="default">{t}</Badge>)}
                    </div>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit Details</Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>URL</CardTitle></CardHeader>
            <CardContent>
              <div className="p-3 rounded-lg bg-app-card-muted text-xs font-mono text-content-secondary break-all">{media.url}</div>
              <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={() => { navigator.clipboard.writeText(media.url); toast.success('Copied!') }}>Copy URL</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
