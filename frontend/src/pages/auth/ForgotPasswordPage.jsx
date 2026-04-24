import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, MailCheck, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { cn } from '../../lib/cn'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('Enter a valid work email')
})

export function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' }
  })

  const onSubmit = async (values) => {
    try {
      setLoading(true)
      const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
      const res = await fetch(`${BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setSuccess(true)
    } catch (e) {
      toast.error(e.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Link to="/login" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-black mb-8 transition-colors">
        <ArrowLeft size={16} className="mr-1.5" /> Back to login
      </Link>

      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">Forgot password</h1>
              <p className="text-gray-500 font-medium leading-relaxed">No worries. Enter the email address associated with your workspace and we'll send you a recovery link.</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5 ml-1">Work Email</label>
                <input
                  className={cn(
                    "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition-all focus:border-black focus:ring-1 focus:ring-black",
                    form.formState.errors.email && "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  placeholder="you@brand.com"
                  {...form.register('email')}
                />
                <AnimatePresence>
                  {form.formState.errors.email && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-xs mt-1.5 font-medium ml-1"
                    >
                      {form.formState.errors.email.message}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button className="w-full h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-all bg-black hover:bg-gray-900 text-white rounded-xl" disabled={loading} type="submit">
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Send Reset Link'}
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center mt-4"
          >
            <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50/50">
              <MailCheck className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Check your inbox</h2>
            <p className="text-gray-500 font-medium leading-relaxed mb-8 max-w-[300px]">
              We've sent a password reset link to <br />
              <span className="text-black font-semibold">{form.getValues('email')}</span>
            </p>

            <p className="text-sm font-medium text-gray-500">
              Didn't receive it? <button onClick={() => setSuccess(false)} className="text-black hover:underline font-semibold ml-1">Try another email</button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
