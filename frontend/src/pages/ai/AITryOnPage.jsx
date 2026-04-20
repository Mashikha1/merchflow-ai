import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '../../components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { UploadDropzone } from '../../components/UploadDropzone'
import { CompareSlider } from '../../components/CompareSlider'
import { aiService } from '../../services/aiService'
import { productService } from '../../services/productService'

const MODEL_PRESETS = [
  {
    id: 'm1',
    name: 'Studio — Neutral',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=900',
    note: 'Clean background, front pose.',
  },
  {
    id: 'm2',
    name: 'Lifestyle — Street',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=900',
    note: 'Natural light, casual stance.',
  },
  {
    id: 'm3',
    name: 'Editorial — Contrast',
    url: 'https://images.unsplash.com/photo-1520975732130-4bbf6a8a2ee0?auto=format&fit=crop&q=80&w=900',
    note: 'High contrast, dramatic pose.',
  },
]

function qualityWarnings({ garmentUrl, personUrl }) {
  const warnings = []
  if (!garmentUrl) warnings.push('Add a garment image (flat lay / ghost mannequin works best).')
  if (!personUrl) warnings.push('Add a person/model image or choose a preset.')
  return warnings
}

export function AITryOnPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [step, setStep] = useState(1)

  const [selectedProductId, setSelectedProductId] = useState(null)
  const [garmentUrl, setGarmentUrl] = useState('')
  const [personUrl, setPersonUrl] = useState(MODEL_PRESETS[0].url)
  const [consent, setConsent] = useState(true)
  const [quality, setQuality] = useState('hd')
  const [variations, setVariations] = useState(2)
  const [activeJobId, setActiveJobId] = useState(null)

  const productsQ = useQuery({
    queryKey: ['products'],
    queryFn: productService.getProducts,
  })

  const jobQ = useQuery({
    queryKey: ['ai', 'job', activeJobId],
    enabled: !!activeJobId,
    queryFn: () => aiService.getJob(activeJobId),
    refetchInterval: (q) => {
      const s = q.state.data?.status
      return s === 'completed' || s === 'failed' || s === 'cancelled' ? false : 1200
    },
  })

  const selectedProduct = useMemo(() => {
    const list = productsQ.data || []
    return list.find((p) => p.id === selectedProductId) || null
  }, [productsQ.data, selectedProductId])

  const warnings = qualityWarnings({ garmentUrl, personUrl })
  const canProceed = warnings.length === 0

  const startJob = async () => {
    if (!consent) {
      toast.error('Consent required', {
        description: 'Please confirm you have rights to use uploaded human photos.',
      })
      return
    }
    try {
      const job = await aiService.createTryOn({
        inputProductId: selectedProductId,
        garmentUrl,
        personUrl,
        meta: { consent, quality, variations },
      })
      setActiveJobId(job.id)
      setStep(4)
      toast.message('Queued', { description: 'Try‑on job created.' })
      qc.invalidateQueries({ queryKey: ['ai', 'jobs'] })
    } catch {
      toast.error('Could not start job')
    }
  }

  const outputs = jobQ.data?.outputs || []
  const primaryOutput = outputs[0]?.url

  return (
    <div className="space-y-6">
      <PageHeader
        title="Virtual Try‑On"
        subtitle="Kolors-style workflow: garment image + person image → async job → approvals → save/publish."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/ai/jobs')}>
              AI Jobs
            </Button>
            <Button variant="secondary" onClick={() => navigate('/ai')}>
              AI Studio
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-5">
        {[
          { n: 1, label: 'Garment' },
          { n: 2, label: 'Model' },
          { n: 3, label: 'Settings' },
          { n: 4, label: 'Generate' },
          { n: 5, label: 'Results' },
        ].map((s) => (
          <button
            key={s.n}
            onClick={() => setStep(s.n)}
            className={`rounded-2xl border px-4 py-3 text-left transition ${step === s.n
              ? 'border-[rgba(var(--accent),0.25)] bg-[rgba(var(--accent),0.10)]'
              : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-muted))]'
              }`}
          >
            <div className="text-xs text-muted">Step {s.n}</div>
            <div className="text-sm font-semibold">{s.label}</div>
          </button>
        ))}
      </div>

      {step === 1 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Garment image</CardTitle>
              <CardDescription>
                Upload a flat lay / ghost mannequin, or select from your product catalog.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <UploadDropzone
                accept={{ 'image/*': [] }}
                maxFiles={1}
                helper={garmentUrl ? 'Garment image selected' : 'Upload garment image'}
                onFiles={(files) => {
                  const f = files?.[0]
                  if (!f) return
                  const url = URL.createObjectURL(f)
                  setGarmentUrl(url)
                  toast.success('Garment uploaded')
                }}
              />

              <div className="rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Select from catalog</div>
                    <div className="mt-1 text-sm text-muted">
                      Picks a product and uses its primary mock image (demo).
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => toast.message('Tip', { description: 'Use the dropdown below to choose a product.' })}
                  >
                    How it works
                  </Button>
                </div>

                <div className="mt-4">
                  {productsQ.isLoading ? (
                    <Skeleton className="h-10" />
                  ) : (
                    <select
                      value={selectedProductId || ''}
                      onChange={(e) => {
                        const id = e.target.value || null
                        setSelectedProductId(id)
                        const p = (productsQ.data || []).find((x) => x.id === id)
                        if (p) {
                          // demo “garment” image: pick a stable unsplash URL by SKU
                          const demoUrl =
                            p.id === 'prod_4'
                              ? 'https://images.unsplash.com/photo-1520975958225-5d5062c5988a?auto=format&fit=crop&q=80&w=900'
                              : 'https://images.unsplash.com/photo-1520975741975-bc1fe9b23c5c?auto=format&fit=crop&q=80&w=900'
                          setGarmentUrl(demoUrl)
                          toast.success('Garment selected', { description: p.name })
                        }
                      }}
                      className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]"
                    >
                      <option value="">Choose a product…</option>
                      {(productsQ.data || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {garmentUrl ? (
                <div className="overflow-hidden rounded-[var(--radius)] border border-[rgb(var(--border))]">
                  <img src={garmentUrl} alt="Garment preview" className="h-72 w-full object-cover" />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Input preview</CardTitle>
              <CardDescription>Quality checks and next steps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {warnings.length ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                  <div className="font-semibold">Quality warnings</div>
                  <ul className="mt-2 list-disc pl-5 text-muted">
                    {warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                  <div className="font-semibold">Ready</div>
                  <div className="mt-1 text-muted">
                    Inputs look good. Continue to model selection.
                  </div>
                </div>
              )}

              <Button className="w-full" disabled={!canProceed} title={!canProceed ? warnings[0] : ''} onClick={() => setStep(2)}>
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Person / model image</CardTitle>
              <CardDescription>
                Upload a person image or choose a preset (pose/background).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <UploadDropzone
                accept={{ 'image/*': [] }}
                maxFiles={1}
                helper="Upload person/model image (requires consent)"
                onFiles={(files) => {
                  const f = files?.[0]
                  if (!f) return
                  const url = URL.createObjectURL(f)
                  setPersonUrl(url)
                  toast.success('Person image uploaded')
                }}
              />

              <div className="grid gap-3 md:grid-cols-3">
                {MODEL_PRESETS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPersonUrl(m.url)}
                    className={`overflow-hidden rounded-[var(--radius)] border text-left transition ${personUrl === m.url
                      ? 'border-[rgba(var(--accent),0.35)] ring-2 ring-[rgba(var(--accent),0.18)]'
                      : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-muted))]'
                      }`}
                  >
                    <img src={m.url} alt={m.name} className="h-40 w-full object-cover" />
                    <div className="p-3">
                      <div className="text-sm font-semibold">{m.name}</div>
                      <div className="mt-1 text-xs text-muted">{m.note}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Consent</CardTitle>
              <CardDescription>Required for uploaded human photos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I confirm I have the rights and consent to use the uploaded person/model image for AI generation.
                </span>
              </label>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button className="w-full" disabled={!personUrl} title={!personUrl ? 'Upload a person/model image first' : ''} onClick={() => setStep(3)}>
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Generation settings</CardTitle>
              <CardDescription>
                Keep it simple: quality + number of outputs. (Kolors is image-first.)
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted">Quality</label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]"
                >
                  <option value="hd">High definition</option>
                  <option value="standard">Standard (faster)</option>
                </select>
                <div className="mt-2 text-xs text-muted">
                  HD yields better fabric edges; Standard is quicker for iteration.
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">Outputs</label>
                <select
                  value={variations}
                  onChange={(e) => setVariations(Number(e.target.value))}
                  className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                </select>
                <div className="mt-2 text-xs text-muted">
                  Generate multiple variations to quickly approve the best.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Generate</CardTitle>
              <CardDescription>Creates an async job.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3 text-sm">
                <div className="font-semibold">Inputs</div>
                <div className="mt-1 text-muted">
                  Garment: {garmentUrl ? '✓' : '—'} • Person: {personUrl ? '✓' : '—'}
                </div>
              </div>
              <Button className="w-full" disabled={!canProceed} title={!canProceed ? 'Complete previous steps first' : ''} onClick={startJob}>
                Generate try‑on
              </Button>
              <Button className="w-full" variant="secondary" onClick={() => setStep(2)}>
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {step === 4 ? (
        <Card>
          <CardContent className="p-8">
            {!activeJobId ? (
              <div className="text-sm text-muted">No job yet. Go back and generate.</div>
            ) : jobQ.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-3" />
                <Skeleton className="h-3" />
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold">Generating…</div>
                      <div className="text-sm text-muted">
                        Job <span className="font-mono text-xs">{activeJobId}</span>
                      </div>
                    </div>
                    <Badge variant="warning">
                      {jobQ.data.status} • {jobQ.data.progress}%
                    </Badge>
                  </div>
                  <div className="h-3 w-full rounded-full bg-[rgb(var(--bg-muted))] overflow-hidden border border-[rgb(var(--border))]">
                    <div
                      className="h-full bg-[rgb(var(--accent))]"
                      style={{ width: `${jobQ.data.progress || 0}%` }}
                    />
                  </div>
                  <div className="text-sm text-muted">
                    We’re aligning garment geometry and blending lighting contours (mocked).
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="overflow-hidden rounded-[var(--radius)] border border-[rgb(var(--border))]">
                      <img src={garmentUrl} alt="Garment" className="h-52 w-full object-cover" />
                    </div>
                    <div className="overflow-hidden rounded-[var(--radius)] border border-[rgb(var(--border))]">
                      <img src={personUrl} alt="Person" className="h-52 w-full object-cover" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <CardTitle>Job states</CardTitle>
                  <div className="text-sm text-muted">
                    queued → processing → completed / failed
                  </div>
                  {jobQ.data.status === 'completed' ? (
                    <Button className="w-full" onClick={() => setStep(5)}>
                      View results
                    </Button>
                  ) : jobQ.data.status === 'failed' ? (
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={async () => {
                        await aiService.retryJob(activeJobId)
                        toast.message('Retry queued')
                        qc.invalidateQueries({ queryKey: ['ai', 'jobs'] })
                      }}
                    >
                      Retry
                    </Button>
                  ) : (
                    <Button className="w-full" variant="secondary" onClick={() => navigate('/ai/jobs')}>
                      Open jobs
                    </Button>
                  )}
                  <Button
                    className="w-full"
                    variant="ghost"
                    onClick={() => {
                      setStep(1)
                      setActiveJobId(null)
                      toast.message('Reset', { description: 'Start a new generation.' })
                    }}
                  >
                    Start over
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {step === 5 ? (
        <div className="space-y-4">
          {!activeJobId ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted">
                No results yet. Generate a job first.
              </CardContent>
            </Card>
          ) : jobQ.isLoading ? (
            <Skeleton className="h-80" />
          ) : jobQ.data.status !== 'completed' ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-semibold">Not completed</div>
                <div className="mt-1 text-sm text-muted">
                  Status: {jobQ.data.status}. Go back to Generate.
                </div>
                <div className="mt-4">
                  <Button variant="secondary" onClick={() => setStep(4)}>
                    Back to job
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <CompareSlider beforeUrl={personUrl} afterUrl={primaryOutput} />

                <Card>
                  <CardHeader>
                    <CardTitle>Results</CardTitle>
                    <CardDescription>
                      Approve the best output, favorite it, and save it to Media.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      {outputs.map((o) => (
                        <div key={o.id} className="rounded-[var(--radius)] border border-[rgb(var(--border))] overflow-hidden">
                          <img src={o.url} alt="Output" className="h-48 w-full object-cover" />
                          <div className="p-3 flex flex-wrap gap-2 items-center justify-between">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={o.favorite ? 'primary' : 'secondary'}
                                onClick={async () => {
                                  await aiService.updateOutput({ jobId: activeJobId, outputId: o.id, patch: { favorite: !o.favorite } })
                                  toast.success(o.favorite ? 'Unfavorited' : 'Favorited')
                                  jobQ.refetch()
                                  qc.invalidateQueries({ queryKey: ['ai', 'jobs'] })
                                }}
                              >
                                {o.favorite ? 'Favorited' : 'Favorite'}
                              </Button>
                              <Button
                                size="sm"
                                variant={o.approved ? 'primary' : 'secondary'}
                                onClick={async () => {
                                  await aiService.updateOutput({ jobId: activeJobId, outputId: o.id, patch: { approved: !o.approved } })
                                  toast.success(o.approved ? 'Approval removed' : 'Approved')
                                  jobQ.refetch()
                                  qc.invalidateQueries({ queryKey: ['ai', 'jobs'] })
                                }}
                              >
                                {o.approved ? 'Approved' : 'Approve'}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={async () => {
                                await aiService.updateOutput(activeJobId, o.id, { approved: false, favorite: false })
                                toast.success('Rejected')
                                jobQ.refetch()
                              }}>
                                Reject
                              </Button>
                            </div>
                            <Badge variant="ai">AI</Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          await startJob()
                        }}
                      >
                        Regenerate
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setVariations(4)
                          toast.success('Variations set to 4', { description: 'Generate again to create more outputs.' })
                        }}
                      >
                        Create variations
                      </Button>
                      <Button onClick={() => toast.success('Saved to media', { description: 'Open Media Library to see it.' })}>
                        Save to Media Library
                      </Button>
                      <Button variant="secondary" onClick={() => toast.success('Attached to product')}>
                        Attach to product
                      </Button>
                      <Button variant="secondary" onClick={() => toast.success('Added to catalog')}>
                        Add to catalog
                      </Button>
                      <Button variant="secondary" onClick={() => toast.success('Publish to showroom')}>
                        Publish to showroom
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Context</CardTitle>
                  <CardDescription>Inputs + product binding.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
                    <div className="text-xs text-muted">Product</div>
                    <div className="mt-1 text-sm font-semibold">
                      {selectedProduct ? selectedProduct.name : 'Not linked'}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {selectedProduct ? selectedProduct.sku : 'Select a product to attach assets.'}
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full" onClick={() => navigate('/products')}>
                    Browse products
                  </Button>
                  <Button className="w-full" onClick={() => setStep(1)}>
                    New try‑on
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
