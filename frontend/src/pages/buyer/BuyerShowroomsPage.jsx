import { Link } from 'react-router-dom'

export function BuyerShowroomsPage() {
  const rows = Array.from({ length: 9 }).map((_, i) => ({
    id: `sr-${i + 1}`,
    name: `Showroom ${i + 1}`,
    cover: `https://picsum.photos/seed/sh${i}/900/600`,
  }))
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-2xl font-bold tracking-tight">Showrooms</div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <Link key={r.id} to={`/buyer/showrooms/${r.id}`} className="group rounded-2xl overflow-hidden border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <div className="aspect-[4/3]">
              <img alt="" src={r.cover} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
            </div>
            <div className="p-3 text-sm font-medium">{r.name}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
