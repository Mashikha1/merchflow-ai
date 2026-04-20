import { useMemo, useRef, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { toast } from 'sonner'

const LANGS = ['English', 'Spanish', 'French', 'German']
const TIMEZONES = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Singapore']
const THEMES = ['System', 'Light', 'Dark']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY']
const AUDIENCES = ['Public', 'Invite Only', 'Private']
const VISIBILITY = ['Public', 'Unlisted', 'Private']
const LANDING = ['Dashboard', 'Products', 'Catalogs', 'Showrooms', 'Quotes', 'Orders', 'Analytics', 'Customers']
const DATEFMTS = ['MMM d, yyyy', 'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd']

export function SettingsProfilePage() {
  const initial = useMemo(() => ({
    name: 'Aisha Rahman',
    email: 'aisha@aurorastudio.co',
    role: 'Admin',
    title: 'Merchandising Lead',
    phone: '+1 (212) 555‑0186',
    photo: '',
    landing: 'Dashboard',
    language: 'English',
    tz: 'America/New_York',
    dateFmt: 'MMM d, yyyy',
    theme: 'System',
    compact: false,
    twofa: true,
    notifyEmail: true,
    notifyQuotes: true,
    notifyOrders: true,
    notifyAI: true,
    notifyShowroom: false,
    weeklySummary: true,
    defaultCurrency: 'USD',
    defaultCatalogAudience: 'Invite Only',
    defaultShowroomVisibility: 'Unlisted',
    autosave: true,
    reminderPref: 'Email',
  }), [])

  const [form, setForm] = useState(initial)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [section, setSection] = useState('Profile')
  const fileRef = useRef(null)

  const actions = (
    <>
      <Button
        onClick={() => {
          toast.success('Profile saved', { description: 'Your changes have been stored locally for demo.' })
        }}
      >
        Save Changes
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          setForm(initial)
          setAvatarPreview('')
          toast.message('Changes discarded')
        }}
      >
        Cancel
      </Button>
    </>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your account details and personal preferences"
        actions={actions}
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2">
          {['Profile','Preferences','Security','Notifications','Work Defaults'].map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm ${section === s ? 'bg-[rgb(var(--bg-muted))] font-semibold' : 'hover:bg-[rgb(var(--bg-muted))]'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="space-y-6">
          {section === 'Profile' ? (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
              <div className="text-[15px] font-semibold tracking-[-0.02em]">Profile</div>
              <div className="mt-6 grid gap-6 md:grid-cols-[160px_1fr]">
                <div>
                  <div className="h-32 w-32 rounded-full bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] overflow-hidden">
                    {avatarPreview ? <img alt="avatar" src={avatarPreview} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" onClick={() => fileRef.current?.click()}>Change photo</Button>
                    <Button variant="ghost" onClick={() => { setAvatarPreview(''); setForm((f)=>({ ...f, photo: '' }))}}>Remove</Button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      const url = URL.createObjectURL(f)
                      setAvatarPreview(url)
                      setForm((val) => ({ ...val, photo: 'uploaded' }))
                    }} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted">Full name</label>
                    <Input className="mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">Email</label>
                    <Input className="mt-1" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">Role</label>
                    <Input className="mt-1" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">Job title</label>
                    <Input className="mt-1" placeholder="Optional" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-muted">Phone number</label>
                    <Input className="mt-1" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {section === 'Preferences' ? (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
              <div className="text-[15px] font-semibold tracking-[-0.02em]">Preferences</div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted">Default landing page</label>
                  <select value={form.landing} onChange={(e) => setForm((f) => ({ ...f, landing: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm">
                    {LANDING.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Language</label>
                  <select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm">
                    {LANGS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Time zone</label>
                  <select value={form.tz} onChange={(e) => setForm((f) => ({ ...f, tz: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm">
                    {TIMEZONES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Date format</label>
                  <select value={form.dateFmt} onChange={(e) => setForm((f) => ({ ...f, dateFmt: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm">
                    {DATEFMTS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Theme</label>
                  <select value={form.theme} onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm">
                    {THEMES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <label className="flex items-center justify-between rounded-xl bg-[rgb(var(--surface-2))] px-3 py-2 text-sm border border-[rgb(var(--border))]">
                  <span>Compact mode</span>
                  <input type="checkbox" checked={form.compact} onChange={(e) => setForm((f) => ({ ...f, compact: e.target.checked }))} />
                </label>
              </div>
            </div>
          ) : null}

          {section === 'Security' ? (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
              <div className="text-[15px] font-semibold tracking-[-0.02em]">Security</div>
              <div className="mt-6 grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-xs font-medium text-muted">Current password</label>
                    <Input className="mt-1" type="password" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">New password</label>
                    <Input className="mt-1" type="password" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">Confirm password</label>
                    <Input className="mt-1" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => toast.success('Password updated')}>Change password</Button>
                  <label className="ml-auto inline-flex items-center gap-2 text-sm rounded-xl bg-[rgb(var(--surface-2))] px-3 py-2 border border-[rgb(var(--border))]">
                    <span>Two‑factor authentication</span>
                    <input type="checkbox" checked={form.twofa} onChange={(e) => setForm((f) => ({ ...f, twofa: e.target.checked }))} />
                  </label>
                </div>
                <div className="mt-2 rounded-2xl border border-[rgb(var(--border))] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted bg-[rgb(var(--surface))]">
                      <tr>
                        <th className="py-2 text-left font-medium px-3">Device</th>
                        <th className="py-2 text-left font-medium px-3">Location</th>
                        <th className="py-2 text-left font-medium px-3">Time</th>
                        <th className="py-2 text-left font-medium px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-[rgb(var(--border))]">
                        <td className="py-2 px-3">MacOS Chrome</td>
                        <td className="py-2 px-3">NY, USA</td>
                        <td className="py-2 px-3">Today 9:42 AM</td>
                        <td className="py-2 px-3">Success</td>
                      </tr>
                      <tr className="border-t border-[rgb(var(--border))]">
                        <td className="py-2 px-3">iPhone Safari</td>
                        <td className="py-2 px-3">NY, USA</td>
                        <td className="py-2 px-3">Yesterday 8:13 PM</td>
                        <td className="py-2 px-3">Success</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {section === 'Notifications' ? (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
              <div className="text-[15px] font-semibold tracking-[-0.02em]">Notifications</div>
              <div className="mt-6 space-y-2">
                <label className="flex items-center justify-between rounded-xl bg-[rgb(var(--surface-2))] px-3 py-2 text-sm border border-[rgb(var(--border))]">
                  <span>Email notifications</span>
                  <input type="checkbox" checked={form.notifyEmail} onChange={(e) => setForm((f) => ({ ...f, notifyEmail: e.target.checked }))} />
                </label>
                <label className="flex items-center justify-between rounded-xl bg-[rgb(var(--surface-2))] px-3 py-2 text-sm border border-[rgb(var(--border))]">
                  <span>Quote updates</span>
                  <input type="checkbox" checked={form.notifyQuotes} onChange={(e) => setForm((f) => ({ ...f, notifyQuotes: e.target.checked }))} />
                </label>
                <label className="flex items-center justify-between rounded-xl bg-[rgb(var(--surface-2))] px-3 py-2 text-sm border border-[rgb(var(--border))]">
                  <span>Order updates</span>
                  <input type="checkbox" checked={form.notifyOrders} onChange={(e) => setForm((f) => ({ ...f, notifyOrders: e.target.checked }))} />
                </label>
                <label className="flex items-center justify-between rounded-xl bg-[rgb(var(--surface-2))] px-3 py-2 text-sm border border-[rgb(var(--border))]">
                  <span>AI job alerts</span>
                  <input type="checkbox" checked={form.notifyAI} onChange={(e) => setForm((f) => ({ ...f, notifyAI: e.target.checked }))} />
                </label>
                <label className="flex items-center justify-between rounded-xl bg-[rgb(var(--surface-2))] px-3 py-2 text-sm border border-[rgb(var(--border))]">
                  <span>Showroom activity</span>
                  <input type="checkbox" checked={form.notifyShowroom} onChange={(e) => setForm((f) => ({ ...f, notifyShowroom: e.target.checked }))} />
                </label>
                <label className="flex items-center justify-between rounded-xl bg-[rgb(var(--surface-2))] px-3 py-2 text-sm border border-[rgb(var(--border))]">
                  <span>Weekly summary</span>
                  <input type="checkbox" checked={form.weeklySummary} onChange={(e) => setForm((f) => ({ ...f, weeklySummary: e.target.checked }))} />
                </label>
              </div>
            </div>
          ) : null}

          {section === 'Work Defaults' ? (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6">
              <div className="text-[15px] font-semibold tracking-[-0.02em]">Work Defaults</div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted">Default quote currency</label>
                  <select value={form.defaultCurrency} onChange={(e) => setForm((f) => ({ ...f, defaultCurrency: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm">
                    {CURRENCIES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Default catalog audience</label>
                  <select value={form.defaultCatalogAudience} onChange={(e) => setForm((f) => ({ ...f, defaultCatalogAudience: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm">
                    {AUDIENCES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Default showroom visibility</label>
                  <select value={form.defaultShowroomVisibility} onChange={(e) => setForm((f) => ({ ...f, defaultShowroomVisibility: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm">
                    {VISIBILITY.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <label className="flex items-center justify-between rounded-xl bg-[rgb(var(--surface-2))] px-3 py-2 text-sm border border-[rgb(var(--border))]">
                  <span>Auto‑save</span>
                  <input type="checkbox" checked={form.autosave} onChange={(e) => setForm((f) => ({ ...f, autosave: e.target.checked }))} />
                </label>
                <div>
                  <label className="text-xs font-medium text-muted">Reminder preference</label>
                  <select value={form.reminderPref} onChange={(e) => setForm((f) => ({ ...f, reminderPref: e.target.value }))} className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm">
                    <option>Email</option>
                    <option>In‑app</option>
                    <option>Both</option>
                    <option>Off</option>
                  </select>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
