import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { cn } from '../lib/cn'
import { toast } from 'sonner'
import {
  FolderTree, Plus, Upload, MoveVertical, ChevronRight, ChevronDown,
  Settings2, Package, Sparkles, Tags, Book, Store, FolderOpen, FolderMinus,
  Edit2, Trash2, CheckCircle2, Search, Wand2, Image as ImageIcon, X
} from 'lucide-react'
import { CategoryAttributesTab } from '../components/CategoryAttributesTab'
import { CategoryRulesTab } from '../components/CategoryRulesTab'
import { CategoryAISettingsTab } from '../components/CategoryAISettingsTab'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryService } from '../services/categoryService'
import { productService } from '../services/productService'

function addNodeToParent(tree, parentId, newNode) {
  return tree.map(node => {
    if (node.id === parentId) {
      return { ...node, isExpanded: true, children: [newNode, ...(node.children || [])] }
    }
    if (node.children) {
      return { ...node, children: addNodeToParent(node.children, parentId, newNode) }
    }
    return node
  })
}

function removeDraftNode(tree) {
  return tree.filter(n => !n.isDraft).map(node => {
    if (node.children) {
      return { ...node, children: removeDraftNode(node.children) }
    }
    return node
  })
}

function updateTreeNode(tree, nodeId, patch) {
  return tree.map(node => {
    if (node.id === nodeId) return { ...node, ...patch }
    if (node.children) return { ...node, children: updateTreeNode(node.children, nodeId, patch) }
    return node
  })
}

function expandNodeInTree(tree, nodeId) {
  return tree.map(node => {
    if (node.id === nodeId) return { ...node, isExpanded: true }
    if (node.children) return { ...node, children: expandNodeInTree(node.children, nodeId) }
    return node
  })
}

export function CategoriesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [categories, setCategories] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [isCreateMode, setIsCreateMode] = useState(false)

  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await categoryService.getCategories()
      // Turn into flat array with no children
      return data.map(c => ({
        ...c,
        isExpanded: false,
        productCount: c._count?.products || 0,
        children: []
      }))
    }
  })

  // Only run when we get fresh categories to initialize tree
  useEffect(() => {
    if (dbCategories.length > 0 && categories.length === 0) {
      setCategories(dbCategories)
    }
  }, [dbCategories])

  const { data: rawProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts()
  })

  // Provide mapping
  const assignedProductsMap = rawProducts.reduce((acc, p) => {
    if (p.categoryId) {
      if (!acc[p.categoryId]) acc[p.categoryId] = []
      acc[p.categoryId].push(p)
    }
    return acc
  }, {})

  const [selectedCategory, setSelectedCategory] = useState(null)

  // Assign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assignSearchQuery, setAssignSearchQuery] = useState('')
  const [assignFilterStatus, setAssignFilterStatus] = useState('All')
  const [assignSelectedIds, setAssignSelectedIds] = useState(new Set())

  // Local form state for editing / creating
  const [draftForm, setDraftForm] = useState({})

  useEffect(() => {
    if (selectedCategory) {
      setDraftForm({ ...selectedCategory })
    }
  }, [selectedCategory])

  // Live update the tree node name when creating
  useEffect(() => {
    if (isCreateMode && draftForm.name !== undefined && selectedCategory?.id === 'draft_new') {
      setCategories(cats => updateTreeNode(cats, 'draft_new', { name: draftForm.name || 'New Category' }))
    }
  }, [draftForm.name, isCreateMode])

  useEffect(() => {
    if (isCreateMode && draftForm.name && !draftForm.slugModified) {
      const newSlug = draftForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      setDraftForm(prev => ({ ...prev, slug: newSlug }))
    }
  }, [draftForm.name, isCreateMode])


  const handleSelectCategory = (node) => {
    if (isCreateMode) return toast.info("Please save or cancel your new category first.")

    setSelectedCategory({
      ...node,
      slug: node.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      parent: node.parentName || 'None (Root Line)',
      status: 'Active',
      description: node.description || ''
    })
    setActiveTab('overview')
  }

  const toggleExpand = (nodeId, e) => {
    e.stopPropagation()
    const toggleRec = (tree) => tree.map(n => {
      if (n.id === nodeId) return { ...n, isExpanded: !n.isExpanded }
      if (n.children) return { ...n, children: toggleRec(n.children) }
      return n
    })
    setCategories(cats => toggleRec(cats))
  }

  const handleNewRootCategory = () => {
    let cleanTree = removeDraftNode(categories)
    const newDraft = { id: 'draft_new', name: 'New Category', productCount: 0, children: [], isDraft: true, parentName: 'None (Root Line)' }

    setCategories([newDraft, ...cleanTree])
    setSelectedCategory(newDraft)
    setIsCreateMode(true)
    setActiveTab('overview')
  }

  const handleNewSubCategory = (parentNode, e) => {
    e.stopPropagation()
    let cleanTree = removeDraftNode(categories)
    cleanTree = expandNodeInTree(cleanTree, parentNode.id)

    const newDraft = {
      id: 'draft_new',
      name: 'New Subcategory',
      productCount: 0,
      children: [],
      isDraft: true,
      parentName: parentNode.name,
      parentId: parentNode.id
    }

    cleanTree = addNodeToParent(cleanTree, parentNode.id, newDraft)
    setCategories(cleanTree)
    setSelectedCategory(newDraft)
    setIsCreateMode(true)
    setActiveTab('overview')
  }

  const handleCancelCreate = () => {
    setCategories(cats => removeDraftNode(cats))
    setIsCreateMode(false)
    setSelectedCategory(null)
  }

  const createCategoryM = useMutation({
    mutationFn: categoryService.createCategory,
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsCreateMode(false)
      setSelectedCategory({ ...newCat, isExpanded: false, productCount: 0, children: [] })
      setCategories(cats => removeDraftNode(cats).concat([{ ...newCat, isExpanded: false, productCount: 0, children: [] }]))
      toast.success('Category created successfully')
    },
    onError: err => toast.error('Creation failed: ' + err.message)
  })

  // Bulk update category IDs
  const assignProductsM = useMutation({
    mutationFn: async ({ categoryId, productIds }) => {
      return Promise.all(productIds.map(id => productService.updateProduct(id, { categoryId })))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsAssignModalOpen(false)
      toast.success('Products assigned successfully!')
    }
  })

  const handleCreateSave = () => {
    if (!draftForm.name?.trim()) {
      return toast.error("Category name is required.")
    }
    createCategoryM.mutate({
      name: draftForm.name,
      slug: draftForm.slug || draftForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: draftForm.description || '',
      status: draftForm.status || 'Active'
    })
  }

  const handleOpenAssignModal = () => {
    setAssignSearchQuery('')
    setAssignFilterStatus('All')
    setAssignSelectedIds(new Set())
    setIsAssignModalOpen(true)
  }

  const toggleProductSelection = (productId) => {
    setAssignSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const handleAssignSubmit = () => {
    if (assignSelectedIds.size === 0) {
      toast.info("No products selected.")
      return
    }
    assignProductsM.mutate({
      categoryId: selectedCategory.id,
      productIds: Array.from(assignSelectedIds)
    })
  }

  const handleCreateCatalog = () => {
    if (!selectedCategory || selectedCategory.productCount === 0) {
      toast.error('No products available in this category yet. Please assign products first.')
      return
    }
    navigate(`/catalogs/new/setup?source=category&categoryId=${selectedCategory.id}&name=${encodeURIComponent(selectedCategory.name)}`)
  }

  const handlePublishShowroom = () => {
    if (!selectedCategory || selectedCategory.productCount === 0) {
      toast.error('No products available in this category yet. Please assign products first.')
      return
    }
    navigate(`/showrooms?create=true&source=Category&categoryId=${selectedCategory.id}&name=${encodeURIComponent(selectedCategory.name)}`)
  }

  // Recursive Category Node Component
  const CategoryNode = ({ node, level = 0 }) => {
    const isSelected = selectedCategory?.id === node.id
    const hasChildren = node.children && node.children.length > 0
    const isDraft = node.isDraft

    return (
      <div className="select-none">
        <div
          onClick={() => handleSelectCategory(node)}
          className={cn(
            "flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer transition-colors group",
            isSelected ? (isDraft ? "bg-amber-50 text-amber-900 border border-amber-200" : "bg-indigo-50 text-indigo-900 border border-transparent") : "hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-transparent"
          )}
          style={{ paddingLeft: `${(level * 16) + 8}px` }}
        >
          <div className="w-5 flex items-center justify-center text-gray-400" onClick={(e) => toggleExpand(node.id, e)}>
            {hasChildren ? (
              node.isExpanded ? <ChevronDown size={14} className="hover:text-black cursor-pointer" /> : <ChevronRight size={14} className="hover:text-black cursor-pointer" />
            ) : (
              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
            )}
          </div>
          {node.productCount === 0 || isDraft ? <FolderMinus size={16} className={cn(isSelected ? "text-indigo-500" : "text-gray-400", isDraft && "text-amber-500")} /> : <FolderOpen size={16} className={isSelected ? "text-indigo-500" : "text-amber-400"} />}

          <span className={cn("font-medium text-[13px] flex-1 truncate", isSelected && "font-semibold")}>
            {node.name || 'Untitled'}
            {isDraft && <em className="text-[10px] text-amber-600 ml-2 font-normal">(Draft)</em>}
          </span>

          {!isDraft && (
            <>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md group-hover:bg-gray-200 transition-colors">{node.productCount}</span>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                <button onClick={(e) => handleNewSubCategory(node, e)} className="p-1 hover:bg-white rounded text-gray-400 hover:text-black shadow-sm" title="Add Subcategory"><Plus size={12} /></button>
              </div>
            </>
          )}
        </div>
        {hasChildren && node.isExpanded && (
          <div className="mt-1 space-y-1 relative">
            <div className="absolute left-6 top-0 bottom-4 w-px bg-gray-100 -z-10" style={{ left: `${(level * 16) + 18}px` }}></div>
            {node.children.map(child => (
              <CategoryNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Derived current products for selected category
  const activeProducts = selectedCategory ? (assignedProductsMap[selectedCategory.id] || []) : []

  // Derived filtered products for assign modal
  const assignModalProducts = rawProducts.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(assignSearchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(assignSearchQuery.toLowerCase())
    const matchesStatus = assignFilterStatus === 'All' || p.status === assignFilterStatus.toUpperCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 pb-20 animate-in fade-in max-w-[1400px] mx-auto min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Categories"
          description="Organize your product taxonomy, configure AI extraction rules, and manage assignments."
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-brand border-brand-soft hover:bg-brand-soft"><Wand2 className="mr-2 h-4 w-4" /> AI Auto-Generate</Button>
          <Button variant="outline" className="hidden sm:flex"><Upload className="mr-2 h-4 w-4" /> Import</Button>
          <Button onClick={handleNewRootCategory} disabled={isCreateMode}><Plus className="mr-2 h-4 w-4" /> New Category</Button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] min-h-[600px]">

        {/* Left Column: Category Tree */}
        <div className="w-full lg:w-[320px] flex flex-col gap-4">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border-subtle bg-app-card-muted">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-tertiary" />
                <Input placeholder="Search categories..." className="pl-9 h-9 text-sm bg-white" />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-content-tertiary uppercase tracking-wider px-1">
                <span>Taxonomy</span>
                <button className="flex items-center hover:text-content-primary transition-colors"><MoveVertical size={12} className="mr-1" /> Reorder</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {categories.map(cat => <CategoryNode key={cat.id} node={cat} />)}
            </div>
          </Card>
        </div>

        {/* Right Column: Details Panel */}
        <Card className="flex-1 flex flex-col overflow-hidden border-border-strong shadow-sm relative">

          {selectedCategory ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-border-subtle bg-white shrink-0">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {isCreateMode ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] uppercase font-bold tracking-wider rounded-md">Creating Category</Badge>
                      ) : (
                        <Badge className="bg-brand-soft text-brand border-brand/20 text-[10px] uppercase font-bold tracking-wider rounded-md">Category Details</Badge>
                      )}

                      <span className="text-[13px] font-medium text-content-tertiary">{draftForm.parentName || draftForm.parent}</span>
                    </div>
                    <h2 className="text-[24px] font-bold text-content-primary flex items-center gap-2 tracking-tight">
                      {draftForm.name || 'Untitled Category'}
                      {!isCreateMode && <button className="text-content-tertiary hover:text-brand"><Edit2 size={16} /></button>}
                    </h2>
                  </div>

                  {isCreateMode ? (
                    <div className="flex items-center gap-3">
                      <Button variant="outline" onClick={handleCancelCreate}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                      <Button onClick={handleCreateSave}><CheckCircle2 className="mr-2 h-4 w-4" /> Create Category</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="hidden xl:flex" onClick={handleCreateCatalog}><Book className="mr-2 h-3.5 w-3.5" /> Create Catalog</Button>
                      <Button variant="outline" size="sm" className="hidden xl:flex" onClick={handlePublishShowroom}><Store className="mr-2 h-3.5 w-3.5" /> Publish Showroom</Button>
                      <Button variant="ghost" size="sm" className="text-semantic-error hover:bg-red-50"><Trash2 size={16} /></Button>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex gap-6 mt-6 border-b border-border-subtle">
                  {[
                    { id: 'overview', label: 'Overview', icon: FolderOpen },
                    { id: 'products', label: `Products (${selectedCategory.productCount || 0})`, icon: Package },
                    { id: 'attributes', label: 'Attributes', icon: Tags },
                    { id: 'rules', label: 'Smart Rules', icon: Settings2 },
                    { id: 'ai', label: 'AI Settings', icon: Sparkles }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 pb-3 px-1 text-[13px] font-semibold transition-colors relative border-b-2",
                        activeTab === tab.id
                          ? "text-content-primary border-content-primary"
                          : "text-content-tertiary border-transparent hover:text-content-secondary hover:border-border-strong"
                      )}
                    >
                      <tab.icon size={14} className={activeTab === tab.id ? "text-brand" : "text-content-tertiary"} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-app-body">

                {activeTab === 'overview' && (
                  <div className="max-w-3xl space-y-8 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-5">
                        <div>
                          <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Category Name <span className="text-semantic-error">*</span></label>
                          <Input value={draftForm.name || ''} onChange={e => setDraftForm({ ...draftForm, name: e.target.value })} className="bg-white" placeholder="e.g. Graphic Tees" />
                        </div>
                        <div>
                          <label className="block text-[13px] font-semibold text-content-primary mb-1.5">URL Slug</label>
                          <div className="flex items-center rounded-xl overflow-hidden border border-border-subtle focus-within:ring-2 focus-within:ring-brand">
                            <span className="bg-app-card-muted text-content-tertiary text-[13px] px-3 border-r border-border-subtle py-2">/</span>
                            <input
                              value={draftForm.slug || ''}
                              onChange={e => setDraftForm({ ...draftForm, slug: e.target.value, slugModified: true })}
                              className="flex-1 bg-white font-mono text-[13px] outline-none px-3"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Parent Category</label>
                          <select
                            value={draftForm.parentName || draftForm.parent || 'None (Root Line)'}
                            onChange={e => setDraftForm({ ...draftForm, parentName: e.target.value })}
                            className="flex h-10 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand"
                          >
                            <option value="None (Root Line)">None (Root Line)</option>
                            <option value="Men's Wear > Bottoms">Men's Wear &gt; Bottoms</option>
                            <option value="Women's Wear">Women's Wear</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-5">
                        <div>
                          <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Category Image / Banner</label>
                          <div className="h-32 border-2 border-dashed border-border-strong rounded-xl bg-app-card-muted hover:bg-border-subtle flex flex-col items-center justify-center text-content-tertiary cursor-pointer transition-colors relative overflow-hidden group">
                            <ImageIcon size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium">Upload Banner Image</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Status</label>
                          <select
                            value={draftForm.status || 'Active'}
                            onChange={e => setDraftForm({ ...draftForm, status: e.target.value })}
                            className="flex h-10 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand"
                          >
                            <option value="Active">Active / Visible</option>
                            <option value="Draft">Draft / Hidden</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border-subtle">
                      <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Description (SEO)</label>
                      <textarea
                        className="w-full h-24 p-3 border border-border-subtle rounded-xl bg-white text-[13px] focus:ring-2 focus:ring-brand outline-none resize-y"
                        value={draftForm.description || ''}
                        onChange={e => setDraftForm({ ...draftForm, description: e.target.value })}
                        placeholder="Optimized description for meta tags and catalog intros."
                      ></textarea>
                    </div>

                    {!isCreateMode && (
                      <div className="pt-6 flex justify-end gap-3">
                        <Button variant="outline">Discard Changes</Button>
                        <Button>Save Category</Button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab !== 'overview' && isCreateMode && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in">
                    <div className="w-16 h-16 bg-white border border-border-subtle rounded-xl shadow-sm flex items-center justify-center mb-4 text-content-tertiary">
                      {activeTab === 'products' && <Package size={24} />}
                      {activeTab === 'attributes' && <Tags size={24} />}
                      {activeTab === 'rules' && <Settings2 size={24} />}
                      {activeTab === 'ai' && <Sparkles size={24} />}
                    </div>
                    <h3 className="text-[16px] font-bold text-content-primary mb-2">Not available in Create Mode</h3>
                    <p className="text-[13px] font-medium text-content-secondary max-w-xs leading-relaxed">Please Create the category first before configuring its {activeTab}.</p>
                  </div>
                )}

                {activeTab === 'products' && !isCreateMode && (
                  <div className="space-y-4 animate-in fade-in h-full flex flex-col">
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-border-subtle shadow-sm shrink-0">
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-tertiary" />
                        <Input placeholder="Search assigned products..." className="pl-9 h-9 text-[13px] bg-transparent border-none shadow-none focus-visible:ring-0" />
                      </div>
                      <Button size="sm" onClick={handleOpenAssignModal}>
                        <Plus className="mr-2 h-4 w-4" /> Assign Products
                      </Button>
                    </div>

                    {activeProducts.length > 0 ? (
                      <div className="bg-white border text-[13px] border-border-subtle rounded-xl overflow-hidden shadow-sm flex-1 overflow-y-auto">
                        <table className="w-full text-left">
                          <thead className="bg-app-card-muted border-b border-border-subtle text-content-tertiary font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 w-10"><input type="checkbox" className="rounded border-border-strong text-brand focus:ring-brand" /></th>
                              <th className="px-4 py-3">Product Name</th>
                              <th className="px-4 py-3">SKU</th>
                              <th className="px-4 py-3">Price</th>
                              <th className="px-4 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle">
                            {activeProducts.map((p) => (
                              <tr key={p.id} className="hover:bg-app-hover group cursor-pointer transition-colors">
                                <td className="px-4 py-3"><input type="checkbox" className="rounded border-border-strong text-brand focus:ring-brand" /></td>
                                <td className="px-4 py-3 font-semibold text-content-primary flex items-center gap-3">
                                  <div className="h-8 w-8 bg-app-card-muted rounded border border-border-subtle flex items-center justify-center text-content-tertiary shrink-0"><ImageIcon size={14} /></div>
                                  <span className="truncate">{p.name}</span>
                                </td>
                                <td className="px-4 py-3 text-content-secondary font-mono text-xs">{p.sku}</td>
                                <td className="px-4 py-3 text-content-primary font-medium">{p.price}</td>
                                <td className="px-4 py-3">
                                  {p.status === 'Active' ? (
                                    <Badge className="bg-semantic-success/10 text-semantic-success border-none font-bold">Active</Badge>
                                  ) : (
                                    <Badge className="bg-app-card-muted text-content-secondary border-none font-bold">Draft</Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border border-border-dashed rounded-xl border-border-strong">
                        <Package size={32} className="text-content-tertiary mb-3" />
                        <h4 className="text-[15px] font-bold text-content-primary">No products assigned</h4>
                        <p className="text-[13px] text-content-secondary mt-1 mb-4">You have not mapped any products to this category yet.</p>
                        <Button onClick={handleOpenAssignModal} variant="secondary"><Plus className="mr-2 h-4 w-4" /> Assign Products</Button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'attributes' && !isCreateMode && (
                  <CategoryAttributesTab category={selectedCategory} />
                )}

                {activeTab === 'rules' && !isCreateMode && (
                  <CategoryRulesTab category={selectedCategory} />
                )}

                {activeTab === 'ai' && !isCreateMode && (
                  <CategoryAISettingsTab category={selectedCategory} />
                )}

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-app-body animate-in fade-in">
              <div className="h-16 w-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 border-4 border-app-body">
                <FolderOpen className="text-content-tertiary" size={32} />
              </div>
              <h3 className="text-xl font-bold text-content-primary mb-2 tracking-tight">No Category Selected</h3>
              <p className="text-content-secondary max-w-sm mb-6 font-medium text-[13px] leading-relaxed">Select a category from the tree on the left to view its details, properties, and assigned products.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Assign Products Modal/Drawer Overlay */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-[600px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-border-subtle bg-app-card-muted flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-[18px] font-bold text-content-primary tracking-tight">Assign Products</h2>
                <p className="text-[13px] font-medium text-content-secondary mt-1">Select items to place into <span className="font-bold text-brand">{selectedCategory?.name}</span></p>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="h-8 w-8 rounded-full bg-white border border-border-subtle flex items-center justify-center text-content-secondary hover:text-content-primary shadow-sm">
                <X size={16} />
              </button>
            </div>

            {/* Modal Filters */}
            <div className="p-4 border-b border-border-subtle flex gap-3 bg-white shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-tertiary" />
                <Input
                  placeholder="Search by name or SKU..."
                  className="pl-9 h-10 text-[13px]"
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={assignFilterStatus}
                onChange={(e) => setAssignFilterStatus(e.target.value)}
                className="h-10 rounded-xl border border-border-subtle focus:ring-brand text-[13px] bg-white font-medium outline-none px-3 w-32"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            {/* Modal List */}
            <div className="flex-1 overflow-y-auto p-2 bg-app-body">
              {assignModalProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50 py-12">
                  <FolderMinus size={32} className="mb-2" />
                  <p className="text-[13px] font-semibold">No products match your search.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {assignModalProducts.map(product => {
                    const isSelected = assignSelectedIds.has(product.id)
                    return (
                      <div
                        key={product.id}
                        onClick={() => toggleProductSelection(product.id)}
                        className={cn(
                          "flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-colors",
                          isSelected ? "bg-brand-soft border-brand text-brand" : "bg-white border-border-subtle hover:border-border-strong text-content-primary"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="rounded border-border-strong text-brand focus:ring-brand ml-1"
                        />
                        <div className="h-10 w-10 bg-app-card-muted border border-border-subtle rounded-lg flex items-center justify-center shrink-0">
                          <ImageIcon size={16} className={isSelected ? "text-brand" : "text-content-tertiary"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[13px] truncate">{product.name}</div>
                          <div className="flex items-center gap-2 text-[11px] font-medium mt-0.5 opacity-80">
                            <span className="font-mono">{product.sku}</span>
                            <span>•</span>
                            <span>{product.price}</span>
                            <span>•</span>
                            <span>{product.category}</span>
                          </div>
                        </div>
                        <div className="shrink-0 pr-2">
                          {product.status === 'Active' ? (
                            <Badge className="bg-semantic-success/10 text-semantic-success border-none text-[10px]">Active</Badge>
                          ) : (
                            <Badge className="bg-app-card-muted text-content-secondary border-none text-[10px]">Draft</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border-subtle bg-white flex items-center justify-between shrink-0">
              <div className="text-[13px] font-semibold text-content-secondary">
                {assignSelectedIds.size} selected
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                <Button onClick={handleAssignSubmit} disabled={assignSelectedIds.size === 0}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Assign Products
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
