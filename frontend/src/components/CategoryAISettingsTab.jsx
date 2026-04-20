import React, { useState } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { cn } from '../lib/cn'
import { toast } from 'sonner'
import { Save, Sparkles, Bot, PenTool, Search, Zap, Eye, CheckCircle2, Sliders, Image as ImageIcon, Box, ListVideo } from 'lucide-react'

export function CategoryAISettingsTab({ category }) {
    const isShoes = category?.name?.toLowerCase().includes('shoe') || category?.name?.toLowerCase().includes('footwear') || category?.id === 'footwear'

    // Form state with sensible defaults based on category
    const [settings, setSettings] = useState({
        // 1. AI Category Settings
        aiCategoryType: isShoes ? 'Footwear' : 'General Apparel',
        aiEnabled: true,
        globalTryOnEligible: isShoes ? true : false,
        requiresHumanApproval: true,

        // 2. Description Generation
        descTone: isShoes ? 'Premium' : 'Professional',
        descStyle: 'Bullet Points + Paragraph',
        outLength: 'Medium (100-150 words)',
        seoSupport: true,

        // 3. Attribute Extraction
        prioritizedAttributes: isShoes ? 'Shoe Size, Color, Material, Sole Material, Occasion' : '',
        requiredExtractedFields: isShoes ? 'Color, Material' : '',
        extractionHints: isShoes ? 'Pay close attention to upper materials (leather, suede, mesh) and closure types (laces, velcro).' : '',

        // 4. Try-On Settings
        tryOnEnabled: isShoes ? true : false,
        productGarmentType: isShoes ? 'Shoes / Sneakers' : 'Tops',
        reqSourceImageType: 'Flat Lay or Ghost Mannequin',
        prefOutputStyle: isShoes ? 'Ecommerce Clean (White Background)' : 'Lifestyle Editorial',
        minImageQuality: 'High (1080p+)',
        allowModelPresets: true,

        // 5. Publishing / Output Rules
        showDescInCatalog: true,
        showVisualsInShowroom: true,
        allowLookbooks: true,
        aiBadge: false,
        approvalBeforePublish: true,
    })

    const handleSave = () => {
        toast.success("AI Settings updated successfully")
    }

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }))
    }

    const ToggleSwitch = ({ checked, onChange, label, description }) => (
        <label className={cn(
            "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors bg-white",
            checked ? "border-brand-soft shadow-sm ring-1 ring-brand/5" : "border-border-subtle hover:border-border-strong"
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

    const SectionHeader = ({ title, icon: Icon, desc }) => (
        <div className="mb-5 pb-3 border-b border-border-subtle">
            <h4 className="text-[15px] font-bold text-content-primary flex items-center gap-2">
                <Icon size={18} className="text-brand" /> {title}
            </h4>
            {desc && <p className="text-[13px] text-content-secondary mt-1 ml-6">{desc}</p>}
        </div>
    )

    return (
        <div className="flex flex-col gap-6 animate-in fade-in h-full relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-white p-5 rounded-xl border border-border-subtle shadow-sm">
                <div>
                    <h3 className="text-[18px] font-bold text-content-primary tracking-tight">AI Settings</h3>
                    <p className="text-[13px] text-content-secondary mt-1">Configure automated intelligence behaviors for products in this category.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setSettings(settings)}>Discard Changes</Button>
                    <Button size="sm" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Configuration</Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-y-auto pb-10">
                {/* Left Column */}
                <div className="flex-1 space-y-6">

                    {/* 1. Core AI Settings */}
                    <Card className="p-6 bg-white border-border-subtle shadow-sm">
                        <SectionHeader title="Category Core Setup" icon={Bot} desc="Foundation models mapping for this category context." />

                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[13px] font-bold text-content-primary mb-1.5">AI Category Type</label>
                                    <select
                                        className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-[13px] focus:ring-2 focus:ring-brand outline-none"
                                        value={settings.aiCategoryType} onChange={(e) => handleChange('aiCategoryType', e.target.value)}
                                    >
                                        <option value="General Apparel">General Apparel</option>
                                        <option value="Footwear">Footwear</option>
                                        <option value="Accessories">Accessories</option>
                                        <option value="Jewelry">Jewelry</option>
                                        <option value="Outerwear">Outerwear</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ToggleSwitch
                                    label="AI Workflows Enabled"
                                    description="Allow products in this category to be processed by Merchflow AI models."
                                    checked={settings.aiEnabled} onChange={(val) => handleChange('aiEnabled', val)}
                                />
                                <ToggleSwitch
                                    label="Require Human Approval"
                                    description="Pause AI output for manual review before treating as finalized data."
                                    checked={settings.requiresHumanApproval} onChange={(val) => handleChange('requiresHumanApproval', val)}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* 3. Attribute Extraction */}
                    <Card className="p-6 bg-white border-border-subtle shadow-sm">
                        <SectionHeader title="Attribute Extraction" icon={Search} desc="Guide the vision and text models on what to extract from raw assets." />

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[13px] font-bold text-content-primary mb-1.5">Prioritized Attributes (Comma separated)</label>
                                <Input
                                    className="bg-white" placeholder="e.g. Size, Color, Fabric"
                                    value={settings.prioritizedAttributes} onChange={(e) => handleChange('prioritizedAttributes', e.target.value)}
                                />
                                <p className="text-[11px] text-content-secondary mt-1">AI will focus primarily on finding these specifics in descriptions and images.</p>
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold text-content-primary mb-1.5">Required Extracted Fields</label>
                                <Input
                                    className="bg-white" placeholder="e.g. Color, Material"
                                    value={settings.requiredExtractedFields} onChange={(e) => handleChange('requiredExtractedFields', e.target.value)}
                                />
                                <p className="text-[11px] text-content-secondary mt-1">Extraction fails if these fields cannot be confidently determined.</p>
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold text-content-primary mb-1.5">Extraction Hints & Guidelines</label>
                                <textarea
                                    className="w-full h-24 p-3 rounded-xl border border-border-subtle bg-white text-[13px] focus:ring-2 focus:ring-brand outline-none resize-y"
                                    placeholder="Provide custom instructions to the AI on how to interpret items in this category..."
                                    value={settings.extractionHints} onChange={(e) => handleChange('extractionHints', e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* 4. Try-On Settings */}
                    <Card className="p-6 bg-white border-border-subtle shadow-sm relative overflow-hidden">
                        {/* Status bar */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-400 via-brand to-cyan-400"></div>
                        <SectionHeader title="Virtual Try-On Output" icon={ImageIcon} desc="Configuring generative imagery for catalogs and showrooms." />

                        <div className="space-y-6">
                            <ToggleSwitch
                                label="Enable Virtual Try-On Generation"
                                description="Automatically queue products for on-model image generation upon import."
                                checked={settings.tryOnEnabled} onChange={(val) => handleChange('tryOnEnabled', val)}
                            />

                            <div className={cn("space-y-5 transition-all duration-300", !settings.tryOnEnabled && "opacity-50 pointer-events-none")}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] font-bold text-content-primary mb-1.5">Garment Mapping Type</label>
                                        <select
                                            className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-[13px] outline-none"
                                            value={settings.productGarmentType} onChange={(e) => handleChange('productGarmentType', e.target.value)}
                                        >
                                            <option value="Tops">Tops (Shirts, Jackets)</option>
                                            <option value="Bottoms">Bottoms (Pants, Shorts)</option>
                                            <option value="Shoes / Sneakers">Shoes / Sneakers</option>
                                            <option value="Full Body">Full Body (Dresses, Suits)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-bold text-content-primary mb-1.5">Preferred Output Style</label>
                                        <select
                                            className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-[13px] outline-none"
                                            value={settings.prefOutputStyle} onChange={(e) => handleChange('prefOutputStyle', e.target.value)}
                                        >
                                            <option value="Ecommerce Clean (White Background)">Ecommerce Clean (White Background)</option>
                                            <option value="Lifestyle Editorial">Lifestyle Editorial</option>
                                            <option value="Streetwear Context">Streetwear Context</option>
                                            <option value="Minimalist Studio">Minimalist Studio</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] font-bold text-content-primary mb-1.5">Req. Source Image Type</label>
                                        <select
                                            className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-[13px] outline-none"
                                            value={settings.reqSourceImageType} onChange={(e) => handleChange('reqSourceImageType', e.target.value)}
                                        >
                                            <option value="Flat Lay or Ghost Mannequin">Flat Lay or Ghost Mannequin</option>
                                            <option value="Any clean source">Any clean source</option>
                                            <option value="High-Res 3D Render">High-Res 3D Render</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-bold text-content-primary mb-1.5">Min Quality Check</label>
                                        <select
                                            className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-[13px] outline-none"
                                            value={settings.minImageQuality} onChange={(e) => handleChange('minImageQuality', e.target.value)}
                                        >
                                            <option value="Standard (720p+)">Standard (720p+)</option>
                                            <option value="High (1080p+)">High (1080p+)</option>
                                            <option value="Ultra (4k)">Ultra (4k+)</option>
                                        </select>
                                    </div>
                                </div>
                                <ToggleSwitch
                                    label="Allow Model Consistency Presets"
                                    description="Use predefined model faces/body types across generations for brand consistency."
                                    checked={settings.allowModelPresets} onChange={(val) => handleChange('allowModelPresets', val)}
                                />
                            </div>
                        </div>
                    </Card>

                </div>

                {/* Right Column */}
                <div className="w-full lg:w-[360px] flex flex-col gap-6 shrink-0">

                    {/* 2. Description Generation */}
                    <Card className="p-6 bg-white border-border-subtle shadow-sm">
                        <SectionHeader title="Writing Style" icon={PenTool} />

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[13px] font-bold text-content-primary mb-1.5">Default Tone</label>
                                <select
                                    className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-[13px] outline-none"
                                    value={settings.descTone} onChange={(e) => handleChange('descTone', e.target.value)}
                                >
                                    <option value="Premium">Premium & Exclusive</option>
                                    <option value="Professional">Professional</option>
                                    <option value="Playful">Playful & Casual</option>
                                    <option value="Technical">Technical & Detailed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold text-content-primary mb-1.5">Description Style</label>
                                <select
                                    className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-[13px] outline-none"
                                    value={settings.descStyle} onChange={(e) => handleChange('descStyle', e.target.value)}
                                >
                                    <option value="Bullet Points + Paragraph">Bullet Points + Paragraph</option>
                                    <option value="Short Paragraph Only">Short Paragraph Only</option>
                                    <option value="Extensive Storytelling">Extensive Storytelling</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[13px] font-bold text-content-primary mb-1.5">Output Length Target</label>
                                <select
                                    className="w-full h-10 rounded-xl border border-border-subtle bg-white px-3 text-[13px] outline-none"
                                    value={settings.outLength} onChange={(e) => handleChange('outLength', e.target.value)}
                                >
                                    <option value="Short (50-80 words)">Short (50-80 words)</option>
                                    <option value="Medium (100-150 words)">Medium (100-150 words)</option>
                                    <option value="Long (200+ words)">Long (200+ words)</option>
                                </select>
                            </div>
                            <ToggleSwitch
                                label="SEO Optimizations"
                                description="Auto-inject high-volume search keywords naturally into the descriptions."
                                checked={settings.seoSupport} onChange={(val) => handleChange('seoSupport', val)}
                            />
                        </div>
                    </Card>

                    {/* 5. Publishing / Output Rules */}
                    <Card className="p-6 bg-white border-border-subtle shadow-sm bg-app-card-muted/30">
                        <SectionHeader title="Publishing & Output" icon={Sliders} desc="Where and how AI content is allowed to surface." />

                        <div className="space-y-4">
                            <ToggleSwitch
                                label="Show AI Descriptions in Catalog"
                                checked={settings.showDescInCatalog} onChange={(val) => handleChange('showDescInCatalog', val)}
                            />
                            <ToggleSwitch
                                label="Show AI Visuals in Showroom"
                                checked={settings.showVisualsInShowroom} onChange={(val) => handleChange('showVisualsInShowroom', val)}
                            />
                            <ToggleSwitch
                                label="Allow in Lookbook Generation"
                                checked={settings.allowLookbooks} onChange={(val) => handleChange('allowLookbooks', val)}
                            />

                            <div className="h-px w-full bg-border-subtle my-2"></div>

                            <ToggleSwitch
                                label="Add 'AI Generated' Badge"
                                description="Visually flag AI outputs internally."
                                checked={settings.aiBadge} onChange={(val) => handleChange('aiBadge', val)}
                            />
                            <ToggleSwitch
                                label="Approval Before Publish"
                                description="Require manager signoff before AI assets go live."
                                checked={settings.approvalBeforePublish} onChange={(val) => handleChange('approvalBeforePublish', val)}
                            />
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    )
}
