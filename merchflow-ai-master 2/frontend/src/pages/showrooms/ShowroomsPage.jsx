import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { PageHeader } from '../../components/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  Plus, MoreHorizontal, Eye, Edit2, Copy, Archive, Trash2,
  Link as LinkIcon, Globe, Lock, Globe2, Search, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../lib/cn'

function statusBadge(status) {
  const s = (status || '').toLowerCase()
  if (s === 'published') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (s === 'draft') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (s === 'archived') return 'bg-gray-100 text-gray-500 border-gray-200'
  return 'bg-gray-50 text-gray-600 border-gray-200'
}

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function ShowroomsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')

  const { data: showrooms = [], isLoading, refetch } = useQuery({
    queryKey: ['showrooms'],
    queryFn: () => api.get('/showrooms'),
  })

  const deleteM = useMutation({
    mutationFn: (id) => api.delete(`/showrooms/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['showrooms'] }); toast.success('Showroom deleted') }
  })

  const updateStatusM = useMutation({
    mutationFn: ({ id, status }) => api.put(`/showrooms/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['showrooms'] }); toast.success('Status updated') }
  })

  const filtered = showrooms.filter(s => {
    if (filterStatus !== 'All' && s.status?.toLowerCase() !== filterStatus.toLowerCase()) return false
    if (search && !(s.name + s.slug).toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const published = showrooms.filter(s => s.status?.toLowerCase() === 'published')
  const drafts = showrooms.filter(s => s.status?.toLowerCase() === 'draft')
  const STATS = [
    { label: 'Total Showrooms', value: showrooms.length },
    { label: 'Published', value: published.length },
    { label: 'Drafts', value: drafts.length },
    { label: 'Archived', value: showrooms.filter(s => s.status?.toLowerCase() === 'archived').length },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader title="Showrooms" subtitle="Manage your B2B buyer showrooms and digital storefronts." className="mb-0" />
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
          <Button onClick={() => navigate('/showrooms/new')}><Plus className="h-4 w-4 mr-2" /> New Showroom</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STATS.map(s => (
          <Card key={s.label} className="p-4 bg-white">
            <div className="text-xs font-bold text-content-tertiary uppercase tracking-wider">{s.label}</div>
            <div className="text-2xl font-black text-content-primary mt-2">{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search showrooms..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        {['All', 'Published', 'Draft', 'Archived'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors',
              filterStatus === s ? 'bg-brand text-white border-brand' : 'bg-white border-gray-200 text-gray-600 hover:border-brand hover:text-brand')}>
            {s}
          </button>
        ))}
      </div>

      {/* Showroom Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Globe2 className="h-12 w-12 text-gray-300" />
          <h2 className="text-lg font-semibold text-content-primary">
            {showrooms.length === 0 ? 'No showrooms yet' : 'No showrooms match filters'}
          </h2>
          <p className="text-sm text-content-secondary max-w-sm text-center">
            {showrooms.length === 0
              ? 'Create your first digital showroom to share products with wholesale buyers.'
              : 'Try adjusting your filters or search.'}
          </p>
          {showrooms.length === 0 && <Button onClick={() => navigate('/showrooms/new')}><Plus className="h-4 w-4 mr-2" /> Create First Showroom</Button>}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(showroom => (
            <Card key={showroom.id} className="group overflow-hidden border border-border-subtle bg-white hover:shadow-md transition-shadow">
              {/* Cover */}
              <div className="h-36 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative">
                {showroom.coverImage
                  ? <img src={showroom.coverImage} alt={showroom.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-5xl">🏬</div>
                }
                <div className="absolute top-3 left-3">
                  <Badge variant="outline" className={cn('text-[10px] font-bold shadow-sm', statusBadge(showroom.status))}>
                    {showroom.status || 'Draft'}
                  </Badge>
                </div>
                {showroom.settings?.passwordProtected && (
                  <div className="absolute top-3 right-3 bg-white/80 rounded p-1" title="Password Protected">
                    <Lock className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-content-primary truncate">{showroom.name}</div>
                    <div className="text-xs text-content-tertiary mt-0.5">/s/{showroom.slug}</div>
                  </div>
                  <div className="relative shrink-0">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/showrooms/${showroom.id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/s/${showroom.slug}`)
                        toast.success('Link copied!')
                      }}>
                        <LinkIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => {
                        if (confirm(`Delete "${showroom.name}"?`)) deleteM.mutate(showroom.id)
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {showroom.description && (
                  <p className="text-xs text-content-secondary mt-2 line-clamp-2">{showroom.description}</p>
                )}

                <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between">
                  <span className="text-xs text-content-tertiary">Updated {timeAgo(showroom.updatedAt)}</span>
                  <div className="flex gap-1">
                    {showroom.status?.toLowerCase() !== 'published' && (
                      <Button size="sm" className="h-7 text-xs" onClick={() => updateStatusM.mutate({ id: showroom.id, status: 'Published' })}>
                        <Globe className="h-3 w-3 mr-1" /> Publish
                      </Button>
                    )}
                    {showroom.status?.toLowerCase() === 'published' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatusM.mutate({ id: showroom.id, status: 'Draft' })}>
                        Unpublish
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
