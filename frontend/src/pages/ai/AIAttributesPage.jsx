import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import api from '../../lib/api'

export function AIAttributesPage() {
  const [imageUrl, setImageUrl] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const fileRef = useRef(null)

  const productsQ = useQuery({ queryKey: ['products'], queryFn: () => api('/products') })
  const products = productsQ.data || []

  const extractM = useMutation({
    mutationFn: (data) => api('/ai/attributes', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => toast.success('Attributes extracted!')
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

  const attrs = extractM.data?.attributes || {}
  const attrEntries = Object.entries(attrs).filter(([k]) => k !== 'tags')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-content-primary">AI Attribute Extraction</h1>
        <p className="text-sm text-content-secondary mt-1">Upload a product image — AI identifies color, material, pattern, occasion, and more.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Product Image</CardTitle><CardDescription>Upload or paste an image URL for analysis.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://… or upload below" className="flex-1" />
                <input type="file" ref={fileRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                <Button variant="secondary" onClick={() => fileRef.current?.click()}>Upload</Button>
              </div>
              {imageUrl && (
                <div className="rounded-xl overflow-hidden border border-border-subtle">
                  <img src={imageUrl} alt="Product" className="w-full h-64 object-contain bg-gray-50" onError={e => { e.target.src = ''; e.target.alt = 'Invalid URL' }} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Link to Product (optional)</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-[240px] overflow-auto">
              {products.slice(0, 10).map(p => (
                <button key={p.id} onClick={() => setSelectedProduct(p)}
                  className={`w-full text-left rounded-lg border p-2.5 text-sm transition ${selectedProduct?.id === p.id ? 'border-brand bg-brand/5' : 'border-border-subtle hover:bg-app-card-muted'}`}>
                  <span className="font-medium">{p.name}</span> <span className="text-content-tertiary">— {p.sku}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Button className="w-full" disabled={!imageUrl || extractM.isPending} onClick={() => extractM.mutate({ imageUrl, productId: selectedProduct?.id })}>
            {extractM.isPending ? '🔍 Analyzing…' : '🔍 Extract Attributes'}
          </Button>
        </div>

        <div className="space-y-4">
          {!extractM.data && !extractM.isPending && (
            <div className="flex items-center justify-center min-h-[400px] rounded-xl border-2 border-dashed border-border-subtle">
              <div className="text-center space-y-2">
                <div className="text-4xl">🏷️</div>
                <p className="text-sm text-content-secondary">Upload an image and click Extract to see AI-detected attributes.</p>
              </div>
            </div>
          )}

          {extractM.isPending && <><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></>}

          {extractM.data && (
            <>
              <Card>
                <CardHeader><CardTitle>Extracted Attributes</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {attrEntries.map(([key, value]) => (
                      <div key={key} className="p-3 rounded-xl border border-border-subtle bg-app-card-muted">
                        <div className="text-xs text-content-tertiary capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                        <div className="text-sm font-semibold text-content-primary mt-0.5">{value || '—'}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {attrs.tags?.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="text-xs text-content-tertiary mb-2">Suggested Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {attrs.tags.map(t => (
                        <span key={t} className="px-2.5 py-1 rounded-full bg-brand/10 text-brand text-xs font-medium">{t}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
