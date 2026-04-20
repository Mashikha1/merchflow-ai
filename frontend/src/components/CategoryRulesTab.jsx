import React, { useState } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Input } from './ui/Input'
import { cn } from '../lib/cn'
import { toast } from 'sonner'
import {
    Plus, Save, Play, Edit2, Copy, Trash2, MoreHorizontal, GripVertical, AlertTriangle,
    Zap, Sparkles, Filter, CheckCircle2, ChevronDown, Package, HelpCircle, X, Search
} from 'lucide-react'

const MOCK_RULES = [
    {
        id: 'r1',
        name: 'Shoe Title Match',
        conditionsSummary: 'Title contains: shoe, sneaker, boot, sandal',
        status: 'Active',
        priority: 1,
        matchedCount: 145,
        lastRun: '10 mins ago',
        logic: 'any',
        conditions: [
            { id: 'c1', field: 'Product Title', operator: 'contains', value: 'shoe, sneaker, boot, sandal' }
        ],
        action: 'assign'
    },
    {
        id: 'r2',
        name: 'Footwear Tags',
        conditionsSummary: 'Tags include: footwear',
        status: 'Active',
        priority: 2,
        matchedCount: 89,
        lastRun: '1 hour ago',
        logic: 'any',
        conditions: [
            { id: 'c2', field: 'Tags', operator: 'include', value: 'footwear' }
        ],
        action: 'assign'
    },
    {
        id: 'r3',
        name: 'Import Category Mapping',
        conditionsSummary: 'Import Category equals: shoes',
        status: 'Paused',
        priority: 3,
        matchedCount: 210,
        lastRun: '1 day ago',
        logic: 'all',
        conditions: [
            { id: 'c3', field: 'Import Category', operator: 'equals', value: 'shoes' }
        ],
        action: 'suggest'
    }
]

const RULE_FIELDS = ['Product Title', 'Tags', 'SKU', 'Import Category', 'Product Type', 'Brand', 'Material']
const RULE_OPERATORS = ['contains', 'equals', 'starts with', 'includes', 'does not contain', 'is empty']
const RULE_ACTIONS = [
    { id: 'assign', label: 'Assign to this category', description: 'Adds the product to this category (can be in multiple).' },
    { id: 'move', label: 'Move to this category', description: 'Removes from other categories and assigns here exclusively.' },
    { id: 'suggest', label: 'Suggest assignment only', description: 'Flags for manual review instead of auto-assigning.' }
]

const INITIAL_FORM_STATE = {
    name: '',
    status: 'Active',
    priority: 1,
    logic: 'all',
    conditions: [
        { id: 'new_c1', field: 'Product Title', operator: 'contains', value: '' }
    ],
    action: 'assign'
}

export function CategoryRulesTab({ category }) {
    const [rules, setRules] = useState(MOCK_RULES)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [formData, setFormData] = useState(INITIAL_FORM_STATE)
    const [formErrors, setFormErrors] = useState({})
    const [activeActionMenu, setActiveActionMenu] = useState(null)

    const openAddDrawer = () => {
        setFormData({ ...INITIAL_FORM_STATE, priority: rules.length + 1 })
        setFormErrors({})
        setIsDrawerOpen(true)
    }

    const handleAddCondition = () => {
        setFormData(prev => ({
            ...prev,
            conditions: [...prev.conditions, { id: `new_c_${Date.now()}`, field: 'Product Title', operator: 'contains', value: '' }]
        }))
    }

    const handleRemoveCondition = (id) => {
        if (formData.conditions.length === 1) return
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.filter(c => c.id !== id)
        }))
    }

    const updateCondition = (id, key, value) => {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions.map(c => c.id === id ? { ...c, [key]: value } : c)
        }))
    }

    const handleSaveRule = () => {
        const errors = {}
        if (!formData.name.trim()) errors.name = 'Rule name is required'

        let validConditions = true
        formData.conditions.forEach(c => {
            if (!c.value.trim() && c.operator !== 'is empty') validConditions = false
        })
        if (!validConditions) errors.conditions = 'All conditions must have a value'

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors)
            return
        }

        const conditionSummary = formData.conditions.map(c => `${c.field} ${c.operator} ${c.value}`).join(formData.logic === 'all' ? ' AND ' : ' OR ')

        const newRule = {
            id: `rule_${Date.now()}`,
            name: formData.name,
            conditionsSummary: conditionSummary.length > 50 ? conditionSummary.substring(0, 50) + '...' : conditionSummary,
            status: formData.status,
            priority: formData.priority,
            matchedCount: Math.floor(Math.random() * 50),
            lastRun: 'Just now',
            logic: formData.logic,
            conditions: formData.conditions,
            action: formData.action
        }

        setRules(prev => [...prev, newRule].sort((a, b) => a.priority - b.priority))
        toast.success(`Rule "${newRule.name}" created successfully`)
        setIsDrawerOpen(false)
    }

    const deleteRule = (id) => {
        setRules(rules.filter(r => r.id !== id))
        toast.info("Rule deleted")
        setActiveActionMenu(null)
    }

    const toggleRuleStatus = (id) => {
        setRules(rules.map(r => r.id === id ? { ...r, status: r.status === 'Active' ? 'Paused' : 'Active' } : r))
        setActiveActionMenu(null)
    }

    const duplicateRule = (rule) => {
        const newRule = {
            ...rule,
            id: `rule_${Date.now()}`,
            name: `${rule.name} (Copy)`,
            priority: rules.length + 1,
            matchedCount: 0,
            lastRun: 'Never'
        }
        setRules([...rules, newRule])
        toast.success("Rule duplicated")
        setActiveActionMenu(null)
    }

    const runRulesNow = () => {
        toast.success("Automation rules are running in the background...")
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in h-full relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-white p-5 rounded-xl border border-border-subtle shadow-sm">
                <div>
                    <h3 className="text-[18px] font-bold text-content-primary tracking-tight">Smart Rules</h3>
                    <p className="text-[13px] text-content-secondary mt-1">Automatically assign products to this category based on product data and imports.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={runRulesNow}>
                        <Play className="mr-2 h-4 w-4" /> Run Rules Now
                    </Button>
                    <Button variant="outline" size="sm" onClick={openAddDrawer}>
                        <Plus className="mr-2 h-4 w-4" /> Add Rule
                    </Button>
                    <Button size="sm" onClick={() => toast.success("Rules saved")}>
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 min-h-0">
                {/* Main Content - Rules Table */}
                <div className="flex-1 w-full bg-white border border-border-subtle rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
                    <div className="p-4 border-b border-border-subtle bg-app-card-muted flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-content-primary">Configured Rules</span>
                            <Badge className="bg-white border-border-subtle text-content-secondary">{rules.length}</Badge>
                        </div>
                    </div>

                    {rules.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <Zap className="h-10 w-10 text-content-tertiary mb-3 opacity-50" />
                            <h4 className="text-[15px] font-bold text-content-primary mb-1">No Smart Rules</h4>
                            <p className="text-[13px] text-content-secondary max-w-sm mb-4">You haven't set up any automation rules for this category yet. Create a rule to automatically pull in matching products.</p>
                            <Button onClick={openAddDrawer}><Plus className="mr-2 h-4 w-4" /> Add Your First Rule</Button>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-app-card-muted/50 border-b border-border-subtle text-content-tertiary font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-4 py-3 w-8"></th>
                                        <th className="px-4 py-3">Rule Name</th>
                                        <th className="px-4 py-3">Conditions Summary</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Priority</th>
                                        <th className="px-4 py-3 text-right">Matched</th>
                                        <th className="px-4 py-3">Last Run</th>
                                        <th className="px-4 py-3 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle text-[13px]">
                                    {rules.map((rule) => (
                                        <tr key={rule.id} className={cn("hover:bg-app-hover group transition-colors bg-white relative", rule.status === 'Paused' && 'opacity-70 grayscale-[0.2]')}>
                                            <td className="px-4 py-3 cursor-grab text-content-tertiary hover:text-content-primary">
                                                <GripVertical size={16} />
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-content-primary">
                                                {rule.name}
                                                {rule.action === 'suggest' && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">SUGGEST</span>}
                                            </td>
                                            <td className="px-4 py-3 text-[12px] text-content-secondary font-mono">
                                                <div className="truncate max-w-[200px] xl:max-w-[300px]" title={rule.conditionsSummary}>{rule.conditionsSummary}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {rule.status === 'Active' ? (
                                                    <Badge className="bg-semantic-success/10 text-semantic-success border-none font-bold text-[11px]"><CheckCircle2 size={12} className="mr-1" /> Active</Badge>
                                                ) : (
                                                    <Badge className="bg-app-card-muted text-content-secondary border-none font-bold text-[11px]">Paused</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="secondary" className="bg-white border-border-subtle">{rule.priority}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-brand">
                                                {rule.matchedCount}
                                            </td>
                                            <td className="px-4 py-3 text-content-tertiary text-[12px]">
                                                {rule.lastRun}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => setActiveActionMenu(activeActionMenu === rule.id ? null : rule.id)}
                                                    className="text-content-tertiary hover:text-content-primary p-1 rounded hover:bg-black/5 transition-colors relative"
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>
                                                {activeActionMenu === rule.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setActiveActionMenu(null)}></div>
                                                        <div className="absolute right-8 top-10 w-36 bg-white border border-border-subtle rounded-xl shadow-xl z-20 py-1 flex flex-col items-start overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                            <button className="w-full text-left px-3 py-2 text-[12px] font-medium text-content-primary hover:bg-app-hover flex items-center gap-2 transition-colors">
                                                                <Edit2 size={14} className="text-content-tertiary" /> Edit
                                                            </button>
                                                            <button onClick={() => duplicateRule(rule)} className="w-full text-left px-3 py-2 text-[12px] font-medium text-content-primary hover:bg-app-hover flex items-center gap-2 transition-colors">
                                                                <Copy size={14} className="text-content-tertiary" /> Duplicate
                                                            </button>
                                                            <button onClick={() => toggleRuleStatus(rule.id)} className="w-full text-left px-3 py-2 text-[12px] font-medium text-content-primary hover:bg-app-hover flex items-center gap-2 transition-colors">
                                                                {rule.status === 'Active' ? <Zap size={14} className="text-content-tertiary" /> : <Play size={14} className="text-content-tertiary" />}
                                                                {rule.status === 'Active' ? 'Disable' : 'Enable'}
                                                            </button>
                                                            <div className="h-px w-full bg-border-subtle my-1"></div>
                                                            <button onClick={() => deleteRule(rule.id)} className="w-full text-left px-3 py-2 text-[12px] font-medium hover:bg-red-50 text-semantic-error flex items-center gap-2 transition-colors">
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
                    )}
                </div>

                {/* Sidebar Cards */}
                <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">

                    {/* Overall Preview / Analytics */}
                    <Card className="border-border-subtle shadow-sm bg-white overflow-hidden">
                        <div className="p-4 border-b border-border-subtle bg-app-card-muted flex items-center gap-2">
                            <ActivityIcon size={16} className="text-content-tertiary" />
                            <span className="text-[13px] font-bold text-content-primary">Automation Preview</span>
                        </div>
                        <div className="p-4 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] text-content-secondary">Total Est. Matches</span>
                                <span className="text-[18px] font-bold text-content-primary">444</span>
                            </div>

                            <div className="h-px bg-border-subtle w-full" />

                            <div>
                                <span className="text-[11px] font-bold text-content-tertiary uppercase tracking-wider mb-2 block">Sample Matches</span>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-app-card-muted rounded border border-border-subtle flex items-center justify-center shrink-0"><Package size={12} className="text-content-tertiary" /></div>
                                        <div className="min-w-0">
                                            <p className="text-[12px] font-semibold text-content-primary truncate">Core Running Sneaker</p>
                                            <p className="text-[10px] text-brand truncate font-mono">Matched: Rule #1</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-app-card-muted rounded border border-border-subtle flex items-center justify-center shrink-0"><Package size={12} className="text-content-tertiary" /></div>
                                        <div className="min-w-0">
                                            <p className="text-[12px] font-semibold text-content-primary truncate">Leather Chelsea Boot</p>
                                            <p className="text-[10px] text-brand truncate font-mono">Matched: Rule #1, #2</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-border-subtle w-full" />

                            <div className="bg-amber-50 rounded-lg border border-amber-200 p-3 flex items-start gap-2">
                                <AlertTriangle size={14} className="text-amber-600 mt-0.5" />
                                <div>
                                    <p className="text-[12px] font-bold text-amber-900">12 Conflicts Detected</p>
                                    <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">Some products match conflicting move/assign rules.</p>
                                    <button className="text-[11px] font-bold text-amber-800 mt-1 hover:underline">View Review Queue &rarr;</button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Suggested Templates */}
                    <Card className="border-border-subtle shadow-sm bg-white overflow-hidden">
                        <div className="p-4 border-b border-border-subtle bg-app-card-muted flex items-center gap-2">
                            <Sparkles size={16} className="text-brand" />
                            <span className="text-[13px] font-bold text-brand">Suggested Templates</span>
                        </div>
                        <div className="p-2 space-y-1">
                            <div className="p-3 hover:bg-app-hover rounded-xl cursor-pointer transition-colors group">
                                <p className="text-[12px] font-bold text-content-primary group-hover:text-brand">Keyword Match (Title)</p>
                                <p className="text-[11px] text-content-secondary mt-0.5 line-clamp-2 leading-relaxed">Assigns products where title contains specific keywords.</p>
                            </div>
                            <div className="p-3 hover:bg-app-hover rounded-xl cursor-pointer transition-colors group">
                                <p className="text-[12px] font-bold text-content-primary group-hover:text-brand">Import Sub-category Map</p>
                                <p className="text-[11px] text-content-secondary mt-0.5 line-clamp-2 leading-relaxed">Map a specific vendor's category exactly to this logic.</p>
                            </div>
                            <div className="p-3 hover:bg-app-hover rounded-xl cursor-pointer transition-colors group">
                                <p className="text-[12px] font-bold text-content-primary group-hover:text-brand">Price Point Tier</p>
                                <p className="text-[11px] text-content-secondary mt-0.5 line-clamp-2 leading-relaxed">Group items above or below a specific price threshold.</p>
                            </div>
                        </div>
                    </Card>

                </div>
            </div>

            {/* Rule Builder Drawer */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-[600px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300 border-l border-border-subtle">
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-border-subtle bg-app-card-muted flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-[18px] font-bold text-content-primary tracking-tight">Rule Builder</h2>
                                <p className="text-[12px] font-medium text-content-secondary mt-1">Configure automated assignments for this category</p>
                            </div>
                            <button onClick={() => setIsDrawerOpen(false)} className="h-8 w-8 rounded-full bg-white border border-border-subtle flex items-center justify-center text-content-secondary hover:text-content-primary shadow-sm transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-app-body">

                            {/* General Setup */}
                            <div className="space-y-5 bg-white p-5 rounded-xl border border-border-subtle shadow-sm">
                                <div>
                                    <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Rule Name <span className="text-semantic-error">*</span></label>
                                    <Input
                                        placeholder="e.g. Catch all shoes"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={cn("bg-white", formErrors.name && "border-semantic-error")}
                                    />
                                    {formErrors.name && <p className="text-[11px] text-semantic-error mt-1.5 font-medium">{formErrors.name}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Rule Status</label>
                                        <select
                                            className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-[13px] focus:ring-2 focus:ring-brand outline-none"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Paused">Paused</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-semibold text-content-primary mb-1.5">Priority (Lower runs first)</label>
                                        <Input
                                            type="number"
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                                            className="bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Conditions Builder */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[14px] font-bold text-content-primary">Conditions</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[12px] text-content-secondary font-medium">Match</span>
                                        <select
                                            className="h-8 rounded-lg border border-border-subtle bg-white px-2 text-[12px] font-bold focus:ring-2 focus:ring-brand outline-none"
                                            value={formData.logic}
                                            onChange={(e) => setFormData({ ...formData, logic: e.target.value })}
                                        >
                                            <option value="all">ALL conditions</option>
                                            <option value="any">ANY condition</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3 bg-white p-2 rounded-xl border border-border-subtle shadow-sm">
                                    {formData.conditions.map((condition, index) => (
                                        <div key={condition.id} className="flex items-start gap-2 p-3 bg-app-body border border-border-subtle rounded-lg">
                                            <div className="flex-1 grid grid-cols-12 gap-2">
                                                <div className="col-span-4">
                                                    <select
                                                        className="w-full h-9 rounded-lg border border-border-subtle bg-white px-2 text-[12px] font-medium focus:ring-1 focus:ring-brand outline-none"
                                                        value={condition.field}
                                                        onChange={(e) => updateCondition(condition.id, 'field', e.target.value)}
                                                    >
                                                        {RULE_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-span-3">
                                                    <select
                                                        className="w-full h-9 rounded-lg border border-border-subtle bg-white px-2 text-[12px] font-medium focus:ring-1 focus:ring-brand outline-none"
                                                        value={condition.operator}
                                                        onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                                                    >
                                                        {RULE_OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                </div>
                                                <div className="col-span-5 relative">
                                                    <Input
                                                        placeholder="comma separated values"
                                                        className="h-9 text-[12px] bg-white pr-8"
                                                        value={condition.value}
                                                        onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                                                        disabled={condition.operator === 'is empty'}
                                                    />
                                                    {formData.conditions.length > 1 && (
                                                        <button
                                                            onClick={() => handleRemoveCondition(condition.id)}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-semantic-error"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {formErrors.conditions && (
                                        <p className="text-[11px] text-semantic-error px-3 py-1 font-medium">{formErrors.conditions}</p>
                                    )}

                                    <div className="px-3 pb-2 pt-1">
                                        <Button variant="ghost" size="sm" onClick={handleAddCondition} className="text-brand hover:text-brand-hover hover:bg-brand-soft">
                                            <Plus className="mr-2 h-4 w-4" /> Add Condition
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Action Builder */}
                            <div className="space-y-4">
                                <h4 className="text-[14px] font-bold text-content-primary">Resulting Action</h4>
                                <div className="space-y-3">
                                    {RULE_ACTIONS.map(action => (
                                        <label key={action.id} className={cn(
                                            "flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors text-left",
                                            formData.action === action.id ? "bg-brand-soft/30 border-brand" : "bg-white border-border-subtle hover:border-brand-soft"
                                        )}>
                                            <div className="mt-0.5 relative flex items-center justify-center">
                                                <input
                                                    type="radio"
                                                    name="rule_action"
                                                    value={action.id}
                                                    checked={formData.action === action.id}
                                                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                                                    className="peer appearance-none w-4 h-4 border border-border-strong rounded-full checked:border-brand checked:border-[4px] bg-white transition-all shadow-sm"
                                                />
                                            </div>
                                            <div>
                                                <div className="text-[13px] font-bold text-content-primary">{action.label}</div>
                                                <div className="text-[12px] text-content-secondary mt-1 max-w-[90%] leading-relaxed">{action.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-4 border-t border-border-subtle bg-white flex items-center justify-between shrink-0">
                            <div className="text-[12px] text-content-secondary font-medium">
                                Estimated Matches: <span className="font-bold text-content-primary">Calculating...</span>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
                                <Button onClick={handleSaveRule}>Save Rule</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function ActivityIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}
