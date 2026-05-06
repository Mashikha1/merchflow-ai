import { useState, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import api from '../../lib/api'

const BACKGROUNDS = [
  { id: 'white', label: 'Studio White', icon: '⬜', desc: 'Clean e-commerce background' },
  { id: 'outdoor', label: 'Outdoor', icon: '🌿', desc: 'Natural outdoor setting' },
  { id: 'editorial', label: 'Editorial', icon: '📸', desc: 'Magazine-style editorial' },
  { id: 'studio', label: 'Studio Dark', icon: '⬛', desc: 'Dramatic dark studio' },
]

export function AIBackgroundsPage() {
  const [imageUrl, setImageUrl] = useState('')
  const [selectedBg, setSelectedBg] = useState('white')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const fileRef = useRef(null)

  const productsQ = useQuery({ queryKey: ['products'], queryFn: () => api('/products') })

  const generateM = useMutation({
    mutationFn: (data) => api('/ai/backgrounds', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => toast.success('Background job started! Check AI Jobs for results.')
  })

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('files', file)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/media/upload`, {
        method: 'POST', body: formData,
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('merchflow_auth') || '{}')?.state?.token}` }
      })
      const data = await res.json()
      if (data[0]?.url) { setImageUrl(data[0].url); toast.success('Image uploaded') }
    } catch { toast.error('Upload failed') }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-content-primary">AI Background Generation</h1>
        <p className="text-sm text-content-secondary mt-1">Place your product on studio-quality backgrounds with AI.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Product Image</CardTitle><CardDescription>Upload your product flat lay or ghost mannequin shot.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Paste image URL or upload" className="flex-1" />
                <input type="file" ref={fileRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                <Button variant="secondary" onClick={() => fileRef.current?.click()}>Upload</Button>
              </div>
              {imageUrl && (
                <div className="rounded-xl overflow-hidden border border-border-subtle bg-[#f5f5f5]">
                  <img src={imageUrl} alt="Product" className="w-full h-64 object-contain" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Choose Background</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {BACKGROUNDS.map(bg => (
                <button key={bg.id} onClick={() => setSelectedBg(bg.id)}
                  className={`p-4 rounded-xl border text-left transition ${selectedBg === bg.id ? 'border-brand bg-brand/5 ring-1 ring-brand' : 'border-border-subtle hover:bg-app-card-muted'}`}>
                  <div className="text-2xl mb-1">{bg.icon}</div>
                  <div className="text-sm font-semibold text-content-primary">{bg.label}</div>
                  <div className="text-xs text-content-tertiary">{bg.desc}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Link to Product (optional)</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-[200px] overflow-auto">
              {(productsQ.data || []).slice(0, 8).map(p => (
                <button key={p.id} onClick={() => setSelectedProduct(p)}
                  className={`w-full text-left rounded-lg border p-2.5 text-sm transition ${selectedProduct?.id === p.id ? 'border-brand bg-brand/5' : 'border-border-subtle hover:bg-app-card-muted'}`}>
                  <span className="font-medium">{p.name}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Button className="w-full" disabled={!imageUrl || generateM.isPending}
            onClick={() => generateM.mutate({ garmentUrl: imageUrl, background: selectedBg, productId: selectedProduct?.id })}>
            {generateM.isPending ? '🎨 Generating…' : '🎨 Generate Background'}
          </Button>
        </div>

        <div className="space-y-4">
          {generateM.data ? (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <div className="text-4xl">✅</div>
                <h3 className="text-lg font-semibold text-content-primary">Background Job Created</h3>
                <p className="text-sm text-content-secondary">Job ID: <span className="font-mono text-xs">{generateM.data.id}</span></p>
                <p className="text-sm text-content-secondary">Check <a href="/ai/jobs" className="text-brand hover:underline">AI Jobs</a> for results.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center min-h-[500px] rounded-xl border-2 border-dashed border-border-subtle">
              <div className="text-center space-y-2">
                <div className="text-4xl">🎨</div>
                <p className="text-sm text-content-secondary">Upload a product image and choose a background to get started.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
