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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {catalogs.map(c => {
            const coverImg = c.coverImage || (Array.isArray(c.sections) ? c.sections.find(s => s.type === 'hero')?.data?.image : null);
            return (
              <Link key={c.id} to={`/buyer/catalogs/${c.id}`}
                className="group flex flex-col rounded-2xl border border-[rgb(var(--border))] overflow-hidden bg-[rgb(var(--surface))] hover:shadow-lg transition-all hover:-translate-y-1 h-[200px]">
                <div className="flex-1 overflow-hidden bg-gray-100">
                  {coverImg
                    ? <img src={coverImg} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
                  }
                </div>
                <div className="p-4 shrink-0 bg-white flex items-center justify-between">
                  <div>
                    <div className="text-[15px] font-bold text-gray-900 truncate">{c.name}</div>
                    <div className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{c.type} • {c.audience}</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#2c2420]/10 text-[#2c2420] flex items-center justify-center text-xs font-bold group-hover:bg-[#2c2420] group-hover:text-white transition-colors">
                    →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
