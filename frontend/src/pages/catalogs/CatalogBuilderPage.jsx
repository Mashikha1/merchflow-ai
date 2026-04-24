import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import {
    Save, Eye, Monitor, Smartphone, LayoutGrid, Type, Image as ImageIcon, Plus, Trash2, ArrowLeft, Shirt, AlignLeft, HelpCircle, Columns, Table, DollarSign, Download, Layers, Sparkles, ArrowUp, ArrowDown, Copy, Edit2, Mail, Phone, MapPin
} from 'lucide-react'
import { catalogService } from '../../services/catalogService'
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

export function CatalogBuilderPage() {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const [catalog, setCatalog] = useState(null)
    const [sections, setSections] = useState([])
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [selectedProducts, setSelectedProducts] = useState([])

    // Interaction State
    const [selectedSectionId, setSelectedSectionId] = useState(null)
    const sectionRefs = useRef({})

    // Global Theme State
    const [themeColor, setThemeColor] = useState('#111111')
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

                const initialSections = []
                let counter = 1

                if (data.toggles?.intro !== false) {
                    initialSections.push({ id: `s_${counter++}`, type: 'hero', data: { title: data.name, subtitle: 'Season Preview' } })
                    initialSections.push({ id: `s_${counter++}`, type: 'brand_intro', data: { content: data.description || 'Welcome to our premium collection.' } })
                }

                if (data.type === 'lookbook') {
                    if (data.toggles?.aiAssets) initialSections.push({ id: `s_${counter++}`, type: 'ai_tryon', data: { content: 'Virtual Try-On Experience' } })
                    initialSections.push({ id: `s_${counter++}`, type: 'product_grid', data: { content: 'The Full Lookbook' } })
                } else if (data.type === 'line-sheet') {
                    initialSections.push({ id: `s_${counter++}`, type: 'product_grid', data: { content: 'Products Overview' } })
                    if (data.toggles?.specs) initialSections.push({ id: `s_${counter++}`, type: 'specs', data: { content: 'Technical Specifications' } })
                    if (data.toggles?.pricing) initialSections.push({ id: `s_${counter++}`, type: 'pricing', data: { content: 'Wholesale Pricing Tiers' } })
                } else if (data.type === 'price-list') {
                    initialSections.push({ id: `s_${counter++}`, type: 'pricing', data: { content: 'Master Price List' } })
                }

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
            sectionsPayload = sectionsPayload.filter((s) => {
                if (s.type === 'product_grid') return true
                if (s.type === 'hero') return !!(s.data?.image || s.data?.title)
                if (s.type === 'brand_intro') return !!(s.data?.logo || s.data?.content)
                if (s.type === 'collection_intro') return !!s.data?.content
                if (s.type === 'featured_product') return !!(s.data?.image || s.data?.content)
                if (s.type === 'pricing') return true
                if (s.type === 'specs') return true
                if (s.type === 'contact') return true
                if (s.type === 'footer') return true
                // Include AI Try-On only when explicitly enabled by section flag
                if (s.type === 'ai_tryon') return s.data?.enabled === true
                return false
            })
            const auth = JSON.parse(localStorage.getItem('merchflow_auth') || '{}')
            const token = auth?.state?.token || null
            const res = await fetch(`/api/export`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ catalogId: catalog.id, sections: sectionsPayload })
            })
            const ct = res.headers.get('content-type') || ''
            if (!res.ok) {
                const msg = await res.text().catch(() => '')
                throw new Error(msg || 'Request failed')
            }
            if (!ct.includes('application/pdf')) {
                const msg = await res.text().catch(() => '')
                throw new Error(msg || 'Server did not return a PDF')
            }
            const raw = await res.arrayBuffer()
            const blob = new Blob([raw], { type: 'application/pdf' })
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

    const selectThemeColor = (color) => {
        setThemeColor(color)
        setCatalog(prev => ({ ...prev, themeColor: color }))
    }

    const getSectionDefaults = (type) => {
        switch (type) {
            case 'hero': return { title: 'New Collection', subtitle: 'Fall/Winter 2026', image: null }
            case 'brand_intro': return { content: 'Welcome to our brand.', logo: null }
            case 'collection_intro': return { content: 'This collection embodies the spirit of our brand. Expect dynamic cuts, premium fabrics, and sustainable sourcing.' }
            case 'product_grid': return { content: 'The Collection', collectionName: 'Fall Core' }
            case 'featured_product': return { content: 'Hero Product Spotlight', sku: 'HD-WSH-02' }
            case 'ai_tryon': return { content: 'Virtual Try-On' }
            case 'specs': return { content: 'Technical Specifications' }
            case 'pricing': return { content: 'Master Price List' }
            case 'contact': return { content: 'Get in Touch', email: 'wholesale@brand.com', phone: '+1 800 555 1234' }
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

    const onFilePicked = (e) => {
        const f = e.target.files?.[0]
        if (!f || !uploadCtx) return
        const url = URL.createObjectURL(f)
        setSections(prev => prev.map((s) => {
            if (s.id !== uploadCtx.sectionId) return s
            return { ...s, data: { ...s.data, [uploadCtx.key]: url } }
        }))
        toast.success('Image added')
        e.target.value = ''
    }

    const removeImage = (sectionId, key) => {
        setSections(prev => prev.map((s) => s.id === sectionId ? ({ ...s, data: { ...s.data, [key]: null } }) : s))
        toast.message('Image removed')
    }

    if (loading) return <div className="p-12 flex justify-center text-gray-500">Loading builder...</div>

    return (
        <div className={cn("flex flex-col h-[calc(100vh-80px)] overflow-hidden -mx-4 -mt-6", printMode && "mx-0 mt-0 h-auto overflow-visible")}>

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
                    <Button className="shadow-md"><Save className="mr-2 h-4 w-4" /> Save Draft</Button>
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
                                <select className="w-full h-8 text-xs font-medium border-border-subtle rounded-lg bg-gray-50 focus:ring-black outline-none px-2">
                                    <option>Inter / System UI</option>
                                    <option>Playfair Display / Serif</option>
                                    <option>Space Grotesk</option>
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
                                                        <img src={section.data.image} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
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
                                                <h1 className="text-5xl font-serif text-gray-900 tracking-tight font-bold z-10 text-center px-4" style={{ color: themeColor }}>{section.data?.title || 'Cover Hero'}</h1>
                                                {section.data?.subtitle && <h2 className="text-xl text-gray-600 mt-4 z-10 font-medium tracking-widest uppercase text-center">{section.data.subtitle}</h2>}
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
                                                    <img src={section.data.logo} alt="Brand Logo" className="h-16 mx-auto mb-8" />
                                                ) : (
                                                    <div className="h-16 w-16 text-white font-serif font-bold text-2xl flex items-center justify-center rounded-full mx-auto mb-8 transition-colors" style={{ backgroundColor: themeColor }}>BR</div>
                                                )}
                                                <h3 className="text-2xl font-serif text-gray-800 mb-6 leading-snug">{section.data?.content}</h3>
                                                <p className="text-sm text-gray-500 leading-relaxed font-medium">We design luxury apparel with a focus on sustainable sourcing, zero-waste patterns, and modern silhouettes. Every thread connects to our philosophy of enduring style.</p>
                                                <div className="h-0.5 w-16 mx-auto mt-8 transition-colors" style={{ backgroundColor: themeColor }}></div>
                                            </div>
                                        )}
                                        {/* If merging hero + brand intro for print, render brand intro directly below hero here */}
                                        {mergeHeroWithBrand && (
                                            <div className="text-center max-w-2xl mx-auto py-10">
                                                {sections[idx + 1]?.data?.logo ? (
                                                    <img src={sections[idx + 1].data.logo} alt="Brand Logo" className="h-16 mx-auto mb-8" />
                                                ) : (
                                                    <div className="h-16 w-16 text-white font-serif font-bold text-2xl flex items-center justify-center rounded-full mx-auto mb-8 transition-colors" style={{ backgroundColor: themeColor }}>BR</div>
                                                )}
                                                <h3 className="text-2xl font-serif text-gray-800 mb-6 leading-snug">{sections[idx + 1]?.data?.content}</h3>
                                                <p className="text-sm text-gray-500 leading-relaxed font-medium">We design luxury apparel with a focus on sustainable sourcing, zero-waste patterns, and modern silhouettes. Every thread connects to our philosophy of enduring style.</p>
                                                <div className="h-0.5 w-16 mx-auto mt-8 transition-colors" style={{ backgroundColor: themeColor }}></div>
                                            </div>
                                        )}
                                        {section.type === 'collection_intro' && (
                                            <div className="text-left w-full py-10 px-4">
                                                <div className="h-1 w-12 mb-4 rounded-full transition-colors" style={{ backgroundColor: themeColor }}></div>
                                                <h2 className="text-3xl font-bold text-content-primary mb-4 tracking-tight">Introducing The Collection</h2>
                                                <p className="text-[15px] text-content-secondary max-w-3xl leading-relaxed border-l-4 pl-4 transition-colors" style={{ borderColor: themeColor }}>{section.data?.content}</p>
                                            </div>
                                        )}
                                        {section.type === 'product_grid' && (
                                            <div className="w-full py-4">
                                                <div className="flex items-center justify-between mb-6 pb-3 border-b border-border-subtle">
                                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                                                        <div className="w-2 h-6 rounded-full transition-colors" style={{ backgroundColor: themeColor }}></div>
                                                        {section.data?.content}
                                                    </h3>
                                                    {section.data?.collectionName && <div className="text-[11px] font-bold px-2.5 py-1 rounded inline-flex items-center uppercase tracking-wider transition-colors border shadow-sm" style={{ color: themeColor, backgroundColor: `${themeColor}10`, borderColor: `${themeColor}30` }}><Layers size={14} className="mr-1.5" /> Mapped to: {section.data.collectionName}</div>}
                                                </div>
                                                <div className="rounded-2xl border border-border-subtle bg-white shadow-md p-6">
                                                    <div className="grid grid-cols-3 gap-8">
                                                        {(printMode ? (products || []).filter((p) => !!section.data?.[`image_${p.id}`]) : (products || []).slice(0, 9)).map((p) => {
                                                            const img = section.data?.[`image_${p.id}`]
                                                            return (
                                                                printMode ? (
                                                                    <div
                                                                        key={p.id}
                                                                        className="group aspect-[4/5] rounded-2xl border bg-white flex items-center justify-center relative shadow-sm"
                                                                        style={{ borderColor: `${themeColor}20` }}
                                                                    >
                                                                        {img ? (
                                                                            <img src={img} alt={p.name} className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                                                                        ) : (
                                                                            <Shirt className="text-gray-300" size={36} />
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        key={p.id}
                                                                        onClick={() => openUpload(section.id, `image_${p.id}`)}
                                                                        className={cn(
                                                                            "group aspect-[4/5] rounded-2xl border bg-white flex items-center justify-center relative shadow-sm hover:shadow-md active:scale-[0.99] transition-all focus:outline-none",
                                                                            "border-border-subtle"
                                                                        )}
                                                                        style={{ borderColor: `${themeColor}20` }}
                                                                    >
                                                                        {img ? (
                                                                            <>
                                                                                <img src={img} alt={p.name} className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
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
                                                                )
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {section.type === 'featured_product' && (
                                            <div className={cn("flex flex-col md:flex-row items-center gap-10", printMode ? "py-8" : "py-6")} style={printMode ? { breakInside: 'avoid', pageBreakInside: 'avoid' } : undefined}>
                                                <div
                                                    className={cn("w-full md:w-1/2 bg-gray-50 rounded-xl border flex items-center justify-center relative overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer", printMode ? "aspect-[3/4]" : "aspect-[4/5]")}
                                                    style={{ borderColor: `${themeColor}30` }}
                                                    onClick={() => openUpload(section.id, 'image')}
                                                >
                                                    {section.data?.image ? (
                                                        <>
                                                            <img src={section.data.image} alt="Featured" className="absolute inset-0 w-full h-full object-cover" />
                                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/15 to-transparent"></div>
                                                            {!printMode && (
                                                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <div className="text-[11px] font-bold bg-white/90 border border-border-subtle rounded px-2 py-0.5 shadow">
                                                                        Replace image
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {!printMode && (
                                                                <button
                                                                    className="absolute top-2 right-2 text-[11px] font-bold bg-white/90 border border-border-subtle rounded px-2 py-0.5 shadow"
                                                                    onClick={(e) => { e.stopPropagation(); removeImage(section.id, 'image') }}
                                                                >
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ImageIcon className="text-gray-300" size={48} />
                                                            {!printMode && (
                                                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <div className="text-[11px] font-bold bg-white border border-border-subtle rounded px-2 py-0.5 shadow">
                                                                        Upload image
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="w-full md:w-1/2 py-4">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3 px-2 py-0.5 inline-block rounded-full border transition-colors" style={{ color: themeColor, borderColor: `${themeColor}40` }}>{section.data?.content}</p>
                                                    <h3 className="text-3xl font-serif font-bold text-content-primary mb-3">Oversized Washed Hoodie</h3>
                                                    <p className="text-[15px] font-semibold mb-6 transition-colors" style={{ color: themeColor }}>$85.00 MSRP • $42.50 WHL</p>
                                                    <p className="text-[13px] text-content-secondary leading-relaxed mb-6">Featuring a vintage enzyme wash, heavyweight 400gsm cotton fleece, and dropped shoulders for an effortlessly modern drape. Pre-shrunk and garment-dyed.</p>
                                                    <div className="flex items-center gap-3">
                                                        <Button style={{ backgroundColor: themeColor }} className="text-white border-transparent hover:opacity-90">Order Sample</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {section.type === 'ai_tryon' && (
                                            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-10">
                                                <div className="w-full lg:w-1/2">
                                                    <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight"><span style={{ color: themeColor }}>AI Engine: </span>{section.data?.content}</h3>
                                                    <p className="text-gray-500 mb-8 font-medium leading-relaxed">Instantly visualize our products on diverse models using MerchFlow AI's native Try-On pipeline. Click below to toggle variations.</p>
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
                                                    {products.length === 0 ? (
                                                        <div className="p-6 text-center text-content-tertiary text-[13px]">No products added yet. Add products to see pricing here.</div>
                                                    ) : (
                                                        products.slice(0, 20).map((p) => (
                                                            <div key={p.id} className="grid grid-cols-4 p-3 border-b text-content-primary hover:bg-app-hover transition-colors">
                                                                <div className="font-mono text-left px-2 text-content-secondary">{p.sku || '—'}</div>
                                                                <div className="font-bold text-left px-2">{p.name}</div>
                                                                <div className="text-right px-2 font-medium">{p.cost ? `$${Number(p.cost).toFixed(2)}` : '—'}</div>
                                                                <div className="text-right px-2 font-medium">{p.price ? `$${Number(p.price).toFixed(2)}` : '—'}</div>
                                                            </div>
                                                        ))
                                                    )}
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
                                                    <div className="flex justify-between border-b border-border-subtle pb-2"><span>Material Composition</span><span className="text-content-primary font-bold">100% Organic Cotton</span></div>
                                                    <div className="flex justify-between border-b border-border-subtle pb-2"><span>Fabric Weight</span><span className="text-content-primary font-bold">400 GSM Fleece</span></div>
                                                    <div className="flex justify-between border-b border-border-subtle pb-2"><span>Manufacturing Origin</span><span className="text-content-primary font-bold">Portugal</span></div>
                                                    <div className="flex justify-between pb-1"><span>Care Instructions</span><span className="text-content-primary font-bold">Machine cold wash, Hang dry</span></div>
                                                </div>
                                            </div>
                                        )}
                                        {section.type === 'contact' && (
                                            <div className="w-full text-center py-16 rounded-xl text-white transition-colors" style={{ backgroundColor: themeColor }}>
                                                <h3 className="text-3xl font-bold mb-4">{section.data?.content}</h3>
                                                <p className="text-white/80 mb-8 max-w-lg mx-auto leading-relaxed">We look forward to partnering with your retail locations. Reach out for custom quotes, seasonal order minimums, and shipping timelines.</p>

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
                                        <button onClick={(e) => { e.stopPropagation(); toast.info('Opening block settings panel...') }} className="h-8 w-8 flex items-center justify-center bg-brand-soft text-brand hover:bg-brand hover:text-white transition-colors shadow-sm" title="Edit Properties"><Edit2 size={13} /></button>
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
        </div>
    )
}
