import { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building2, Upload, X, CheckCircle2, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'

export function SettingsCompanyPage() {
    const setUser = useAuthStore(s => s.setUser)
    const currentUser = useAuthStore(s => s.user)

    const [form, setForm] = useState({
        brandName: '',
        companyAddress: '',
        brandLogo: '',
    })
    const [logoPreview, setLogoPreview] = useState(null)
    const [uploading, setUploading] = useState(false)
    const fileRef = useRef()

    const profileQ = useQuery({
        queryKey: ['profile'],
        queryFn: () => api('/auth/me')
    })

    useEffect(() => {
        if (profileQ.data) {
            setForm({
                brandName: profileQ.data.brandName || '',
                companyAddress: profileQ.data.companyAddress || '',
                brandLogo: profileQ.data.brandLogo || '',
            })
            setLogoPreview(profileQ.data.brandLogo || null)
        }
    }, [profileQ.data])

    // Convert file to base64 and use as logo URL (stored as data URL or upload to media)
    const handleLogoFile = async (file) => {
        if (!file) return
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('files', file)
            const result = await api.post('/media/upload', formData)
            const url = Array.isArray(result) ? result[0]?.url : result?.url
            if (url) {
                setForm(f => ({ ...f, brandLogo: url }))
                setLogoPreview(url)
                toast.success('Logo uploaded!')
                return
            }
        } catch {
            // Fall through to base64
        }
        // Fallback: base64 data URL
        const reader = new FileReader()
        reader.onload = (e) => {
            setForm(f => ({ ...f, brandLogo: e.target.result }))
            setLogoPreview(e.target.result)
            toast.success('Logo ready — save to apply.')
        }
        reader.readAsDataURL(file)
        setUploading(false)
    }

    const saveM = useMutation({
        mutationFn: (data) => api.patch('/auth/me', data),
        onSuccess: (updated) => {
            // Update auth store so sidebar refreshes immediately
            setUser({ ...currentUser, ...updated })
            toast.success('Company profile saved!', {
                description: 'Your company name and logo now appear in the sidebar.',
                icon: <CheckCircle2 className="text-green-500" size={18} />
            })
        },
        onError: (err) => toast.error('Save failed', { description: err.message })
    })

    const isComplete = form.brandName.trim().length > 0

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-5 w-5 text-brand" />
                    <h1 className="text-2xl font-bold tracking-tight text-content-primary">Company Profile</h1>
                </div>
                <p className="text-sm text-content-secondary">
                    Your company name and logo will replace "MerchFlow AI" in the sidebar and across the platform.
                </p>
            </div>

            {/* Completion banner */}
            {!isComplete && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                    <Sparkles size={16} className="shrink-0 text-amber-500" />
                    <span>Add your company name below to personalize your MerchFlow workspace.</span>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-5">
                {/* Form Card */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Company Details</CardTitle>
                        <CardDescription>These details are shown to your team in the dashboard sidebar.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Company Name */}
                        <div>
                            <label className="text-sm font-medium text-content-primary block mb-1.5">
                                Company Name <span className="text-red-400">*</span>
                            </label>
                            <Input
                                value={form.brandName}
                                onChange={e => setForm({ ...form, brandName: e.target.value })}
                                placeholder="e.g. Acme Fashion Group"
                                className="h-11"
                            />
                            <p className="text-[11px] text-content-tertiary mt-1">
                                Replaces "MerchFlow AI" in the sidebar header.
                            </p>
                        </div>

                        {/* Company Address */}
                        <div>
                            <label className="text-sm font-medium text-content-primary block mb-1.5">
                                Company Address
                            </label>
                            <textarea
                                value={form.companyAddress}
                                onChange={e => setForm({ ...form, companyAddress: e.target.value })}
                                placeholder="123 Fashion Ave, Mumbai, Maharashtra 400001, India"
                                rows={3}
                                className="w-full rounded-lg border border-border-subtle bg-app-body px-3 py-2.5 text-sm text-content-primary placeholder:text-content-tertiary outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand resize-none transition-all"
                            />
                        </div>

                        {/* Company Logo */}
                        <div>
                            <label className="text-sm font-medium text-content-primary block mb-1.5">
                                Company Logo
                            </label>
                            <div
                                className="relative group border-2 border-dashed border-border-subtle rounded-xl p-6 flex flex-col items-center justify-center gap-3 bg-app-body hover:border-brand hover:bg-brand/5 transition-all cursor-pointer"
                                onClick={() => fileRef.current?.click()}
                            >
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => handleLogoFile(e.target.files[0])}
                                />
                                {logoPreview ? (
                                    <div className="relative">
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            className="h-16 max-w-[180px] object-contain rounded-lg"
                                        />
                                        <button
                                            className="absolute -top-2 -right-2 bg-white border border-border-subtle rounded-full p-0.5 shadow-sm hover:bg-red-50 transition-colors"
                                            onClick={e => {
                                                e.stopPropagation()
                                                setLogoPreview(null)
                                                setForm(f => ({ ...f, brandLogo: '' }))
                                            }}
                                        >
                                            <X size={12} className="text-red-500" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="h-12 w-12 rounded-xl bg-app-card border border-border-subtle flex items-center justify-center">
                                            <Upload size={20} className="text-content-tertiary group-hover:text-brand transition-colors" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-content-primary">Click to upload logo</p>
                                            <p className="text-xs text-content-tertiary mt-0.5">PNG, JPG, SVG up to 5MB</p>
                                        </div>
                                    </>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                                        <div className="animate-spin h-5 w-5 border-2 border-brand border-t-transparent rounded-full" />
                                    </div>
                                )}
                            </div>
                            <p className="text-[11px] text-content-tertiary mt-1">
                                Shown in the sidebar instead of the "M" icon.
                            </p>
                        </div>

                        <Button
                            onClick={() => saveM.mutate(form)}
                            disabled={saveM.isPending || !isComplete}
                            className="w-full h-11 font-semibold"
                        >
                            {saveM.isPending ? (
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    Saving…
                                </span>
                            ) : (
                                'Save Company Profile'
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Live Preview Card */}
                <Card className="lg:col-span-2 h-fit">
                    <CardHeader>
                        <CardTitle>Sidebar Preview</CardTitle>
                        <CardDescription>How the sidebar header will look.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-app-sidebar rounded-xl border border-border-subtle p-4">
                            <div className="flex items-center gap-3">
                                {/* Logo preview */}
                                {logoPreview ? (
                                    <img
                                        src={logoPreview}
                                        alt="Logo"
                                        className="h-8 w-8 rounded-md object-contain bg-white border border-border-subtle shrink-0 shadow-sm"
                                    />
                                ) : (
                                    <div className="h-8 w-8 rounded-md bg-brand flex items-center justify-center text-white shrink-0 shadow-sm font-bold text-lg">
                                        {form.brandName ? form.brandName[0].toUpperCase() : 'M'}
                                    </div>
                                )}
                                <div className="leading-tight overflow-hidden">
                                    <div className="text-[15px] font-semibold tracking-tight text-content-primary truncate">
                                        {form.brandName || 'MerchFlow AI'}
                                    </div>
                                    {form.brandName ? (
                                        <div className="text-[10px] text-content-tertiary mt-0.5">Powered by MerchFlow AI</div>
                                    ) : (
                                        <div className="text-[11px] text-content-tertiary mt-0.5">admin</div>
                                    )}
                                </div>
                            </div>

                            {/* Address preview if set */}
                            {form.companyAddress && (
                                <div className="mt-4 pt-4 border-t border-border-subtle">
                                    <p className="text-[10px] font-medium text-content-tertiary uppercase tracking-wider mb-1">Address</p>
                                    <p className="text-xs text-content-secondary leading-relaxed">{form.companyAddress}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
