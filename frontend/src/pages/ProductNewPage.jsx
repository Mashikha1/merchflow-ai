import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, ChevronRight, UploadCloud, Info, AlertCircle, Save, X, Sparkles, Book, Image as ImageIcon, Plus, Layers } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { UploadDropzone } from '../components/UploadDropzone'
import { RightDrawer } from '../components/RightDrawer'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { catalogService } from '../services/catalogService'
import { productService } from '../services/productService'

const STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Media & Variants' },
  { id: 3, label: 'Pricing & Inventory' },
  { id: 4, label: 'Specifications' },
  { id: 5, label: 'Review & Save' }
]

export function ProductNewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [mode, setMode] = useState('existing') // 'existing' | 'new'
  const [existingId, setExistingId] = useState('')
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('lookbook')
  const [placement, setPlacement] = useState({
    grid: true,
    featured: false,
    end: true,
    newSection: false,
  })

  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    sku: '',
    category: '',
    collection: '',
    brand: '',
    description: '',
    status: 'Draft',
    tags: '',
    slug: '',

    // Media & Variants
    images: [],
    variants: [],
    variantOptions: [],

    // Pricing & Inventory
    retailPrice: '',
    wholesalePrice: '',
    discountedPrice: '',
    currency: 'USD',
    stock: '',
    moq: '',
    reorderThreshold: '',
    warehouse: 'Main Hub',

    // Specs
    material: '',
    pattern: '',
    fit: '',
    gsm: '',
    care: '',
    origin: '',
    notes: ''
  })

  // Auto-generate slug when name changes
  useEffect(() => {
    if (step === 1 && formData.name) {
      setFormData(prev => ({
        ...prev,
        slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      }))
    }
  }, [formData.name, step])

  const updateForm = (key, value) => setFormData(prev => ({ ...prev, [key]: value }))

  const handleNext = () => setStep(s => Math.min(s + 1, 5))
  const handlePrev = () => setStep(s => Math.max(s - 1, 1))

  const [variantOpen, setVariantOpen] = useState(false)
  const [variantName, setVariantName] = useState('Color')
  const [variantValuesText, setVariantValuesText] = useState('')

  const generateCombinations = (options) => {
    if (!options || options.length === 0) return []
    const names = options.map(o => o.name)
    const lists = options.map(o => o.values || [])
    const cartesian = (arrs) => arrs.reduce((acc, curr) => {
      const res = []
      acc.forEach(a => curr.forEach(b => res.push([...a, b])))
      return res
    }, [[]])
    const combos = cartesian(lists)
    return combos.map((combo, i) => ({
      id: `var_${Date.now()}_${i}`,
      attrs: Object.fromEntries(combo.map((val, idx) => [names[idx], val])),
      sku: '',
      price: '',
      stock: '',
      imageUrl: '',
    }))
  }

  const handleAddOption = () => {
    const raw = variantValuesText.trim()
    if (!raw) { toast.message('Enter option values'); return }
    const values = Array.from(new Set(raw.split(',').map(s => s.trim()).filter(Boolean)))
    const nextOptions = [...(formData.variantOptions || []), { name: variantName, values }]
    const nextVariants = nextOptions.length >= 2 ? generateCombinations(nextOptions) : []
    setFormData(prev => ({ ...prev, variantOptions: nextOptions, variants: nextVariants }))
    setVariantOpen(false)
    setVariantValuesText('')
    toast.success('Variant option added')
  }

  const handleDeleteOption = (name) => {
    const nextOptions = (formData.variantOptions || []).filter(o => o.name !== name)
    const nextVariants = nextOptions.length >= 2 ? generateCombinations(nextOptions) : []
    setFormData(prev => ({ ...prev, variantOptions: nextOptions, variants: nextVariants }))
    toast.message('Option removed')
  }

  const handleRegenerate = () => {
    const nextVariants = (formData.variantOptions || []).length >= 2 ? generateCombinations(formData.variantOptions) : []
    setFormData(prev => ({ ...prev, variants: nextVariants }))
    toast.success('Combinations regenerated')
  }
  const createProductM = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setShowSuccess(true)
      setIsSubmitting(false)
    },
    onError: (err) => {
      toast.error('Failed to create product: ' + err.message)
      setIsSubmitting(false)
    }
  })

  const handleCreate = async () => {
    if (!formData.name) {
      toast.error('Product name is required')
      return
    }
    
    setIsSubmitting(true)
    
    const sku = formData.sku || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    createProductM.mutate({
      name: formData.name,
      sku: sku,
      description: formData.description,
      price: Number(formData.retailPrice) || 0,
      cost: Number(formData.wholesalePrice) || 0,
      stock: Number(formData.stock) || 0,
      status: formData.status === 'Draft' ? 'DRAFT' : formData.status === 'Active' ? 'ACTIVE' : 'ARCHIVED',
      images: formData.images.map(img => img.url),
      tags: formData.tags ? formData.tags.split(',').map(s => s.trim()) : []
    })
  }

  // Calculate completeness score (mock logic)
  const calculateCompleteness = () => {
    let score = 0
    if (formData.name) score += 10
    if (formData.sku) score += 10
    if (formData.category) score += 10
    if (formData.images.length > 0) score += 20
    if (formData.retailPrice && formData.stock) score += 20
    if (formData.material && formData.fit) score += 15
    if (formData.description) score += 15
    return score
  }

  const completeness = calculateCompleteness()
  const catalogsQ = useQuery({ queryKey: ['catalogs'], queryFn: catalogService.getCatalogs })

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto pt-16 pb-12 animate-in slide-in-from-bottom-4">
        <Card className="text-center p-12 border-none shadow-lg bg-white">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-[32px] font-bold text-content-primary tracking-tight mb-3">Product Created Successfully!</h2>
          <p className="text-[16px] text-content-secondary mb-10">"{formData.name}" has been saved as a {formData.status.toLowerCase()} and is ready for next steps.</p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <Button size="lg" onClick={() => navigate('/products/prod_new_123')} className="w-full text-[15px] h-14">
              Open Product Details
            </Button>
            <Button size="lg" variant="secondary" onClick={() => {
              setFormData({
                name: '', sku: '', category: '', collection: '', brand: '', description: '', status: 'Draft', tags: '', slug: '',
                images: [], variants: [], retailPrice: '', wholesalePrice: '', discountedPrice: '', currency: 'USD', stock: '', moq: '', reorderThreshold: '', warehouse: 'Main Hub',
                material: '', pattern: '', fit: '', gsm: '', care: '', origin: '', notes: ''
              })
              setStep(1)
              setShowSuccess(false)
            }} className="w-full text-[15px] h-14">
              <Plus className="mr-2 h-5 w-5" /> Create Another
            </Button>
          </div>

          <div className="border-t border-border-subtle pt-8">
            <h3 className="text-sm font-semibold text-content-primary mb-4 text-left">Recommended Next Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand transition-colors group">
                <div className="h-10 w-10 bg-indigo-50 text-brand rounded-full flex items-center justify-center mb-3 group-hover:bg-brand group-hover:text-white transition-colors">
                  <Sparkles size={18} />
                </div>
                <div className="text-sm font-semibold text-content-primary">Gen AI Assets</div>
              </Card>
              <Card onClick={() => setAddOpen(true)} className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand transition-colors group">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Book size={18} />
                </div>
                <div className="text-sm font-semibold text-content-primary">Add to Catalog</div>
              </Card>
              <Card className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand transition-colors group">
                <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <ImageIcon size={18} />
                </div>
                <div className="text-sm font-semibold text-content-primary">Publish to Showroom</div>
              </Card>
            </div>
          </div>
        </Card>
        <RightDrawer
          open={addOpen}
          onClose={() => setAddOpen(false)}
          title="Add to Catalog"
          subtitle="Add this product to a catalog"
          widthClassName="w-[min(42.5vw,900px)]"
          backdropClassName="bg-black/5"
          className="bg-white shadow-lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  try {
                    let targetId = existingId
                    if (mode === 'new') {
                      if (!newName.trim()) { toast.message('Enter a catalog name'); return }
                      const created = await catalogService.createCatalog({ name: newName.trim(), type: newType })
                      targetId = created.id
                    }
                    if (!targetId) { toast.message('Choose a catalog'); return }
                    const target = await catalogService.getCatalog(targetId)
                    const items = target.items || []
                    const p = formData
                    const addItem = { id: p.slug || `prod_${Date.now()}`, sku: p.sku, name: p.name }
                    await catalogService.updateCatalog(targetId, { items: [...items, addItem] })
                    toast.success('Added to catalog', { description: p.name || 'Product' })
                    setAddOpen(false)
                  } catch {
                    toast.error('Could not add to catalog')
                  }
                }}
              >
                Add to Catalog
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div>
              <div className="text-xs text-content-secondary">Selected product</div>
              <div className="mt-2 rounded-xl border border-border-subtle bg-app-card-muted p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-app-card-muted overflow-hidden border border-border-subtle">
                  {formData.images[0]?.url ? <img alt="" src={formData.images[0]?.url} className="w-full h-full object-cover" /> : null}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{formData.name || 'Untitled Product'}</div>
                  <div className="text-xs text-content-secondary">{formData.sku || '—'} • {formData.status}</div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-content-secondary mb-2">Destination</div>
              <div className="inline-flex rounded-xl border border-border-subtle bg-white p-1">
                <button
                  className={`px-3 py-1.5 text-sm rounded-lg ${mode === 'existing' ? 'bg-app-card-muted font-semibold' : 'text-content-secondary hover:text-content-primary'}`}
                  onClick={() => setMode('existing')}
                >
                  Existing Catalog
                </button>
                <button
                  className={`px-3 py-1.5 text-sm rounded-lg ${mode === 'new' ? 'bg-app-card-muted font-semibold' : 'text-content-secondary hover:text-content-primary'}`}
                  onClick={() => setMode('new')}
                >
                  Create New Catalog
                </button>
              </div>

              {mode === 'existing' ? (
                <div className="mt-3">
                  <label className="text-xs font-medium text-content-secondary">Select catalog</label>
                  <select
                    className="mt-1 h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
                    value={existingId}
                    onChange={(e) => setExistingId(e.target.value)}
                  >
                    <option value="">Choose a catalog…</option>
                    {(catalogsQ.data || []).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-content-secondary">Catalog Name</label>
                    <Input className="mt-1" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Spring 26 Line Sheet" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-content-secondary">Catalog Type</label>
                    <select
                      className="mt-1 h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                    >
                      <option value="lookbook">Lookbook</option>
                      <option value="linesheet">Line Sheet</option>
                      <option value="pricelist">Price List</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-medium text-content-secondary">Placement</div>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <label className="flex items-center gap-2 rounded-xl border border-border-subtle bg-app-card-muted px-3 py-2 text-sm">
                  <input type="checkbox" checked={placement.grid} onChange={(e) => setPlacement((p) => ({ ...p, grid: e.target.checked }))} /> Add to product grid
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-border-subtle bg-app-card-muted px-3 py-2 text-sm">
                  <input type="checkbox" checked={placement.featured} onChange={(e) => setPlacement((p) => ({ ...p, featured: e.target.checked }))} /> Add as featured product
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-border-subtle bg-app-card-muted px-3 py-2 text-sm">
                  <input type="checkbox" checked={placement.end} onChange={(e) => setPlacement((p) => ({ ...p, end: e.target.checked }))} /> Add to end of catalog
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-border-subtle bg-app-card-muted px-3 py-2 text-sm">
                  <input type="checkbox" checked={placement.newSection} onChange={(e) => setPlacement((p) => ({ ...p, newSection: e.target.checked }))} /> Create new section
                </label>
              </div>
            </div>

            
          </div>
        </RightDrawer>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/products')} className="shrink-0 text-content-secondary hover:text-content-primary">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageHeader
            title="Create Product"
            subtitle="Add a new product to your catalog"
            className="mb-0"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/products')}><X className="mr-2 h-4 w-4" /> Cancel</Button>
          <Button variant="secondary" onClick={() => toast.success('Draft saved successfully')}><Save className="mr-2 h-4 w-4" /> Save Draft</Button>
          <Button disabled={step < 5 || isSubmitting} onClick={handleCreate}>
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8 max-w-4xl">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex flex-col items-center gap-2 relative flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-colors ${step === s.id ? 'bg-brand text-white ring-4 ring-brand/10' : step > s.id ? 'bg-brand-soft text-brand' : 'bg-app-card-muted text-content-tertiary border border-border-subtle'}`}>
              {step > s.id ? <CheckCircle2 size={16} /> : s.id}
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${step >= s.id ? 'text-content-primary' : 'text-content-tertiary'}`}>{s.label}</span>
            {idx < STEPS.length - 1 && (
              <div className={`absolute top-4 left-[50%] right-[-50%] h-[2px] transition-colors ${step > s.id ? 'bg-brand' : 'bg-border-subtle'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card className="animate-in slide-in-from-right-4 duration-300">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core details used to identify this product everywhere.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold mb-1.5 block text-content-primary">Product Name <span className="text-semantic-error">*</span></label>
                    <Input value={formData.name} onChange={e => updateForm('name', e.target.value)} placeholder="e.g. Core Cotton Heavyweight Tee" className="text-[15px] h-11" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block text-content-primary">SKU Code</label>
                    <Input value={formData.sku} onChange={e => updateForm('sku', e.target.value)} placeholder="e.g. TS-CORE-100" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block text-content-primary">Status</label>
                    <select value={formData.status} onChange={e => updateForm('status', e.target.value)} className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm focus:ring-2 focus:ring-brand outline-none">
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block text-content-primary">Category</label>
                    <select value={formData.category} onChange={e => updateForm('category', e.target.value)} className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm focus:ring-2 focus:ring-brand outline-none">
                      <option value="">Select Category...</option>
                      <option value="T-Shirts">T-Shirts</option>
                      <option value="Outerwear">Outerwear</option>
                      <option value="Pants">Pants</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block text-content-primary">Brand / Manufacturer</label>
                    <Input value={formData.brand} onChange={e => updateForm('brand', e.target.value)} placeholder="e.g. In-house" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold mb-1.5 block text-content-primary">URL Slug</label>
                    <div className="flex rounded-xl overflow-hidden border border-border-subtle focus-within:ring-2 focus-within:ring-brand">
                      <span className="bg-app-card-muted px-3 flex items-center text-sm text-content-secondary border-r border-border-subtle">merchflow.com/p/</span>
                      <input value={formData.slug} onChange={e => updateForm('slug', e.target.value)} className="flex-1 h-10 px-3 text-sm outline-none bg-white" placeholder="core-cotton-heavyweight-tee" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold mb-1.5 block text-content-primary">Short Description</label>
                    <textarea
                      value={formData.description} onChange={e => updateForm('description', e.target.value)}
                      className="w-full min-h-[120px] rounded-xl border border-border-subtle bg-white p-3 text-sm focus:ring-2 focus:ring-brand outline-none resize-y"
                      placeholder="Enter a compelling description for catalogs and showrooms..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold mb-1.5 block text-content-primary">Tags</label>
                    <Input value={formData.tags} onChange={e => updateForm('tags', e.target.value)} placeholder="e.g. summer, essentials, premium (comma separated)" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Media & Variants */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <Card>
                <CardHeader>
                  <CardTitle>Product Media</CardTitle>
                  <CardDescription>Upload primary photos, flat lays, or ghost mannequins.</CardDescription>
                </CardHeader>
                <CardContent>
                  <UploadDropzone
                    accept={{ 'image/*': [] }}
                    maxFiles={10}
                    helper="Drag & drop product images, or click to browse. (Max 10MB per file)"
                    onFiles={(files) => {
                      if (files?.length) {
                        const newImages = Array.from(files).map((f, i) => ({ id: `img_${Date.now()}_${i}`, url: URL.createObjectURL(f), name: f.name }))
                        setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }))
                        toast.success(`${files.length} images uploaded`)
                      }
                    }}
                  />
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-4">
                      {formData.images.map((img, i) => (
                        <div key={img.id} className="aspect-square rounded-xl border border-border-subtle overflow-hidden relative group">
                          <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                          {i === 0 && <div className="absolute top-1 left-1 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">PRIMARY</div>}
                          <button
                            className="absolute top-1 right-1 h-6 w-6 bg-white rounded-full flex items-center justify-center text-semantic-error opacity-0 group-hover:opacity-100 shadow-sm border border-border-subtle transition-opacity"
                            onClick={() => updateForm('images', formData.images.filter(x => x.id !== img.id))}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Variants</CardTitle>
                  <CardDescription>Configure sizes, colors, and other variations.</CardDescription>
                </CardHeader>
                <CardContent>
                  {(formData.variantOptions || []).length === 0 ? (
                    <div className="rounded-xl border border-border-dashed bg-app-card-muted p-8 text-center">
                      <div className="h-12 w-12 bg-white border border-border-subtle shadow-sm rounded-xl flex items-center justify-center mx-auto mb-3 text-content-tertiary">
                        <Layers size={20} />
                      </div>
                      <h3 className="text-sm font-semibold text-content-primary mb-1">No variants configured</h3>
                      <p className="text-xs text-content-secondary mb-4 max-w-[250px] mx-auto">Add options like Color or Size to generate a variant matrix.</p>
                      <Button variant="secondary" size="sm" onClick={() => setVariantOpen(true)}>Add Variant Option</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Options</div>
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => setVariantOpen(true)}>Add Variant Option</Button>
                          <Button variant="secondary" size="sm" onClick={handleRegenerate}>Regenerate Combinations</Button>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {(formData.variantOptions || []).map((opt) => (
                          <div key={opt.name} className="rounded-xl border border-border-subtle bg-app-card-muted p-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">{opt.name}</div>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteOption(opt.name)}>Delete</Button>
                            </div>
                            <div className="mt-2 text-xs text-content-secondary">{(opt.values || []).join(', ')}</div>
                          </div>
                        ))}
                      </div>
                      {(formData.variantOptions || []).length === 1 ? (
                        <div className="rounded-xl border border-border-subtle p-3">
                          <div className="text-xs text-content-secondary">Add another option to generate variant combinations.</div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-border-subtle overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-app-card-muted">
                              <tr className="border-b border-border-subtle">
                                {Object.keys(formData.variants?.[0]?.attrs || {}).map((k) => (
                                  <th key={k} className="px-3 py-2 text-left font-medium">{k}</th>
                                ))}
                                <th className="px-3 py-2 text-left font-medium">SKU</th>
                                <th className="px-3 py-2 text-left font-medium">Price</th>
                                <th className="px-3 py-2 text-left font-medium">Stock</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(formData.variants || []).map((v, idx) => (
                                <tr key={v.id} className="border-b border-border-subtle">
                                  {Object.values(v.attrs).map((val, i) => (
                                    <td key={i} className="px-3 py-2">{val}</td>
                                  ))}
                                  <td className="px-3 py-2">
                                    <Input value={v.sku} onChange={(e) => {
                                      const next = [...formData.variants]
                                      next[idx] = { ...next[idx], sku: e.target.value }
                                      updateForm('variants', next)
                                    }} placeholder="SKU" />
                                  </td>
                                  <td className="px-3 py-2">
                                    <Input type="number" value={v.price} onChange={(e) => {
                                      const next = [...formData.variants]
                                      next[idx] = { ...next[idx], price: e.target.value }
                                      updateForm('variants', next)
                                    }} placeholder="0.00" />
                                  </td>
                                  <td className="px-3 py-2">
                                    <Input type="number" value={v.stock} onChange={(e) => {
                                      const next = [...formData.variants]
                                      next[idx] = { ...next[idx], stock: e.target.value }
                                      updateForm('variants', next)
                                    }} placeholder="0" />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              <RightDrawer
                open={variantOpen}
                onClose={() => setVariantOpen(false)}
                title="Add Variant Option"
                subtitle="Define an option and its values"
                widthClassName="w-[min(38vw,720px)]"
                backdropClassName="bg-black/5"
                className="bg-white shadow-lg"
                footer={
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setVariantOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddOption}>Save Option</Button>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-content-secondary">Option Name</label>
                    <select
                      className="mt-1 h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm"
                      value={variantName}
                      onChange={(e) => setVariantName(e.target.value)}
                    >
                      <option>Color</option>
                      <option>Size</option>
                      <option>Material</option>
                      <option>Fit</option>
                      <option>Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-content-secondary">Option Values</label>
                    <Input
                      className="mt-1"
                      placeholder="Enter values comma-separated e.g. Red, Blue, Green"
                      value={variantValuesText}
                      onChange={(e) => setVariantValuesText(e.target.value)}
                    />
                    <div className="text-[11px] text-content-tertiary mt-1">You can add multiple values separated by commas.</div>
                  </div>
                </div>
              </RightDrawer>
            </div>
          )}

          {/* Step 3: Pricing & Inventory */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Strategy</CardTitle>
                  <CardDescription>Set your standard and wholesale pricing tiers.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="text-sm font-semibold mb-1.5 block text-content-primary">Retail Price (MSRP)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary">$</span>
                        <Input type="number" value={formData.retailPrice} onChange={e => updateForm('retailPrice', e.target.value)} className="pl-7" placeholder="0.00" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-1.5 block text-content-primary">Wholesale Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary">$</span>
                        <Input type="number" value={formData.wholesalePrice} onChange={e => updateForm('wholesalePrice', e.target.value)} className="pl-7" placeholder="0.00" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-1.5 block text-content-primary">Cost per Unit (Internal)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary">$</span>
                        <Input type="number" placeholder="0.00" className="pl-7" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Tracking</CardTitle>
                  <CardDescription>Manage stock levels and low-stock alerts.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-semibold mb-1.5 block text-content-primary">Initial Stock (On Hand)</label>
                      <Input type="number" value={formData.stock} onChange={e => updateForm('stock', e.target.value)} placeholder="e.g. 500" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-1.5 block text-content-primary">Primary Location</label>
                      <select value={formData.warehouse} onChange={e => updateForm('warehouse', e.target.value)} className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm focus:ring-2 focus:ring-brand outline-none">
                        <option value="Main Hub">Main Fulfillment Hub</option>
                        <option value="West Coast">West Coast Warehouse</option>
                        <option value="Drop Ship">Drop Ship Vendor</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-1.5 block text-content-primary">Low Stock Alert Threshold</label>
                      <Input type="number" value={formData.reorderThreshold} onChange={e => updateForm('reorderThreshold', e.target.value)} placeholder="e.g. 50" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-1.5 block text-content-primary">Minimum Order Quantity (MOQ)</label>
                      <Input type="number" value={formData.moq} onChange={e => updateForm('moq', e.target.value)} placeholder="e.g. 1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Specifications */}
          {step === 4 && (
            <Card className="animate-in slide-in-from-right-4 duration-300">
              <CardHeader>
                <CardTitle>Product Specifications</CardTitle>
                <CardDescription>Help buyers understand the exact details and quality metrics.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block text-content-primary">Material / Composition</label>
                    <Input value={formData.material} onChange={e => updateForm('material', e.target.value)} placeholder="e.g. 100% Organic Cotton" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block text-content-primary">Fabric Weight (GSM)</label>
                    <Input value={formData.gsm} onChange={e => updateForm('gsm', e.target.value)} placeholder="e.g. 240 GSM" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block text-content-primary">Fit / Silhouette</label>
                    <Input value={formData.fit} onChange={e => updateForm('fit', e.target.value)} placeholder="e.g. Oversized Drop Shoulder" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block text-content-primary">Country of Origin</label>
                    <Input value={formData.origin} onChange={e => updateForm('origin', e.target.value)} placeholder="e.g. Portugal" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold mb-1.5 block text-content-primary">Care Instructions</label>
                    <Input value={formData.care} onChange={e => updateForm('care', e.target.value)} placeholder="e.g. Machine wash cold, tumble dry low" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold mb-1.5 block text-content-primary">Internal Notes / Dimensions</label>
                    <textarea
                      value={formData.notes} onChange={e => updateForm('notes', e.target.value)}
                      className="w-full h-24 rounded-xl border border-border-subtle bg-white p-3 text-sm focus:ring-2 focus:ring-brand outline-none resize-y"
                      placeholder="e.g. Sizing runs slightly large."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review & Save */}
          {step === 5 && (
            <Card className="animate-in slide-in-from-right-4 duration-300">
              <CardHeader>
                <CardTitle>Review & Finalize</CardTitle>
                <CardDescription>Check your details before creating this product asset.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl border border-border-subtle overflow-hidden">
                  <div className="bg-app-card-muted px-4 py-3 border-b border-border-subtle font-semibold text-sm">Summary Snapshot</div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <div className="text-xs text-content-tertiary mb-1">Name</div>
                      <div className="text-sm font-medium text-content-primary truncate">{formData.name || 'Untitled Product'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-content-tertiary mb-1">SKU</div>
                      <div className="text-sm font-medium text-content-primary truncate">{formData.sku || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-content-tertiary mb-1">Status</div>
                      <div className={`text-sm font-bold truncate ${formData.status === 'Active' ? 'text-semantic-success' : 'text-amber-500'}`}>{formData.status}</div>
                    </div>
                    <div>
                      <div className="text-xs text-content-tertiary mb-1">Category</div>
                      <div className="text-sm font-medium text-content-primary truncate">{formData.category || 'Uncategorized'}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-border-subtle rounded-xl p-4 bg-white">
                    <div className="text-xs text-content-tertiary font-semibold uppercase tracking-wide mb-2">Media Stats</div>
                    <div className="text-2xl font-bold text-content-primary">{formData.images.length}</div>
                    <div className="text-xs text-content-secondary mt-1">Images uploaded</div>
                  </div>
                  <div className="border border-border-subtle rounded-xl p-4 bg-white">
                    <div className="text-xs text-content-tertiary font-semibold uppercase tracking-wide mb-2">Financials</div>
                    <div className="text-2xl font-bold text-content-primary">${formData.retailPrice || '0'}</div>
                    <div className="text-xs text-content-secondary mt-1">Retail Price</div>
                  </div>
                  <div className="border border-border-subtle rounded-xl p-4 bg-white">
                    <div className="text-xs text-content-tertiary font-semibold uppercase tracking-wide mb-2">Inventory</div>
                    <div className="text-2xl font-bold text-content-primary">{formData.stock || '0'}</div>
                    <div className="text-xs text-content-secondary mt-1">Units on hand</div>
                  </div>
                </div>

                {completeness < 100 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3 text-amber-800">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold">Incomplete Data</h4>
                      <p className="text-xs mt-0.5">Your product is only {completeness}% complete. You can save it as a Draft now, but should finalize pricing and images before publishing to a Showroom.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Form Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" onClick={handlePrev} disabled={step === 1}>
              Back
            </Button>
            {step < 5 ? (
              <Button onClick={handleNext}>
                Next Step <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>

        {/* Right Sticky Summary Panel */}
        <div className="w-full xl:w-[320px] shrink-0">
          <div className="sticky top-24 space-y-4">
            <Card className="shadow-floating border-border-soft overflow-hidden">
              <CardHeader className="bg-app-card-muted border-b border-border-subtle py-4">
                <CardTitle className="text-[15px]">Profile Completeness</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-[28px] font-bold text-content-primary leading-none">{completeness}%</span>
                  <span className="text-xs font-semibold uppercase text-brand">Score</span>
                </div>
                <div className="h-2.5 w-full bg-border-subtle rounded-full overflow-hidden mb-5">
                  <div className="h-full bg-brand rounded-full transition-all duration-500 ease-out" style={{ width: `${completeness}%` }} />
                </div>

                <h4 className="text-xs font-bold text-content-tertiary uppercase tracking-wider mb-3">Setup Checklist</h4>
                <div className="space-y-2.5 text-sm font-medium">
                  <div className="flex items-center justify-between">
                    <span className={formData.name ? 'text-content-primary' : 'text-content-secondary'}>Basic Info</span>
                    {formData.name ? <CheckCircle2 className="text-semantic-success h-4 w-4" /> : <div className="h-3 w-3 rounded-full bg-border-strong" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={formData.images.length > 0 ? 'text-content-primary' : 'text-content-secondary'}>Media Assets</span>
                    {formData.images.length > 0 ? <CheckCircle2 className="text-semantic-success h-4 w-4" /> : <div className="h-3 w-3 rounded-full bg-border-strong" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={formData.retailPrice && formData.stock ? 'text-content-primary' : 'text-content-secondary'}>Pricing & Stock</span>
                    {formData.retailPrice && formData.stock ? <CheckCircle2 className="text-semantic-success h-4 w-4" /> : <div className="h-3 w-3 rounded-full bg-border-strong" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={formData.material ? 'text-content-primary' : 'text-content-secondary'}>Specifications</span>
                    {formData.material ? <CheckCircle2 className="text-semantic-success h-4 w-4" /> : <div className="h-3 w-3 rounded-full bg-border-strong" />}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-indigo-700 font-bold mb-2">
                  <Sparkles size={16} /> AI Readiness
                </div>
                <p className="text-xs text-indigo-900/80 mb-4 leading-relaxed">
                  Uploading high-quality flat-lay garment images in Step 2 will unlock instant virtual try-on generation once created.
                </p>
                {formData.images.length > 0 ? (
                  <div className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14} /> Ready for Try-On</div>
                ) : (
                  <div className="text-xs font-medium text-indigo-600 flex items-center gap-1 opacity-70"><Info size={14} /> Missing media</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
