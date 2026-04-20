import { Button } from '../../components/ui/Button'

export function BuyerShowroomDetailPage() {
  const items = Array.from({ length: 9 }).map((_, i) => ({
    id: `it-${i + 1}`,
    img: `https://picsum.photos/seed/sd${i}/900/1200`,
    name: `Look ${i + 1}`,
  }))
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
      <div className="rounded-2xl overflow-hidden border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
        <div className="text-2xl font-bold tracking-tight">Showroom</div>
        <div className="text-muted mt-1">Explore featured looks and save favorites.</div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.id} className="rounded-xl overflow-hidden border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
            <div className="aspect-[3/4] bg-gray-100">
              <img alt="" src={it.img} className="w-full h-full object-cover" />
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="text-sm font-medium">{it.name}</div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">Wishlist</Button>
                <Button variant="secondary" size="sm">Request Sample</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
