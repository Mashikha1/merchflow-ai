export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'spark' },
  { label: 'Products', path: '/products', icon: 'box' },
  { label: 'Categories', path: '/categories', icon: 'tag' },
  { label: 'Collections', path: '/collections', icon: 'stack' },
  { label: 'Inventory', path: '/inventory', icon: 'warehouse' },
  { label: 'Imports', path: '/imports', icon: 'import' },
  { label: 'Media Library', path: '/media', icon: 'image' },
  { label: 'AI Studio', path: '/ai', icon: 'ai' },
  { label: 'Catalogs', path: '/catalogs', icon: 'book' },
  { label: 'Showrooms', path: '/showrooms', icon: 'store' },
  { label: 'Orders', path: '/orders', icon: 'receipt' },
  { label: 'Quotes', path: '/quotes', icon: 'quote' },
  { label: 'Customers', path: '/customers', icon: 'users' },
  { label: 'Settings', path: '/settings/profile', icon: 'gear' },
]

export const SETTINGS_ITEMS = [
  { label: 'Profile', path: '/settings/profile' },
  { label: 'Team', path: '/settings/team', minRole: 'MERCHANDISER' },
  { label: 'Brand', path: '/settings/brand', minRole: 'DESIGNER' },
  { label: 'Integrations', path: '/settings/integrations', minRole: 'ADMIN' },
  {
    label: 'Notifications',
    path: '/settings/notifications',
    minRole: 'MERCHANDISER',
  },
  { label: 'AI', path: '/settings/ai', minRole: 'ADMIN' },
]

