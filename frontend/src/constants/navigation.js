export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'spark' },
  { label: 'Products', path: '/products', icon: 'box' },
  { label: 'Inventory', path: '/inventory', icon: 'warehouse' },
  { label: 'Media Library', path: '/media', icon: 'image' },
  { label: 'AI Studio', path: '/ai', icon: 'ai' },
  { label: 'Catalogs', path: '/catalogs', icon: 'book' },
  { label: 'Showrooms', path: '/showrooms', icon: 'store' },
  { label: 'Orders', path: '/orders', icon: 'receipt' },
  { label: 'Quotes', path: '/quotes', icon: 'quote' },
  { label: 'Settings', path: '/settings/profile', icon: 'gear' },
  { label: 'Wishlist', path: '/buyer/wishlist', icon: 'heart' },
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

