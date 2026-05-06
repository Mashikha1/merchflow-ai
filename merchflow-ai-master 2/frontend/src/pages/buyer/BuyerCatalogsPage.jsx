import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Skeleton } from '../../components/ui/Skeleton'
import api from '../../lib/api'

export function BuyerCatalogsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['catalogs'], queryFn: () => api('/catalogs') })
  const catalogs = (data || []).filter(c => c.status === 'Published' || c.status === 'Approved')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-content-primary">Catalogs</h1>
        <p className="text-sm text-content-secondary mt-1">Browse all available product catalogs curated for you.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      ) : catalogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-5xl">📖</div>
          <h2 className="text-lg font-semibold text-content-primary">No catalogs available yet</h2>
          <p className="text-sm text-content-secondary">Published catalogs will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalogs.map(c => (
            <Link key={c.id} to={`/buyer/catalogs/${c.id}`}
              className="group rounded-2xl overflow-hidden border border-border-subtle bg-white hover:shadow-lg transition-shadow">
              <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                {c.coverImage
                  ? <img src={c.coverImage} alt={c.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  : <div className="w-full h-full flex items-center justify-center text-5xl">📖</div>
                }
              </div>
              <div className="p-4">
                <div className="text-sm font-bold text-content-primary">{c.name}</div>
                <div className="text-xs text-content-tertiary mt-1">{c.type} • {c.audience}</div>
                {c.description && <p className="text-xs text-content-secondary mt-2 line-clamp-2">{c.description}</p>}
                <div className="mt-3 text-xs text-brand font-medium">View Catalog →</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
