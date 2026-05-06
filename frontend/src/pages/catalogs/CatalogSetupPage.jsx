import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Check, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { catalogService } from '../../services/catalogService'

export function CatalogSetupPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const type = searchParams.get('type') || 'lookbook'

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [source, setSource] = useState('manual')
    const [audience, setAudience] = useState('b2b')
    const [toggles, setToggles] = useState({
        pricing: type === 'price-list',
        variants: true,
        aiAssets: type === 'lookbook',
        stock: type !== 'lookbook',
        moq: type !== 'lookbook',
        specs: type === 'line-sheet',
        intro: type === 'lookbook'
    })
    const [template, setTemplate] = useState('blank')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState({})

    const handleToggle = (key) => setToggles(prev => ({ ...prev, [key]: !prev[key] }))

    const handleCreate = async () => {
        // Validate
        const newErrors = {}
        if (!name.trim()) newErrors.name = 'Catalog name is required'
        if (!source) newErrors.source = 'Please select a content source'
        if (!audience) newErrors.audience = 'Please specify a target audience'
        if (!template) newErrors.template = 'Please select a template mapping'

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            toast.error('Please fix the errors before proceeding.')
            return
        }

        setErrors({})
        setIsSubmitting(true)

        try {
            const newCat = await catalogService.createCatalog({
                type, name, description, source, audience, toggles, template
            })
            toast.success('Draft catalog created')
            navigate(`/catalogs/${newCat.id}/builder`)
        } catch (err) {
            toast.error('Failed to create catalog')
        } finally {
            setIsSubmitting(false)
        }
    }

    const getTypeLabel = () => {
        if (type === 'line-sheet') return 'Line Sheet'
        if (type === 'price-list') return 'Price List'
        return 'Lookbook'
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in">
            <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="sm" className="-ml-2 text-content-secondary hover:text-content-primary" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} className="mr-1" /> Back
                </Button>
            </div>

            <PageHeader
                title={`Setup ${getTypeLabel()}`}
                description="Configure the content sources and layout preferences for your new catalog."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Give your catalog a name and description for internal reference.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold mb-1 block">Catalog Name <span className="text-semantic-error">*</span></label>
                                <Input
                                    value={name}
                                    onChange={e => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: null }) }}
                                    placeholder="e.g. Fall 2026 Core Collection"
                                    className={errors.name ? 'border-semantic-error focus-visible:ring-semantic-error focus:ring-semantic-error' : ''}
                                />
                                {errors.name && <p className="text-sm font-medium text-semantic-error mt-1.5">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-semibold mb-1 block">Description (Optional)</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full h-24 rounded-[12px] border border-border-subtle bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
                                    placeholder="Internal notes about this catalog..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Content Strategy</CardTitle>
                            <CardDescription>Determine what products go into this catalog and who it is for.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold mb-1 block">Source Content <span className="text-semantic-error">*</span></label>
                                    <select
                                        value={source}
                                        onChange={e => { setSource(e.target.value); if (errors.source) setErrors({ ...errors, source: null }) }}
                                        className={`h-10 w-full rounded-[12px] border ${errors.source ? 'border-semantic-error focus:ring-semantic-error' : 'border-border-subtle focus:ring-brand'} bg-white px-3 text-sm outline-none focus:ring-2`}
                                    >
                                        <option value="manual">Manual Selection</option>
                                        <option value="all">All Active Products</option>
                                        <option value="collection">Specific Collection</option>
                                        <option value="category">Specific Category</option>
                                    </select>
                                    {errors.source && <p className="text-sm font-medium text-semantic-error mt-1.5">{errors.source}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-semibold mb-1 block">Target Audience <span className="text-semantic-error">*</span></label>
                                    <select
                                        value={audience}
                                        onChange={e => { setAudience(e.target.value); if (errors.audience) setErrors({ ...errors, audience: null }) }}
                                        className={`h-10 w-full rounded-[12px] border ${errors.audience ? 'border-semantic-error focus:ring-semantic-error' : 'border-border-subtle focus:ring-brand'} bg-white px-3 text-sm outline-none focus:ring-2`}
                                    >
                                        <option value="b2b">B2B Wholesale</option>
                                        <option value="d2c">D2C Direct</option>
                                        <option value="pr">Press & PR</option>
                                    </select>
                                    {errors.audience && <p className="text-sm font-medium text-semantic-error mt-1.5">{errors.audience}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Display Preferences</CardTitle>
                            <CardDescription>Toggle what information should be visible in the final generated pages.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                                {Object.entries({
                                    pricing: 'Show Pricing',
                                    variants: 'Show Variants',
                                    aiAssets: 'Include AI Try-On Assets',
                                    stock: 'Show Stock Levels',
                                    moq: 'Show MOQ',
                                    specs: 'Show Specification Tables',
                                    intro: 'Include Intro/Cover Page'
                                }).map(([key, label]) => (
                                    <div key={key} onClick={() => handleToggle(key)} className="flex items-center gap-3 cursor-pointer group w-fit">
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${toggles[key] ? 'bg-brand border-brand text-white' : 'bg-white border-border-subtle text-transparent group-hover:border-border-soft'}`}>
                                            <Check size={14} />
                                        </div>
                                        <span className="text-sm text-content-primary font-medium">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Template <span className="text-semantic-error">*</span></CardTitle>
                            <CardDescription>Select a layout starting point.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { id: 'blank', name: 'Start from Scratch', desc: 'Empty canvas' },
                                { id: 'modern', name: 'Modern Minimal', desc: 'Clean, large imagery' },
                                { id: 'classic', name: 'Classic Grid', desc: 'Dense product focused' },
                            ].map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => { setTemplate(t.id); if (errors.template) setErrors({ ...errors, template: null }) }}
                                    className={`p-3 rounded-[12px] border cursor-pointer transition-all ${template === t.id ? 'border-brand bg-brand-soft ring-1 ring-brand' : 'border-border-subtle bg-white hover:border-border-soft'} ${errors.template && template !== t.id ? 'border-semantic-error bg-red-50/50' : ''}`}
                                >
                                    <div className="text-sm font-bold text-content-primary">{t.name}</div>
                                    <div className="text-xs text-content-secondary mt-0.5">{t.desc}</div>
                                </div>
                            ))}
                            {errors.template && <p className="text-sm font-medium text-semantic-error mt-2">{errors.template}</p>}
                        </CardContent>
                    </Card>

                    <div className="sticky top-24 pt-4">
                        <Button
                            className="w-full h-12 text-[15px]"
                            disabled={isSubmitting}
                            onClick={handleCreate}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Draft Catalog'}
                        </Button>
                        <p className="text-xs text-content-tertiary text-center mt-3">
                            You can adjust all these settings later in the builder.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
