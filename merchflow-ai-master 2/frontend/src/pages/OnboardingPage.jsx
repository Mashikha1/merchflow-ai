import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '../components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { UploadDropzone } from '../components/UploadDropzone'

const STEPS = [
  { id: 'company', title: 'Company details' },
  { id: 'brand', title: 'Brand setup' },
  { id: 'industry', title: 'Industry/category' },
  { id: 'workflow', title: 'Workflow preferences' },
  { id: 'import', title: 'Import starter data' },
  { id: 'invite', title: 'Invite team' },
  { id: 'ai', title: 'AI settings' },
  { id: 'finish', title: 'Finish setup' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const [idx, setIdx] = useState(0)
  const step = STEPS[idx]
  const [logo, setLogo] = useState(null)

  const progress = useMemo(
    () => Math.round(((idx + 1) / STEPS.length) * 100),
    [idx],
  )

  const finish = () => {
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding"
        subtitle="Set up your workspace in a few quick steps."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                toast.message('Skipped', {
                  description: 'You can revisit onboarding later.',
                })
                finish()
              }}
            >
              Skip
            </Button>
            <Button
              onClick={() => {
                if (idx === STEPS.length - 1) {
                  toast.success('Setup complete', {
                    description: 'Workspace is ready.',
                  })
                  finish()
                  return
                }
                setIdx(idx + 1)
              }}
            >
              {idx === STEPS.length - 1 ? 'Done' : 'Continue'}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <div className="mt-1 text-sm text-muted">{progress}% complete</div>
          </CardHeader>
          <CardContent className="space-y-2">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition ${
                  i === idx
                    ? 'border-[rgba(var(--accent),0.25)] bg-[rgba(var(--accent),0.10)]'
                    : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-muted))]'
                }`}
                onClick={() => setIdx(i)}
              >
                <div className="font-medium">{s.title}</div>
                <div className="text-xs text-muted">
                  Step {i + 1} of {STEPS.length}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{step.title}</CardTitle>
              <div className="text-sm text-muted">
                Configure your workspace to get started.
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <div className="text-sm font-semibold">Brand identity</div>
                <UploadDropzone
                  helper={logo ? `Selected: ${logo.name}` : 'Upload your brand logo'}
                  accept={{ 'image/*': [] }}
                  onFiles={(files) => {
                    const f = files?.[0]
                    if (f) setLogo(f)
                    toast.success('Logo added', { description: f?.name })
                  }}
                />
                <div className="grid gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted">
                      Company name
                    </label>
                    <Input className="mt-1" defaultValue="Aurora Studio" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">
                      Brand type
                    </label>
                    <select className="mt-1 h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg))]">
                      <option>Fashion</option>
                      <option>Apparel</option>
                      <option>Textile</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold">Starter data</div>
                <div className="rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
                  <div className="text-sm font-medium">Seed sample data</div>
                  <div className="mt-1 text-sm text-muted">
                    Adds realistic products, collections, and media.
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input id="seed" type="checkbox" defaultChecked />
                    <label htmlFor="seed" className="text-sm">
                      Enable sample data
                    </label>
                  </div>
                </div>

                <div className="rounded-[var(--radius)] border border-dashed border-[rgb(var(--border))] p-4">
                  <div className="text-sm font-medium">Invite team</div>
                  <div className="mt-1 text-sm text-muted">
                    Add merchandisers, sales, and designers to your team.
                  </div>
                  <div className="mt-3 grid gap-2">
                    <Input placeholder="email@brand.com" />
                    <Button
                      variant="secondary"
                      onClick={() =>
                        toast.success('Invite sent', {
                          description:
                            'They will appear as pending in Settings → Team.',
                        })
                      }
                    >
                      Send invite
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

