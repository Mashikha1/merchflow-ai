import { Button } from '../../components/ui/Button'

export function BuyerCatalogDetailPage() {
  const products = Array.from({ length: 12 }).map((_, i) => ({
    id: `p-${i + 1}`,
    name: `Product ${i + 1}`,
    img: `https://picsum.photos/seed/cp${i}/600/800`,
    price: 25 + i,
  }))
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
      <div className="rounded-2xl overflow-hidden border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
        <div className="aspect-[16/5] bg-gray-100">
          <img alt="" src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1600&auto=format&fit=crop" className="w-full h-full object-cover" />
        </div>
        <div className="p-6">
          <div className="text-2xl font-bold tracking-tight">Catalog</div>
          <div className="text-muted mt-1">Browse and add to wishlist or request a quote.</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] overflow-hidden">
            <div className="aspect-[3/4] bg-gray-100">
              <img alt="" src={p.img} className="w-full h-full object-cover" />
            </div>
            <div className="p-3">
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs text-muted">${p.price}</div>
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" size="sm">Wishlist</Button>
                <Button variant="secondary" size="sm">Add to Quote</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
