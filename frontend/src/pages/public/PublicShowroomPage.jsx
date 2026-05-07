import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '../../components/ui/Skeleton'
import { ArrowLeft, Wand2, Heart, ShoppingCart } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { toast } from 'sonner'

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
  const user = useAuthStore(s => s.user)
  const [wishlist, setWishlist] = useState([])
  const [cart, setCart] = useState([])

  useEffect(() => {
    try {
      const storedW = JSON.parse(localStorage.getItem(`wishlist_${slug}`) || '[]')
      setWishlist(storedW)
      const storedC = JSON.parse(localStorage.getItem(`cart_${slug}`) || '[]')
      setCart(storedC)
    } catch {}
  }, [slug])

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id)
    let next
    if (existing) {
      next = cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
    } else {
      next = [...cart, { ...item, qty: 1 }]
    }
    setCart(next)
    localStorage.setItem(`cart_${slug}`, JSON.stringify(next))
    toast.success('Added to cart')
  }

  const toggleWishlist = async (item) => {
    let next = []
    const exists = wishlist.some(w => w.id === item.id)
    if (exists) next = wishlist.filter(w => w.id !== item.id)
    else next = [...wishlist, { ...item }]
    
    setWishlist(next)
    localStorage.setItem(`wishlist_${slug}`, JSON.stringify(next))
    
    if (user && (item.productId || item.id)) {
      try {
        const pId = item.productId || item.id
        if (exists) await api.delete(`/wishlist/${pId}`)
        else await api.post('/wishlist', { productId: pId })
        toast.success(exists ? 'Removed from your main wishlist' : 'Added to your main wishlist')
      } catch (e) {
        console.error('Failed to sync to main wishlist', e)
      }
    }
  }

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
  const sections = Array.isArray(showroom.sections) ? showroom.sections : []
  const items = Array.isArray(showroom.items) ? showroom.items : []

  const heroData = sections.find(s => s.type === 'hero')?.data
  const brandData = sections.find(s => s.type === 'brand_intro')?.data
  const featuredData = sections.find(s => s.type === 'featured_product')?.data
  const contactData = sections.find(s => s.type === 'contact')?.data

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Nav */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-[#e8e2da]">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex gap-6 text-sm font-medium items-center">
            <button onClick={() => navigate(user?.role === 'VIEWER' ? '/buyer/showrooms' : '/showrooms')} className="text-[#8c7e72] hover:text-[#2c2420] transition flex items-center gap-1 mr-4">
              <ArrowLeft size={16} /> Back
            </button>
            <span className="text-[#2c2420] border-b-2 border-[#C47B2B] pb-1">Showroom</span>
          </div>
          <div className="flex gap-3 items-center">
            {settings.allowWishlist !== false && (
              <button 
                onClick={() => toast.success('Showroom added to your saved showrooms!')} 
                className="text-sm text-[#8c7e72] hover:text-[#2c2420] transition"
              >
                ♡ Wishlist Showroom
              </button>
            )}
            <Link to={`/s/${slug}/cart`} className="relative p-2 bg-[#C47B2B] text-white rounded-lg hover:bg-[#a86820] transition ml-2">
              <ShoppingCart size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                  {cart.reduce((a,c) => a + c.qty, 0)}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        
        {/* Compact Info Card */}
        <div className="bg-white rounded-2xl border border-border-subtle p-6 flex flex-col md:flex-row gap-8 items-start shadow-sm">
          {(heroData?.image || showroom.coverImage) && (
            <img
              src={heroData?.image || showroom.coverImage}
              className="w-full md:w-56 h-36 object-cover rounded-xl shadow-sm flex-shrink-0"
              alt="Showroom cover"
            />
          )}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
              {brandData?.logo && (
                <img src={brandData.logo} className="h-12 w-12 object-contain bg-gray-50 rounded shadow-sm p-1" alt="Brand logo" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{heroData?.title || showroom.name}</h2>
                <p className="text-sm font-medium text-[#C47B2B]">{heroData?.subtitle || 'Showroom'}</p>
              </div>
            </div>
            {contactData && (
              <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                {contactData.email && (
                  <div className="flex items-center gap-2">✉ {contactData.email}</div>
                )}
                {contactData.phone && (
                  <div className="flex items-center gap-2">📞 {contactData.phone}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Featured Product */}
        {featuredData && (
          <div className="p-6 bg-gradient-to-r from-[#C47B2B]/5 to-transparent border border-[#C47B2B]/20 rounded-2xl flex flex-col sm:flex-row gap-6 items-start shadow-sm">
            {featuredData.image && (
              <img src={featuredData.image} className="w-40 h-40 object-cover rounded-xl shadow-sm flex-shrink-0" alt="Featured" />
            )}
            <div className="flex-1">
              <div className="inline-flex items-center text-[10px] font-bold text-[#C47B2B] uppercase tracking-widest mb-2 bg-[#C47B2B]/10 px-2 py-1 rounded">
                ⭐ Featured Spotlight
              </div>
              <h3 className="text-xl font-bold text-gray-900">{featuredData.content || 'Featured Product'}</h3>
              {featuredData.description && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{featuredData.description}</p>
              )}
              {featuredData.price && (
                <div className="font-bold text-lg text-gray-900 mt-4">{featuredData.price}</div>
              )}
            </div>
          </div>
        )}

        <div className="h-px bg-[#e8e2da] w-full"></div>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">All Products</h2>
          <div className="text-sm text-[#8c7e72] font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="text-5xl">🏬</div>
            <h2 className="text-xl font-bold text-[#2c2420]">Welcome to {showroom.name}</h2>
            <p className="text-[#8c7e72] max-w-md mx-auto">Products will appear here once they are added to this showroom.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item, i) => {
              const inWishlist = wishlist.some(w => w.id === item.id)
              return (
                <div key={i} className="group rounded-2xl border border-[#e8e2da] overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="aspect-[4/5] bg-gray-50 overflow-hidden relative">
                    {item.image
                      ? (
                        <>
                          <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          {settings.allowWishlist !== false && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(item) }}
                              className="absolute top-3 left-3 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                            >
                              <Heart size={16} className={inWishlist ? "fill-[#C47B2B] text-[#C47B2B]" : "text-gray-400"} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              navigate('/ai/try-on', { state: { garmentUrl: item.image, productId: item.id } })
                            }}
                            className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-[#C47B2B] hover:text-white text-[#C47B2B] hover:scale-110 z-10"
                            title="Virtual Try-On"
                          >
                            <Wand2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              addToCart(item)
                            }}
                            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-[#C47B2B] hover:text-white text-[#C47B2B] hover:scale-110 z-10"
                            title="Add to Cart"
                          >
                            <ShoppingCart size={16} />
                          </button>
                        </>
                      )
                      : <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-200">📦</div>
                    }
                  </div>
                  <div className="p-4 flex flex-col h-full">
                    <div className="text-[15px] font-bold text-gray-900 truncate">{item.name || 'Product'}</div>
                    <div className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">SKU: {item.sku || '—'}</div>
                    <div className="flex items-center justify-between mt-auto pt-4">
                      {item.price && <div className="text-[15px] font-bold text-[#C47B2B]">${item.price}</div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
