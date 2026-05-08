import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import api from '../../lib/api'
import { Mail, Phone, Wand2 } from 'lucide-react'

export function BuyerCatalogDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: catalog, isLoading } = useQuery({
    queryKey: ['catalogs', id],
    queryFn: () => api(`/catalogs/${id}`)
  })

  // Open the catalog as a beautiful full-page viewer in a new tab
  const viewPdf = () => {
    window.open(`/catalog-print/${id}`, '_blank')
  }

  // Same page but auto-triggers PDF download
  const exportPdf = () => {
    window.open(`/catalog-print/${id}?download=true`, '_blank')
  }

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-64" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48" />
    </div>
  )
  if (!catalog) return <div className="p-8 text-center text-content-secondary">Catalog not found</div>

  const items = Array.isArray(catalog.items) ? catalog.items : []
  const sections = Array.isArray(catalog.sections) ? catalog.sections : []

  const heroData = sections.find(s => s.type === 'hero')?.data
  const brandData = sections.find(s => s.type === 'brand_intro')?.data
  const featuredData = sections.find(s => s.type === 'featured_product')?.data
  const contactData = sections.find(s => s.type === 'contact')?.data

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-content-primary">{catalog.name}</h1>
        <div className="flex gap-2 ml-auto">
          <Button variant="secondary" onClick={() => navigate('/buyer/catalogs')}>Back</Button>
          <Button variant="outline" onClick={viewPdf}>📄 View PDF</Button>
          <Button onClick={() => navigate(`/buyer/request-quote?catalogId=${id}`)}>Request Quote</Button>
        </div>
      </div>

      {/* Compact Info Card */}
      <div className="bg-white rounded-2xl border border-border-subtle p-6 flex flex-col md:flex-row gap-8 items-start shadow-sm">
        {heroData?.image && (
          <img
            src={heroData.image}
            className="w-full md:w-56 h-36 object-cover rounded-xl shadow-sm flex-shrink-0"
            alt="Catalog cover"
          />
        )}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
            {brandData?.logo && (
              <img src={brandData.logo} className="h-12 w-12 object-contain bg-gray-50 rounded shadow-sm p-1" alt="Brand logo" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{heroData?.title || catalog.name}</h2>
              <p className="text-sm font-medium text-brand">{heroData?.subtitle || catalog.type}</p>
            </div>
          </div>
          {contactData && (
            <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
              {contactData.email && (
                <div className="flex items-center gap-2"><Mail size={15} className="text-gray-400" /> {contactData.email}</div>
              )}
              {contactData.phone && (
                <div className="flex items-center gap-2"><Phone size={15} className="text-gray-400" /> {contactData.phone}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Featured Product */}
      {featuredData && (
        <div className="p-6 bg-gradient-to-r from-brand/5 to-transparent border border-brand/20 rounded-2xl flex flex-col sm:flex-row gap-6 items-start shadow-sm">
          {featuredData.image && (
            <img src={featuredData.image} className="w-40 h-40 object-cover rounded-xl shadow-sm flex-shrink-0" alt="Featured" />
          )}
          <div className="flex-1">
            <div className="inline-flex items-center text-[10px] font-bold text-brand uppercase tracking-widest mb-2 bg-brand/10 px-2 py-1 rounded">
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

      <div className="h-px bg-border-subtle w-full"></div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">All Products</h2>
        <div className="text-sm text-gray-500 font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 space-y-3 bg-white rounded-2xl border border-border-subtle shadow-sm">
          <div className="text-4xl">📦</div>
          <p className="text-sm text-content-secondary font-medium">Products will appear here once they are added to this catalog.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, i) => (
            <div key={i} className="group rounded-2xl border border-border-subtle overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="aspect-[4/5] bg-gray-50 overflow-hidden relative">
                {item.image
                  ? (
                    <>
                      <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          navigate('/ai/try-on', { state: { garmentUrl: item.image, productId: item.productId } })
                        }}
                        className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-brand hover:text-white text-brand hover:scale-110 z-10"
                        title="Virtual Try-On"
                      >
                        <Wand2 size={16} />
                      </button>
                    </>
                  )
                  : <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-200">📦</div>
                }
              </div>
              <div className="p-4">
                <div className="text-[15px] font-bold text-gray-900 truncate">{item.name || 'Product'}</div>
                <div className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">SKU: {item.sku || '—'}</div>
                {item.price && <div className="text-[15px] font-bold text-brand mt-3">${item.price}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
