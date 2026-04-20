import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, KeyRound } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { PasswordField } from './LoginPage'
import { cn } from '../../lib/cn'

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' }
  })

  const onSubmit = async (values) => {
    try {
      setLoading(true)
      await new Promise(r => setTimeout(r, 800))
      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  const passwordVal = form.watch('password') || ''
  const getStrength = (p) => {
    if (p.length === 0) return { label: '', width: 0, color: 'bg-gray-200' }
    if (p.length < 6) return { label: 'Weak', width: 25, color: 'bg-red-400' }
    if (p.length < 10) return { label: 'Good', width: 60, color: 'bg-amber-400' }
    return { label: 'Strong', width: 100, color: 'bg-green-500' }
  }
  const strength = getStrength(passwordVal)

  return (
    <div>
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">Set new password</h1>
              <p className="text-gray-500 font-medium">Please enter a new password for your account.</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5 ml-1">New Password</label>
                <PasswordField
                  register={form.register}
                  name="password"
                  placeholder="Min. 8 characters"
                  error={form.formState.errors.password?.message}
                />
                {passwordVal.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3"
                  >
                    <div className="flex bg-gray-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${strength.width}%` }}
                        className={cn("h-full transition-colors duration-300", strength.color)}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs ml-1">
                      <span className="text-gray-500">Strength: <span className="font-semibold text-gray-900">{strength.label}</span></span>
                    </div>
                  </motion.div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5 ml-1">Confirm New Password</label>
                <PasswordField
                  register={form.register}
                  name="confirmPassword"
                  placeholder="Repeat your new password"
                  error={form.formState.errors.confirmPassword?.message}
                />
              </div>

              <Button className="w-full h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-all bg-black hover:bg-gray-900 text-white rounded-xl mt-2" disabled={loading} type="submit">
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Reset Password'}
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-6"
          >
            <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-blue-50/50">
              <KeyRound className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Password updated</h2>
            <p className="text-gray-500 font-medium leading-relaxed mb-8 max-w-[280px]">
              Your password has been successfully reset. You can now sign in to your account.
            </p>

            <Link to="/login" className="w-full">
              <Button className="w-full h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-all bg-black hover:bg-gray-900 text-white rounded-xl">
                Continue to Sign in
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
