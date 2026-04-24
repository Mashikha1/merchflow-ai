import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { toast } from 'sonner'

const INTEGRATIONS = [
  { id: 'shopify', name: 'Shopify', icon: '🛒', desc: 'Sync products, inventory, and orders with your Shopify store.', status: 'available', color: '#96BF48' },
  { id: 'woocommerce', name: 'WooCommerce', icon: '🔌', desc: 'Connect your WordPress/WooCommerce catalog.', status: 'coming_soon' },
  { id: 'google-sheets', name: 'Google Sheets', icon: '📊', desc: 'Export products, quotes, and analytics to Google Sheets.', status: 'available' },
  { id: 'slack', name: 'Slack', icon: '💬', desc: 'Get real-time notifications for quotes, orders, and AI jobs.', status: 'available' },
  { id: 'zapier', name: 'Zapier', icon: '⚡', desc: 'Connect MerchFlow to 5,000+ apps via webhook triggers.', status: 'available' },
  { id: 'xero', name: 'Xero', icon: '📒', desc: 'Sync invoices and customer data with Xero accounting.', status: 'coming_soon' },
  { id: 'mailchimp', name: 'Mailchimp', icon: '📧', desc: 'Sync buyer contacts for email marketing campaigns.', status: 'coming_soon' },
  { id: 'stripe', name: 'Stripe', icon: '💳', desc: 'Accept payments directly on approved quotes.', status: 'coming_soon' },
]

export function SettingsIntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-content-primary">Integrations</h1>
        <p className="text-sm text-content-secondary mt-1">Connect MerchFlow with your existing tools and services.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map(intg => (
          <Card key={intg.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{intg.icon}</div>
                <Badge variant={intg.status === 'available' ? 'default' : 'secondary'}>
                  {intg.status === 'available' ? 'Available' : 'Coming Soon'}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-content-primary">{intg.name}</h3>
              <p className="text-xs text-content-secondary mt-1 mb-4">{intg.desc}</p>
              {intg.status === 'available' ? (
                <Button variant="secondary" size="sm" className="w-full" onClick={() => toast.info(`${intg.name} integration — configure webhook URL or API key in your .env file.`)}>
                  Configure
                </Button>
              ) : (
                <Button variant="secondary" size="sm" className="w-full" disabled>Coming Soon</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Webhook Endpoints</CardTitle><CardDescription>Use these URLs to receive events from external services.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {[
            { event: 'Quote Created', url: '/api/webhooks/quote-created' },
            { event: 'Order Placed', url: '/api/webhooks/order-placed' },
            { event: 'AI Job Completed', url: '/api/webhooks/ai-job-done' },
          ].map(wh => (
            <div key={wh.event} className="flex items-center justify-between p-3 rounded-xl border border-border-subtle">
              <div>
                <div className="text-sm font-medium text-content-primary">{wh.event}</div>
                <div className="text-xs text-content-tertiary font-mono">{window.location.origin}{wh.url}</div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${wh.url}`); toast.success('URL copied!') }}>Copy</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
