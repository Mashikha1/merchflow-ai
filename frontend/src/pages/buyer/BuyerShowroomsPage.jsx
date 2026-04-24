import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Skeleton } from '../../components/ui/Skeleton'
import api from '../../lib/api'

export function BuyerShowroomsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['showrooms'], queryFn: () => api('/showrooms') })
  const showrooms = (data || []).filter(s => s.status === 'Published')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-content-primary">Showrooms</h1>
        <p className="text-sm text-content-secondary mt-1">Browse active showrooms and explore products live.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : showrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-5xl">🏬</div>
          <h2 className="text-lg font-semibold text-content-primary">No showrooms available yet</h2>
          <p className="text-sm text-content-secondary">Published showrooms will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showrooms.map(s => (
            <Link key={s.id} to={`/buyer/showrooms/${s.id}`}
              className="group rounded-2xl overflow-hidden border border-border-subtle bg-white hover:shadow-lg transition-shadow">
              <div className="h-40 overflow-hidden bg-gray-100">
                {s.coverImage
                  ? <img src={s.coverImage} alt={s.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  : <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-brand/5 to-brand/20">🏬</div>
                }
              </div>
              <div className="p-4">
                <div className="text-sm font-bold text-content-primary">{s.name}</div>
                <div className="text-xs text-content-tertiary mt-1">/s/{s.slug}</div>
                {s.description && <p className="text-xs text-content-secondary mt-2 line-clamp-2">{s.description}</p>}
                <div className="mt-3 flex gap-2">
                  <span className="text-xs text-brand font-medium">Enter Showroom →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
