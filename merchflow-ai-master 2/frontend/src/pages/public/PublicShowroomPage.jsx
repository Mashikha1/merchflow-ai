import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '../../components/ui/Skeleton'

const publicApi = async (path) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/public${path}`)
  if (!res.ok) throw new Error('Not found')
  return res.json()
}

const trackView = (entity, entityId, showroomId) => {
  fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/public/track`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity, entityId, showroomId, visitorId: localStorage.getItem('visitor_id') || crypto.randomUUID() })
  }).catch(() => {})
  if (!localStorage.getItem('visitor_id')) localStorage.setItem('visitor_id', crypto.randomUUID())
}

export function PublicShowroomPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const { data: showroom, isLoading, error } = useQuery({
    queryKey: ['public-showroom', slug],
    queryFn: async () => {
      const sr = await publicApi(`/showroom/${slug}`)
      trackView('showroom', sr.id, sr.id)
      return sr
    }
  })

  if (isLoading) return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" /><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96" />
      </div>
    </div>
  )

  if (error || !showroom) return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-5xl">🔒</div>
        <h1 className="text-2xl font-bold text-[#2c2420]">Showroom Not Found</h1>
        <p className="text-[#8c7e72]">This showroom may not be published or doesn't exist.</p>
      </div>
    </div>
  )

  const settings = typeof showroom.settings === 'object' ? showroom.settings : {}

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Hero */}
      {showroom.coverImage && (
        <div className="relative h-[400px] overflow-hidden">
          <img src={showroom.coverImage} alt={showroom.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-white tracking-tight">{showroom.name}</h1>
            {showroom.description && <p className="text-white/80 mt-2 max-w-xl">{showroom.description}</p>}
          </div>
        </div>
      )}

      {!showroom.coverImage && (
        <div className="bg-[#2c2420] py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-white tracking-tight">{showroom.name}</h1>
            {showroom.description && <p className="text-white/70 mt-2 max-w-xl">{showroom.description}</p>}
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-[#e8e2da]">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex gap-6 text-sm font-medium">
            <span className="text-[#2c2420] border-b-2 border-[#C47B2B] pb-1">Products</span>
          </div>
          <div className="flex gap-3">
            {settings.allowWishlist !== false && (
              <Link to={`/s/${slug}/wishlist`} className="text-sm text-[#8c7e72] hover:text-[#2c2420] transition">♡ Wishlist</Link>
            )}
            {settings.allowQuoteRequest !== false && (
              <Link to={`/s/${slug}/request-quote`} className="px-4 py-2 bg-[#C47B2B] text-white text-sm rounded-lg font-medium hover:bg-[#a86820] transition">Request Quote</Link>
            )}
          </div>
        </div>
      </div>

      {/* Content — placeholder until products are linked */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center py-16 space-y-4">
          <div className="text-5xl">🏬</div>
          <h2 className="text-xl font-bold text-[#2c2420]">Welcome to {showroom.name}</h2>
          <p className="text-[#8c7e72] max-w-md mx-auto">Products will appear here once they are added to this showroom. Use the showroom builder in your dashboard to curate this collection.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#2c2420] py-8 px-6 mt-20">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white/50 text-xs">Powered by MerchFlow AI</p>
        </div>
      </div>
    </div>
  )
}
