import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import api from '../../lib/api'

export function BuyerShowroomDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: showroom, isLoading } = useQuery({
    queryKey: ['showrooms', id],
    queryFn: () => api(`/showrooms/${id}`)
  })

  const addWishlistM = useMutation({
    mutationFn: (productId) => api('/wishlist', { method: 'POST', body: JSON.stringify({ productId }) }),
    onSuccess: () => { toast.success('Added to wishlist ♡'); qc.invalidateQueries({ queryKey: ['wishlist'] }) }
  })

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-64" /><Skeleton className="h-8 w-64" /></div>
  if (!showroom) return <div className="p-8 text-center text-content-secondary">Showroom not found</div>

  const settings = typeof showroom.settings === 'object' ? showroom.settings : {}

  return (
    <div className="space-y-6">
      {showroom.coverImage && (
        <div className="relative h-56 rounded-2xl overflow-hidden">
          <img src={showroom.coverImage} alt={showroom.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold text-white">{showroom.name}</h1>
            {showroom.description && <p className="text-white/70 text-sm mt-1">{showroom.description}</p>}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        {!showroom.coverImage && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-content-primary">{showroom.name}</h1>
            {showroom.description && <p className="text-sm text-content-secondary mt-1">{showroom.description}</p>}
          </div>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="secondary" onClick={() => navigate('/buyer/showrooms')}>Back</Button>
          {settings.allowWishlist !== false && (
            <Button variant="secondary" onClick={() => navigate('/buyer/wishlist')}>♡ Wishlist</Button>
          )}
          {settings.allowQuoteRequest !== false && (
            <Button onClick={() => navigate('/buyer/request-quote')}>Request Quote</Button>
          )}
        </div>
      </div>

      {/* Also open in public mode */}
      <div className="p-4 rounded-xl border border-border-subtle bg-app-card-muted flex items-center justify-between">
        <div className="text-sm text-content-secondary">
          View the full public showroom experience at <span className="font-mono text-xs">/s/{showroom.slug}</span>
        </div>
        <Link to={`/s/${showroom.slug}`} className="text-sm text-brand hover:underline font-medium">Open Public View →</Link>
      </div>

      <div className="text-center py-16 space-y-3">
        <div className="text-4xl">🏬</div>
        <p className="text-sm text-content-secondary">Products from this showroom will appear here once linked.</p>
      </div>
    </div>
  )
}
