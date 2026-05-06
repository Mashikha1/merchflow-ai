import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'

export function LookbookDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: catalog, isLoading, error } = useQuery({
    queryKey: ['catalogs', id],
    queryFn: () => api.get(`/catalogs/${id}`)
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  if (error || !catalog) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📖</div>
          <h2 className="text-xl font-bold text-content-primary">Lookbook not found</h2>
          <p className="text-sm text-content-secondary mt-2">This lookbook may have been deleted.</p>
          <Button className="mt-4" onClick={() => navigate('/lookbooks')}>Back to Lookbooks</Button>
        </div>
      </div>
    )
  }

  const items = Array.isArray(catalog.items) ? catalog.items : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">{catalog.name}</h1>
          <p className="text-sm text-content-secondary mt-1">{catalog.description || 'No description'}</p>
        </div>
        <div className="flex gap-2">
          <Badge>{catalog.audience || 'Private'}</Badge>
          <Button variant="secondary" onClick={() => navigate(`/catalogs/${id}/builder`)}>Edit in Builder</Button>
          <Button variant="secondary" onClick={() => navigate('/lookbooks')}>Back</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lookbook Contents</CardTitle>
          <CardDescription>{items.length} item(s) in this lookbook</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border-subtle rounded-xl">
              <div className="text-4xl mb-3">📸</div>
              <p className="text-sm text-content-secondary mb-4">No items in this lookbook yet.</p>
              <Button onClick={() => navigate(`/catalogs/${id}/builder`)}>Open Builder</Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item, i) => (
                <div key={item.productId || i} className="rounded-xl border border-border-subtle overflow-hidden">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name || 'Product'} className="h-48 w-full object-cover" />
                  )}
                  <div className="p-3">
                    <div className="text-sm font-semibold text-content-primary">{item.name || `Item ${i + 1}`}</div>
                    {item.sku && <div className="text-xs text-content-tertiary">{item.sku}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
