import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ArrowLeft, Edit3, Share2, Download, Archive, Users, LayoutGrid } from 'lucide-react'

export function CatalogDetailPage() {
    const { id } = useParams()

    return (
        <div className="space-y-6 pb-12 animate-in fade-in max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <Link to="/catalogs">
                        <Button variant="ghost" size="sm" className="-ml-2 text-gray-500 hover:text-black">
                            <ArrowLeft size={18} className="mr-1" /> Back
                        </Button>
                    </Link>
                    <div className="h-5 w-px bg-gray-200"></div>
                    <span className="text-sm font-bold bg-green-50 text-green-700 px-2 py-1 rounded-md uppercase tracking-wider">Published</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share Link</Button>
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
                    <Link to={`/catalogs/${id}/builder`}>
                        <Button className="bg-black text-white"><Edit3 className="mr-2 h-4 w-4" /> Edit Catalog</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="p-8">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Fall Core Collection</h1>
                        <p className="text-gray-500 font-medium mb-8">Wholesale Lookbook • Created on Sep 1, 2026</p>

                        <div className="aspect-[4/3] bg-gray-100 rounded-xl border border-gray-200 overflow-hidden relative group">
                            <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-10">
                                <Link to={`/catalogs/${id}/builder`}>
                                    <Button className="bg-white text-black hover:bg-gray-100 shadow-xl border-none"><LayoutGrid className="mr-2 h-4 w-4" /> Enter Builder</Button>
                                </Link>
                            </div>
                            <img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=1200" alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Engagement Analytics</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 font-medium">Total Views</span>
                                <span className="text-lg font-bold text-gray-900">1,450</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 font-medium">Unique Buyers</span>
                                <span className="text-lg font-bold text-gray-900">342</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 font-medium">Avg. Time</span>
                                <span className="text-lg font-bold text-gray-900">03:45</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 text-sm">
                        <h3 className="font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Catalog Settings</h3>
                        <div className="space-y-3 pb-6 border-b border-gray-100 mb-6 text-gray-600 font-medium">
                            <div className="flex justify-between"><span>Type</span> <span className="text-black">Lookbook</span></div>
                            <div className="flex justify-between"><span>Products</span> <span className="text-black">24</span></div>
                            <div className="flex justify-between"><span>Password Prod.</span> <span className="text-black">No</span></div>
                        </div>
                        <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-colors"><Archive className="mr-2 h-4 w-4" /> Archive Catalog</Button>
                    </Card>
                </div>
            </div>
        </div>
    )
}
