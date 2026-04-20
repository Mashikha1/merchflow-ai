import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export const useUiStore = create(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: 'system', // 'system' | 'light' | 'dark'
      resolvedTheme: 'light',
      commandOpen: false,
      notificationsOpen: false,
      globalSearch: '',
      activeWorkspaceId: 'ws_aurora',

      setSidebarCollapsed: (v) => set({ sidebarCollapsed: !!v }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setTheme: (theme) => set({ theme }),
      resolveTheme: () => {
        const t = get().theme
        const resolved = t === 'system' ? getSystemTheme() : t
        set({ resolvedTheme: resolved })
      },

      openCommand: () => set({ commandOpen: true }),
      closeCommand: () => set({ commandOpen: false }),
      setNotificationsOpen: (v) => set({ notificationsOpen: !!v }),
      setGlobalSearch: (q) => set({ globalSearch: q }),
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
    }),
    {
      name: 'merchflow_ui',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        theme: s.theme,
        activeWorkspaceId: s.activeWorkspaceId,
      }),
    },
  ),
)

