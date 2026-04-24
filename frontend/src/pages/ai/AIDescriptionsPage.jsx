import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import api from '../../lib/api'

const TONES = [
  { id: 'professional', label: 'Professional', icon: '💼', desc: 'Formal, precise, B2B-appropriate' },
  { id: 'creative', label: 'Creative', icon: '✨', desc: 'Evocative, storytelling, brand-forward' },
  { id: 'luxury', label: 'Luxury', icon: '👑', desc: 'Elevated, aspirational, premium' },
]

export function AIDescriptionsPage() {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [customContext, setCustomContext] = useState('')

  const productsQ = useQuery({ queryKey: ['products'], queryFn: () => api('/products') })
  const products = productsQ.data || []

  const generateM = useMutation({
    mutationFn: (data) => api('/ai/descriptions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => toast.success('Descriptions generated!')
  })

  const applyM = useMutation({
    mutationFn: ({ productId, description }) => api('/ai/descriptions/apply', { method: 'PATCH', body: JSON.stringify({ productId, description }) }),
    onSuccess: () => toast.success('Description applied to product!')
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-content-primary">AI Product Descriptions</h1>
        <p className="text-sm text-content-secondary mt-1">Generate compelling descriptions with AI — choose from 3 tones and apply with one click.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left: Product Picker */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Select Product</CardTitle><CardDescription>Choose a product to generate descriptions for.</CardDescription></CardHeader>
            <CardContent className="space-y-2 max-h-[400px] overflow-auto">
              {productsQ.isLoading ? <><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></> :
                products.map(p => (
                  <button key={p.id} onClick={() => setSelectedProduct(p)}
                    className={`w-full text-left rounded-xl border p-3 transition ${selectedProduct?.id === p.id ? 'border-brand bg-brand/5' : 'border-border-subtle hover:bg-app-card-muted'}`}>
                    <div className="text-sm font-semibold text-content-primary truncate">{p.name}</div>
                    <div className="text-xs text-content-tertiary">{p.sku} • {p.category?.name || 'Uncategorized'}</div>
                  </button>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <label className="text-sm font-medium text-content-primary">Additional Context (optional)</label>
              <textarea className="mt-1 w-full rounded-lg border border-border-subtle px-3 py-2 text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-brand" value={customContext} onChange={e => setCustomContext(e.target.value)} placeholder="e.g. Target audience: upscale boutiques…" />
            </CardContent>
          </Card>

          <Button className="w-full" disabled={!selectedProduct || generateM.isPending} onClick={() => generateM.mutate({ productId: selectedProduct.id, customContext })}>
            {generateM.isPending ? '✨ Generating…' : '✨ Generate Descriptions'}
          </Button>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {!generateM.data && !generateM.isPending && (
            <div className="flex items-center justify-center min-h-[300px] rounded-xl border-2 border-dashed border-border-subtle">
              <div className="text-center space-y-2">
                <div className="text-4xl">📝</div>
                <p className="text-sm text-content-secondary">Select a product and click Generate to see AI-written descriptions.</p>
              </div>
            </div>
          )}

          {generateM.isPending && (
            <div className="space-y-4">
              {TONES.map(t => <Skeleton key={t.id} className="h-40 rounded-xl" />)}
            </div>
          )}

          {generateM.data?.variations?.map((v, i) => {
            const tone = TONES.find(t => t.id === v.tone) || TONES[i]
            return (
              <Card key={v.tone}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{tone.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-content-primary">{tone.label}</div>
                        <div className="text-xs text-content-tertiary">{tone.desc}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(v.text); toast.success('Copied!') }}>Copy</Button>
                      <Button size="sm" onClick={() => applyM.mutate({ productId: selectedProduct.id, description: v.text })} disabled={applyM.isPending}>
                        Apply
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-content-secondary leading-relaxed whitespace-pre-wrap">{v.text}</p>
                </CardContent>
              </Card>
            )
          })}

          {selectedProduct?.description && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">Current</Badge>
                  <span className="text-xs text-content-tertiary">Existing product description</span>
                </div>
                <p className="text-sm text-content-secondary italic">{selectedProduct.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
