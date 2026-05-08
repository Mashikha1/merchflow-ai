import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../components/PageHeader'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { Building2, Upload, X } from 'lucide-react'

const LANGS = ['English', 'Spanish', 'French', 'German']
const TIMEZONES = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Singapore', 'Asia/Kolkata']
const THEMES = ['System', 'Light', 'Dark']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'INR']
const AUDIENCES = ['Public', 'Invite Only', 'Private']
const VISIBILITY = ['Public', 'Unlisted', 'Private']
const LANDING = ['Dashboard', 'Products', 'Catalogs', 'Showrooms', 'Quotes', 'Orders']
const DATEFMTS = ['MMM d, yyyy', 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd']

export function SettingsProfilePage() {
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)
  const qc = useQueryClient()

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatarUrl: user?.avatarUrl || '',
    role: user?.role || '',
    title: user?.title || '',
    phone: user?.phone || '',
    landing: user?.preferences?.landing || 'Dashboard',
    language: user?.preferences?.language || 'English',
    tz: user?.preferences?.tz || 'UTC',
    dateFmt: user?.preferences?.dateFmt || 'MMM d, yyyy',
    theme: user?.preferences?.theme || 'System',
    compact: user?.preferences?.compact || false,
    twofa: user?.twofa || false,
    notifyEmail: user?.notifyEmail ?? true,
    notifyQuotes: user?.notifyQuotes ?? true,
    notifyOrders: user?.notifyOrders ?? true,
    notifyAI: user?.notifyAI ?? true,
    notifyShowroom: user?.notifyShowroom ?? false,
    weeklySummary: user?.weeklySummary ?? true,
    defaultCurrency: user?.defaultCurrency || 'USD',
    defaultCatalogAudience: user?.defaultCatalogAudience || 'Invite Only',
    defaultShowroomVisibility: user?.defaultShowroomVisibility || 'Unlisted',
    autosave: user?.autosave ?? true,
    reminderPref: user?.reminderPref || 'Email',
  })

  const [section, setSection] = useState('Profile')
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '')
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const fileRef = useRef(null)

  // Company Profile state
  const [companyForm, setCompanyForm] = useState({
    brandName: user?.brandName || '',
    companyAddress: user?.companyAddress || '',
    brandLogo: user?.brandLogo || '',
  })
  const [logoPreview, setLogoPreview] = useState(user?.brandLogo || null)
  const [uploading, setUploading] = useState(false)
  const logoFileRef = useRef(null)

  const handleLogoFile = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('files', file)
      const result = await api.post('/media/upload', formData)
      const url = Array.isArray(result) ? result[0]?.url : result?.url
      if (url) {
        setCompanyForm(f => ({ ...f, brandLogo: url }))
        setLogoPreview(url)
        toast.success('Logo uploaded!')
        setUploading(false)
        return
      }
    } catch { }
    // Fallback: base64
    const reader = new FileReader()
    reader.onload = (e) => {
      setCompanyForm(f => ({ ...f, brandLogo: e.target.result }))
      setLogoPreview(e.target.result)
      toast.success('Logo ready — save to apply.')
    }
    reader.readAsDataURL(file)
    setUploading(false)
  }

  const companyM = useMutation({
    mutationFn: (data) => api.patch('/auth/me', data),
    onSuccess: (updated) => {
      setUser({ ...user, ...updated })
      qc.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Company profile saved!', { description: 'Sidebar updated with your company details.' })
    },
    onError: (e) => toast.error('Save failed: ' + (e.message || 'Unknown error'))
  })

  const saveM = useMutation({
    mutationFn: (body) => api.patch('/auth/me', body),
    onSuccess: (updated) => {
      setUser({ ...user, ...updated })
      qc.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile saved')
    },
    onError: (e) => toast.error('Save failed: ' + (e.message || 'Unknown error'))
  })

  const changePwM = useMutation({
    mutationFn: (body) => api.patch('/auth/change-password', {
      currentPassword: body.current,
      newPassword: body.next,
    }),
    onSuccess: () => { setPwForm({ current: '', next: '', confirm: '' }); toast.success('Password changed') },
    onError: (e) => toast.error(e.message || 'Password change failed')
  })

  const handleSave = () => saveM.mutate(form)

  const actions = (
    <>
      <Button onClick={handleSave} disabled={saveM.isPending}>
        {saveM.isPending ? 'Saving…' : 'Save Changes'}
      </Button>
      <Button variant="secondary" onClick={() => toast.message('Changes discarded')}>Cancel</Button>
    </>
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Profile Settings" subtitle="Manage your account details and personal preferences" actions={actions} />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2">
          {['Profile', 'Preferences', 'Security', 'Notifications', 'Work Defaults', 'Company Profile'].map((s) => (
            <button key={s} onClick={() => setSection(s)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm ${section === s ? 'bg-[rgb(var(--bg-muted))] font-semibold' : 'hover:bg-[rgb(var(--bg-muted))]'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {/* Profile */}
          {section === 'Profile' && (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
              <div className="text-[15px] font-semibold tracking-[-0.02em]">Profile</div>
              <div className="mt-6 grid gap-6 md:grid-cols-[160px_1fr]">
                <div>
                  <div className="h-32 w-32 rounded-full bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] overflow-hidden flex items-center justify-center text-3xl">
                    {avatarPreview
                      ? <img alt="avatar" src={avatarPreview} className="h-full w-full object-cover" />
                      : <span>{(form.name || '?')[0].toUpperCase()}</span>
                    }
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" onClick={() => fileRef.current?.click()}>Change photo</Button>
                    <Button variant="ghost" onClick={() => { setAvatarPreview(''); setForm(f => ({ ...f, avatarUrl: '' })) }}>Remove</Button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      const url = URL.createObjectURL(f)
                      setAvatarPreview(url)
                      
                      const formData = new FormData()
                      formData.append('files', f)
                      
                      try {
                        const res = await api.post('/media/upload', formData)
                        if (res && res[0]) {
                          setForm(v => ({ ...v, avatarUrl: res[0].url }))
                        }
                      } catch (err) {
                        toast.error('Failed to upload image')
                        setAvatarPreview(form.avatarUrl || '')
                      }
                    }} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted">Full name</label>
                    <Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">Email</label>
                    <Input className="mt-1" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">Role</label>
                    <Input value={form.role} readOnly className="mt-1 opacity-60 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">Job title</label>
                    <Input className="mt-1" placeholder="Optional" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted">Phone number</label>
                    <Input className="mt-1" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
          {section === 'Preferences' && (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
              <div className="text-[15px] font-semibold tracking-[-0.02em]">Preferences</div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  { label: 'Default landing page', key: 'landing', opts: LANDING },
                  { label: 'Language', key: 'language', opts: LANGS },
                  { label: 'Time zone', key: 'tz', opts: TIMEZONES },
                  { label: 'Date format', key: 'dateFmt', opts: DATEFMTS },
                  { label: 'Theme', key: 'theme', opts: THEMES },
                ].map(({ label, key, opts }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-muted">{label}</label>
                    <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm">
                      {opts.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                ))}
                <label className="flex items-center justify-between rounded-xl bg-[rgb(var(--surface-2))] px-3 py-2 text-sm border border-[rgb(var(--border))]">
                  <span>Compact mode</span>
                  <input type="checkbox" checked={form.compact} onChange={e => setForm(f => ({ ...f, compact: e.target.checked }))} />
                </label>
              </div>
            </div>
          )}

          {/* Security */}
          {section === 'Security' && (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
              <div className="text-[15px] font-semibold tracking-[-0.02em]">Security</div>
              <div className="mt-6 grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-xs font-medium text-muted">Current password</label>
                    <Input className="mt-1" type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">New password</label>
                    <Input className="mt-1" type="password" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">Confirm password</label>
                    <Input className="mt-1" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" />
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Button variant="secondary"
                    disabled={!pwForm.current || !pwForm.next || pwForm.next !== pwForm.confirm || changePwM.isPending}
                    onClick={() => changePwM.mutate({ current: pwForm.current, next: pwForm.next })}>
                    {changePwM.isPending ? 'Updating…' : 'Change password'}
                  </Button>
                  {pwForm.next && pwForm.confirm && pwForm.next !== pwForm.confirm && (
                    <span className="text-xs text-red-500 font-medium">Passwords don't match</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {section === 'Notifications' && (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
              <div className="text-[15px] font-semibold tracking-[-0.02em]">Notifications</div>
              <div className="mt-6 space-y-2">
                {[
                  { label: 'Email notifications', key: 'notifyEmail' },
                  { label: 'Quote updates', key: 'notifyQuotes' },
                  { label: 'Order updates', key: 'notifyOrders' },
                  { label: 'AI job alerts', key: 'notifyAI' },
                  { label: 'Showroom activity', key: 'notifyShowroom' },
                  { label: 'Weekly summary', key: 'weeklySummary' },
                ].map(({ label, key }) => (
                  <label key={key} className="flex items-center justify-between rounded-xl bg-[rgb(var(--surface-2))] px-3 py-2 text-sm border border-[rgb(var(--border))]">
                    <span>{label}</span>
                    <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Work Defaults */}
          {section === 'Work Defaults' && (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
              <div className="text-[15px] font-semibold tracking-[-0.02em]">Work Defaults</div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  { label: 'Default quote currency', key: 'defaultCurrency', opts: CURRENCIES },
                  { label: 'Default catalog audience', key: 'defaultCatalogAudience', opts: AUDIENCES },
                  { label: 'Default showroom visibility', key: 'defaultShowroomVisibility', opts: VISIBILITY },
                  { label: 'Reminder preference', key: 'reminderPref', opts: ['Email', 'In-app', 'Both', 'Off'] },
                ].map(({ label, key, opts }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-muted">{label}</label>
                    <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm">
                      {opts.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                ))}
                <label className="flex items-center justify-between rounded-xl bg-[rgb(var(--surface-2))] px-3 py-2 text-sm border border-[rgb(var(--border))]">
                  <span>Auto-save</span>
                  <input type="checkbox" checked={form.autosave} onChange={e => setForm(f => ({ ...f, autosave: e.target.checked }))} />
                </label>
              </div>
            </div>
          )}

          {/* Company Profile */}
          {section === 'Company Profile' && (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
              <div className="flex items-center gap-2 mb-1">
                <Building2 size={16} className="text-brand" />
                <div className="text-[15px] font-semibold tracking-[-0.02em]">Company Profile</div>
              </div>
              <p className="text-xs text-content-tertiary mb-6">Your company name and logo replace "MerchFlow AI" in the sidebar.</p>

              <div className="grid gap-5">
                {/* Company Name */}
                <div>
                  <label className="text-xs font-medium text-muted">Company Name <span className="text-red-400">*</span></label>
                  <Input
                    className="mt-1"
                    value={companyForm.brandName}
                    onChange={e => setCompanyForm(f => ({ ...f, brandName: e.target.value }))}
                    placeholder="e.g. Acme Fashion Group"
                  />
                  <p className="text-[11px] text-content-tertiary mt-1">Replaces "MerchFlow AI" in the sidebar header.</p>
                </div>

                {/* Company Address */}
                <div>
                  <label className="text-xs font-medium text-muted">Company Address</label>
                  <textarea
                    value={companyForm.companyAddress}
                    onChange={e => setCompanyForm(f => ({ ...f, companyAddress: e.target.value }))}
                    placeholder="123 Fashion Ave, Mumbai, Maharashtra 400001"
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2.5 text-sm text-content-primary placeholder:text-content-tertiary outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand resize-none transition-all"
                  />
                </div>

                {/* Company Logo */}
                <div>
                  <label className="text-xs font-medium text-muted">Company Logo</label>
                  <div
                    className="mt-1 relative group border-2 border-dashed border-[rgb(var(--border))] rounded-xl p-5 flex flex-col items-center justify-center gap-3 bg-[rgb(var(--surface-2))] hover:border-brand hover:bg-brand/5 transition-all cursor-pointer"
                    onClick={() => logoFileRef.current?.click()}
                  >
                    <input
                      ref={logoFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleLogoFile(e.target.files[0])}
                    />
                    {logoPreview ? (
                      <div className="relative">
                        <img src={logoPreview} alt="Logo" className="h-14 max-w-[160px] object-contain rounded-lg" />
                        <button
                          className="absolute -top-2 -right-2 bg-white border border-[rgb(var(--border))] rounded-full p-0.5 shadow-sm hover:bg-red-50 transition-colors"
                          onClick={e => { e.stopPropagation(); setLogoPreview(null); setCompanyForm(f => ({ ...f, brandLogo: '' })) }}
                        >
                          <X size={11} className="text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] flex items-center justify-center">
                          <Upload size={18} className="text-content-tertiary group-hover:text-brand transition-colors" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-content-primary">Click to upload logo</p>
                          <p className="text-xs text-content-tertiary mt-0.5">PNG, JPG, SVG — max 5MB</p>
                        </div>
                      </>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-brand border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Live preview */}
                <div className="rounded-xl border border-[rgb(var(--border))] bg-app-sidebar p-4">
                  <p className="text-[10px] font-medium text-content-tertiary uppercase tracking-wider mb-3">Sidebar Preview</p>
                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="h-8 w-8 rounded-md object-contain bg-white border border-[rgb(var(--border))] shrink-0 shadow-sm" />
                    ) : (
                      <div className="h-8 w-8 rounded-md bg-brand flex items-center justify-center text-white shrink-0 shadow-sm font-bold text-lg">
                        {companyForm.brandName ? companyForm.brandName[0].toUpperCase() : 'M'}
                      </div>
                    )}
                    <div className="leading-tight">
                      <div className="text-[15px] font-semibold text-content-primary">{companyForm.brandName || 'MerchFlow AI'}</div>
                      {companyForm.brandName
                        ? <div className="text-[10px] text-content-tertiary mt-0.5">Powered by MerchFlow AI</div>
                        : <div className="text-[11px] text-content-tertiary mt-0.5 capitalize">{user?.role?.toLowerCase()}</div>
                      }
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => companyM.mutate(companyForm)}
                  disabled={companyM.isPending || !companyForm.brandName.trim()}
                  className="w-full h-10 font-semibold"
                >
                  {companyM.isPending ? 'Saving…' : 'Save Company Profile'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
