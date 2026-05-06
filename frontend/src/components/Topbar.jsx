import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Breadcrumbs } from './Breadcrumbs'
import { useUiStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { cn } from '../lib/cn'
import { Menu, Search, Bell, Moon, Sun, Monitor, LogOut, ChevronDown, Settings } from 'lucide-react'

export function Topbar() {
  const navigate = useNavigate()
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const openCommand = useUiStore((s) => s.openCommand)
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)
  const notificationsOpen = useUiStore((s) => s.notificationsOpen)
  const setNotificationsOpen = useUiStore((s) => s.setNotificationsOpen)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const [profileOpen, setProfileOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const profileRef = useRef(null)
  const themeRef = useRef(null)

  useEffect(() => {
    const onKeyDown = (e) => {
      const isK = e.key?.toLowerCase?.() === 'k'
      const isMeta = e.metaKey || e.ctrlKey
      if (isMeta && isK) {
        e.preventDefault()
        openCommand()
      }
    }
    const onClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
      if (themeRef.current && !themeRef.current.contains(e.target)) setThemeOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousedown', onClickOutside)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousedown', onClickOutside)
    }
  }, [openCommand])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border-subtle">
      <div className="mx-auto flex w-full items-center gap-4 px-6 h-[64px]">
        {/* Mobile Toggle */}
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 -ml-2 text-content-secondary hover:text-content-primary transition-colors hover:bg-app-hover rounded-md"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 flex items-center h-full">
          <Breadcrumbs />
        </div>

        {/* Search */}
        <div className="hidden md:block w-72 lg:w-96 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[16px] w-[16px] text-content-tertiary group-hover:text-content-secondary transition-colors pointer-events-none" />
          <input
            type="text"
            readOnly
            onClick={openCommand}
            placeholder="Search products, SKUs, buyers..."
            className="w-full h-[36px] pl-[36px] pr-12 rounded-md bg-white text-[14px] text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-brand-soft cursor-pointer transition-all border border-border-subtle hover:border-content-tertiary/50"
          />
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-border-subtle bg-app-card-muted px-1.5 py-0.5 text-[10px] font-semibold text-content-tertiary">
            ⌘K
          </div>
        </div>

        {/* Notifications */}
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className="p-2 text-content-tertiary hover:text-content-primary hover:bg-app-hover rounded-md transition-colors relative"
        >
          <Bell className="h-[20px] w-[20px]" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand ring-2 ring-white" />
        </button>

        {/* Theme Dropdown */}
        <div className="relative hidden sm:block" ref={themeRef}>
          <button
            onClick={() => setThemeOpen(!themeOpen)}
            className="p-2 text-content-tertiary hover:text-content-primary hover:bg-app-hover rounded-md transition-colors flex items-center justify-center"
          >
            {theme === 'dark' ? <Moon className="h-[20px] w-[20px]" /> : theme === 'light' ? <Sun className="h-[20px] w-[20px]" /> : <Monitor className="h-[20px] w-[20px]" />}
          </button>
          {themeOpen && (
            <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-md shadow-card border border-border-subtle overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2">
              {['light', 'dark', 'system'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setTheme(t); setThemeOpen(false) }}
                  className={cn(
                    "w-full px-3 py-1.5 text-left text-sm font-medium transition-colors hover:bg-app-hover capitalize",
                    theme === t ? "text-brand" : "text-content-secondary"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-md hover:bg-app-hover transition-colors border border-transparent hover:border-border-soft"
          >
            <div className="text-right hidden sm:block">
              <div className="text-[13px] font-semibold text-content-primary leading-none">{user?.name?.split(' ')[0] || 'Admin'}</div>
            </div>
            <div className="h-8 w-8 rounded-md bg-app-active border border-border-subtle flex items-center justify-center text-brand-strong font-bold text-xs overflow-hidden">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : (user?.name?.[0] || 'A')}
            </div>
            <ChevronDown className={cn("h-4 w-4 text-content-tertiary transition-transform", profileOpen && "rotate-180")} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-md shadow-card border border-border-subtle overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-border-soft mb-1">
                <div className="text-sm font-semibold text-content-primary truncate">{user?.name || 'Administrator'}</div>
                <div className="text-xs text-content-tertiary truncate">{user?.email || 'admin@merchflow.ai'}</div>
              </div>
              <button onClick={() => { navigate('/settings/profile'); setProfileOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-content-secondary hover:text-content-primary hover:bg-app-hover transition-colors">
                <Settings className="h-4 w-4" /> Settings
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-semantic-error hover:bg-semantic-error-bg transition-colors">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
