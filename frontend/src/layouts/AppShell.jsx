import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'
import { CommandPalette } from '../components/CommandPalette'
import { NotificationsPanel } from '../components/NotificationsPanel'

export function AppShell() {
  return (
    <div className="min-h-[100svh] bg-app-bg">
      <div className="flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Topbar />
          <main className="mx-auto w-full max-w-[1400px] px-4 py-6">
            <Outlet />
          </main>
        </div>
      </div>
      <CommandPalette />
      <NotificationsPanel />
    </div>
  )
}

