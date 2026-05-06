import { useParams, Link } from 'react-router-dom'

export function PublicShowroomProductPage() {
  const { slug, id } = useParams()

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-[#e8e2da]">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link to={`/s/${slug}`} className="text-sm font-medium text-[#C47B2B] hover:underline">← Back to Showroom</Link>
          <div className="flex gap-3">
            <Link to={`/s/${slug}/wishlist`} className="text-sm text-[#8c7e72] hover:text-[#2c2420]">♡ Wishlist</Link>
            <Link to={`/s/${slug}/request-quote`} className="px-4 py-2 bg-[#C47B2B] text-white text-sm rounded-lg font-medium hover:bg-[#a86820] transition">Request Quote</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="bg-gray-100 rounded-2xl h-[500px] flex items-center justify-center">
            <p className="text-[#8c7e72]">Product image</p>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-xs text-[#8c7e72] uppercase tracking-wider mb-1">Product Details</p>
              <h1 className="text-3xl font-bold text-[#2c2420]">Product #{id?.slice(0, 8)}</h1>
            </div>
            <p className="text-[#8c7e72] leading-relaxed">Full product details will display here when products are linked to this showroom.</p>
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-[#C47B2B] text-white rounded-lg font-medium hover:bg-[#a86820] transition">Add to Quote</button>
              <button className="px-6 py-3 border border-[#e8e2da] text-[#2c2420] rounded-lg font-medium hover:bg-[#f0ede8] transition">♡ Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
