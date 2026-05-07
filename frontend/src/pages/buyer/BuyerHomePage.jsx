import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'

export function BuyerHomePage() {
  const user = useAuthStore((s) => s.user)

  const catalogsQ = useQuery({ queryKey: ['catalogs'], queryFn: () => api('/catalogs') })
  const showroomsQ = useQuery({ queryKey: ['showrooms'], queryFn: () => api('/showrooms') })
  const wishlistQ = useQuery({ queryKey: ['wishlist'], queryFn: () => api('/wishlist') })

  const catalogs = (catalogsQ.data || []).filter(c => c.status === 'Published' || c.status === 'Approved').slice(0, 4)
  const showrooms = (showroomsQ.data || []).filter(s => s.status === 'Published').slice(0, 6)
  const wishlistCount = (wishlistQ.data || []).length

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold tracking-tight">Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</div>
          <div className="text-muted mt-1">Explore catalogs and showrooms curated for you.</div>
        </div>
        <div className="flex gap-2">
          <Link to="/buyer/wishlist">
            <Button variant="secondary">♡ Wishlist {wishlistCount > 0 && `(${wishlistCount})`}</Button>
          </Link>
          <Link to="/buyer/request-quote">
            <Button>Request Quote</Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Active Catalogs', value: catalogs.length, link: '/buyer/catalogs', icon: '📖' },
          { label: 'Open Showrooms', value: showrooms.length, link: '/buyer/showrooms', icon: '🏬' },
          { label: 'Wishlist Items', value: wishlistCount, link: '/buyer/wishlist', icon: '♡' },
        ].map(s => (
          <Link key={s.label} to={s.link} className="group p-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="text-3xl">{s.icon}</div>
            <div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-muted">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Catalogs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Latest Catalogs</h2>
          <Link to="/buyer/catalogs" className="text-sm text-brand hover:underline">View all →</Link>
        </div>
        {catalogsQ.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-[200px] rounded-2xl" /><Skeleton className="h-[200px] rounded-2xl" /><Skeleton className="h-[200px] rounded-2xl" /></div>
        ) : catalogs.length === 0 ? (
          <div className="text-center py-10 text-muted">No published catalogs available yet.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {catalogs.map((c) => {
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

      {/* Showrooms */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Featured Showrooms</h2>
          <Link to="/buyer/showrooms" className="text-sm text-brand hover:underline">View all →</Link>
        </div>
        {showroomsQ.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-[200px] rounded-2xl" />)}
          </div>
        ) : showrooms.length === 0 ? (
          <div className="text-center py-8 text-muted">No published showrooms yet.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {showrooms.map((s) => (
              <Link key={s.id} to={`/buyer/showrooms/${s.id}`}
                className="group flex flex-col rounded-2xl border border-[rgb(var(--border))] overflow-hidden bg-[rgb(var(--surface))] hover:shadow-lg transition-all hover:-translate-y-1 h-[200px]">
                <div className="flex-1 overflow-hidden bg-[#C47B2B]/10">
                  {s.coverImage 
                    ? <img src={s.coverImage} alt={s.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl">🏬</div>
                  }
                </div>
                <div className="p-4 shrink-0 bg-white flex items-center justify-between">
                  <div>
                    <div className="text-[15px] font-bold text-gray-900 truncate">{s.name}</div>
                    <div className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">/s/{s.slug}</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#C47B2B]/10 text-[#C47B2B] flex items-center justify-center text-xs font-bold group-hover:bg-[#C47B2B] group-hover:text-white transition-colors">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
