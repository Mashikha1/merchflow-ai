import { Link } from 'react-router-dom'

const list = Array.from({ length: 8 }).map((_, i) => ({
  id: `cat-${i + 1}`,
  name: `Catalog ${i + 1}`,
  cover: `https://picsum.photos/seed/cat${i}/800/500`,
}))

export function BuyerCatalogsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-2xl font-bold tracking-tight">Catalogs</div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <Link key={c.id} to={`/buyer/catalogs/${c.id}`} className="group rounded-2xl overflow-hidden border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <div className="aspect-[16/10] bg-gray-100">
              <img alt="" src={c.cover} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
            </div>
            <div className="p-3 text-sm font-medium">{c.name}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
