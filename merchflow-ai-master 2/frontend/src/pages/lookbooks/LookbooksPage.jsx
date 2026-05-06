import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import { PageHeader } from '../../components/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/EmptyState'
import { Plus, BookOpen, Trash2, Eye, Edit, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function LookbooksPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Lookbooks are stored as catalogs with type='lookbook'
  const { data = [], isLoading } = useQuery({
    queryKey: ['lookbooks'],
    queryFn: () => api.get('/catalogs').then(all => all.filter(c => c.type === 'lookbook')),
  })

  const deleteM = useMutation({
    mutationFn: (id) => api.delete(`/catalogs/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lookbooks'] }); toast.success('Lookbook deleted') },
    onError: () => toast.error('Failed to delete lookbook')
  })

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lookbooks"
        description="Visual catalogs and editorial lookbooks for your brand."
        action={<Button onClick={() => navigate('/lookbooks/new')}><Plus size={16} className="mr-2" />New Lookbook</Button>}
      />

      {data.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No lookbooks yet"
          description="Create your first lookbook to start sharing editorial content with buyers."
          action={<Button onClick={() => navigate('/lookbooks/new')}>Create Lookbook</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(lb => (
            <Card key={lb.id} className="p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-content-primary truncate">{lb.name}</h3>
                  <p className="text-xs text-content-secondary mt-0.5 flex items-center gap-1">
                    <Calendar size={11} />
                    {lb.updatedAt ? formatDistanceToNow(new Date(lb.updatedAt), { addSuffix: true }) : '—'}
                  </p>
                </div>
                <Badge variant={lb.status === 'Published' ? 'success' : 'default'} className="ml-2 shrink-0">
                  {lb.status || 'Draft'}
                </Badge>
              </div>
              {lb.description && (
                <p className="text-sm text-content-secondary mb-4 line-clamp-2">{lb.description}</p>
              )}
              <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border-subtle">
                <Button variant="secondary" size="sm" className="flex-1"
                  onClick={() => navigate(`/lookbooks/${lb.id}/builder`)}>
                  <Edit size={13} className="mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm"
                  onClick={() => { if (window.confirm('Delete this lookbook?')) deleteM.mutate(lb.id) }}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
