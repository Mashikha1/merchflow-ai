import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import api from '../../lib/api'

export function BuyerWishlistPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api('/wishlist')
  })

  const removeM = useMutation({
    mutationFn: (itemId) => api(`/wishlist/${itemId}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Removed from wishlist'); qc.invalidateQueries({ queryKey: ['wishlist'] }) }
  })

  const items = Array.isArray(data) ? data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">My Wishlist</h1>
          <p className="text-sm text-content-secondary mt-1">{items.length} saved {items.length === 1 ? 'item' : 'items'}</p>
        </div>
        {items.length > 0 && (
          <Button onClick={() => navigate('/buyer/request-quote')}>Request Quote for All</Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-5xl">♡</div>
          <h2 className="text-lg font-semibold text-content-primary">Your wishlist is empty</h2>
          <p className="text-sm text-content-secondary">Browse showrooms and catalogs to save items.</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/buyer/catalogs')}>Browse Catalogs</Button>
            <Button onClick={() => navigate('/buyer/showrooms')}>Browse Showrooms</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const product = item.product || {}
            return (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border border-border-subtle bg-white hover:bg-app-card-muted transition-colors">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {product.images?.[0]
                    ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-content-primary">{product.name || 'Product'}</div>
                  <div className="text-xs text-content-tertiary mt-0.5">SKU: {product.sku || '—'}</div>
                  {product.price && <div className="text-sm font-medium text-brand mt-1">${product.price}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => removeM.mutate(item.id)}>Remove</Button>
                </div>
              </div>
            )
          })}
          <div className="pt-4 border-t border-border-subtle flex justify-end">
            <Button onClick={() => navigate('/buyer/request-quote')}>
              Request Quote for {items.length} Item{items.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
