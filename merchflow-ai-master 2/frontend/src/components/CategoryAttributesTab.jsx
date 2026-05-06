import React, { useState } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Input } from './ui/Input'
import { cn } from '../lib/cn'
import { toast } from 'sonner'
import {
    Plus, Save, Download, LayoutTemplate, Eye, MoreHorizontal, GripVertical, Check, X, Sparkles, Filter, Store, Package, Edit2, Copy, Trash2
} from 'lucide-react'

const MOCK_ATTRIBUTES = [
    { id: 'a1', name: 'Shoe Size', group: 'General', type: 'Select', required: true, catalog: true, showroom: true, filterable: true },
    { id: 'a2', name: 'Color', group: 'General', type: 'Color Swatch', required: true, catalog: true, showroom: true, filterable: true },
    { id: 'a3', name: 'Material', group: 'Material & Care', type: 'Multi-Select', required: true, catalog: true, showroom: true, filterable: true },
    { id: 'a4', name: 'Sole Material', group: 'Material & Care', type: 'Text', required: false, catalog: true, showroom: false, filterable: false },
    { id: 'a5', name: 'Closure Type', group: 'Design', type: 'Select', required: false, catalog: true, showroom: true, filterable: true },
    { id: 'a6', name: 'Toe Shape', group: 'Design', type: 'Select', required: false, catalog: true, showroom: false, filterable: false },
    { id: 'a7', name: 'Heel Type', group: 'Design', type: 'Select', required: false, catalog: true, showroom: false, filterable: false },
    { id: 'a8', name: 'Heel Height', group: 'Design', type: 'Number', required: false, catalog: true, showroom: true, filterable: true },
    { id: 'a9', name: 'Occasion', group: 'Marketing', type: 'Multi-Select', required: false, catalog: true, showroom: true, filterable: true },
    { id: 'a10', name: 'Gender', group: 'Marketing', type: 'Select', required: true, catalog: true, showroom: true, filterable: true },
    { id: 'a11', name: 'Season', group: 'Marketing', type: 'Multi-Select', required: false, catalog: true, showroom: true, filterable: true },
    { id: 'a12', name: 'Width', group: 'Fit', type: 'Select', required: false, catalog: true, showroom: true, filterable: true },
    { id: 'a13', name: 'Fit Type', group: 'Fit', type: 'Select', required: false, catalog: true, showroom: false, filterable: false },
]

const INITIAL_FORM_STATE = {
    name: '',
    type: 'Text',
    group: 'General',
    required: false,
    catalog: true,
    showroom: true,
    filterable: false,
    helpText: '',
    options: []
}

export function CategoryAttributesTab({ category }) {
    const [attributes, setAttributes] = useState(MOCK_ATTRIBUTES)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [formData, setFormData] = useState(INITIAL_FORM_STATE)
    const [formErrors, setFormErrors] = useState({})
    const [newOption, setNewOption] = useState('')
    const [activeActionMenu, setActiveActionMenu] = useState(null)

    const toggleToggle = (id, field) => {
        setAttributes(attributes.map(attr => attr.id === id ? { ...attr, [field]: !attr[field] } : attr))
    }

    const openAddDrawer = () => {
        setFormData(INITIAL_FORM_STATE)
        setFormErrors({})
        setNewOption('')
        setIsDrawerOpen(true)
    }

    const handleAddOption = () => {
        if (!newOption.trim()) return
        if (formData.options.includes(newOption.trim())) return toast.error("Option already exists")
        setFormData(prev => ({ ...prev, options: [...prev.options, newOption.trim()] }))
        setNewOption('')
    }

    const handleRemoveOption = (opt) => {
        setFormData(prev => ({ ...prev, options: prev.options.filter(o => o !== opt) }))
    }

    const handleSaveAttribute = () => {
        const errors = {}
        if (!formData.name.trim()) errors.name = 'Attribute name is required'

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors)
            return
        }

        const newAttr = {
            id: `attr_${Date.now()}`,
            name: formData.name,
            type: formData.type,
            group: formData.group,
            required: formData.required,
            catalog: formData.catalog,
            showroom: formData.showroom,
            filterable: formData.filterable,
            helpText: formData.helpText,
            options: formData.options
        }

        setAttributes(prev => [...prev, newAttr])
        toast.success(`Attribute "${newAttr.name}" added successfully`)
        setIsDrawerOpen(false)
    }

    const BooleanIcon = ({ value }) => (
        value ? <Check size={16} className="text-semantic-success" /> : <X size={16} className="text-content-tertiary opacity-50" />
    )

    const isDropdownType = formData.type === 'Select' || formData.type === 'Multi-Select'

    return (
        <div className="flex flex-col gap-6 animate-in fade-in h-full relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-white p-5 rounded-xl border border-border-subtle shadow-sm">
                <div>
                    <h3 className="text-[18px] font-bold text-content-primary tracking-tight">Category Attributes</h3>
                    <p className="text-[13px] text-content-secondary mt-1">Define the properties and specifications required for products in this category.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" className="hidden xl:flex">
                        <Download className="mr-2 h-4 w-4" /> Import Template
                    </Button>
                    <Button variant="outline" size="sm" onClick={openAddDrawer}>
                        <Plus className="mr-2 h-4 w-4" /> Add Attribute
                    </Button>
                    <Button size="sm">
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 min-h-0">
                {/* Main Content - Attributes Table */}
                <div className="flex-1 w-full bg-white border border-border-subtle rounded-xl shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-border-subtle bg-app-card-muted flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-content-primary">Configured Attributes</span>
                            <Badge className="bg-white border-border-subtle text-content-secondary">{attributes.length}</Badge>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-app-card-muted/50 border-b border-border-subtle text-content-tertiary font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th className="px-4 py-3 w-8"></th>
                                    <th className="px-4 py-3">Attribute Name</th>
                                    <th className="px-4 py-3">Input Type</th>
                                    <th className="px-4 py-3 text-center">Required</th>
                                    <th className="px-4 py-3 text-center">Catalog</th>
                                    <th className="px-4 py-3 text-center">Showroom</th>
                                    <th className="px-4 py-3 text-center">Filterable</th>
                                    <th className="px-4 py-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle text-[13px]">
                                {attributes.map((attr) => (
                                    <tr key={attr.id} className="hover:bg-app-hover group transition-colors bg-white relative">
                                        <td className="px-4 py-3 cursor-grab text-content-tertiary hover:text-content-primary">
                                            <GripVertical size={16} />
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-content-primary">
                                            <div className="flex flex-col">
                                                <span>{attr.name}</span>
                                                <span className="text-[10px] text-content-tertiary font-normal uppercase tracking-wider mt-0.5">{attr.group}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="secondary" className="bg-app-card-muted text-content-secondary border-none font-medium text-[11px]">{attr.type}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center cursor-pointer" onClick={() => toggleToggle(attr.id, 'required')}>
                                            <div className="flex justify-center"><BooleanIcon value={attr.required} /></div>
                                        </td>
                                        <td className="px-4 py-3 text-center cursor-pointer" onClick={() => toggleToggle(attr.id, 'catalog')}>
                                            <div className="flex justify-center"><BooleanIcon value={attr.catalog} /></div>
                                        </td>
                                        <td className="px-4 py-3 text-center cursor-pointer" onClick={() => toggleToggle(attr.id, 'showroom')}>
                                            <div className="flex justify-center"><BooleanIcon value={attr.showroom} /></div>
                                        </td>
                                        <td className="px-4 py-3 text-center cursor-pointer" onClick={() => toggleToggle(attr.id, 'filterable')}>
                                            <div className="flex justify-center"><BooleanIcon value={attr.filterable} /></div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => setActiveActionMenu(activeActionMenu === attr.id ? null : attr.id)}
                                                className="text-content-tertiary hover:text-content-primary p-1 rounded hover:bg-black/5 transition-colors relative"
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>
                                            {activeActionMenu === attr.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setActiveActionMenu(null)}></div>
                                                    <div className="absolute right-8 top-10 w-36 bg-white border border-border-subtle rounded-xl shadow-xl z-20 py-1 flex flex-col items-start overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                        <button className="w-full text-left px-3 py-2 text-[12px] font-medium text-content-primary hover:bg-app-hover flex items-center gap-2 transition-colors">
                                                            <Edit2 size={14} className="text-content-tertiary" /> Edit
                                                        </button>
                                                        <button className="w-full text-left px-3 py-2 text-[12px] font-medium text-content-primary hover:bg-app-hover flex items-center gap-2 transition-colors">
                                                            <Copy size={14} className="text-content-tertiary" /> Duplicate
                                                        </button>
                                                        <div className="h-px w-full bg-border-subtle my-1"></div>
                                                        <button className="w-full text-left px-3 py-2 text-[12px] font-medium hover:bg-red-50 text-semantic-error flex items-center gap-2 transition-colors">
                                                            <Trash2 size={14} strokeWidth={2.5} /> Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">
                    {/* AI Suggestions Card */}
                    <Card className="border-brand-soft ring-1 ring-brand/10 shadow-sm overflow-hidden bg-white">
                        <div className="p-4 border-b border-brand-soft bg-gradient-to-r from-brand-soft/50 to-transparent flex items-center gap-2">
                            <Sparkles size={16} className="text-brand" />
                            <span className="text-[13px] font-bold text-brand tracking-tight">AI Suggested Attributes</span>
                        </div>
                        <div className="p-4 space-y-3 bg-white">
                            <p className="text-[12px] text-content-secondary leading-relaxed">
                                Based on <span className="font-semibold text-content-primary">"{category?.name || 'Footwear'}"</span>, we recommend adding these attributes:
                            </p>
                            <div className="space-y-2">
                                {['Sustainability Rating', 'Country of Origin', 'Care Instructions'].map((suggestion, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border-subtle bg-app-card-muted hover:bg-white hover:border-brand-soft transition-colors group cursor-pointer" onClick={openAddDrawer}>
                                        <span className="text-[12px] font-medium text-content-primary">{suggestion}</span>
                                        <button className="text-brand opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Template Actions */}
                    <Card className="border-border-subtle shadow-sm bg-white p-4">
                        <h4 className="text-[13px] font-bold text-content-primary mb-3 flex items-center gap-2">
                            <LayoutTemplate size={16} className="text-content-tertiary" /> Category Templates
                        </h4>
                        <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start text-[13px]">
                                <Download size={14} className="mr-2 opacity-50" /> Load from Library
                            </Button>
                            <Button variant="outline" className="w-full justify-start text-[13px]">
                                <Save size={14} className="mr-2 opacity-50" /> Save as Template
                            </Button>
                        </div>
                    </Card>

                    {/* Preview Card */}
                    <Card className="border-border-subtle shadow-sm bg-white overflow-hidden">
                        <div className="p-4 border-b border-border-subtle bg-app-card-muted flex items-center gap-2">
                            <Eye size={16} className="text-content-tertiary" />
                            <span className="text-[13px] font-bold text-content-primary">Visibility Preview</span>
                        </div>
                        <div className="p-0 text-[12px] divide-y divide-border-subtle">
                            <div className="p-3 flex items-start gap-3 hover:bg-app-hover transition-colors">
                                <Store size={16} className="text-content-tertiary mt-0.5 shrink-0" />
                                <div>
                                    <div className="font-semibold text-content-primary">Showroom Display</div>
                                    <div className="text-content-secondary mt-0.5">{attributes.filter(a => a.showroom).length} attributes visible</div>
                                </div>
                            </div>
                            <div className="p-3 flex items-start gap-3 hover:bg-app-hover transition-colors">
                                <Filter size={16} className="text-content-tertiary mt-0.5 shrink-0" />
                                <div>
                                    <div className="font-semibold text-content-primary">Filters</div>
                                    <div className="text-content-secondary mt-0.5">{attributes.filter(a => a.filterable).length} attributes as filters</div>
                                </div>
                            </div>
                            <div className="p-3 flex items-start gap-3 hover:bg-app-hover transition-colors">
                                <Package size={16} className="text-content-tertiary mt-0.5 shrink-0" />
                                <div>
                                    <div className="font-semibold text-content-primary">Catalog Schema</div>
                                    <div className="text-content-secondary mt-0.5">{attributes.filter(a => a.required).length} required fields</div>
                                </div>
                            </div>
                        </div>
                    </Card>

                </div>
            </div>

            {/* Add Attribute Drawer */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-[480px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300 border-l border-border-subtle">
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-border-subtle bg-app-card-muted flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-[18px] font-bold text-content-primary tracking-tight">Add Attribute</h2>
                                <p className="text-[12px] font-medium text-content-secondary mt-1">Configure a new property for {category?.name || 'this category'}</p>
                            </div>
                            <button onClick={() => setIsDrawerOpen(false)} className="h-8 w-8 rounded-full bg-white border border-border-subtle flex items-center justify-center text-content-secondary hover:text-content-primary shadow-sm transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-app-body">

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Attribute Name <span className="text-semantic-error">*</span></label>
                                    <Input
                                        placeholder="e.g. Material Composition"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={cn("bg-white", formErrors.name && "border-semantic-error")}
                                    />
                                    {formErrors.name && <p className="text-[11px] text-semantic-error mt-1.5 font-medium">{formErrors.name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Input Type</label>
                                        <select
                                            className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-[13px] focus:ring-2 focus:ring-brand outline-none"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="Text">Text</option>
                                            <option value="Number">Number</option>
                                            <option value="Select">Dropdown (Select)</option>
                                            <option value="Multi-Select">Multi-Select</option>
                                            <option value="Color Swatch">Color Swatch</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Group</label>
                                        <select
                                            className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-[13px] focus:ring-2 focus:ring-brand outline-none"
                                            value={formData.group}
                                            onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                                        >
                                            <option value="General">General</option>
                                            <option value="Material & Care">Material & Care</option>
                                            <option value="Design">Design</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="Fit">Fit</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Help Text (Optional)</label>
                                    <Input
                                        placeholder="Instructions for data entry..."
                                        value={formData.helpText}
                                        onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
                                        className="bg-white"
                                    />
                                </div>
                            </div>

                            {/* Options Editor if Select / Multi-Select */}
                            {isDropdownType && (
                                <div className="bg-white border border-border-subtle rounded-xl p-4 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                    <label className="block text-[13px] font-bold text-content-primary mb-3">Options List</label>

                                    <div className="flex gap-2 mb-4">
                                        <Input
                                            placeholder="Type an option..."
                                            className="bg-app-body h-9 text-[13px]"
                                            value={newOption}
                                            onChange={(e) => setNewOption(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                                        />
                                        <Button size="sm" variant="secondary" onClick={handleAddOption}>Add</Button>
                                    </div>

                                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                        {formData.options.length === 0 ? (
                                            <div className="text-[12px] text-content-tertiary text-center py-4 bg-app-body rounded-lg border border-dashed border-border-subtle">
                                                No options added yet.
                                            </div>
                                        ) : (
                                            formData.options.map((opt, i) => (
                                                <div key={i} className="flex items-center justify-between p-2 rounded border border-border-subtle bg-app-body group">
                                                    <span className="text-[12px] font-medium text-content-primary">{opt}</span>
                                                    <button
                                                        onClick={() => handleRemoveOption(opt)}
                                                        className="text-content-tertiary opacity-0 group-hover:opacity-100 hover:text-semantic-error transition-all"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Visibility & Rules Configuration */}
                            <div className="space-y-1 pt-2">
                                <label className="block text-[13px] font-bold text-content-primary mb-3">Visibility & Rules</label>

                                <label className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle cursor-pointer hover:border-brand-soft bg-white transition-colors">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 rounded border-border-strong text-brand focus:ring-brand"
                                        checked={formData.required}
                                        onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                                    />
                                    <div>
                                        <div className="text-[13px] font-bold text-content-primary">Required Field</div>
                                        <div className="text-[11px] text-content-secondary mt-0.5 leading-relaxed">Products cannot be published to the catalog without this value.</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle cursor-pointer hover:border-brand-soft bg-white transition-colors">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 rounded border-border-strong text-brand focus:ring-brand"
                                        checked={formData.catalog}
                                        onChange={(e) => setFormData({ ...formData, catalog: e.target.checked })}
                                    />
                                    <div>
                                        <div className="text-[13px] font-bold text-content-primary">Show in Catalog</div>
                                        <div className="text-[11px] text-content-secondary mt-0.5 leading-relaxed">Visible in internal product management views.</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle cursor-pointer hover:border-brand-soft bg-white transition-colors">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 rounded border-border-strong text-brand focus:ring-brand"
                                        checked={formData.showroom}
                                        onChange={(e) => setFormData({ ...formData, showroom: e.target.checked })}
                                    />
                                    <div>
                                        <div className="text-[13px] font-bold text-content-primary">Show in Showroom</div>
                                        <div className="text-[11px] text-content-secondary mt-0.5 leading-relaxed">Visible to buyers on wholesale storefronts.</div>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3 rounded-xl border border-border-subtle cursor-pointer hover:border-brand-soft bg-white transition-colors">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 rounded border-border-strong text-brand focus:ring-brand"
                                        checked={formData.filterable}
                                        onChange={(e) => setFormData({ ...formData, filterable: e.target.checked })}
                                    />
                                    <div>
                                        <div className="text-[13px] font-bold text-content-primary">Filterable</div>
                                        <div className="text-[11px] text-content-secondary mt-0.5 leading-relaxed">Buyers can use this attribute to filter product listings.</div>
                                    </div>
                                </label>
                            </div>

                        </div>

                        {/* Drawer Footer */}
                        <div className="p-4 border-t border-border-subtle bg-white flex items-center justify-end gap-3 shrink-0">
                            <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveAttribute}>Save Attribute</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
