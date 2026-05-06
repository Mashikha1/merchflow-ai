import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import {
    Save, Eye, Monitor, Smartphone, LayoutGrid, Type, Image as ImageIcon, Plus, Trash2, ArrowLeft, Shirt, AlignLeft, HelpCircle, Columns, Table, DollarSign, Download, Layers, Sparkles, ArrowUp, ArrowDown, Copy, Edit2, Mail, Phone, MapPin, X
} from 'lucide-react'
import { catalogService } from '../../services/catalogService'
import { mediaService } from '../../services/mediaService'
import { toast } from 'sonner'
import { cn } from '../../lib/cn'
import { productService } from '../../services/productService'

// Expanding the builder blocks as requested
const BLOCKS = [
    { type: 'hero', icon: ImageIcon, label: 'Cover Hero' },
    { type: 'brand_intro', icon: AlignLeft, label: 'Brand Intro' },
    { type: 'collection_intro', icon: HelpCircle, label: 'Collection Intro' },
    { type: 'product_grid', icon: LayoutGrid, label: 'Product Grid' },
    { type: 'featured_product', icon: Columns, label: 'Featured Product' },
    { type: 'ai_tryon', icon: Shirt, label: 'AI Try-On Section' },
    { type: 'specs', icon: Table, label: 'Specifications Table' },
    { type: 'pricing', icon: DollarSign, label: 'Pricing Table' },
    { type: 'contact', icon: Type, label: 'Contact / CTA' },
    { type: 'footer', icon: LayoutGrid, label: 'Footer' },
]

const resolveImageUrl = (url) => {
    if (!url) return null
    if (typeof url !== 'string') return null
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')) return url
    
    const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '')
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`
}

export function CatalogBuilderPage() {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const [catalog, setCatalog] = useState(null)
    const [sections, setSections] = useState([])
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [selectedProducts, setSelectedProducts] = useState([])

    // Product Picker State
    const [isProductPickerOpen, setIsProductPickerOpen] = useState(false)
    const [pickerTarget, setPickerTarget] = useState(null) // { sectionId }

    // Settings Panel State
    const [editingSectionId, setEditingSectionId] = useState(null)

    // Interaction State
    const [selectedSectionId, setSelectedSectionId] = useState(null)
    const sectionRefs = useRef({})

    // Global Theme State
    const [themeColor, setThemeColor] = useState('#111111')
    const [fontFamily, setFontFamily] = useState('Inter / System UI')
    const [customPalettes, setCustomPalettes] = useState(['#111111', '#E5D0BA', '#8E9B90', '#4F46E5'])
    const fileInputRef = useRef(null)
    const [uploadCtx, setUploadCtx] = useState(null) // { sectionId, key }

    const printMode = new URLSearchParams(location.search).get('print') === '1'

    useEffect(() => {
        const loadCatalog = async () => {
            try {
                const data = await catalogService.getCatalog(id)
                setCatalog(data)

                // Hydrate theme color if available
                if (data.themeColor) {
                    setThemeColor(data.themeColor)
                    if (!customPalettes.includes(data.themeColor)) {
                        setCustomPalettes(prev => [...prev, data.themeColor])
                    }
                }
                
                // Hydrate font family if available
                if (data.fontFamily) {
                    setFontFamily(data.fontFamily)
                }

                if (printMode) {
                    try {
                        const ss = sessionStorage.getItem(`export_sections_${id}`)
                        if (ss) {
                            const parsed = JSON.parse(ss)
                            setSections(parsed)
                            setSelectedSectionId(null)
                            return
                        }
                    } catch {}
                }

                if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
                    setSections(data.sections)
                    setSelectedSectionId(data.sections[0].id)
                    setLoading(false)
                    return
                }

                const initialSections = []
                let counter = 1

                if (data.toggles?.intro !== false) {
                    initialSections.push({ id: `s_${counter++}`, type: 'hero', data: { title: data.name, subtitle: 'Season Preview' } })
                    initialSections.push({ id: `s_${counter++}`, type: 'brand_intro', data: { content: data.description || 'Welcome to our premium collection.' } })
                }

                // Default to lookbook style
                if (data.toggles?.aiAssets) initialSections.push({ id: `s_${counter++}`, type: 'ai_tryon', data: { content: 'Virtual Try-On Experience' } })
                initialSections.push({ id: `s_${counter++}`, type: 'product_grid', data: { content: 'The Full Lookbook' } })

                initialSections.push({ id: `s_${counter++}`, type: 'contact', data: { content: 'Get in Touch' } })

                setSections(initialSections)

                // Set initial selection
                if (initialSections.length > 0) setSelectedSectionId(initialSections[0].id)

            } catch (_) {
                console.error('Failed to fetch catalog:', _)
                toast.error('Failed to load catalog draft')
                navigate('/catalogs')
            } finally {
                setLoading(false)
            }
        }
        loadCatalog()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, navigate])

    useEffect(() => {
        let mounted = true
        productService.getProducts().then((list) => {
            if (!mounted) return
            setProducts(list || [])
        })
        return () => { mounted = false }
    }, [])

    useEffect(() => {
        if (printMode) {
            try {
                const style = document.createElement('style')
                style.setAttribute('data-print-style', 'catalog-only')
                style.textContent = `
                  body.only-catalog-print { background: #fff !important; }
                  @page { size: A4; margin: 0.5in; }
                `
                document.head.appendChild(style)
                document.body.classList.add('only-catalog-print')

                const root = document.getElementById('root')
                if (root) {
                    const hidden = []
                    Array.from(root.children).forEach((el) => {
                        if (!el.querySelector?.('#catalog-print-root')) {
                            el.setAttribute('data-prev-display', el.style.display || '')
                            el.style.display = 'none'
                            hidden.push(el)
                        }
                    })
                    ;(window).__CAT_PRINT_RESTORE__ = () => {
                        hidden.forEach((el) => {
                            const prev = el.getAttribute('data-prev-display') || ''
                            el.style.display = prev
                            el.removeAttribute('data-prev-display')
                        })
                    }
                }
            } catch {}
        }
        if (printMode && catalog && sections.length > 0 && products.length > 0) {
            setTimeout(() => {
                try {
                    window.__CATALOG_READY = true
                } catch {}
            }, 100)
        }
        return () => {
            if (printMode) {
                document.body.classList.remove('only-catalog-print')
                const s = document.querySelector('style[data-print-style="catalog-only"]')
                if (s) s.remove()
                try { (window).__CAT_PRINT_RESTORE__?.() } catch {}
            }
        }
    }, [printMode, catalog, sections, products])

    const toDataUrl = async (url) => {
        if (!url) return null
        if (url.startsWith('data:')) return url
        if (url.startsWith('blob:')) {
            const res = await fetch(url)
            const blob = await res.blob()
            const reader = new FileReader()
            return await new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result)
                reader.readAsDataURL(blob)
            })
        }
        return url
    }

    const serializeSections = async (secs) => {
        const out = []
        for (const s of secs) {
            const data = { ...s.data }
            const keys = Object.keys(data || {})
            for (const k of keys) {
                const v = data[k]
                if (typeof v === 'string' && (v.startsWith('blob:') || v.startsWith('data:'))) {
                    data[k] = await toDataUrl(v)
                }
            }
            out.push({ ...s, data })
        }
        return out
    }

    const handleGeneratePdf = async () => {
        if (!catalog) return
        try {
            toast.message('Generating PDF…', { description: 'Rendering with headless Chrome' })
            let sectionsPayload = await serializeSections(sections)
            
            const blob = await catalogService.exportPdf(catalog.id, sectionsPayload, themeColor, fontFamily)
            
            if (!(blob instanceof Blob)) {
                throw new Error('Server response was not a valid PDF blob')
            }

            const url = URL.createObjectURL(blob)
            const safe = (catalog.name || 'catalog').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'catalog'
            const filename = safe.endsWith('.pdf') ? safe : `${safe}.pdf`
            
            const a = document.createElement('a')
            a.href = url
            a.setAttribute('download', filename)
            document.body.appendChild(a)
            a.click()
            
            setTimeout(() => {
                a.remove()
                URL.revokeObjectURL(url)
            }, 0)
            
            toast.success('PDF exported')
        } catch (e) {
            console.error('PDF Export Error:', e)
            toast.error('Failed to export PDF', { description: String(e?.message || e) })
        }
    }

    const handleColorPick = (e) => {
        const hex = e.target.value
        setThemeColor(hex)
        setCatalog(prev => ({ ...prev, themeColor: hex }))
        if (!customPalettes.includes(hex)) {
            setCustomPalettes(prev => [...prev, hex])
        }
    }

    const handleSaveDraft = async () => {
        try {
            await catalogService.updateCatalog(catalog.id, {
                status: 'Draft',
                themeColor: themeColor,
                fontFamily: fontFamily,
                sections: sections,
                items: catalog.items
            })
            setCatalog(prev => ({ ...prev, status: 'Draft', themeColor, fontFamily, sections }))
            toast.success('Draft saved')
        } catch (error) {
            toast.error('Failed to save draft')
        }
    }

    const handlePublish = async () => {
        try {
            await catalogService.updateCatalog(catalog.id, {
                status: 'Published',
                themeColor: themeColor,
                fontFamily: fontFamily,
                sections: sections,
                items: catalog.items
            })
            setCatalog(prev => ({ ...prev, status: 'Published', themeColor, fontFamily, sections }))
            toast.success('Catalog published globally')
        } catch (error) {
            toast.error('Failed to publish catalog')
        }
    }

    const selectThemeColor = (color) => {
        setThemeColor(color)
        setCatalog(prev => ({ ...prev, themeColor: color }))
    }

    const getSectionDefaults = (type) => {
        switch (type) {
            case 'hero': return { title: 'New Collection', subtitle: 'Fall/Winter 2026', image: null }
            case 'brand_intro': return { 
                content: 'Welcome to our brand.', 
                description: 'We design luxury apparel with a focus on sustainable sourcing, zero-waste patterns, and modern silhouettes. Every thread connects to our philosophy of enduring style.',
                logo: null 
            }
            case 'collection_intro': return { 
                 title: 'Introducing The Collection',
                 content: 'This collection embodies the spirit of our brand. Expect dynamic cuts, premium fabrics, and sustainable sourcing.',
                 description: 'Explore our latest curated pieces.'
             }
            case 'product_grid': return { content: 'The Collection', collectionName: 'Fall Core' }
            case 'featured_product': return { content: 'Hero Product Spotlight', sku: 'HD-WSH-02', description: '' }
            case 'ai_tryon': return { 
                content: 'Virtual Try-On',
                description: "Instantly visualize our products on diverse models using MerchFlow AI's native Try-On pipeline. Click below to toggle variations."
            }
            case 'specs': return { 
                content: 'Technical Specifications',
                specs: [
                    { label: 'Material Composition', value: '100% Organic Cotton' },
                    { label: 'Fabric Weight', value: '400 GSM Fleece' },
                    { label: 'Manufacturing Origin', value: 'Portugal' },
                    { label: 'Care Instructions', value: 'Machine cold wash, Hang dry' }
                ]
            }
            case 'pricing': return { content: 'Master Price List' }
            case 'contact': return { 
                content: 'Get in Touch', 
                description: 'We look forward to partnering with your retail locations. Reach out for custom quotes, seasonal order minimums, and shipping timelines.',
                email: 'wholesale@brand.com', 
                phone: '+1 800 555 1234' 
            }
            case 'footer': return { content: '© 2026 Brand Name. All rights reserved. Do not distribute without permission.' }
            default: return { content: 'New Block' }
        }
    }

    const addSection = (type) => {
        const newId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        const newSection = { id: newId, type, data: getSectionDefaults(type) }

        let newSections = [...sections]
        if (selectedSectionId) {
            const index = sections.findIndex(s => s.id === selectedSectionId)
            if (index !== -1) {
                newSections.splice(index + 1, 0, newSection)
            } else {
                newSections.push(newSection)
            }
        } else {
            newSections.push(newSection)
        }

        setSections(newSections)
        setSelectedSectionId(newId)

        const typeLabel = BLOCKS.find(b => b.type === type)?.label || 'Block'
        toast.success(`${typeLabel} added`)

        setTimeout(() => {
            sectionRefs.current[newId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
    }

    const moveSectionUp = (e, index) => {
        e.stopPropagation()
        if (index === 0) return
        const newSections = [...sections]
        const temp = newSections[index - 1]
        newSections[index - 1] = newSections[index]
        newSections[index] = temp
        setSections(newSections)
        setTimeout(() => {
            sectionRefs.current[newSections[index - 1].id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 50)
    }

    const moveSectionDown = (e, index) => {
        e.stopPropagation()
        if (index === sections.length - 1) return
        const newSections = [...sections]
        const temp = newSections[index + 1]
        newSections[index + 1] = newSections[index]
        newSections[index] = temp
        setSections(newSections)
        setTimeout(() => {
            sectionRefs.current[newSections[index + 1].id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 50)
    }

    const duplicateSection = (e, section) => {
        e.stopPropagation()
        const newId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        const newSection = { ...section, id: newId }

        const index = sections.findIndex(s => s.id === section.id)
        const newSections = [...sections]
        newSections.splice(index + 1, 0, newSection)

        setSections(newSections)
        setSelectedSectionId(newId)

        const typeLabel = BLOCKS.find(b => b.type === section.type)?.label || 'Block'
        toast.success(`${typeLabel} duplicated`)

        setTimeout(() => {
            sectionRefs.current[newId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
    }

    const removeSection = (e, id) => {
        e.stopPropagation()
        setSections(sections.filter(s => s.id !== id))
        if (selectedSectionId === id) setSelectedSectionId(null)
        toast.info('Block removed')
    }

    const handleSelectSection = (id) => {
        setSelectedSectionId(id)
    }

    const toggleSelectProduct = async (p) => {
        const isSelected = selectedProducts.includes(p.id)
        let next = []
        if (isSelected) {
            next = selectedProducts.filter((pid) => pid !== p.id)
            toast.message('Removed from selection', { description: `${p.name}` })
        } else {
            next = [...selectedProducts, p.id]
            toast.success('Added to catalog selection', { description: `${p.name}` })
        }
        setSelectedProducts(next)
        try {
            if (!catalog) return
            const existingItems = catalog.items || []
            const exists = existingItems.some((it) => it.id === p.id)
            let newItems = existingItems
            if (!exists && !isSelected) {
                newItems = [...existingItems, { id: p.id, sku: p.sku, name: p.name }]
            } else if (exists && isSelected) {
                newItems = existingItems.filter((it) => it.id !== p.id)
            }
            const updated = await catalogService.updateCatalog(catalog.id, { items: newItems })
            setCatalog(updated)
        } catch (_) {
            // non-blocking
        }
    }

    const openUpload = (sectionId, key) => {
        setUploadCtx({ sectionId, key })
        fileInputRef.current?.click()
    }

    const onFilePicked = async (e) => {
        const f = e.target.files?.[0]
        if (!f || !uploadCtx) return
        
        const loadingToastId = toast.loading('Uploading image...')
        try {
            const formData = new FormData()
            formData.append('files', f)
            formData.append('folder', 'Catalog Builder')
            
            const response = await mediaService.upload(formData)
            const uploadedMedia = Array.isArray(response) ? response[0] : null
            
            if (uploadedMedia && uploadedMedia.url) {
                setSections(prev => prev.map((s) => {
                    if (s.id !== uploadCtx.sectionId) return s
                    return { ...s, data: { ...s.data, [uploadCtx.key]: uploadedMedia.url } }
                }))
                toast.dismiss(loadingToastId)
                toast.success('Image added')
            } else {
                throw new Error('Upload response missing media URL')
            }
        } catch (error) {
            toast.dismiss(loadingToastId)
            toast.error('Failed to upload image')
            console.error('Upload error:', error)
        } finally {
            e.target.value = ''
        }
    }

    const removeImage = (sectionId, key) => {
        setSections(prev => prev.map((s) => s.id === sectionId ? ({ ...s, data: { ...s.data, [key]: null } }) : s))
        toast.message('Image removed')
    }

    const handleSelectFeaturedProduct = (p) => {
        if (!pickerTarget) return
        setSections(prev => prev.map(s => {
            if (s.id !== pickerTarget.sectionId) return s
            return {
                ...s,
                data: {
                    ...s.data,
                    productId: p.id,
                    // We don't populate title, price, etc. here anymore
                    // so that it stays synced with the inventory.
                    // The user can still override them in the builder.
                }
            }
        }))
        setIsProductPickerOpen(false)
        setPickerTarget(null)
        toast.success(`Featured product linked: ${p.name}`)
    }

    const updateSectionData = (sectionId, newData) => {
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, data: { ...s.data, ...newData } } : s))
    }

    if (loading) return <div className="p-12 flex justify-center text-gray-500">Loading builder...</div>

    return (
        <div 
            className={cn("flex flex-col h-[calc(100vh-80px)] overflow-hidden -mx-4 -mt-6", printMode && "mx-0 mt-0 h-auto overflow-visible")}
            style={{ 
                fontFamily: fontFamily.includes('Playfair') ? "'Playfair Display', serif" : fontFamily.includes('Space') ? "'Space Grotesk', sans-serif" : "'Inter', system-ui, sans-serif" 
            }}
        >

            {/* Top Toolbar */}
            {!printMode && (
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shadow-sm z-10 w-full h-16 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/catalogs')} className="-ml-2 text-gray-500 hover:text-black">
                        <ArrowLeft size={18} className="mr-1" /> Back
                    </Button>
                    <div className="h-5 w-px bg-gray-200"></div>
                    <div>
                        <h2 className="font-semibold text-[15px] leading-tight text-content-primary">{catalog?.name || 'Untitled Catalog'}</h2>
                        <p className="text-[11px] text-content-tertiary font-semibold tracking-wider uppercase flex items-center gap-2 mt-0.5">
                            {catalog?.type?.replace('-', ' ')} <span className="h-1 w-1 rounded-full bg-border-strong"></span>
                            <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-200/50">{catalog?.status || 'Draft'}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-app-card-muted p-1 rounded-lg flex mr-4 border border-border-subtle shadow-inner">
                        <button className="p-1.5 px-3 bg-white shadow-sm rounded-md text-content-primary text-xs font-semibold flex items-center transition-all"><Monitor size={14} className="mr-1.5 text-brand" /> Desktop</button>
                        <button className="p-1.5 px-3 text-content-tertiary hover:text-content-primary text-xs font-medium flex items-center transition-colors"><Smartphone size={14} className="mr-1.5" /> Mobile</button>
                    </div>
                    <Button variant="outline" className="border-border-subtle shadow-sm bg-white hover:bg-app-hover" onClick={handleGeneratePdf}><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
                    <Button className="shadow-md bg-white text-content-primary border border-border-subtle hover:bg-gray-50" onClick={handleSaveDraft}><Save className="mr-2 h-4 w-4" /> Save Draft</Button>
                    <Button className="shadow-md bg-brand text-white hover:bg-brand-dark" onClick={handlePublish}><Sparkles className="mr-2 h-4 w-4" /> Publish</Button>
                </div>
            </div>
            )}

            <div className="flex flex-1 overflow-hidden h-full">
                {/* Left Sidebar - Blocks Arsenal */}
                {!printMode && (
                <div className="w-72 bg-gray-50/80 border-r border-border-subtle overflow-y-auto p-5 flex flex-col gap-8 h-full z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] backdrop-blur-xl shrink-0">
                    <div>
                        <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Content Blocks</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {BLOCKS.map(block => (
                                <button
                                    key={block.type}
                                    onClick={() => addSection(block.type)}
                                    className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:border-brand hover:shadow-sm hover:text-brand transition-all text-xs font-semibold text-content-secondary active:scale-95 group"
                                >
                                    <block.icon size={20} className="text-gray-400 group-hover:text-brand transition-colors" />
                                    <span className="text-center leading-tight">{block.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Global Theme</h4>
                        <div className="space-y-4 bg-white p-4 rounded-xl border border-border-subtle shadow-sm">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-3">Color Palette</label>
                                <div className="flex flex-wrap gap-2.5">
                                    {customPalettes.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => selectThemeColor(color)}
                                            className={cn(
                                                "w-6 h-6 rounded-full transition-transform outline-none relative text-white flex items-center justify-center",
                                                themeColor === color ? "scale-110 shadow-sm" : "hover:scale-110 border border-black/10 shadow-sm hover:shadow"
                                            )}
                                            style={{
                                                backgroundColor: color,
                                                boxShadow: themeColor === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : undefined
                                            }}
                                        >
                                            {themeColor === color && <div className="w-2 h-2 rounded-full bg-white opacity-80" />}
                                        </button>
                                    ))}
                                    <label className="w-6 h-6 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors cursor-pointer overflow-hidden relative group">
                                        <Plus size={12} className="text-gray-400 group-hover:hidden" />
                                        <input
                                            type="color"
                                            className="absolute -inset-2 opacity-0 cursor-pointer w-[150%] h-[150%]"
                                            onBlur={handleColorPick}
                                            onChange={handleColorPick}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div className="pt-2">
                                <label className="text-xs font-bold text-gray-700 block mb-2">Typography Setup</label>
                                <select 
                                    className="w-full h-8 text-xs font-medium border-border-subtle rounded-lg bg-gray-50 focus:ring-black outline-none px-2"
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                >
                                    <option value="Inter / System UI">Inter / System UI</option>
                                    <option value="Playfair Display / Serif">Playfair Display / Serif</option>
                                    <option value="Space Grotesk">Space Grotesk</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {/* Builder Canvas Area */}
                <div className={cn("flex-1 bg-[#F5F5F7] overflow-y-auto py-12 flex justify-center pb-40", printMode && "bg-white p-0 overflow-visible block pb-0") } onClick={() => setSelectedSectionId(null)}>
                    <div
                        id={printMode ? "catalog-print-root" : undefined}
                        className={cn(
                            printMode
                                ? "w-[850px] bg-white shadow-none flex flex-col relative mx-auto"
                                : "w-full max-w-[850px] bg-white shadow-xl min-h-[1056px] flex flex-col relative"
                        )}
                        onClick={e => e.stopPropagation()}
                        style={printMode ? { width: 'calc(8.27in - 1in)' } : undefined}
                    >

                        {sections.length === 0 && (
                            <div className="absolute inset-0 top-32 flex flex-col items-center justify-center pointer-events-none opacity-40">
                                <LayoutGrid size={64} className="text-gray-300 mb-4" />
                                <h3 className="text-lg font-bold text-gray-400">Your Catalog is Empty</h3>
                                <p className="text-sm font-medium text-gray-500 mt-2">Click a block on the left to get started.</p>
                            </div>
                        )}

                        {sections.map((section, idx) => {
                            const isSelected = selectedSectionId === section.id
                            const nextType = sections[idx + 1]?.type
                            const prevType = sections[idx - 1]?.type
                            const mergeHeroWithBrand = printMode && section.type === 'hero' && nextType === 'brand_intro'
                            if (printMode && section.type === 'brand_intro' && prevType === 'hero') {
                                return null
                            }

                            const printBreak = printMode ? {} : {}


                            return (
                                <div
                                    key={section.id}
                                    ref={el => sectionRefs.current[section.id] = el}
                                    onClick={() => handleSelectSection(section.id)}
                                    className={cn(
                                        "group relative w-full flex flex-col border-y-2 border-transparent transition-all overflow-visible cursor-pointer",
                                        isSelected ? "z-20" : "hover:border-border-strong z-10"
                                    )}
                                    style={{
                                        borderColor: isSelected ? themeColor : undefined,
                                        backgroundColor: isSelected ? `${themeColor}05` : 'transparent',
                                        breakInside: printMode ? 'avoid' : undefined,
                                        pageBreakInside: printMode ? 'avoid' : undefined,
                                        ...printBreak
                                    }}
                                >

                                    {/* Block Render Core */}
                                    <div className={cn("w-full flex flex-col justify-center relative z-10 h-auto", printMode ? "px-10 py-12" : "px-12 py-16")}>
                                        {section.type === 'hero' && (
                                            <div
                                                className={cn("w-full bg-gray-50 flex flex-col items-center justify-center overflow-hidden rounded-xl relative group", printMode ? "py-20" : "py-32")}
                                                onClick={() => openUpload(section.id, 'image')}
                                            >
                                                {section.data?.image ? (
                                                    <>
                                                        <img src={resolveImageUrl(section.data.image)} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                                                        {!printMode && (
                                                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <div className="text-[11px] font-bold bg-white/90 border border-border-subtle rounded px-2 py-1 shadow">
                                                                    Replace image
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <ImageIcon className="h-16 w-16 text-gray-300 mb-4 opacity-70 z-10" />
                                                        {!printMode && (
                                                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <div className="text-[11px] font-bold bg-white border border-border-subtle rounded px-2 py-1 shadow">
                                                                    Upload image
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                <input 
                                                    className="text-5xl font-serif text-gray-900 tracking-tight font-bold z-10 text-center px-4 bg-transparent border-none focus:ring-0 w-full placeholder:text-gray-300" 
                                                    style={{ color: themeColor }}
                                                    value={section.data?.title || ''}
                                                    onChange={(e) => updateSectionData(section.id, { title: e.target.value })}
                                                    placeholder="Cover Hero"
                                                    disabled={printMode}
                                                />
                                                {!printMode ? (
                                                    <textarea 
                                                        className="text-xl text-gray-600 mt-4 z-10 font-medium tracking-widest uppercase text-center bg-transparent border-none focus:ring-0 w-full resize-none placeholder:text-gray-300"
                                                        value={section.data?.subtitle || ''}
                                                        onChange={(e) => updateSectionData(section.id, { subtitle: e.target.value })}
                                                        placeholder="FALL/WINTER 2026"
                                                        rows={1}
                                                    />
                                                ) : (
                                                    section.data?.subtitle && <h2 className="text-xl text-gray-600 mt-4 z-10 font-medium tracking-widest uppercase text-center">{section.data.subtitle}</h2>
                                                )}
                                                <div className="absolute inset-0 pointer-events-none border-[8px] opacity-10" style={{ borderColor: themeColor }}></div>
                                                {!printMode && section.data?.image && (
                                                    <button
                                                        className="absolute top-3 right-3 text-[11px] font-bold bg-white/90 border border-border-subtle rounded px-2 py-1 shadow"
                                                        onClick={(e) => { e.stopPropagation(); removeImage(section.id, 'image') }}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                                
                                            </div>
                                        )}
                                        {/* In print mode, if previous was hero we already merged brand intro with hero; skip duplicate */}
                                        {!(printMode && prevType === 'hero') && section.type === 'brand_intro' && (
                                            <div className="text-center max-w-2xl mx-auto py-12">
                                                {section.data?.logo ? (
                                                    <img src={resolveImageUrl(section.data.logo)} alt="Brand Logo" className="h-16 mx-auto mb-8" />
                                                ) : (
                                                    <div className="h-16 w-16 text-white font-serif font-bold text-2xl flex items-center justify-center rounded-full mx-auto mb-8 transition-colors" style={{ backgroundColor: themeColor }}>BR</div>
                                                )}
                                                {!printMode ? (
                                                    <>
                                                        <textarea 
                                                            className="text-2xl font-serif text-gray-800 mb-6 leading-snug text-center bg-transparent border-none focus:ring-0 w-full resize-none placeholder:text-gray-300"
                                                            value={section.data?.content || ''}
                                                            onChange={(e) => updateSectionData(section.id, { content: e.target.value })}
                                                            placeholder="Welcome to our premium collection."
                                                            rows={2}
                                                        />
                                                        <textarea 
                                                            className="text-sm text-gray-500 leading-relaxed font-medium text-center bg-transparent border-none focus:ring-0 w-full resize-none placeholder:text-gray-300"
                                                            value={section.data?.description || ''}
                                                            onChange={(e) => updateSectionData(section.id, { description: e.target.value })}
                                                            placeholder="Enter brand description..."
                                                            rows={3}
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <h3 className="text-2xl font-serif text-gray-800 mb-6 leading-snug">{section.data?.content}</h3>
                                                        <p className="text-sm text-gray-500 leading-relaxed font-medium">{section.data?.description}</p>
                                                    </>
                                                )}
                                                <div className="h-0.5 w-16 mx-auto mt-8 transition-colors" style={{ backgroundColor: themeColor }}></div>
                                            </div>
                                        )}
                                        {/* If merging hero + brand intro for print, render brand intro directly below hero here */}
                                        {mergeHeroWithBrand && (
                                            <div className="text-center max-w-2xl mx-auto py-10">
                                                {sections[idx + 1]?.data?.logo ? (
                                                    <img src={resolveImageUrl(sections[idx + 1].data.logo)} alt="Brand Logo" className="h-16 mx-auto mb-8" />
                                                ) : (
                                                    <div className="h-16 w-16 text-white font-serif font-bold text-2xl flex items-center justify-center rounded-full mx-auto mb-8 transition-colors" style={{ backgroundColor: themeColor }}>BR</div>
                                                )}
                                                <h3 className="text-2xl font-serif text-gray-800 mb-6 leading-snug">{sections[idx + 1]?.data?.content}</h3>
                                                <p className="text-sm text-gray-500 leading-relaxed font-medium">{sections[idx + 1]?.data?.description}</p>
                                                <div className="h-0.5 w-16 mx-auto mt-8 transition-colors" style={{ backgroundColor: themeColor }}></div>
                                            </div>
                                        )}
                                        {section.type === 'collection_intro' && (
                                            <div className="text-left w-full py-10 px-4">
                                                <div className="h-1 w-12 mb-4 rounded-full transition-colors" style={{ backgroundColor: themeColor }}></div>
                                                {!printMode ? (
                                                    <input 
                                                        className="text-3xl font-bold text-content-primary mb-4 tracking-tight bg-transparent border-none focus:ring-0 w-full p-0 placeholder:text-gray-300"
                                                        value={section.data?.title || 'Introducing The Collection'}
                                                        onChange={(e) => updateSectionData(section.id, { title: e.target.value })}
                                                        placeholder="Introducing The Collection"
                                                    />
                                                ) : (
                                                    <h2 className="text-3xl font-bold text-content-primary mb-4 tracking-tight">{section.data?.title || 'Introducing The Collection'}</h2>
                                                )}
                                                {!printMode ? (
                                                    <div className="space-y-4">
                                                        <textarea 
                                                            className="text-[15px] text-content-secondary max-w-3xl leading-relaxed border-l-4 pl-4 transition-colors bg-transparent border-none focus:ring-0 w-full resize-none placeholder:text-gray-300"
                                                            style={{ borderColor: themeColor }}
                                                            value={section.data?.content || ''}
                                                            onChange={(e) => updateSectionData(section.id, { content: e.target.value })}
                                                            placeholder="This collection embodies the spirit of our brand..."
                                                            rows={4}
                                                        />
                                                        {section.data?.description && (
                                                            <textarea 
                                                                className="text-sm text-content-tertiary max-w-3xl leading-relaxed border-l-4 pl-4 transition-colors bg-transparent border-none focus:ring-0 w-full resize-none placeholder:text-gray-300 italic"
                                                                style={{ borderColor: `${themeColor}40` }}
                                                                value={section.data?.description || ''}
                                                                onChange={(e) => updateSectionData(section.id, { description: e.target.value })}
                                                                placeholder="Enter secondary description..."
                                                                rows={2}
                                                            />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <p className="text-[15px] text-content-secondary max-w-3xl leading-relaxed border-l-4 pl-4 transition-colors" style={{ borderColor: themeColor }}>{section.data?.content}</p>
                                                        {section.data?.description && <p className="text-sm text-content-tertiary max-w-3xl leading-relaxed border-l-4 pl-4 transition-colors italic" style={{ borderColor: `${themeColor}40` }}>{section.data.description}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {section.type === 'product_grid' && (
                                            <div className="w-full py-4">
                                                <div className="flex items-center justify-between mb-6 pb-3 border-b border-border-subtle">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="w-2 h-6 rounded-full transition-colors shrink-0" style={{ backgroundColor: themeColor }}></div>
                                                        {!printMode ? (
                                                            <input 
                                                                className="text-2xl font-bold text-gray-900 tracking-tight bg-transparent border-none focus:ring-0 w-full p-0 placeholder:text-gray-300"
                                                                value={section.data?.content || ''}
                                                                onChange={(e) => updateSectionData(section.id, { content: e.target.value })}
                                                                placeholder="The Full Lookbook"
                                                            />
                                                        ) : (
                                                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{section.data?.content}</h3>
                                                        )}
                                                    </div>
                                                    {section.data?.collectionName && <div className="text-[11px] font-bold px-2.5 py-1 rounded inline-flex items-center uppercase tracking-wider transition-colors border shadow-sm" style={{ color: themeColor, backgroundColor: `${themeColor}10`, borderColor: `${themeColor}30` }}><Layers size={14} className="mr-1.5" /> Mapped to: {section.data.collectionName}</div>}
                                                </div>
                                                <div className="rounded-2xl border border-border-subtle bg-white shadow-md p-6">
                                                    <div className="grid grid-cols-3 gap-8">
                                                        {(() => {
                                                            // Determine which products to show in this grid
                                                            let catalogProducts = []
                                                            
                                                            // 1. Get products explicitly saved in the catalog
                                                            if (catalog?.items && catalog.items.length > 0) {
                                                                catalogProducts = catalog.items.map(item => {
                                                                    const fullProduct = (products || []).find(p => String(p.id) === String(item.id))
                                                                    const fallbackImage = item.image ? [item.image] : []
                                                                    return {
                                                                        ...item,
                                                                        name: fullProduct?.name || item.name || 'Untitled Product',
                                                                        sku: fullProduct?.sku || item.sku || '—',
                                                                        images: fullProduct?.images && fullProduct.images.length > 0 
                                                                            ? fullProduct.images 
                                                                            : fallbackImage
                                                                    }
                                                                })
                                                            } 

                                                            // 2. Always provide 6-9 slots. Fill with catalog products first, then empty slots.
                                                            const totalSlots = Math.max(9, catalogProducts.length)
                                                            const displayProducts = Array.from({ length: totalSlots }).map((_, i) => {
                                                                if (i < catalogProducts.length) return catalogProducts[i]
                                                                return {
                                                                    id: `slot_${i}`,
                                                                    isSlot: true,
                                                                    name: `Custom Item ${i + 1}`
                                                                }
                                                            })

                                                            // In print mode, only show those that have images
                                                            let printProducts = displayProducts
                                                            if (printMode) {
                                                                printProducts = displayProducts.filter(p => !!(section.data?.[`image_${p.id}`] || (p.images && p.images[0])))
                                                            }

                                                            // Final fallback: show a placeholder message if nothing is found (only in builder)
                                                            if (printProducts.length === 0 && !printMode) {
                                                                return (
                                                                    <div className="col-span-3 py-12 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                                                        <Shirt className="mx-auto text-gray-300 mb-3" size={40} />
                                                                        <p className="text-gray-400 text-sm font-medium">No products to display.</p>
                                                                        <p className="text-gray-400 text-[11px] mt-1">Upload images to the slots below or add products from the Products page.</p>
                                                                    </div>
                                                                )
                                                            }
                                                            
                                                            if (printProducts.length === 0 && printMode) return null

                                                            return printProducts.map((p) => {
                                                                const inventoryProduct = (products || []).find(invP => String(invP.id) === String(p.id))
                                                                const rawImg = section.data?.[`image_${p.id}`] || (inventoryProduct?.images && inventoryProduct.images[0]) || p.image
                                                                const img = resolveImageUrl(rawImg)
                                                                
                                                                const customName = section.data?.[`name_${p.id}`] || inventoryProduct?.name || p.name
                                                                const customPrice = section.data?.[`price_${p.id}`] || (inventoryProduct?.price ? `$${Number(inventoryProduct.price).toFixed(2)}` : (p.price ? `$${Number(p.price).toFixed(2)}` : null))

                                                                return (
                                                                    printMode ? (
                                                                        <div
                                                                            key={p.id}
                                                                            className="group flex flex-col gap-3"
                                                                        >
                                                                            <div
                                                                                className="aspect-[4/5] rounded-2xl border bg-white flex items-center justify-center relative shadow-sm"
                                                                                style={{ borderColor: `${themeColor}20` }}
                                                                            >
                                                                                {img ? (
                                                                                    <img 
                                                                                        src={img} 
                                                                                        alt={customName} 
                                                                                        className="absolute inset-0 w-full h-full object-cover rounded-2xl" 
                                                                                        onError={(e) => {
                                                                                            e.target.onerror = null
                                                                                            e.target.style.display = 'none'
                                                                                            e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full w-full"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shirt text-gray-300"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.62 1.96V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5.42a2 2 0 0 0-1.62-1.96Z"/><path d="M12 22V8"/><path d="M4 7h16"/></svg></div>'
                                                                                        }}
                                                                                    />
                                                                                ) : (
                                                                                    <Shirt className="text-gray-300" size={36} />
                                                                                )}
                                                                            </div>
                                                                            <div className="text-center px-1">
                                                                                <p className="text-[13px] font-bold text-gray-900 truncate">{customName}</p>
                                                                                {customPrice && <p className="text-[11px] font-medium text-gray-500 mt-0.5">{customPrice}</p>}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div key={p.id} className="group flex flex-col gap-3">
                                                                            <button
                                                                                onClick={() => openUpload(section.id, `image_${p.id}`)}
                                                                                className={cn(
                                                                                    "group w-full aspect-[4/5] rounded-2xl border bg-white flex items-center justify-center relative shadow-sm hover:shadow-md active:scale-[0.99] transition-all focus:outline-none",
                                                                                    "border-border-subtle"
                                                                                )}
                                                                                style={{ borderColor: `${themeColor}20` }}
                                                                            >
                                                                                {img ? (
                                                                                    <>
                                                                                        <img 
                                                                                            src={img} 
                                                                                            alt={customName} 
                                                                                            className="absolute inset-0 w-full h-full object-cover rounded-2xl" 
                                                                                            onError={(e) => {
                                                                                                e.target.onerror = null
                                                                                                e.target.style.display = 'none'
                                                                                                e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full w-full"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shirt text-gray-300"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.62 1.96V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5.42a2 2 0 0 0-1.62-1.96Z"/><path d="M12 22V8"/><path d="M4 7h16"/></svg></div>'
                                                                                            }}
                                                                                        />
                                                                                        <div className="absolute bottom-2 right-2 text-[11px] font-bold bg-white/90 border border-border-subtle rounded px-2 py-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                            Replace image
                                                                                        </div>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Shirt className="text-gray-300" size={36} />
                                                                                        <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/5 pointer-events-none transition-colors" />
                                                                                        <div className="absolute right-2 top-2 text-[11px] font-bold bg-white/90 border border-border-subtle rounded px-2 py-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                            Upload image
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                            <div className="space-y-1">
                                                                                <input 
                                                                                    type="text"
                                                                                    placeholder="Product Name"
                                                                                    className="w-full text-center text-[12px] font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 placeholder:text-gray-300"
                                                                                    value={section.data?.[`name_${p.id}`] || ''}
                                                                                    onChange={(e) => updateSectionData(section.id, { [`name_${p.id}`]: e.target.value })}
                                                                                />
                                                                                <input 
                                                                                    type="text"
                                                                                    placeholder="Price (e.g. $45.00)"
                                                                                    className="w-full text-center text-[10px] font-medium text-gray-500 bg-transparent border-none focus:ring-0 p-0 placeholder:text-gray-200"
                                                                                    value={section.data?.[`price_${p.id}`] || ''}
                                                                                    onChange={(e) => updateSectionData(section.id, { [`price_${p.id}`]: e.target.value })}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                )
                                                            })
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {section.type === 'featured_product' && (() => {
                                            const fullProduct = (products || []).find(p => String(p.id) === String(section.data?.productId))
                                            const displayTitle = section.data?.title || fullProduct?.name || ''
                                            const displayPrice = section.data?.price || fullProduct?.price || ''
                                            const displayCost = section.data?.cost || fullProduct?.cost || ''
                                            const displayDescription = section.data?.description || fullProduct?.description || ''
                                            const displayImage = section.data?.image || fullProduct?.images?.[0] || null

                                            return (
                                                <div className={cn("flex flex-col md:flex-row items-center gap-10", printMode ? "py-8" : "py-6")} style={printMode ? { breakInside: 'avoid', pageBreakInside: 'avoid' } : undefined}>
                                                    <div
                                                        className={cn("w-full md:w-1/2 bg-gray-50 rounded-xl border flex items-center justify-center relative overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer", printMode ? "aspect-[3/4]" : "aspect-[4/5]")}
                                                        style={{ borderColor: `${themeColor}30` }}
                                                        onClick={() => {
                                                            if (!printMode) {
                                                                openUpload(section.id, 'image')
                                                            }
                                                        }}
                                                    >
                                                        {displayImage ? (
                                                            <>
                                                                <img src={resolveImageUrl(displayImage)} alt="Featured" className="absolute inset-0 w-full h-full object-cover" />
                                                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/15 to-transparent"></div>
                                                                {!printMode && (
                                                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <div className="text-[11px] font-bold bg-white/90 border border-border-subtle rounded px-2 py-0.5 shadow">
                                                                            Upload Image
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ImageIcon className="text-gray-300" size={48} />
                                                                {!printMode && (
                                                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <div className="text-[11px] font-bold bg-white border border-border-subtle rounded px-2 py-0.5 shadow">
                                                                            Upload Image
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="w-full md:w-1/2 py-4">
                                                        {!printMode ? (
                                                            <input 
                                                                className="text-[10px] font-bold uppercase tracking-widest mb-3 px-2 py-0.5 inline-block rounded-full border transition-colors bg-transparent focus:ring-0 w-full placeholder:text-gray-300"
                                                                style={{ color: themeColor, borderColor: `${themeColor}40` }}
                                                                value={section.data?.content || ''}
                                                                onChange={(e) => updateSectionData(section.id, { content: e.target.value })}
                                                                placeholder="Featured"
                                                            />
                                                        ) : (
                                                            <p className="text-[10px] font-bold uppercase tracking-widest mb-3 px-2 py-0.5 inline-block rounded-full border transition-colors" style={{ color: themeColor, borderColor: `${themeColor}40` }}>{section.data?.content || 'Featured'}</p>
                                                        )}

                                                        {!printMode ? (
                                                            <textarea 
                                                                className="text-3xl font-serif font-bold text-content-primary mb-3 bg-transparent border-none focus:ring-0 w-full resize-none placeholder:text-gray-300"
                                                                value={displayTitle}
                                                                onChange={(e) => updateSectionData(section.id, { title: e.target.value })}
                                                                placeholder="Enter Product Name"
                                                                rows={2}
                                                            />
                                                        ) : (
                                                            <h3 className="text-3xl font-serif font-bold text-content-primary mb-3">{displayTitle || 'No Product Name'}</h3>
                                                        )}

                                                        {!printMode ? (
                                                            <div className="flex items-center gap-2 mb-6">
                                                                <div className="flex items-center bg-gray-50 border border-border-subtle rounded-lg px-2 py-1 focus-within:ring-1 focus-within:ring-brand transition-all">
                                                                    <span className="text-[10px] font-bold text-gray-400 mr-1">$</span>
                                                                    <input 
                                                                        type="number"
                                                                        step="0.01"
                                                                        className="text-[14px] font-bold w-16 bg-transparent border-none focus:ring-0 p-0 placeholder:text-gray-300"
                                                                        value={displayPrice}
                                                                        onChange={(e) => updateSectionData(section.id, { price: e.target.value })}
                                                                        placeholder="0.00"
                                                                    />
                                                                    <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">MSRP</span>
                                                                </div>
                                                                <div className="text-gray-300">•</div>
                                                                <div className="flex items-center bg-gray-50 border border-border-subtle rounded-lg px-2 py-1 focus-within:ring-1 focus-within:ring-brand transition-all">
                                                                    <span className="text-[10px] font-bold text-gray-400 mr-1">$</span>
                                                                    <input 
                                                                        type="number"
                                                                        step="0.01"
                                                                        className="text-[14px] font-bold w-16 bg-transparent border-none focus:ring-0 p-0 placeholder:text-gray-300"
                                                                        value={displayCost}
                                                                        onChange={(e) => updateSectionData(section.id, { cost: e.target.value })}
                                                                        placeholder="0.00"
                                                                    />
                                                                    <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">WHL</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-[15px] font-semibold mb-6 transition-colors" style={{ color: themeColor }}>
                                                                {(displayPrice !== undefined && displayPrice !== '' || displayCost !== undefined && displayCost !== '') ? (
                                                                    <>
                                                                        {(displayPrice !== undefined && displayPrice !== '') && `$${Number(displayPrice).toFixed(2)} MSRP`}
                                                                        {(displayPrice !== undefined && displayPrice !== '') && (displayCost !== undefined && displayCost !== '') && ' • '}
                                                                        {(displayCost !== undefined && displayCost !== '') && `$${Number(displayCost).toFixed(2)} WHL`}
                                                                    </>
                                                                ) : null}
                                                            </p>
                                                        )}

                                                        {!printMode ? (
                                                            <textarea 
                                                                className="text-[13px] text-content-secondary leading-relaxed mb-6 bg-transparent border-none focus:ring-0 w-full resize-none placeholder:text-gray-300"
                                                                value={displayDescription}
                                                                onChange={(e) => updateSectionData(section.id, { description: e.target.value })}
                                                                placeholder="Select a product to display its details here."
                                                                rows={4}
                                                            />
                                                        ) : (
                                                            <p className="text-[13px] text-content-secondary leading-relaxed mb-6">
                                                                {displayDescription || 'Select a product to display its details here.'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                        {section.type === 'ai_tryon' && (
                                            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-10">
                                                <div className="w-full lg:w-1/2">
                                                    <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight"><span style={{ color: themeColor }}>AI Engine: </span>{section.data?.content}</h3>
                                                    {!printMode ? (
                                                        <textarea 
                                                            className="text-gray-500 mb-8 font-medium leading-relaxed bg-transparent border-none focus:ring-0 w-full resize-none placeholder:text-gray-300"
                                                            value={section.data?.description || ''}
                                                            onChange={(e) => updateSectionData(section.id, { description: e.target.value })}
                                                            placeholder="Enter AI Try-On description..."
                                                            rows={3}
                                                        />
                                                    ) : (
                                                        <p className="text-gray-500 mb-8 font-medium leading-relaxed">{section.data?.description}</p>
                                                    )}
                                                    <Button variant="outline" className="shadow-sm transition-colors" style={{ color: themeColor, borderColor: themeColor }}><Shirt className="mr-2 h-4 w-4" /> Switch Model Size & Ethnicity</Button>
                                                </div>
                                                <div className="w-full lg:w-1/2 aspect-[4/5] bg-gray-50 rounded-2xl border-2 border-dashed flex items-center justify-center flex-col shadow-inner transition-colors" style={{ borderColor: `${themeColor}40`, color: themeColor }}>
                                                    <Sparkles className="h-10 w-10 mb-3 opacity-70" />
                                                    <span className="font-bold text-sm tracking-wide">AI Try-On Placement</span>
                                                </div>
                                            </div>
                                        )}
                                        {section.type === 'pricing' && (
                                            <div className={cn("w-full text-center", printMode ? "py-4" : "py-6")} style={printMode ? { breakInside: 'avoid', pageBreakInside: 'avoid' } : undefined}>
                                                <h3 className={cn("text-2xl font-bold text-gray-900 tracking-tight", printMode ? "mb-6" : "mb-8")}>{section.data?.content}</h3>
                                                <div className="border border-border-strong rounded-xl overflow-hidden text-[13px]">
                                                    <div className="grid grid-cols-4 font-bold p-3 border-b border-border-strong tracking-wider uppercase text-[11px] transition-colors" style={{ backgroundColor: `${themeColor}10`, color: themeColor }}>
                                                        <div className="text-left px-2">SKU</div>
                                                        <div className="text-left px-2">Product Name</div>
                                                        <div className="text-right px-2">Wholesale</div>
                                                        <div className="text-right px-2">MSRP</div>
                                                    </div>
                                                    {(() => {
                                                        const displayItems = (catalog?.items || []).map(item => {
                                                            const fullProduct = (products || []).find(p => String(p.id) === String(item.id))
                                                            return {
                                                                ...item,
                                                                name: fullProduct?.name || item.name || 'Untitled Product',
                                                                sku: fullProduct?.sku || item.sku || '—',
                                                                cost: fullProduct?.cost || 0,
                                                                price: fullProduct?.price || 0
                                                            }
                                                        })

                                                        if (displayItems.length === 0) {
                                                            return <div className="p-6 text-center text-content-tertiary text-[13px]">No products added to this catalog yet. Add products to see pricing here.</div>
                                                        }

                                                        return displayItems.map((p) => {
                                                            const customName = section.data?.[`name_${p.id}`] || p.name
                                                            const customSku = section.data?.[`sku_${p.id}`] || p.sku
                                                            const customCost = section.data?.[`cost_${p.id}`] || p.cost
                                                            const customPrice = section.data?.[`price_${p.id}`] || p.price

                                                            return (
                                                                <div key={p.id} className="grid grid-cols-4 p-3 border-b text-content-primary hover:bg-app-hover transition-colors items-center">
                                                                    <div className="text-left px-2">
                                                                        {!printMode ? (
                                                                            <input 
                                                                                className="w-full bg-transparent border-none focus:ring-0 p-0 font-mono text-content-secondary text-[13px] placeholder:text-gray-300"
                                                                                value={customSku || ''}
                                                                                onChange={(e) => updateSectionData(section.id, { [`sku_${p.id}`]: e.target.value })}
                                                                                placeholder="SKU"
                                                                            />
                                                                        ) : (
                                                                            <span className="font-mono text-content-secondary">{customSku || '—'}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-left px-2">
                                                                        {!printMode ? (
                                                                            <input 
                                                                                className="w-full bg-transparent border-none focus:ring-0 p-0 font-bold text-content-primary text-[13px] placeholder:text-gray-300"
                                                                                value={customName || ''}
                                                                                onChange={(e) => updateSectionData(section.id, { [`name_${p.id}`]: e.target.value })}
                                                                                placeholder="Product Name"
                                                                            />
                                                                        ) : (
                                                                            <span className="font-bold">{customName}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-right px-2">
                                                                        {!printMode ? (
                                                                            <div className="flex items-center justify-end">
                                                                                <span className="text-gray-400 mr-0.5">$</span>
                                                                                <input 
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    className="w-16 bg-transparent border-none focus:ring-0 p-0 text-right font-medium text-content-primary text-[13px] placeholder:text-gray-300"
                                                                                    value={customCost || ''}
                                                                                    onChange={(e) => updateSectionData(section.id, { [`cost_${p.id}`]: e.target.value })}
                                                                                    placeholder="0.00"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <span className="font-medium">{customCost ? `$${Number(customCost).toFixed(2)}` : '—'}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-right px-2">
                                                                        {!printMode ? (
                                                                            <div className="flex items-center justify-end">
                                                                                <span className="text-gray-400 mr-0.5">$</span>
                                                                                <input 
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    className="w-16 bg-transparent border-none focus:ring-0 p-0 text-right font-medium text-content-primary text-[13px] placeholder:text-gray-300"
                                                                                    value={customPrice || ''}
                                                                                    onChange={(e) => updateSectionData(section.id, { [`price_${p.id}`]: e.target.value })}
                                                                                    placeholder="0.00"
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <span className="font-medium">{customPrice ? `$${Number(customPrice).toFixed(2)}` : '—'}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                        {section.type === 'specs' && (
                                            <div className="w-full text-center py-6">
                                                <h3 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight flex justify-center items-center gap-2">
                                                    <Table className="h-5 w-5" style={{ color: themeColor }} />
                                                    {section.data?.content}
                                                </h3>
                                                <div className="bg-app-body p-6 rounded-xl border-l-4 border-y border-r border-border-subtle text-[13px] text-left max-w-3xl mx-auto space-y-3 font-medium text-content-secondary transition-colors" style={{ borderLeftColor: themeColor }}>
                                                    {(section.data?.specs || []).map((spec, sIdx) => (
                                                        <div key={sIdx} className="flex justify-between border-b border-border-subtle pb-2 last:border-0 last:pb-0">
                                                            <span>{spec.label}</span>
                                                            <span className="text-content-primary font-bold">{spec.value}</span>
                                                        </div>
                                                    ))}
                                                    {(!section.data?.specs || section.data.specs.length === 0) && (
                                                        <div className="text-center py-4 text-gray-400">No specifications added yet.</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {section.type === 'contact' && (
                                            <div className="w-full text-center py-16 rounded-xl text-white transition-colors" style={{ backgroundColor: themeColor }}>
                                                <h3 className="text-3xl font-bold mb-4">{section.data?.content}</h3>
                                                {!printMode ? (
                                                    <textarea 
                                                        className="text-white/80 mb-8 max-w-lg mx-auto leading-relaxed bg-transparent border-none focus:ring-0 w-full resize-none placeholder:text-white/30 text-center"
                                                        value={section.data?.description || ''}
                                                        onChange={(e) => updateSectionData(section.id, { description: e.target.value })}
                                                        placeholder="Enter contact description..."
                                                        rows={3}
                                                    />
                                                ) : (
                                                    <p className="text-white/80 mb-8 max-w-lg mx-auto leading-relaxed">{section.data?.description}</p>
                                                )}

                                                <div className="flex items-center justify-center gap-6 mb-8 font-mono text-sm opacity-90">
                                                    <div className="flex items-center gap-2"><Mail size={16} /> <span>{section.data?.email}</span></div>
                                                    <div className="flex items-center gap-2"><Phone size={16} /> <span>{section.data?.phone}</span></div>
                                                </div>

                                                <Button className="bg-white hover:bg-gray-100 font-bold px-8 shadow-sm transition-colors" style={{ color: themeColor }}>Submit Wholesale Inquiry</Button>
                                            </div>
                                        )}
                                        {section.type === 'footer' && (
                                            <div className="w-full text-center py-8 opacity-60">
                                                <div className="h-px w-full mb-6 opacity-30 transition-colors" style={{ backgroundColor: themeColor }}></div>
                                                <div className="flex justify-center gap-4 mb-4">
                                                    <span className="font-bold text-sm tracking-widest uppercase transition-colors" style={{ color: themeColor }}>Brand</span>
                                                </div>
                                                <p className="text-xs font-semibold">{section.data?.content}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Toolbar */}
                                    <div className={cn(
                                        "absolute right-4 top-4 transition-all bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] rounded-lg border border-border-strong flex z-30 overflow-hidden transform duration-200",
                                        isSelected ? "opacity-100 translate-y-0 scale-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-[-10px] scale-95 pointer-events-none group-hover:pointer-events-auto"
                                    )}>
                                        <div className="px-3 py-2 bg-app-card-muted border-r border-border-subtle text-[10px] font-bold text-content-secondary uppercase tracking-widest flex items-center shrink-0">
                                            <span className="mr-1 opacity-50">{idx + 1}.</span> {section.type.replace('_', ' ')}
                                        </div>
                                        <button onClick={(e) => moveSectionUp(e, idx)} disabled={idx === 0} className={cn("h-8 w-8 flex items-center justify-center transition-colors shadow-sm", idx === 0 ? "text-border-strong bg-app-card-muted" : "hover:bg-app-hover text-content-primary")} title="Move Up"><ArrowUp size={14} /></button>
                                        <button onClick={(e) => moveSectionDown(e, idx)} disabled={idx === sections.length - 1} className={cn("h-8 w-8 flex items-center justify-center transition-colors shadow-sm", idx === sections.length - 1 ? "text-border-strong bg-app-card-muted" : "hover:bg-app-hover text-content-primary")} title="Move Down"><ArrowDown size={14} /></button>
                                        <div className="h-8 w-px bg-border-subtle"></div>
                                        <button onClick={(e) => duplicateSection(e, section)} className="h-8 w-8 flex items-center justify-center hover:bg-app-hover text-content-primary transition-colors shadow-sm" title="Duplicate Block"><Copy size={13} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingSectionId(section.id) }} className="h-8 w-8 flex items-center justify-center bg-brand-soft text-brand hover:bg-brand hover:text-white transition-colors shadow-sm" title="Edit Properties"><Edit2 size={13} /></button>
                                        <div className="h-8 w-px bg-border-subtle"></div>
                                        <button onClick={(e) => removeSection(e, section.id)} className="h-8 w-8 flex items-center justify-center hover:bg-red-50 text-semantic-error transition-colors shadow-sm" title="Delete Block"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            )
                        })}

                        {!printMode && (
                            <div className="w-full py-10 mx-auto max-w-[calc(100%-6rem)] mb-12 mt-auto bg-white border-2 border-dashed border-border-strong rounded-xl text-content-tertiary font-bold hover:border-brand hover:text-brand hover:bg-brand-soft/20 transition-all flex items-center justify-center cursor-pointer shadow-sm" onClick={() => toast.info('Click a content block on the left sidebar to add it.')}>
                                <Plus className="mr-2 h-5 w-5" /> Drop New Block Here
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />

            {/* Block Settings Panel */}
            {editingSectionId && (
                <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-[110] border-l border-border-subtle flex flex-col animate-in slide-in-from-right duration-300">
                    {(() => {
                        const section = sections.find(s => s.id === editingSectionId)
                        if (!section) return null
                        const blockInfo = BLOCKS.find(b => b.type === section.type)
                        
                        return (
                            <>
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div className="flex items-center gap-2">
                                        {blockInfo && <blockInfo.icon size={18} className="text-brand" />}
                                        <h3 className="font-bold text-gray-900">{blockInfo?.label || 'Block Settings'}</h3>
                                    </div>
                                    <button 
                                        onClick={() => setEditingSectionId(null)}
                                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                    {/* Generic Content Field (most blocks use this) */}
                                    {['brand_intro', 'collection_intro', 'product_grid', 'ai_tryon', 'specs', 'pricing', 'contact', 'footer'].includes(section.type) && (
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                                {section.type === 'brand_intro' ? 'Headline' : 
                                                 section.type === 'contact' ? 'Contact Heading' : 
                                                 'Main Content / Header'}
                                            </label>
                                            <textarea 
                                                className="w-full min-h-[80px] p-3 text-[13px] border border-border-subtle rounded-xl focus:ring-1 focus:ring-brand outline-none resize-none"
                                                value={section.data?.content || ''}
                                                onChange={(e) => updateSectionData(section.id, { content: e.target.value })}
                                                placeholder="Enter block content..."
                                            />
                                        </div>
                                    )}

                                    {/* Description Field for specific blocks */}
                                    {['brand_intro', 'collection_intro', 'ai_tryon', 'contact'].includes(section.type) && (
                                        <>
                                            {section.type === 'collection_intro' && (
                                                <div className="space-y-2 mb-4">
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Intro Title</label>
                                                    <Input 
                                                        value={section.data?.title || ''}
                                                        onChange={(e) => updateSectionData(section.id, { title: e.target.value })}
                                                        placeholder="e.g. Introducing The Collection"
                                                    />
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Description / Body Text</label>
                                                <textarea 
                                                    className="w-full min-h-[120px] p-3 text-[13px] border border-border-subtle rounded-xl focus:ring-1 focus:ring-brand outline-none resize-none"
                                                    value={section.data?.description || ''}
                                                    onChange={(e) => updateSectionData(section.id, { description: e.target.value })}
                                                    placeholder="Enter detailed description..."
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Brand Intro Logo */}
                                    {section.type === 'brand_intro' && (
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Brand Logo</label>
                                            <div 
                                                className="h-20 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => openUpload(section.id, 'logo')}
                                            >
                                                {section.data?.logo ? (
                                                    <img src={resolveImageUrl(section.data.logo)} className="h-full object-contain p-2 rounded-xl" alt="" />
                                                ) : (
                                                    <>
                                                        <ImageIcon size={20} className="text-gray-300 mb-1" />
                                                        <span className="text-[10px] font-medium text-gray-400">Upload Logo</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Specs Specific Fields */}
                                    {section.type === 'specs' && (
                                        <div className="space-y-4">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Technical Specs</label>
                                            {(section.data?.specs || []).map((spec, sIdx) => (
                                                <div key={sIdx} className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl relative group/spec">
                                                    <Input 
                                                        className="text-[12px] h-8"
                                                        value={spec.label || ''}
                                                        onChange={(e) => {
                                                            const newSpecs = [...(section.data?.specs || [])]
                                                            newSpecs[sIdx] = { ...newSpecs[sIdx], label: e.target.value }
                                                            updateSectionData(section.id, { specs: newSpecs })
                                                        }}
                                                        placeholder="Label"
                                                    />
                                                    <Input 
                                                        className="text-[12px] h-8"
                                                        value={spec.value || ''}
                                                        onChange={(e) => {
                                                            const newSpecs = [...(section.data?.specs || [])]
                                                            newSpecs[sIdx] = { ...newSpecs[sIdx], value: e.target.value }
                                                            updateSectionData(section.id, { specs: newSpecs })
                                                        }}
                                                        placeholder="Value"
                                                    />
                                                    <button 
                                                        className="absolute -right-2 -top-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/spec:opacity-100 transition-opacity"
                                                        onClick={() => {
                                                            const newSpecs = (section.data?.specs || []).filter((_, i) => i !== sIdx)
                                                            updateSectionData(section.id, { specs: newSpecs })
                                                        }}
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full text-[11px] h-8 border-dashed"
                                                onClick={() => {
                                                    const newSpecs = [...(section.data?.specs || []), { label: '', value: '' }]
                                                    updateSectionData(section.id, { specs: newSpecs })
                                                }}
                                            >
                                                <Plus size={14} className="mr-1" /> Add Specification
                                            </Button>
                                        </div>
                                    )}

                                    {/* Hero Specific Fields */}
                                    {section.type === 'hero' && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Hero Title</label>
                                                <Input 
                                                    value={section.data?.title || ''}
                                                    onChange={(e) => updateSectionData(section.id, { title: e.target.value })}
                                                    placeholder="e.g. Autumn/Winter 2026"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Subtitle</label>
                                                <textarea 
                                                    className="w-full min-h-[80px] p-3 text-[13px] border border-border-subtle rounded-xl focus:ring-1 focus:ring-brand outline-none resize-none"
                                                    value={section.data?.subtitle || ''}
                                                    onChange={(e) => updateSectionData(section.id, { subtitle: e.target.value })}
                                                    placeholder="Enter subtitle..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Hero Banner</label>
                                                <div 
                                                    className="aspect-video bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                                                    onClick={() => openUpload(section.id, 'image')}
                                                >
                                                    {section.data?.image ? (
                                                        <img src={resolveImageUrl(section.data.image)} className="w-full h-full object-cover rounded-xl" alt="" />
                                                    ) : (
                                                        <>
                                                            <ImageIcon size={24} className="text-gray-300 mb-2" />
                                                            <span className="text-[11px] font-medium text-gray-400">Click to upload</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Featured Product Fields */}
                                    {section.type === 'featured_product' && (() => {
                                        const fullProduct = (products || []).find(p => String(p.id) === String(section.data?.productId))
                                        
                                        return (
                                            <>
                                                <div className="p-3 bg-brand-soft/20 rounded-xl border border-brand/10">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Sparkles size={14} className="text-brand" />
                                                        <span className="text-[11px] font-bold text-brand uppercase tracking-wider">Smart Spotlight</span>
                                                    </div>
                                                    <p className="text-[11px] text-brand/70 leading-relaxed mb-3">Linked products automatically sync their name, price, and description.</p>
                                                    <Button 
                                                        size="sm" 
                                                        className="w-full bg-brand text-white text-[11px] h-8"
                                                        onClick={() => {
                                                            setPickerTarget({ sectionId: section.id })
                                                            setIsProductPickerOpen(true)
                                                        }}
                                                    >
                                                        {section.data?.productId ? 'Change Linked Product' : 'Select From Inventory'}
                                                    </Button>
                                                </div>

                                                <div className="space-y-4 pt-2">
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product Data {fullProduct ? '(Linked)' : '(Manual)'}</label>
                                                        <div className="space-y-3 p-3 bg-gray-50 rounded-xl border border-border-subtle">
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Product Name</span>
                                                                <Input 
                                                                    value={section.data?.title || ''}
                                                                    onChange={(e) => updateSectionData(section.id, { title: e.target.value })}
                                                                    placeholder={fullProduct?.name || "e.g. Premium Cotton Tee"}
                                                                    className="h-8 text-xs"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="space-y-1">
                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Price (MSRP)</span>
                                                                    <Input 
                                                                        type="number"
                                                                        value={section.data?.price || ''}
                                                                        onChange={(e) => updateSectionData(section.id, { price: e.target.value })}
                                                                        placeholder={fullProduct?.price || "0.00"}
                                                                        className="h-8 text-xs"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Cost (WHL)</span>
                                                                    <Input 
                                                                        type="number"
                                                                        value={section.data?.cost || ''}
                                                                        onChange={(e) => updateSectionData(section.id, { cost: e.target.value })}
                                                                        placeholder={fullProduct?.cost || "0.00"}
                                                                        className="h-8 text-xs"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">SKU / Reference</span>
                                                                <Input 
                                                                    value={section.data?.sku || ''}
                                                                    onChange={(e) => updateSectionData(section.id, { sku: e.target.value })}
                                                                    placeholder={fullProduct?.sku || "e.g. TEE-001"}
                                                                    className="h-8 text-xs"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product Image</label>
                                                        <div 
                                                            className="aspect-square bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors relative overflow-hidden group"
                                                            onClick={() => openUpload(section.id, 'image')}
                                                        >
                                                            { (section.data?.image || fullProduct?.images?.[0]) ? (
                                                                <>
                                                                    <img src={resolveImageUrl(section.data?.image || fullProduct?.images?.[0])} className="w-full h-full object-cover rounded-xl" alt="" />
                                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <span className="text-white text-[10px] font-bold uppercase">Change Image</span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ImageIcon size={24} className="text-gray-300 mb-2" />
                                                                    <span className="text-[11px] font-medium text-gray-400">Click to upload image</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Custom Badge</label>
                                                        <Input 
                                                            value={section.data?.content || 'Featured'}
                                                            onChange={(e) => updateSectionData(section.id, { content: e.target.value })}
                                                            placeholder="e.g. Best Seller"
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product Description</label>
                                                        <textarea 
                                                            className="w-full min-h-[100px] p-3 text-[13px] border border-border-subtle rounded-xl focus:ring-1 focus:ring-brand outline-none resize-none"
                                                            value={section.data?.description || ''}
                                                            onChange={(e) => updateSectionData(section.id, { description: e.target.value })}
                                                            placeholder={fullProduct?.description || "Enter product description..."}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    })()}

                                    {/* Contact Specific Fields */}
                                    {section.type === 'contact' && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                                                <Input 
                                                    value={section.data?.email || ''}
                                                    onChange={(e) => updateSectionData(section.id, { email: e.target.value })}
                                                    placeholder="wholesale@brand.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                                                <Input 
                                                    value={section.data?.phone || ''}
                                                    onChange={(e) => updateSectionData(section.id, { phone: e.target.value })}
                                                    placeholder="+1 800 555 1234"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                    <Button 
                                        className="w-full bg-black text-white hover:bg-gray-800"
                                        onClick={() => setEditingSectionId(null)}
                                    >
                                        Done Editing
                                    </Button>
                                </div>
                            </>
                        )
                    })()}
                </div>
            )}

            {/* Product Picker Modal */}
            {isProductPickerOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Select Featured Product</h3>
                                <p className="text-sm text-gray-500 mt-1">Choose a product to spotlight in this section.</p>
                            </div>
                            <button 
                                onClick={() => setIsProductPickerOpen(false)}
                                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {products.length === 0 ? (
                                <div className="py-20 text-center text-gray-400">
                                    <Shirt size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="font-medium">No products found in your inventory.</p>
                                </div>
                            ) : (
                                products.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSelectFeaturedProduct(p)}
                                        className="w-full flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-brand hover:bg-brand-soft/10 transition-all text-left group"
                                    >
                                        <div className="h-14 w-14 rounded-lg bg-gray-100 overflow-hidden border border-gray-100 shrink-0">
                                            {p.images?.[0] ? (
                                                <img src={resolveImageUrl(p.images[0])} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{p.name}</p>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">{p.sku || 'No SKU'}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-brand">${Number(p.price || 0).toFixed(2)}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">MSRP</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors text-gray-300">
                                            <Plus size={16} />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                            <Button variant="outline" onClick={() => setIsProductPickerOpen(false)}>Cancel</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
