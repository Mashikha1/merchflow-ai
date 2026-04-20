import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

const catalogs = [
  { id: 'fall', name: 'Fall ’26 Lookbook', cover: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1200&auto=format&fit=crop' },
  { id: 'core', name: 'Core Essentials', cover: 'https://images.unsplash.com/photo-1503342217505-b0a15cf70489?q=80&w=1200&auto=format&fit=crop' },
]

export function BuyerHomePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold tracking-tight">Welcome</div>
          <div className="text-muted mt-1">Explore catalogs and showrooms from Aurora Studio</div>
        </div>
        <div className="flex gap-2">
          <Link to="/buyer/wishlist"><Button variant="secondary">Wishlist</Button></Link>
          <Link to="/buyer/request-quote"><Button>Request Quote</Button></Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {catalogs.map((c) => (
          <Link key={c.id} to={`/buyer/catalogs/${c.id}`} className="group rounded-2xl overflow-hidden border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <div className="aspect-[16/9] overflow-hidden">
              <img alt="" src={c.cover} className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]" />
            </div>
            <div className="p-4">
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="text-xs text-muted mt-1">Curated selection • Updated weekly</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
        <div className="text-[15px] font-semibold tracking-[-0.02em]">Featured Showrooms</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Link key={i} to={`/buyer/showrooms/sr-${i + 1}`} className="rounded-xl overflow-hidden border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]">
              <div className="aspect-[4/3] bg-gray-100">
                <img alt="" src={`https://picsum.photos/seed/sr${i}/600/400`} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 text-sm font-medium">Seasonal Edit {i + 1}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
