import { Link, useParams } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Search, Heart, Mail, FileText, ChevronDown, Filter, LayoutGrid, CheckCircle2 } from 'lucide-react'

export function PublicShowroomPage() {
  const { slug } = useParams()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Showroom Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">ACME Apparel Co.</h1>
            <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
              <a href="#" className="text-black border-b-2 border-black pb-1">All Products</a>
              <a href="#" className="hover:text-black transition-colors">Men's Core</a>
              <a href="#" className="hover:text-black transition-colors">Women's Core</a>
              <a href="#" className="hover:text-black transition-colors">Accessories</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search collection..."
                className="pl-9 pr-4 py-2 bg-gray-100 border-transparent rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all w-64"
              />
            </div>
            <button className="relative p-2 text-gray-400 hover:text-black transition-colors">
              <Heart className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-indigo-600"></span>
            </button>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <Button className="bg-black text-white rounded-full px-6">Request Quote</Button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gray-900 text-white relative h-[400px] flex items-center overflow-hidden">
        <img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=2000" alt="Autumn collection" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center">
          <Badge className="bg-white/20 text-white backdrop-blur border-white/10 mb-6 font-medium tracking-wide">AUTUMN COLLECTION 2026</Badge>
          <h2 className="text-5xl md:text-6xl font-serif font-bold tracking-tight mb-6">Elevated Essentials.</h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">Discover our latest collection of premium organic cotton and recycled materials. Designed for longevity and everyday comfort.</p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-black hover:bg-gray-100 border-none rounded-full px-8">View Lookbook</Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full px-8"><FileText className="mr-2 h-4 w-4" /> Download PDF</Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full flex gap-12">
        {/* Sidebar Filters */}
        <aside className="w-64 hidden lg:block flex-shrink-0 space-y-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">Category <ChevronDown size={16} /></h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm text-gray-600"><input type="checkbox" className="rounded text-black" defaultChecked /> Tops (45)</label>
              <label className="flex items-center gap-3 text-sm text-gray-600"><input type="checkbox" className="rounded text-black" /> Bottoms (24)</label>
              <label className="flex items-center gap-3 text-sm text-gray-600"><input type="checkbox" className="rounded text-black" /> Outerwear (12)</label>
              <label className="flex items-center gap-3 text-sm text-gray-600"><input type="checkbox" className="rounded text-black" /> Accessories (8)</label>
            </div>
          </div>
          <div className="h-px bg-gray-200"></div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">Material <ChevronDown size={16} /></h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm text-gray-600"><input type="checkbox" className="rounded text-black" /> Organic Cotton</label>
              <label className="flex items-center gap-3 text-sm text-gray-600"><input type="checkbox" className="rounded text-black" /> Recycled Poly</label>
              <label className="flex items-center gap-3 text-sm text-gray-600"><input type="checkbox" className="rounded text-black" /> Linen Blend</label>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <div className="text-sm text-gray-500">Showing <span className="font-medium text-black">89</span> products</div>
            <div className="flex items-center gap-4">
              <button className="text-gray-400 hover:text-black lg:hidden"><Filter size={18} /></button>
              <select className="text-sm border-none bg-transparent font-medium focus:ring-0 cursor-pointer">
                <option>Recommended</option>
                <option>Newest Arrivals</option>
                <option>Price: Low to High</option>
              </select>
              <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                <button className="text-black"><LayoutGrid size={18} /></button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Link key={i} to={`/s/${slug || 'demo'}/products/prod_${i}`} className="group block">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-4 relative overflow-hidden">
                  <img src={`https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=400`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Product" />
                  <button className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-all text-gray-400 hover:text-red-500 shadow-sm">
                    <Heart size={16} />
                  </button>
                  {i === 1 && <div className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded">New</div>}
                  {i === 3 && <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded flex items-center gap-1"><CheckCircle2 size={10} /> In Stock</div>}
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 mb-1">T-Shirts</div>
                  <h3 className="text-sm font-medium text-gray-900 group-hover:underline">Core Cotton Crew Neck</h3>
                  <div className="text-sm font-semibold text-gray-900 pt-1">Request Pricing</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <Button variant="outline" className="px-8 border-gray-300">Load More Products</Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <p>© 2026 ACME Apparel Co. Powered by MerchFlow AI.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-black transition-colors">Contact Sales</a>
            <a href="#" className="hover:text-black transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Badge({ children, className }) {
  return <span className={`inline-block px-3 py-1 text-xs rounded-full ${className}`}>{children}</span>
}
