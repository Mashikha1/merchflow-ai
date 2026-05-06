import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import api from '../../lib/api'

export function SettingsBrandPage() {
  const [form, setForm] = useState({ brandName: '', brandLogo: '', brandColor: '#C47B2B', brandEmail: '' })

  const profileQ = useQuery({ queryKey: ['profile'], queryFn: () => api('/auth/me') })

  useEffect(() => {
    if (profileQ.data) {
      setForm({
        brandName: profileQ.data.brandName || '',
        brandLogo: profileQ.data.brandLogo || '',
        brandColor: profileQ.data.brandColor || '#C47B2B',
        brandEmail: profileQ.data.brandEmail || ''
      })
    }
  }, [profileQ.data])

  const saveM = useMutation({
    mutationFn: (data) => api('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => toast.success('Brand settings saved!')
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-content-primary">Brand Settings</h1>
        <p className="text-sm text-content-secondary mt-1">Customize how your brand appears on quotes, emails, and catalogs.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Brand Identity</CardTitle><CardDescription>Your brand name and logo appear on quotes, emails, and catalogs.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div><label className="text-sm font-medium text-content-primary">Brand Name</label><Input className="mt-1" value={form.brandName} onChange={e => setForm({ ...form, brandName: e.target.value })} placeholder="Your Brand Name" /></div>
            <div><label className="text-sm font-medium text-content-primary">Logo URL</label><Input className="mt-1" value={form.brandLogo} onChange={e => setForm({ ...form, brandLogo: e.target.value })} placeholder="https://…/logo.png" /></div>
            <div>
              <label className="text-sm font-medium text-content-primary">Brand Color</label>
              <div className="mt-1 flex items-center gap-3">
                <input type="color" value={form.brandColor} onChange={e => setForm({ ...form, brandColor: e.target.value })} className="w-10 h-10 rounded-lg border border-border-subtle cursor-pointer" />
                <Input value={form.brandColor} onChange={e => setForm({ ...form, brandColor: e.target.value })} className="w-32" />
              </div>
            </div>
            <div><label className="text-sm font-medium text-content-primary">Reply-to Email</label><Input className="mt-1" type="email" value={form.brandEmail} onChange={e => setForm({ ...form, brandEmail: e.target.value })} placeholder="hello@yourbrand.com" /></div>
            <Button onClick={() => saveM.mutate(form)} disabled={saveM.isPending}>{saveM.isPending ? 'Saving…' : 'Save Brand Settings'}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Preview</CardTitle><CardDescription>How your brand appears in emails.</CardDescription></CardHeader>
          <CardContent>
            <div className="rounded-xl overflow-hidden border border-border-subtle">
              <div className="p-6" style={{ backgroundColor: form.brandColor }}>
                <div className="flex items-center gap-3">
                  {form.brandLogo && <img src={form.brandLogo} alt="Logo" className="h-8 w-8 rounded object-contain bg-white p-0.5" onError={e => e.target.style.display = 'none'} />}
                  <h2 className="text-white font-bold text-lg">{form.brandName || 'Your Brand'}</h2>
                </div>
              </div>
              <div className="p-6 bg-white space-y-3">
                <p className="text-sm text-gray-600">Hi <strong>Buyer Name</strong>,</p>
                <p className="text-sm text-gray-600">Thank you for your interest. Please find your quote details below.</p>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal</span><span className="font-medium">$1,250.00</span></div>
                  <div className="flex justify-between text-sm mt-1"><span className="text-gray-400">Discount</span><span className="font-medium">-$62.50</span></div>
                  <div className="flex justify-between text-sm mt-2 font-bold border-t pt-2"><span>Total</span><span>$1,187.50</span></div>
                </div>
                <p className="text-xs text-gray-400 pt-4">Sent via {form.brandName || 'MerchFlow AI'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
