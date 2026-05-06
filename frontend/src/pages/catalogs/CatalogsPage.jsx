import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Plus, Search, Filter, LayoutGrid, List, FileText, Image as ImageIcon, Briefcase, FileSignature, Layers } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useQuery } from '@tanstack/react-query'
import { catalogService } from '../../services/catalogService'
import { Loader2 } from 'lucide-react'

const TABS = [
    { id: 'all', label: 'All Catalogs' },
    { id: 'lookbook', label: 'Lookbooks' },
    { id: 'line sheet', label: 'Line Sheets' },
    { id: 'price list', label: 'Price Lists' },
    { id: 'Draft', label: 'Drafts' },
    { id: 'Published', label: 'Published' },
    { id: 'templates', label: 'Templates' },
]

export function CatalogsPage() {
    const [activeTab, setActiveTab] = useState('all')

    const { data: catalogs = [], isLoading } = useQuery({
        queryKey: ['catalogs'],
        queryFn: () => catalogService.getCatalogs()
    })

    const filteredCatalogs = catalogs.filter(c => {
        if (activeTab === 'all') return true
        if (activeTab === 'Draft') return c.status === 'Draft'
        if (activeTab === 'Published') return c.status === 'Published'
        if (activeTab === 'lookbook') return c.type?.toLowerCase() === 'lookbook'
        if (activeTab === 'line sheet') return c.type?.toLowerCase() === 'line sheet'
        if (activeTab === 'price list') return c.type?.toLowerCase() === 'price list'
        if (activeTab === 'templates') return false
        return true
    })

    if (isLoading) {
        return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
    }

    return (
        <div className="space-y-6 pb-12 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Catalogs"
                    description="Curate presentation assets including lookbooks, line sheets, and custom price lists."
                />
                <Link to="/catalogs/new">
                    <Button className="bg-black hover:bg-gray-800 text-white rounded-lg shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Create Catalog
                    </Button>
                </Link>
            </div>

            <div className="flex gap-6 mt-8">

                {/* Left Sidebar Tabs */}
                <Card className="w-64 flex-shrink-0 p-3 h-fit border border-gray-100 shadow-sm bg-white/50 backdrop-blur-sm hidden md:block">
                    <div className="space-y-1">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors font-medium",
                                    activeTab === tab.id
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <span>{tab.label}</span>
                                {tab.id === 'all' && <span className="text-xs bg-gray-100 text-gray-500 px-2 rounded-full">{catalogs.length}</span>}
                            </button>
                        ))}
                    </div>
                    <div className="mt-8 pt-4 border-t border-gray-100 px-3">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Filters</h4>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" className="rounded" /> Season: Fall</label>
                            <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" className="rounded" /> Access: Public</label>
                        </div>
                    </div>
                </Card>

                {/* Main Content */}
                <div className="flex-1 space-y-4">

                    {/* Mobile Tabs */}
                    <div className="md:hidden flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex-shrink-0 px-4 py-2 text-sm rounded-full transition-colors font-medium border",
                                    activeTab === tab.id
                                        ? "bg-black text-white border-black"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search catalogs..."
                                className="w-full pl-9 pr-4 py-1.5 text-sm border-none bg-transparent focus:ring-0 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2 border-l pl-4 ml-4">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500"><List size={16} /></Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-black bg-gray-100"><LayoutGrid size={16} /></Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                        {filteredCatalogs.map(catalog => (
                            <Link key={catalog.id} to={`/catalogs/${catalog.id}/builder`} className="group">
                                <Card className="overflow-hidden border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all h-full flex flex-col">

                                    {/* Aspect Thumbnail */}
                                    <div className="aspect-[4/3] bg-gray-50 border-b border-gray-100 flex items-center justify-center relative overflow-hidden">
                                        {catalog.type === 'Lookbook' && <ImageIcon className="h-10 w-10 text-gray-300 transform group-hover:scale-110 transition-transform duration-500" />}
                                        {catalog.type === 'Line Sheet' && <Layers className="h-10 w-10 text-gray-300 transform group-hover:scale-110 transition-transform duration-500" />}
                                        {catalog.type === 'Price List' && <FileSignature className="h-10 w-10 text-gray-300 transform group-hover:scale-110 transition-transform duration-500" />}

                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 flex items-center gap-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-700 shadow-sm border border-gray-100">
                                            {catalog.type === 'Lookbook' && <ImageIcon size={12} className="text-pink-500" />}
                                            {catalog.type === 'Line Sheet' && <Layers size={12} className="text-blue-500" />}
                                            {catalog.type === 'Price List' && <FileSignature size={12} className="text-emerald-500" />}
                                            {catalog.type}
                                        </div>

                                        <div className="absolute top-3 right-3">
                                            <span className={cn(
                                                "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border",
                                                catalog.status === 'Published' ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                            )}>
                                                {catalog.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-4 flex flex-col flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{catalog.name}</h3>
                                        <div className="text-xs text-gray-500 flex items-center gap-2 mb-4">
                                            <span>{new Date(catalog.updatedAt).toLocaleDateString()}</span>
                                            <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                                            <span>{(catalog.items || []).length} items</span>
                                        </div>

                                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div className="flex items-center -space-x-2">
                                                <div className="h-6 w-6 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">AR</div>
                                                <div className="h-6 w-6 rounded-full border-2 border-white bg-pink-100 flex items-center justify-center text-[10px] font-bold text-pink-700">SJ</div>
                                            </div>
                                            {catalog.status === 'Published' && (
                                                <div className="text-xs font-medium text-gray-500">
                                                    {(catalog.views || 0).toLocaleString()} views
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {filteredCatalogs.length === 0 && (
                        <div className="border border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-gray-50 mt-4">
                            <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mb-4">
                                <FileText className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No catalogs found</h3>
                            <p className="text-gray-500 font-medium mb-6">Create a new {activeTab !== 'all' ? activeTab : 'catalog'} to get started.</p>
                            <Link to="/catalogs/new">
                                <Button className="bg-white text-black border-gray-200 hover:border-black shadow-sm">
                                    <Plus className="mr-2 h-4 w-4" /> Create New
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
