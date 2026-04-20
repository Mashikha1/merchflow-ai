import { Button } from '../../components/ui/Button'

export function BuyerWishlistPage() {
  const items = Array.from({ length: 6 }).map((_, i) => ({
    id: `wl-${i + 1}`,
    name: `Saved Item ${i + 1}`,
    img: `https://picsum.photos/seed/wl${i}/700/900`,
  }))
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">
      <div className="text-2xl font-bold tracking-tight">Wishlist</div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.id} className="rounded-xl overflow-hidden border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <div className="aspect-[3/4] bg-gray-100">
              <img alt="" src={it.img} className="w-full h-full object-cover" />
            </div>
            <div className="p-3">
              <div className="text-sm font-medium">{it.name}</div>
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" size="sm">Remove</Button>
                <Button size="sm">Request Quote</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
