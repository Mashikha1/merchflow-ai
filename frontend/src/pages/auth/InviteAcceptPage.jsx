import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Command, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'

export function InviteAcceptPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [loading, setLoading] = useState(false)

  const handleAccept = async () => {
    try {
      setLoading(true)
      // Fake network duration
      await new Promise(r => setTimeout(r, 1200))
      // Log them in as a merchandiser based on the mock invite
      await login({ email: 'new.member@acme.com', role: 'Merchandiser' })
      navigate('/dashboard')
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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">Join ACME Apparel</h1>
        <p className="text-gray-500 font-medium leading-relaxed max-w-sm mx-auto">
          You've been invited by <span className="font-semibold text-gray-900">Sarah Jenkins</span> to collaborate on ACME Apparel Co's merchandising workspace.
        </p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8 mt-2 shadow-inner">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-500">Workspace</span>
            <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Command size={14} /> ACME Core</span>
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-500">Your Role</span>
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100">Merchandiser</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500">Email Address</span>
            <span className="text-sm font-medium text-gray-900">new.member@acme.com</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mt-auto lg:mt-0">
        <Button
          onClick={handleAccept}
          className="w-full h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-all bg-black hover:bg-gray-900 text-white rounded-xl"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Accept Invitation'}
        </Button>
        <Button variant="outline" className="w-full h-12 text-base font-semibold border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600">
          Decline
        </Button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6 font-medium">
        By accepting, you agree to the MerchFlow AI Terms of Service.
      </p>
    </motion.div>
  )
}
