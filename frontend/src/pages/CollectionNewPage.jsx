import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { cn } from '../lib/cn'
import { RightDrawer } from '../components/RightDrawer'
import { productService } from '../services/productService'
import {
    Image as ImageIcon, UploadCloud, X, LayoutGrid, Filter, Sparkles, UserCheck, Eye, Store, Package, Search
} from 'lucide-react'

export function CollectionNewPage() {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        status: 'Active',
        collectionType: 'Seasonal Drop',
        coverImage: null,
        productSource: 'Manual',
        audience: 'B2B Wholesale',
        showInCatalog: true,
        showInShowroom: true,
        lookbookEligible: true
    })

    const [formErrors, setFormErrors] = useState({})
    const [selectedProducts, setSelectedProducts] = useState([])
    const [pickerOpen, setPickerOpen] = useState(false)
    const [pickerQuery, setPickerQuery] = useState('')
    const [pickerStatus, setPickerStatus] = useState('All')
    const [pickerCategory, setPickerCategory] = useState('All')
    const [pickerSelected, setPickerSelected] = useState(new Set())
    const [allProducts, setAllProducts] = useState([])
    const bannerInputRef = useRef(null)

    // Auto-generate slug from name if slug hasn't been manually touched
    const [slugModified, setSlugModified] = useState(false)

    useEffect(() => {
        if (!slugModified && formData.name) {
            setFormData(prev => ({
                ...prev,
                slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
            }))
        }
    }, [formData.name, slugModified])

    useEffect(() => {
        productService.getProducts().then(setAllProducts)
    }, [])

    useEffect(() => {
        if (formData.coverImage) {
            try {
                const draft = JSON.parse(localStorage.getItem('collection_new_draft') || '{}')
                draft.coverImage = formData.coverImage
                localStorage.setItem('collection_new_draft', JSON.stringify(draft))
            } catch {
                localStorage.setItem('collection_new_draft', JSON.stringify({ coverImage: formData.coverImage }))
            }
        }
    }, [formData.coverImage])
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: null }))
        }
    }

    const validateForm = () => {
        const errors = {}
        if (!formData.name.trim()) errors.name = 'Collection Name is required'
        if (!formData.slug.trim()) errors.slug = 'URL Slug is required'

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSave = (isDraft = false) => {
        if (!isDraft && !validateForm()) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSubmitting(true)

        try {
            // Read existing or default to empty
            const existingRaw = localStorage.getItem('merchflow_collections')
            const existingCollections = existingRaw ? JSON.parse(existingRaw) : []

            const newCollection = {
                id: `col_${Date.now()}`,
                name: formData.name || 'Untitled Collection',
                slug: formData.slug || 'untitled',
                items: 0, // Starts empty
                status: isDraft ? 'Draft' : formData.status,
                thumb: formData.coverImage || 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=200',
                type: formData.collectionType,
                createdAt: new Date().toISOString()
            }

            const updatedCollections = [newCollection, ...existingCollections]
            localStorage.setItem('merchflow_collections', JSON.stringify(updatedCollections))

            toast.success(`Collection ${isDraft ? 'saved as draft' : 'created'} successfully`)
            navigate('/collections')

        } catch (error) {
            console.error(error)
            toast.error("Failed to create collection")
        } finally {
            setIsSubmitting(false)
        }
    }

    const ToggleSwitch = ({ checked, onChange, label, description }) => (
        <label className={cn(
            "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors bg-white",
            checked ? "border-brand-soft shadow-sm ring-1 ring-brand/5 bg-brand-soft/10" : "border-border-subtle hover:border-border-strong"
        )}>
            <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors mt-0.5" style={{ backgroundColor: checked ? '#6366f1' : '#e5e7eb' }}>
                <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm", checked ? "translate-x-4" : "translate-x-1")} />
            </div>
            <div>
                <div className="text-[13px] font-bold text-content-primary">{label}</div>
                {description && <div className="text-[12px] text-content-secondary mt-1 leading-relaxed">{description}</div>}
            </div>
        </label>
    )

    const ProductSourceOption = ({ id, icon, title, desc }) => {
        const IconComponent = icon
        return (
            <label className={cn(
                "flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors text-left",
                formData.productSource === id ? "bg-brand-soft/20 border-brand" : "bg-white border-border-subtle hover:border-brand-soft"
            )}>
                <div className="mt-0.5 relative flex items-center justify-center shrink-0">
                    <input
                        type="radio"
                        name="product_source"
                        value={id}
                        checked={formData.productSource === id}
                        onChange={(e) => handleChange('productSource', e.target.value)}
                        className="peer appearance-none w-4 h-4 border border-border-strong rounded-full checked:border-brand checked:border-[4px] bg-white transition-all shadow-sm"
                    />
                </div>
                <div className="shrink-0 mt-0.5 pt-0.5">
                    <IconComponent className={cn("h-5 w-5", formData.productSource === id ? "text-brand" : "text-content-tertiary")} />
                </div>
                <div>
                    <div className="text-[13px] font-bold text-content-primary">{title}</div>
                    <div className="text-[12px] text-content-secondary mt-1 leading-relaxed">{desc}</div>
                </div>
            </label>
        )
    }

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto pb-20 animate-in fade-in">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 bg-app-body/80 backdrop-blur-md pt-4 pb-4 border-b border-border-subtle/50">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-content-primary">Create Collection</h1>
                    <p className="text-[13px] text-content-secondary mt-1">Configure a new product grouping for campaigns or seasons.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => navigate('/collections')} disabled={isSubmitting}>Cancel</Button>
                    <Button variant="secondary" onClick={() => handleSave(true)} disabled={isSubmitting}>Save Draft</Button>
                    <Button onClick={() => handleSave(false)} disabled={isSubmitting}>Create Collection</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Left Column - Main Details */}
                <div className="col-span-1 lg:col-span-2 space-y-6">
                    <Card className="p-6 bg-white border-border-subtle shadow-sm space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Collection Name <span className="text-semantic-error">*</span></label>
                                <Input
                                    placeholder="e.g. Summer 2026 Swimwear"
                                    className={cn("bg-white", formErrors.name && "border-semantic-error focus:ring-semantic-error")}
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                />
                                {formErrors.name && <p className="text-[11px] text-semantic-error mt-1.5 font-medium">{formErrors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-[13px] font-semibold text-content-primary mb-1.5">URL Slug <span className="text-semantic-error">*</span></label>
                                <div className="flex items-center rounded-xl overflow-hidden border border-border-subtle focus-within:ring-2 focus-within:ring-brand">
                                    <span className="bg-app-card-muted text-content-tertiary text-[13px] px-3 border-r border-border-subtle py-2">/collections/</span>
                                    <input
                                        className="flex-1 bg-white font-mono text-[13px] outline-none px-3"
                                        placeholder="summer-2026-swimwear"
                                        value={formData.slug}
                                        onChange={(e) => {
                                            handleChange('slug', e.target.value)
                                            setSlugModified(true)
                                        }}
                                    />
                                </div>
                                {formErrors.slug && <p className="text-[11px] text-semantic-error mt-1.5 font-medium">{formErrors.slug}</p>}
                            </div>

                            <div>
                                <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Description (Optional)</label>
                                <textarea
                                    className="w-full h-32 p-3 rounded-xl border border-border-subtle bg-white text-[13px] focus:ring-2 focus:ring-brand outline-none resize-y"
                                    placeholder="Provide context about this collection for internal notes and SEO meta tags..."
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white border-border-subtle shadow-sm">
                        <div className="mb-5 pb-3 border-b border-border-subtle flex items-center justify-between">
                            <h4 className="text-[15px] font-bold text-content-primary">Product Source</h4>
                            <Badge className="bg-app-card-muted text-content-secondary border-none">{formData.productSource}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <ProductSourceOption
                                id="Manual" icon={LayoutGrid} title="Manual Selection"
                                desc="Hand-pick individual products to include in this collection."
                            />
                            <ProductSourceOption
                                id="Smart Rules" icon={Sparkles} title="Smart Rules"
                                desc="Automatically pull products matching specific dynamic conditions."
                            />
                            <ProductSourceOption
                                id="Category Map" icon={Package} title="Category Mapping"
                                desc="Mirror an entire category taxonomy segment into a collection."
                            />
                            <ProductSourceOption
                                id="Saved Filters" icon={Filter} title="Saved Filter View"
                                desc="Populate using an existing inventory slice or saved view."
                            />
                        </div>

                        {formData.productSource === 'Manual' && selectedProducts.length === 0 && (
                            <div className="p-6 border border-border-dashed rounded-xl flex flex-col items-center justify-center text-center bg-app-card-muted/50">
                                <LayoutGrid size={32} className="text-content-tertiary mb-3 opacity-50" />
                                <h5 className="text-[14px] font-bold text-content-primary mb-1">No products selected</h5>
                                <p className="text-[12px] text-content-secondary max-w-sm mb-4">You can select products now, or build your collection shell and add items later from the inventory view.</p>
                                <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>Browse Products</Button>
                            </div>
                        )}
                        {formData.productSource === 'Manual' && selectedProducts.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-content-secondary">{selectedProducts.length} product(s) added</div>
                                    <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>Browse Products</Button>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {selectedProducts.map((p) => (
                                        <div key={p.id} className="rounded-xl border border-border-subtle bg-app-card-muted p-3">
                                            <div className="text-sm font-medium">{p.name}</div>
                                            <div className="text-xs text-content-secondary">{p.sku} • {p.category} • ${p.price} • {p.status}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {formData.productSource === 'Smart Rules' && (
                            <div className="p-6 border border-border-subtle rounded-xl bg-app-card-muted text-center flex flex-col items-center">
                                <Sparkles size={32} className="text-brand mb-3 opacity-80" />
                                <h5 className="text-[14px] font-bold text-content-primary mb-1">Configure Rules Setup</h5>
                                <p className="text-[12px] text-content-secondary max-w-xs mb-4">Define logic to automatically funnel inventory into this collection upon ingestion.</p>
                                <Button size="sm">Configure Automation</Button>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column - Meta / Settings */}
                <div className="col-span-1 space-y-6">

                    <Card className="p-6 bg-white border-border-subtle shadow-sm space-y-5">
                        <h4 className="text-[15px] font-bold text-content-primary border-b border-border-subtle pb-3">Organization & Publishing</h4>

                        <div>
                            <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Status</label>
                            <select
                                className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-[13px] focus:ring-2 focus:ring-brand outline-none"
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                            >
                                <option value="Active">Active</option>
                                <option value="Draft">Draft</option>
                                <option value="Archived">Archived</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Collection Type</label>
                            <select
                                className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-[13px] focus:ring-2 focus:ring-brand outline-none"
                                value={formData.collectionType}
                                onChange={(e) => handleChange('collectionType', e.target.value)}
                            >
                                <option value="Seasonal Drop">Seasonal Drop</option>
                                <option value="Marketing Campaign">Marketing Campaign</option>
                                <option value="Curated Edit">Curated Edit</option>
                                <option value="Archive / Clearance">Archive / Clearance</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Primary Audience</label>
                            <div className="relative">
                                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
                                <select
                                    className="w-full h-10 rounded-xl border border-border-subtle bg-white pl-9 pr-3 text-[13px] focus:ring-2 focus:ring-brand outline-none"
                                    value={formData.audience}
                                    onChange={(e) => handleChange('audience', e.target.value)}
                                >
                                    <option value="B2B Wholesale">B2B Wholesale</option>
                                    <option value="Direct to Consumer">Direct to Consumer</option>
                                    <option value="Internal Use Only">Internal Use Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-2 space-y-3">
                            <label className="block text-[11px] font-bold text-content-tertiary uppercase tracking-wider mb-2">Visibility Rules</label>

                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-2">
                                    <Store size={14} className="text-content-secondary group-hover:text-content-primary" />
                                    <span className="text-[13px] font-medium text-content-primary">Show in Showroom</span>
                                </div>
                                <div className="relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors" style={{ backgroundColor: formData.showInShowroom ? '#6366f1' : '#e5e7eb' }}>
                                    <input type="checkbox" className="sr-only" checked={formData.showInShowroom} onChange={(e) => handleChange('showInShowroom', e.target.checked)} />
                                    <span className={cn("inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-sm", formData.showInShowroom ? "translate-x-3.5" : "translate-x-1")} />
                                </div>
                            </label>
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-2">
                                    <Eye size={14} className="text-content-secondary group-hover:text-content-primary" />
                                    <span className="text-[13px] font-medium text-content-primary">Show in Catalog Index</span>
                                </div>
                                <div className="relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors" style={{ backgroundColor: formData.showInCatalog ? '#6366f1' : '#e5e7eb' }}>
                                    <input type="checkbox" className="sr-only" checked={formData.showInCatalog} onChange={(e) => handleChange('showInCatalog', e.target.checked)} />
                                    <span className={cn("inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform shadow-sm", formData.showInCatalog ? "translate-x-3.5" : "translate-x-1")} />
                                </div>
                            </label>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white border-border-subtle shadow-sm">
                        <h4 className="text-[15px] font-bold text-content-primary border-b border-border-subtle pb-3 mb-5">Cover Image (Optional)</h4>

                        {!formData.coverImage ? (
                            <div
                                className="border-2 border-dashed border-border-strong rounded-xl bg-app-card-muted hover:bg-app-hover transition-colors flex flex-col items-center justify-center p-8 cursor-pointer relative group"
                                onClick={() => bannerInputRef.current?.click()}
                            >
                                <div className="h-10 w-10 bg-white rounded-full shadow-sm border border-border-subtle flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <UploadCloud size={18} className="text-content-secondary group-hover:text-brand" />
                                </div>
                                <span className="text-[13px] font-bold text-content-primary">Click to upload banner</span>
                                <span className="text-[11px] text-content-secondary mt-1">1920x1080px (16:9 ratio ideally)</span>
                                <input
                                    ref={bannerInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0]
                                        if (!f) return
                                        const url = URL.createObjectURL(f)
                                        handleChange('coverImage', url)
                                        toast.success('Banner uploaded')
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="rounded-xl overflow-hidden border border-border-subtle">
                                <div className="aspect-[16/9] bg-app-card-muted">
                                    <img alt="banner" src={formData.coverImage} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-3 flex items-center justify-end gap-2">
                                    <Button variant="secondary" onClick={() => bannerInputRef.current?.click()}>Replace</Button>
                                    <Button variant="ghost" onClick={() => { handleChange('coverImage', null); toast.message('Banner removed') }}>Remove</Button>
                                    <input
                                        ref={bannerInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0]
                                            if (!f) return
                                            const url = URL.createObjectURL(f)
                                            handleChange('coverImage', url)
                                            toast.success('Banner replaced')
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </Card>

                </div>
            </div>
            <RightDrawer
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                title="Add Products to Collection"
                subtitle="Search and select products to include"
                widthClassName="w-[min(46vw,900px)]"
                backdropClassName="bg-black/5"
                className="bg-white shadow-lg"
                footer={
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-content-secondary">{pickerSelected.size} selected</div>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => setPickerOpen(false)}>Cancel</Button>
                            <Button
                                onClick={() => {
                                    const selected = allProducts.filter((p) => pickerSelected.has(p.id))
                                    setSelectedProducts(selected)
                                    toast.success('Products added', { description: `${selected.length} product(s)` })
                                    setPickerOpen(false)
                                }}
                            >
                                Add Selected Products
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-secondary" />
                            <Input
                                className="pl-9"
                                placeholder="Search products by name, SKU, category..."
                                value={pickerQuery}
                                onChange={(e) => setPickerQuery(e.target.value)}
                            />
                        </div>
                        <select
                            className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm"
                            value={pickerStatus}
                            onChange={(e) => setPickerStatus(e.target.value)}
                        >
                            <option>All</option>
                            <option>Active</option>
                            <option>Draft</option>
                            <option>Low Stock</option>
                        </select>
                        <select
                            className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm"
                            value={pickerCategory}
                            onChange={(e) => setPickerCategory(e.target.value)}
                        >
                            <option>All</option>
                            <option>T-Shirts</option>
                            <option>Outerwear</option>
                            <option>Pants</option>
                            <option>Accessories</option>
                        </select>
                        <Button variant="secondary" onClick={() => { setPickerQuery(''); setPickerStatus('All'); setPickerCategory('All') }}>Clear</Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {(allProducts || [])
                            .filter((p) => {
                                const q = pickerQuery.trim().toLowerCase()
                                const byQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
                                const byStatus = pickerStatus === 'All' || p.status === pickerStatus
                                const byCat = pickerCategory === 'All' || p.category === pickerCategory
                                return byQ && byStatus && byCat
                            })
                            .map((p) => {
                                const checked = pickerSelected.has(p.id)
                                return (
                                    <label key={p.id} className={cn("rounded-xl border p-3 cursor-pointer transition-colors", checked ? "border-brand bg-brand-soft/10" : "border-border-subtle bg-app-card-muted")}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium">{p.name}</div>
                                                <div className="text-xs text-content-secondary">{p.sku} • {p.category} • ${p.price} • {p.status}</div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(e) => {
                                                    setPickerSelected((prev) => {
                                                        const next = new Set(prev)
                                                        if (e.target.checked) next.add(p.id)
                                                        else next.delete(p.id)
                                                        return next
                                                    })
                                                }}
                                            />
                                        </div>
                                    </label>
                                )
                            })}
                    </div>
                </div>
            </RightDrawer>
        </div>
    )
}
