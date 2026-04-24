import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { toast } from 'sonner'
import api from '../../lib/api'

export function BuyerCatalogDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: catalog, isLoading } = useQuery({
    queryKey: ['catalogs', id],
    queryFn: () => api(`/catalogs/${id}`)
  })

  const downloadPdf = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('merchflow_auth') || '{}')?.state?.token
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/catalogs/${id}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `catalog-${id}.pdf`; a.click()
      URL.revokeObjectURL(url)
      toast.success('Catalog PDF downloaded!')
    } catch { toast.error('Failed to download PDF') }
  }

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-64" /><Skeleton className="h-8 w-64" /><Skeleton className="h-48" /></div>
  if (!catalog) return <div className="p-8 text-center text-content-secondary">Catalog not found</div>

  const items = Array.isArray(catalog.items) ? catalog.items : []

  return (
    <div className="space-y-6">
      {catalog.coverImage && (
        <div className="relative h-64 rounded-2xl overflow-hidden">
          <img src={catalog.coverImage} alt={catalog.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold text-white">{catalog.name}</h1>
            <p className="text-white/70 text-sm mt-1">{catalog.type} • {catalog.audience}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        {!catalog.coverImage && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-content-primary">{catalog.name}</h1>
            <p className="text-sm text-content-secondary mt-1">{catalog.type} • {catalog.audience}</p>
          </div>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="secondary" onClick={() => navigate('/buyer/catalogs')}>Back</Button>
          <Button variant="secondary" onClick={downloadPdf}>⬇ Download PDF</Button>
          <Button onClick={() => navigate(`/buyer/request-quote?catalogId=${id}`)}>Request Quote</Button>
        </div>
      </div>

      {catalog.description && (
        <p className="text-sm text-content-secondary max-w-2xl">{catalog.description}</p>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="text-4xl">📦</div>
          <p className="text-sm text-content-secondary">Products will appear here once they are added to this catalog.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, i) => (
            <div key={i} className="group rounded-xl border border-border-subtle overflow-hidden bg-white hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-100 overflow-hidden">
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                }
              </div>
              <div className="p-3">
                <div className="text-sm font-semibold text-content-primary truncate">{item.name || 'Product'}</div>
                <div className="text-xs text-content-tertiary mt-0.5">SKU: {item.sku || '—'}</div>
                {item.price && <div className="text-sm font-bold text-brand mt-1">${item.price}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
