import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '../../components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ErrorState'
import { aiService } from '../../services/aiService'

function statusVariant(status) {
  if (status === 'completed') return 'success'
  if (status === 'failed' || status === 'cancelled') return 'danger'
  if (status === 'processing' || status === 'queued') return 'warning'
  return 'default'
}

export function AIJobsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const jobsQ = useQuery({
    queryKey: ['ai', 'jobs'],
    queryFn: aiService.listJobs,
    refetchInterval: 2500,
  })

  const rows = useMemo(() => jobsQ.data || [], [jobsQ.data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Jobs"
        subtitle="Async job system for Virtual Try‑On. Filter, retry failures, and open results."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              qc.invalidateQueries({ queryKey: ['ai', 'jobs'] })
              toast.message('Refreshing…')
            }}
          >
            Refresh
          </Button>
        }
      />

      {jobsQ.isError ? (
        <ErrorState
          title="Couldn’t load jobs"
          description="Check your connection and try again."
          onRetry={() => jobsQ.refetch()}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobsQ.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : rows.length === 0 ? (
              <div className="text-sm text-muted">No jobs yet.</div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted">
                    <tr className="border-b border-[rgb(var(--border))]">
                      <th className="py-2 text-left font-medium">Job ID</th>
                      <th className="py-2 text-left font-medium">Type</th>
                      <th className="py-2 text-left font-medium">Status</th>
                      <th className="py-2 text-left font-medium">Progress</th>
                      <th className="py-2 text-left font-medium">Created</th>
                      <th className="py-2 text-left font-medium">Duration</th>
                      <th className="py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((j) => (
                      <tr
                        key={j.id}
                        className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-muted))]"
                      >
                        <td className="py-3 pr-4 font-mono text-xs">{j.id}</td>
                        <td className="py-3 pr-4">{j.type}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={statusVariant(j.status)}>{j.status}</Badge>
                          {j.error ? (
                            <div className="mt-1 text-xs text-muted">
                              {j.error}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-28 rounded-full bg-[rgb(var(--bg-muted))] overflow-hidden border border-[rgb(var(--border))]">
                              <div
                                className="h-full bg-[rgb(var(--accent))]"
                                style={{ width: `${j.progress || 0}%` }}
                              />
                            </div>
                            <div className="text-xs text-muted">{j.progress || 0}%</div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted">
                          {new Date(j.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted">
                          {j.durationMs ? `${Math.round(j.durationMs / 1000)}s` : '—'}
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex gap-2">
                            {j.status === 'failed' ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={async () => {
                                  await aiService.retryJob(j.id)
                                  toast.success('Retry queued')
                                  qc.invalidateQueries({ queryKey: ['ai', 'jobs'] })
                                }}
                              >
                                Retry
                              </Button>
                            ) : null}
                            {j.status === 'completed' ? (
                              <Button
                                size="sm"
                                onClick={() => navigate('/ai/try-on')}
                              >
                                Open
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toast.message('Job is still running')}
                              >
                                Details
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
