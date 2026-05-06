import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/cn'

const LABELS = {
  dashboard: 'Dashboard',
  products: 'Products',
  categories: 'Categories',
  collections: 'Collections',
  inventory: 'Inventory',
  imports: 'Imports',
  media: 'Media',
  ai: 'AI Studio',
  lookbooks: 'Lookbooks',
  showrooms: 'Showrooms',
  orders: 'Orders',
  quotes: 'Quotes',
  customers: 'Customers',
  settings: 'Settings',
  'try-on': 'Virtual Try-On',
  descriptions: 'Descriptions',
  attributes: 'Attributes',
  backgrounds: 'Backgrounds',
  jobs: 'Jobs',
  profile: 'Profile',
  team: 'Team',
  brand: 'Brand',
  integrations: 'Integrations',
  notifications: 'Notifications',
}

export function Breadcrumbs({ className }) {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  if (!parts.length) return null

  const crumbs = parts.map((p, idx) => {
    const to = '/' + parts.slice(0, idx + 1).join('/')
    const label = LABELS[p] || (p.length > 20 ? p.slice(0, 18) + '…' : p)
    return { to, label, isLast: idx === parts.length - 1 }
  })

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-2 text-xs text-muted', className)}
    >
      <Link to="/dashboard" className="hover:text-[rgb(var(--text))]">
        MerchFlow
      </Link>
      <span className="text-muted/60">/</span>
      {crumbs.map((c) => (
        <span key={c.to} className="flex items-center gap-2">
          {c.isLast ? (
            <span className="text-[rgb(var(--text))]">{c.label}</span>
          ) : (
            <Link to={c.to} className="hover:text-[rgb(var(--text))]">
              {c.label}
            </Link>
          )}
          {!c.isLast ? <span className="text-muted/60">/</span> : null}
        </span>
      ))}
    </nav>
  )
}
