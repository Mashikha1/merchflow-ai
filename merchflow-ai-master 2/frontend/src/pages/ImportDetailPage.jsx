import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import api from '../lib/api'

export function ImportDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: imp, isLoading } = useQuery({
    queryKey: ['imports', id],
    queryFn: () => api(`/imports/${id}`)
  })

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-48" /><Skeleton className="h-64" /></div>
  if (!imp) return <div className="p-8 text-center text-content-secondary">Import not found</div>

  const statusColors = { Completed: 'success', Processing: 'warning', Failed: 'error' }
  const errors = Array.isArray(imp.errorLog) ? imp.errorLog : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-content-primary">{imp.fileName}</h1>
          <p className="text-sm text-content-secondary mt-1">Import via {imp.source} • {new Date(imp.createdAt).toLocaleString()}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/imports')}>Back to Imports</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Status', value: <Badge variant={statusColors[imp.status] || 'default'}>{imp.status}</Badge> },
          { label: 'Total Rows', value: imp.totalRows ?? '—' },
          { label: 'Successful', value: <span className="text-emerald-600 font-bold">{imp.successRows}</span> },
          { label: 'Failed', value: <span className={imp.failedRows > 0 ? 'text-red-500 font-bold' : ''}>{imp.failedRows}</span> },
        ].map(m => (
          <Card key={m.label}>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-content-tertiary mb-1">{m.label}</div>
              <div className="text-xl font-bold text-content-primary">{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {imp.successRows > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">✅</div>
              <div>
                <div className="text-sm font-semibold text-content-primary">{imp.successRows} products imported successfully</div>
                <div className="text-xs text-content-tertiary">Products were created or updated by SKU matching.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Errors ({errors.length})</CardTitle>
            <CardDescription>These rows could not be imported. Fix them and re-import.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left py-2 px-3 text-xs text-content-tertiary font-medium">Row</th>
                    <th className="text-left py-2 px-3 text-xs text-content-tertiary font-medium">Error</th>
                    <th className="text-left py-2 px-3 text-xs text-content-tertiary font-medium">Raw Data</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((err, i) => (
                    <tr key={i} className="border-b border-border-subtle/50 hover:bg-red-50/50">
                      <td className="py-2 px-3 font-mono text-xs">{err.row || i + 1}</td>
                      <td className="py-2 px-3 text-red-600">{err.error}</td>
                      <td className="py-2 px-3 text-xs text-content-tertiary font-mono truncate max-w-[300px]">{err.raw ? JSON.stringify(err.raw) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {imp.status === 'Processing' && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-content-secondary">Import is still processing. This page will show results when complete.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
