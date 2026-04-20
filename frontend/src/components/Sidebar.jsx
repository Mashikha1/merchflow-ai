import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../constants/navigation'
import { cn } from '../lib/cn'
import { Icon } from './Icon'
import { useUiStore } from '../store/uiStore'
import { HelpCircle, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

function NavItem({ item, collapsed }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-md px-3 py-[10px] text-[14px] font-medium transition-colors w-full relative',
          isActive
            ? 'bg-app-active text-content-primary'
            : 'text-content-secondary hover:bg-app-hover hover:text-content-primary',
        )
      }
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-brand rounded-full" />
          )}
          <span className="grid place-items-center">
            <Icon
              name={item.icon}
              className={cn("h-[18px] w-[18px] transition-colors", isActive ? "text-brand-strong" : "text-content-tertiary group-hover:text-content-secondary")}
            />
          </span>
          {!collapsed ? (
            <span className="flex-1 truncate">{item.label}</span>
          ) : null}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)

  // Grouping NAV_ITEMS for better organization (simulated categories)
  const primaryItems = NAV_ITEMS.filter(i => ['Dashboard', 'Products', 'Categories', 'Collections', 'Inventory'].includes(i.label))
  const marketingItems = NAV_ITEMS.filter(i => ['Catalogs', 'Showrooms', 'AI Studio', 'Media Library'].includes(i.label))
  const operationsItems = NAV_ITEMS.filter(i => ['Orders', 'Quotes', 'Customers', 'Imports'].includes(i.label))
  const systemItems = NAV_ITEMS.filter(i => ['Analytics', 'Activity', 'Settings', 'Help'].includes(i.label))

  const NavSection = ({ label, items }) => (
    <div className="space-y-1 mb-6">
      {!collapsed && label && (
        <div className="px-3 mb-2 text-[11px] font-medium text-content-tertiary uppercase tracking-[0.06em]">
          {label}
        </div>
      )}
      {items.map((item) => (
        <NavItem key={item.path} item={item} collapsed={collapsed} />
      ))}
    </div>
  )

  return (
    <aside
      className={cn(
        'bg-app-sidebar border-r border-border-subtle h-[100svh] sticky top-0 hidden md:flex flex-col z-50 transition-all duration-300',
        collapsed ? 'w-[80px]' : 'w-[260px]',
      )}
    >
      {/* Brand / Logo */}
      <div className="p-5 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-brand flex items-center justify-center text-white shrink-0 shadow-sm font-bold text-lg">
            M
          </div>
          {!collapsed ? (
            <div className="leading-tight overflow-hidden">
              <div className="text-[15px] font-semibold tracking-tight text-content-primary truncate">
                MerchFlow AI
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 overflow-auto px-4 pb-4 scrollbar-none">
        <NavSection items={primaryItems} />
        <NavSection label="Marketing" items={marketingItems} />
        <NavSection label="Operations" items={operationsItems} />
        <NavSection label="System" items={systemItems} />
      </nav>

      <div className={cn("p-4 border-t border-border-soft flex", collapsed ? "flex-col gap-2" : "items-center justify-between")}>
        {!collapsed ? (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-content-tertiary hover:text-content-secondary transition-colors cursor-pointer group rounded-md hover:bg-app-hover flex-1">
            <HelpCircle className="h-[18px] w-[18px] opacity-70 group-hover:opacity-100" />
            <span className="font-medium truncate">Help & Shortcuts</span>
          </div>
        ) : (
          <div className="flex justify-center p-2 text-content-tertiary hover:text-content-secondary transition-colors cursor-pointer rounded-md hover:bg-app-hover" title="Help & Shortcuts">
            <HelpCircle className="h-[18px] w-[18px]" />
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className={cn("flex justify-center p-2 text-content-tertiary hover:text-content-secondary transition-colors rounded-md hover:bg-app-hover", !collapsed && "shrink-0")}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </aside>
  )
}
