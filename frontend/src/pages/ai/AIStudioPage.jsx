import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ErrorState'
import { aiService } from '../../services/aiService'
import { productService } from '../../services/productService'

export function AIStudioPage() {
  const navigate = useNavigate()

  const jobsQ = useQuery({
    queryKey: ['ai', 'jobs'],
    queryFn: aiService.listJobs,
    refetchInterval: 2500,
  })

  const productsQ = useQuery({
    queryKey: ['products'],
    queryFn: productService.getProducts,
  })

  const derived = useMemo(() => {
    const jobs = jobsQ.data || []
    const pending = jobs.filter((j) => j.status === 'queued' || j.status === 'processing')
    const completed = jobs.filter((j) => j.status === 'completed')
    const failed = jobs.filter((j) => j.status === 'failed')
    const approvedAssets = jobs.flatMap((j) => j.outputs || []).filter((o) => o.approved)

    const products = productsQ.data || []
    const readyForTryOn = products.filter((p) => (p.aiAssets || 0) === 0 && p.status !== 'Draft')
    const missingGarmentImages = products.filter((p) => (p.aiAssets || 0) === 0 && p.status === 'Draft')
    return {
      pending,
      completed,
      failed,
      approvedAssets,
      readyForTryOn,
      missingGarmentImages,
    }
  }, [jobsQ.data, productsQ.data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Studio"
        subtitle="Image-first workflows for Kolors Virtual Try‑On. No prompt-heavy tools—just garment + person → results → approvals."
        actions={
          <>
            <Button onClick={() => navigate('/ai/try-on')}>New Try‑On</Button>
            <Button variant="secondary" onClick={() => navigate('/ai/jobs')}>
              View Jobs
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-5">
        {[
          { label: 'Virtual Try‑On', desc: 'Garment + model → results', to: '/ai/try-on' },
          { label: 'AI Jobs', desc: 'Queued, processing, retry', to: '/ai/jobs' },
          { label: 'Approved Assets', desc: 'Ready to publish', to: '/media' },
          { label: 'Model Presets', desc: 'Pose + background sets', to: '/ai/try-on' },
          { label: 'Settings', desc: 'Consent + defaults', to: '/settings/ai' },
        ].map((c) => (
          <Card key={c.label} className="cursor-pointer hover:opacity-95" onClick={() => navigate(c.to)}>
            <CardHeader>
              <CardTitle>{c.label}</CardTitle>
              <CardDescription>{c.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted">Open →</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {jobsQ.isError ? (
        <ErrorState
          title="Couldn’t load AI Studio"
          description="Mock service error. Try again."
          onRetry={() => jobsQ.refetch()}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Queue</CardTitle>
              <CardDescription>Pending try‑on jobs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {jobsQ.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : derived.pending.length === 0 ? (
                <div className="text-sm text-muted">
                  No pending jobs. Start a new try‑on.
                </div>
              ) : (
                derived.pending.slice(0, 4).map((j) => (
                  <div
                    key={j.id}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">Try‑On</div>
                      <Badge variant="warning">
                        {j.status} • {j.progress}%
                      </Badge>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-[rgb(var(--bg-muted))] overflow-hidden">
                      <div
                        className="h-full bg-[rgb(var(--accent))]"
                        style={{ width: `${j.progress || 0}%` }}
                      />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => navigate('/ai/jobs')}>
                        Open
                      </Button>
                      <Button size="sm" onClick={() => navigate('/ai/try-on')}>
                        Create another
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approvals</CardTitle>
              <CardDescription>Approved assets ready to save/publish.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {jobsQ.isLoading ? (
                <Skeleton className="h-24" />
              ) : derived.approvedAssets.length === 0 ? (
                <div className="text-sm text-muted">
                  Nothing approved yet. Approve a try‑on output to unlock “Save to Media”.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {derived.approvedAssets.slice(0, 4).map((o) => (
                    <div key={o.id} className="overflow-hidden rounded-2xl border border-[rgb(var(--border))]">
                      <img src={o.url} alt="Approved asset" className="h-28 w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              <Button variant="secondary" onClick={() => navigate('/media')}>
                Open Media Library
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended</CardTitle>
              <CardDescription>What to generate next.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {productsQ.isLoading ? (
                <Skeleton className="h-28" />
              ) : (
                <>
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Products ready for try‑on</div>
                      <Badge variant="ai">{derived.readyForTryOn.length}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted">
                      Active products with enough media to start.
                    </div>
                    <div className="mt-3">
                      <Button size="sm" onClick={() => navigate('/ai/try-on')}>
                        Start Try‑On
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Failed jobs needing retry</div>
                      <Badge variant={derived.failed.length ? 'danger' : 'default'}>
                        {derived.failed.length}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted">
                      Typically image quality or consent issues.
                    </div>
                    <div className="mt-3">
                      <Button size="sm" variant="secondary" onClick={() => navigate('/ai/jobs')}>
                        Review jobs
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
