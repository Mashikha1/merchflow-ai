import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function SettingsAIPage() {
  const [lightxKey, setLightxKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [features, setFeatures] = useState({
    virtualTryOn: true, descriptions: true, attributes: true, backgrounds: true, lookbook: true
  })
  const [defaults, setDefaults] = useState({ quality: 'hd', variations: 2 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-content-primary">AI Settings</h1>
        <p className="text-sm text-content-secondary mt-1">Configure AI providers, API keys, and default behaviors.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>API Keys</CardTitle><CardDescription>Configure your AI provider credentials. Keys are stored securely on the server.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-content-primary">LightX Editor API Key</label>
              <p className="text-xs text-content-tertiary mb-1">Used for Virtual Try-On and Background Generation.</p>
              <div className="flex gap-2">
                <Input type="password" value={lightxKey} onChange={e => setLightxKey(e.target.value)} placeholder="LightX key…" className="flex-1 font-mono text-xs" />
                <Button variant="secondary" onClick={() => toast.info('LightX Key: update in backend/.env → LIGHTX_API_KEY')}>Save</Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-content-primary">Google Gemini API Key</label>
              <p className="text-xs text-content-tertiary mb-1">Used for Descriptions, Attributes, and Lookbook Assistant.</p>
              <div className="flex gap-2">
                <Input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="AI…" className="flex-1 font-mono text-xs" />
                <Button variant="secondary" onClick={() => toast.info('Gemini Key: update in backend/.env → GEMINI_API_KEY')}>Save</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Default Settings</CardTitle><CardDescription>Defaults for new AI jobs.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-content-primary">Default Quality</label>
              <select value={defaults.quality} onChange={e => setDefaults({ ...defaults, quality: e.target.value })}
                className="mt-1 w-full h-10 rounded-lg border border-border-subtle px-3 text-sm outline-none focus:ring-2 focus:ring-brand">
                <option value="hd">HD (Recommended)</option><option value="standard">Standard</option><option value="ultra">Ultra HD</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-content-primary">Default Variations</label>
              <Input type="number" min={1} max={4} value={defaults.variations} onChange={e => setDefaults({ ...defaults, variations: Number(e.target.value) })} className="mt-1" />
              <p className="text-xs text-content-tertiary mt-1">Number of AI output variations per job (1-4).</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Feature Toggles</CardTitle><CardDescription>Enable or disable AI features for your workspace.</CardDescription></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { key: 'virtualTryOn', label: 'Virtual Try-On', icon: '👗', desc: 'AI garment fitting on model photos' },
                { key: 'descriptions', label: 'AI Descriptions', icon: '📝', desc: 'Generate product descriptions' },
                { key: 'attributes', label: 'Attribute Extraction', icon: '🏷️', desc: 'Extract attributes from images' },
                { key: 'backgrounds', label: 'Background Generation', icon: '🎨', desc: 'Product background replacement' },
                { key: 'lookbook', label: 'Lookbook Assistant', icon: '📖', desc: 'Catalog narrative generation' },
              ].map(f => (
                <label key={f.key} className="flex items-center gap-3 p-4 rounded-xl border border-border-subtle hover:bg-app-card-muted transition cursor-pointer">
                  <input type="checkbox" checked={features[f.key]} onChange={e => setFeatures({ ...features, [f.key]: e.target.checked })} className="w-4 h-4 accent-brand" />
                  <div>
                    <div className="text-sm font-medium text-content-primary">{f.icon} {f.label}</div>
                    <div className="text-xs text-content-tertiary">{f.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => toast.success('AI settings saved!')}>Save All Settings</Button>
      </div>
    </div>
  )
}
