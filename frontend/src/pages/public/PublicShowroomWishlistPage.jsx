import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'

export function PublicShowroomWishlistPage() {
  const { slug } = useParams()
  const [items] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`wishlist_${slug}`) || '[]') } catch { return [] }
  })

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-[#e8e2da]">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link to={`/s/${slug}`} className="text-sm font-medium text-[#C47B2B] hover:underline">← Back to Showroom</Link>
          <Link to={`/s/${slug}/request-quote`} className="px-4 py-2 bg-[#C47B2B] text-white text-sm rounded-lg font-medium hover:bg-[#a86820] transition">Request Quote</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-[#2c2420] mb-2">Your Wishlist</h1>
        <p className="text-sm text-[#8c7e72] mb-8">Items you've saved while browsing this showroom.</p>

        {items.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-5xl">♡</div>
            <h2 className="text-lg font-semibold text-[#2c2420]">Your wishlist is empty</h2>
            <p className="text-sm text-[#8c7e72]">Browse the showroom and click the heart icon to save products.</p>
            <Link to={`/s/${slug}`} className="inline-block mt-4 px-6 py-3 bg-[#C47B2B] text-white rounded-lg font-medium hover:bg-[#a86820] transition">Browse Products</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#e8e2da]">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xl">📦</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#2c2420]">{item.name || 'Product'}</div>
                  <div className="text-xs text-[#8c7e72]">{item.sku || ''}</div>
                </div>
                <button className="text-sm text-red-400 hover:text-red-600 transition">Remove</button>
              </div>
            ))}
            <div className="pt-4 text-center">
              <Link to={`/s/${slug}/request-quote`} className="inline-block px-8 py-3 bg-[#C47B2B] text-white rounded-lg font-medium hover:bg-[#a86820] transition">Request Quote for All Items</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
