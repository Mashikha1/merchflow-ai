import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

const NOTIFICATION_SETTINGS = [
  { category: 'Quotes', items: [
    { id: 'quote_viewed', label: 'Quote viewed by buyer', desc: 'When a buyer opens your quote link', email: true, inApp: true },
    { id: 'quote_approved', label: 'Quote approved', desc: 'When a buyer approves a quote', email: true, inApp: true },
    { id: 'quote_rejected', label: 'Quote rejected', desc: 'When a buyer declines a quote', email: true, inApp: true },
    { id: 'quote_expired', label: 'Quote expired', desc: 'When a quote passes its expiry date', email: false, inApp: true },
  ]},
  { category: 'AI Studio', items: [
    { id: 'ai_job_done', label: 'AI job completed', desc: 'When a try-on or background job finishes', email: false, inApp: true },
    { id: 'ai_job_failed', label: 'AI job failed', desc: 'When an AI job encounters an error', email: true, inApp: true },
  ]},
  { category: 'Operations', items: [
    { id: 'import_done', label: 'Import finished', desc: 'When a CSV/Excel import completes', email: false, inApp: true },
    { id: 'low_stock', label: 'Low stock alert', desc: 'When a product falls below minimum stock', email: true, inApp: true },
    { id: 'new_customer', label: 'New customer registered', desc: 'When a buyer signs up through your showroom', email: false, inApp: true },
  ]},
  { category: 'Team', items: [
    { id: 'invite_accepted', label: 'Invite accepted', desc: 'When a team member accepts an invitation', email: false, inApp: true },
  ]},
]

export function SettingsNotificationsPage() {
  const [settings, setSettings] = useState(() => {
    const initial = {}
    NOTIFICATION_SETTINGS.forEach(cat => cat.items.forEach(item => {
      initial[item.id] = { email: item.email, inApp: item.inApp }
    }))
    return initial
  })

  const toggle = (id, channel) => {
    setSettings(prev => ({ ...prev, [id]: { ...prev[id], [channel]: !prev[id]?.[channel] } }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content-primary">Notification Preferences</h1>
          <p className="text-sm text-content-secondary mt-1">Choose how you want to be notified about key events.</p>
        </div>
        <Button onClick={() => toast.success('Notification preferences saved!')}>Save Changes</Button>
      </div>

      {NOTIFICATION_SETTINGS.map(cat => (
        <Card key={cat.category}>
          <CardHeader><CardTitle>{cat.category}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-3 py-2 text-xs font-medium text-content-tertiary uppercase tracking-wider">
                <span>Event</span><span className="text-center">Email</span><span className="text-center">In-App</span>
              </div>
              {cat.items.map(item => (
                <div key={item.id} className="grid grid-cols-[1fr_80px_80px] gap-2 px-3 py-3 rounded-xl hover:bg-app-card-muted transition items-center">
                  <div>
                    <div className="text-sm font-medium text-content-primary">{item.label}</div>
                    <div className="text-xs text-content-tertiary">{item.desc}</div>
                  </div>
                  <div className="flex justify-center">
                    <button onClick={() => toggle(item.id, 'email')}
                      className={`w-10 h-6 rounded-full transition-colors relative ${settings[item.id]?.email ? 'bg-brand' : 'bg-gray-200'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[item.id]?.email ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <button onClick={() => toggle(item.id, 'inApp')}
                      className={`w-10 h-6 rounded-full transition-colors relative ${settings[item.id]?.inApp ? 'bg-brand' : 'bg-gray-200'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[item.id]?.inApp ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
