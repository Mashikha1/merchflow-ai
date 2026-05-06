import { PageHeader } from '../../components/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Layers, FileSignature, ImageIcon, Plus, ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export function CatalogNewPage() {
    const navigate = useNavigate()
    const [selected, setSelected] = useState(null)

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/catalogs">
                    <Button variant="ghost" size="sm" className="-ml-2 text-gray-500 hover:text-black">
                        <ArrowLeft size={18} className="mr-1" /> Back
                    </Button>
                </Link>
            </div>

            <PageHeader
                title="Create New Catalog"
                description="Choose a starting point for your presentation asset."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <Card
                    className={`p-6 border-2 transition-all cursor-pointer group ${selected === 'lookbook' ? 'border-brand bg-brand-soft/30 ring-4 ring-brand/10' : 'border-transparent hover:border-border-soft'}`}
                    onClick={() => setSelected('lookbook')}
                >
                    <div className="h-12 w-12 bg-pink-50 rounded-[12px] flex items-center justify-center mb-6 text-pink-600 group-hover:scale-110 transition-transform">
                        <ImageIcon size={24} />
                    </div>
                    <h3 className="text-[18px] font-bold text-content-primary mb-2">Lookbook</h3>
                    <p className="text-[14px] text-content-secondary font-medium">Highly visual, editorial catalog designed for brand storytelling.</p>
                </Card>

                <Card
                    className={`p-6 border-2 transition-all cursor-pointer group ${selected === 'line-sheet' ? 'border-brand bg-brand-soft/30 ring-4 ring-brand/10' : 'border-transparent hover:border-border-soft'}`}
                    onClick={() => setSelected('line-sheet')}
                >
                    <div className="h-12 w-12 bg-blue-50 rounded-[12px] flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                        <Layers size={24} />
                    </div>
                    <h3 className="text-[18px] font-bold text-content-primary mb-2">Line Sheet</h3>
                    <p className="text-[14px] text-content-secondary font-medium">Structured grid format optimal for wholesale buying and product details.</p>
                </Card>

                <Card
                    className={`p-6 border-2 transition-all cursor-pointer group ${selected === 'price-list' ? 'border-brand bg-brand-soft/30 ring-4 ring-brand/10' : 'border-transparent hover:border-border-soft'}`}
                    onClick={() => setSelected('price-list')}
                >
                    <div className="h-12 w-12 bg-emerald-50 rounded-[12px] flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                        <FileSignature size={24} />
                    </div>
                    <h3 className="text-[18px] font-bold text-content-primary mb-2">Price List</h3>
                    <p className="text-[14px] text-content-secondary font-medium">Data-rich table views designed specifically for distributors and tiered pricing.</p>
                </Card>
            </div>

            <div className="mt-10 flex flex-col items-center">
                <Button
                    size="lg"
                    disabled={!selected}
                    onClick={() => navigate(`/catalogs/new/setup?type=${selected}`)}
                    className="w-full max-w-sm"
                >
                    Continue Setup
                </Button>

                <div className="mt-6 text-center text-sm font-medium text-content-secondary">
                    Or start from a <button className="text-brand hover:underline">saved template</button>
                </div>
            </div>
        </div>
    )
}
