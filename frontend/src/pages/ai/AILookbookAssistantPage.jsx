import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import api from '../../lib/api'

export function AILookbookAssistantPage() {
  const [selectedCatalog, setSelectedCatalog] = useState(null)

  const catalogsQ = useQuery({ queryKey: ['catalogs'], queryFn: () => api('/catalogs') })
  const catalogs = catalogsQ.data || []

  const generateM = useMutation({
    mutationFn: (data) => api('/ai/lookbook-assist', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => toast.success('Lookbook narrative generated!')
  })

  const narrative = generateM.data?.narrative

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-content-primary">AI Lookbook Assistant</h1>
        <p className="text-sm text-content-secondary mt-1">Generate compelling catalog narratives, section headings, and brand copy with AI.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Select Catalog</CardTitle><CardDescription>Choose a catalog to generate copy for.</CardDescription></CardHeader>
            <CardContent className="space-y-2 max-h-[400px] overflow-auto">
              {catalogsQ.isLoading ? <><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></> :
                catalogs.map(c => (
                  <button key={c.id} onClick={() => setSelectedCatalog(c)}
                    className={`w-full text-left rounded-xl border p-3 transition ${selectedCatalog?.id === c.id ? 'border-brand bg-brand/5' : 'border-border-subtle hover:bg-app-card-muted'}`}>
                    <div className="text-sm font-semibold text-content-primary">{c.name}</div>
                    <div className="text-xs text-content-tertiary">{c.type} • {c.status} • {c.audience}</div>
                  </button>
                ))}
              {!catalogsQ.isLoading && !catalogs.length && (
                <p className="text-sm text-content-tertiary text-center py-4">No catalogs found. Create one first.</p>
              )}
            </CardContent>
          </Card>

          <Button className="w-full" disabled={!selectedCatalog || generateM.isPending}
            onClick={() => generateM.mutate({ catalogId: selectedCatalog.id })}>
            {generateM.isPending ? '✨ Generating…' : '✨ Generate Lookbook Copy'}
          </Button>
        </div>

        <div className="space-y-4">
          {!narrative && !generateM.isPending && (
            <div className="flex items-center justify-center min-h-[400px] rounded-xl border-2 border-dashed border-border-subtle">
              <div className="text-center space-y-2">
                <div className="text-4xl">📖</div>
                <p className="text-sm text-content-secondary">Select a catalog and generate AI-powered lookbook copy.</p>
              </div>
            </div>
          )}

          {generateM.isPending && <><Skeleton className="h-32" /><Skeleton className="h-48" /><Skeleton className="h-24" /></>}

          {narrative && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">📖</span>
                    <div className="text-sm font-semibold text-content-primary">Introduction</div>
                  </div>
                  <p className="text-sm text-content-secondary leading-relaxed">{narrative.intro}</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => { navigator.clipboard.writeText(narrative.intro); toast.success('Copied!') }}>Copy Intro</Button>
                </CardContent>
              </Card>

              {narrative.sections?.map((s, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-content-primary">Section {i + 1}: {s.heading}</h3>
                      <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(`${s.heading}\n\n${s.body}`); toast.success('Copied!') }}>Copy</Button>
                    </div>
                    <p className="text-sm text-content-secondary leading-relaxed">{s.body}</p>
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🎯</span>
                    <div className="text-sm font-semibold text-content-primary">Closing / Call to Action</div>
                  </div>
                  <p className="text-sm text-content-secondary leading-relaxed">{narrative.outro}</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => { navigator.clipboard.writeText(narrative.outro); toast.success('Copied!') }}>Copy CTA</Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Button onClick={() => {
                    const full = `${narrative.intro}\n\n${(narrative.sections || []).map(s => `${s.heading}\n${s.body}`).join('\n\n')}\n\n${narrative.outro}`
                    navigator.clipboard.writeText(full)
                    toast.success('Full narrative copied!')
                  }}>📋 Copy Full Narrative</Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
