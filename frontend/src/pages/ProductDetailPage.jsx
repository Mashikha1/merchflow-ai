import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Save,
  MoreHorizontal,
  Sparkles,
  Image as ImageIcon,
  Tag,
  DollarSign,
  Box,
  LayoutGrid,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  Book
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Tag },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'variants', label: 'Variants', icon: LayoutGrid },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'inventory', label: 'Inventory', icon: Box },
  { id: 'ai', label: 'AI Assets', icon: Sparkles },
  { id: 'publishing', label: 'Publishing', icon: Globe },
  { id: 'activity', label: 'Activity', icon: Clock },
]

export function ProductDetailPage() {
  const { id } = useParams()
  const isNew = id === 'new'
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="max-w-[1400px] mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/products">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            {isNew ? 'New Product' : 'Core Cotton T-Shirt'}
          </h1>
          {!isNew && <p className="text-sm text-gray-500">SKU: TS-CORE-WHT</p>}
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="outline" className="text-gray-600">
              <Sparkles className="h-4 w-4 mr-2 text-indigo-500" /> Generate AI Try-On
            </Button>
          )}
          <Button variant="outline" className="hidden sm:flex">
            <Book className="h-4 w-4 mr-2" /> Add to Catalog
          </Button>
          <Button variant="outline">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" /> Save Product
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-3/4 space-y-6">
          <div className="flex overflow-x-auto border-b border-gray-200 hide-scrollbar">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 px-1 border-b-2 mr-6 text-sm font-medium whitespace-nowrap transition-colors ${isActive
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="min-h-[500px]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <Input defaultValue={isNew ? '' : 'Core Cotton T-Shirt'} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                        <Input defaultValue={isNew ? '' : 'TS-CORE-WHT'} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                        <select className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black">
                          <option>MerchFlow Core</option>
                          <option>Premium Private Label</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                      <textarea
                        className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black min-h-[80px]"
                        defaultValue={isNew ? '' : 'Premium 100% organic cotton t-shirt with a modern relaxed fit.'}
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-4">Organization</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
                        <option>T-Shirts</option>
                        <option>Outerwear</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Collections</label>
                      <Input defaultValue="Essentials, Summer 26" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                      <select className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
                        <option>Core / Never Out Of Stock</option>
                        <option>SS26</option>
                        <option>AW26</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender / Type</label>
                      <select className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
                        <option>Unisex</option>
                        <option>Mens</option>
                        <option>Womens</option>
                      </select>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'media' && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold border-b pb-4 mb-6">Product Media</h3>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer mb-6">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <ImageIcon className="h-10 w-10 mb-3 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">Click or drag images to upload</p>
                    <p className="text-xs mt-1">Supports JPG, PNG up to 10MB</p>
                  </div>
                </div>

                {!isNew && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg relative overflow-hidden group">
                      <div className="absolute top-2 left-2 bg-black text-white text-[10px] uppercase px-2 py-0.5 rounded font-bold">Primary</div>
                      <img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=400" alt="T-Shirt" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="outline" className="bg-white/90 border-0 h-8 text-xs">Edit</Button>
                      </div>
                    </div>
                    {/* Placeholder boxes */}
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400"><ImageIcon size={24} /></div>
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400"><ImageIcon size={24} /></div>
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'variants' && (
              <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Variant Matrix</h3>
                  <Button variant="outline" size="sm">Add Option</Button>
                </div>
                {!isNew ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 font-medium text-gray-500">
                      <tr>
                        <th className="px-6 py-3">Variant</th>
                        <th className="px-6 py-3">SKU</th>
                        <th className="px-6 py-3">Price</th>
                        <th className="px-6 py-3">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">White / Small</td>
                        <td className="px-6 py-4"><Input defaultValue="TS-CORE-WHT-S" className="h-8 text-xs" /></td>
                        <td className="px-6 py-4"><Input defaultValue="24.00" className="h-8 text-xs w-24" /></td>
                        <td className="px-6 py-4"><Input defaultValue="145" className="h-8 text-xs w-24" /></td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">White / Medium</td>
                        <td className="px-6 py-4"><Input defaultValue="TS-CORE-WHT-M" className="h-8 text-xs" /></td>
                        <td className="px-6 py-4"><Input defaultValue="24.00" className="h-8 text-xs w-24" /></td>
                        <td className="px-6 py-4"><Input defaultValue="450" className="h-8 text-xs w-24" /></td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">White / Large</td>
                        <td className="px-6 py-4"><Input defaultValue="TS-CORE-WHT-L" className="h-8 text-xs" /></td>
                        <td className="px-6 py-4"><Input defaultValue="24.00" className="h-8 text-xs w-24" /></td>
                        <td className="px-6 py-4"><Input defaultValue="255" className="h-8 text-xs w-24" /></td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    Save the product first to generate variants.
                  </div>
                )}
              </Card>
            )}

            {(activeTab !== 'overview' && activeTab !== 'media' && activeTab !== 'variants') && (
              <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed">
                <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                  <LayoutGrid />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{TABS.find(t => t.id === activeTab).label} Interface Map</h3>
                <p className="text-sm text-gray-500 max-w-sm">This is a frontend MERN-ready placeholder layout waiting for extended UI implementation.</p>
              </Card>
            )}
          </div>
        </div>

        {/* Sticky right panel */}
        <div className="lg:w-1/4">
          <div className="sticky top-24 space-y-6">
            <Card className="p-5 border border-indigo-100 bg-indigo-50/30">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Product Readiness</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-medium text-gray-700">Completeness Score</span>
                    <span className="font-bold text-indigo-600">85%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>

                <ul className="text-xs space-y-2 mt-4 text-gray-600">
                  <li className="flex items-center gap-2 text-green-600"><CheckCircle2 size={14} /> Basic info complete</li>
                  <li className="flex items-center gap-2 text-green-600"><CheckCircle2 size={14} /> Variants configured</li>
                  <li className="flex items-center gap-2 text-amber-600"><AlertCircle size={14} /> Missing AI Try-On assets</li>
                  <li className="flex items-center gap-2 text-amber-600"><AlertCircle size={14} /> Descriptions need SEO</li>
                </ul>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Status & Visibility</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black">
                    <option>Active</option>
                    <option>Draft</option>
                    <option>Archived</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <span className="block text-xs font-medium text-gray-500 mb-2">Publishing Channels</span>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="rounded text-black" /> Buyer Showrooms</label>
                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="rounded text-black" /> Catalog PDF Export</label>
                    <label className="flex items-center gap-2"><input type="checkbox" className="rounded text-black" /> B2B Marketplace</label>
                  </div>
                </div>
              </div>
            </Card>

            {!isNew && (
              <div className="text-xs text-center text-gray-400">
                Last updated 2 hours ago by Sarah M.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
