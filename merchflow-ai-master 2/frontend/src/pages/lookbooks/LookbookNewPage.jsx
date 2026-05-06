import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function LookbookNewPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    description: '',
    audience: 'Invite Only',
  })

  const createM = useMutation({
    mutationFn: (data) => api.post('/catalogs', { ...data, type: 'lookbook' }),
    onSuccess: (catalog) => {
      toast.success('Lookbook created')
      qc.invalidateQueries({ queryKey: ['catalogs'] })
      navigate(`/catalogs/${catalog.id}/builder`)
    },
    onError: (e) => toast.error(e.message || 'Failed to create lookbook')
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-content-primary">New Lookbook</h1>
        <p className="text-sm text-content-secondary mt-1">Create a new lookbook catalog with AI-assisted narrative.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lookbook Details</CardTitle>
          <CardDescription>Give your lookbook a name and description.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-lg">
          <div>
            <label className="text-sm font-medium text-content-primary">Lookbook Name</label>
            <Input className="mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Spring/Summer 2026" />
          </div>
          <div>
            <label className="text-sm font-medium text-content-primary">Description</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-brand"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the theme and purpose of this lookbook..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-content-primary">Audience</label>
            <select
              value={form.audience}
              onChange={e => setForm({ ...form, audience: e.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="Public">Public</option>
              <option value="Invite Only">Invite Only</option>
              <option value="Private">Private</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => createM.mutate(form)} disabled={!form.name || createM.isPending}>
              {createM.isPending ? 'Creating…' : 'Create Lookbook'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/lookbooks')}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
