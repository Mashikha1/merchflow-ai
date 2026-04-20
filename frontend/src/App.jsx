import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AppRoutes } from './routes/AppRoutes'
import { queryClient } from './app/queryClient'
import { useUiStore } from './store/uiStore'
import { useEffect } from 'react'

function AppInner() {
  const theme = useUiStore((s) => s.theme)
  const resolvedTheme = useUiStore((s) => s.resolvedTheme)
  const resolveTheme = useUiStore((s) => s.resolveTheme)

  useEffect(() => {
    resolveTheme()
  }, [theme, resolveTheme])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  return (
    <>
      <AppRoutes />
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          className:
            'surface shadow-card border border-[rgb(var(--border))] text-[rgb(var(--text))]',
        }}
      />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
