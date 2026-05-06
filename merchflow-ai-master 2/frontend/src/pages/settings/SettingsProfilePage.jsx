import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../components/PageHeader'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'

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
          {['Profile', 'Preferences', 'Security', 'Notifications', 'Work Defaults'].map((s) => (
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
        </div>
      </div>
    </div>
  )
}
