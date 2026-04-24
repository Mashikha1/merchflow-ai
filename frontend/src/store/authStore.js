import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      status: 'anonymous', // anonymous | authenticated
      user: null,
      token: null,
      loginMode: 'seller', // 'seller' | 'buyer'

      login: async ({ email, password, role }) => {
        // Determine password: use what's passed or default for demo
        const pwd = password || 'password'
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pwd })
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Login failed')
        }
        const { token, user } = await res.json()
        // Override role from demo-persona switcher (only in demo mode)
        const finalUser = role ? { ...user, role } : user
        set({ status: 'authenticated', user: finalUser, token })
        return finalUser
      },

      signup: async ({ name, email, password }) => {
        const res = await fetch(`${BASE_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Signup failed')
        }
        const { token, user } = await res.json()
        set({ status: 'authenticated', user, token })
        return user
      },

      logout: async () => {
        set({ status: 'anonymous', user: null, token: null })
      },

      loginWithToken: async (token) => {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Invalid token')
        const user = await res.json()
        set({ status: 'authenticated', user, token })
        return user
      },

      setLoginMode: (mode) => set({ loginMode: mode }),

      setUser: (user) => set({ user }),

      setRole: (role) => {
        const u = get().user
        if (!u) return
        set({ user: { ...u, role } })
      },
    }),
    { name: 'merchflow_auth' },
  ),
)
