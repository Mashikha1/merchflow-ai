import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Command, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'

export function InviteAcceptPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const login = useAuthStore((s) => s.login)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' })

  const token = params.get('token')
  const email = params.get('email') || 'invited@company.com'
  const role = params.get('role') || 'Viewer'
  const brand = params.get('brand') || 'MerchFlow Team'

  const handleAccept = async () => {
    if (!form.name.trim()) { toast.error('Please enter your name'); return }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }

    try {
      setLoading(true)
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
      const res = await fetch(`${BASE_URL}/auth/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: form.name, password: form.password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to accept invitation')

      await login({ email, password: form.password })
      toast.success('Welcome! Your account is ready.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Failed to accept invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full"
    >
      <div className="mb-10 text-center">
        <div className="mx-auto h-20 w-20 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <Building2 size={32} className="text-gray-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">Join {brand}</h1>
        <p className="text-gray-500 font-medium leading-relaxed max-w-sm mx-auto">
          You've been invited to collaborate on <span className="font-semibold text-gray-900">{brand}</span>'s workspace.
        </p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-6 shadow-inner">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-500">Workspace</span>
            <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Command size={14} /> {brand}</span>
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-500">Your Role</span>
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100">{role}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500">Email Address</span>
            <span className="text-sm font-medium text-gray-900">{email}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-700">Your Name</label>
          <Input className="mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Create Password</label>
          <Input className="mt-1" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Confirm Password</label>
          <Input className="mt-1" type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Confirm password" />
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleAccept}
          className="w-full h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-all bg-black hover:bg-gray-900 text-white rounded-xl"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Accept Invitation'}
        </Button>
        <Button variant="outline" className="w-full h-12 text-base font-semibold border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600" onClick={() => navigate('/login')}>
          Decline
        </Button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6 font-medium">
        By accepting, you agree to the MerchFlow AI Terms of Service.
      </p>
    </motion.div>
  )
}
