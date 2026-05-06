import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { PasswordField } from './LoginPage' // Reusing from LoginPage for consistency
import { cn } from '../../lib/cn'
import { useAuthStore } from '../../store/authStore'

const schema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Enter a valid work email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) })
})

export function SignupPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', terms: false }
  })

  const signup = useAuthStore(s => s.signup)

  const onSubmit = async (values) => {
    try {
      setLoading(true)
      // Pass name properly
      const name = `${values.firstName} ${values.lastName}`.trim()
      await signup({ name, email: values.email, password: values.password })
      toast.success('Account created', { description: 'Let\'s set up your workspace.' })
      navigate('/onboarding', { replace: true })
    } catch (e) {
      toast.error('Signup failed', { description: e.message || 'Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const passwordVal = form.watch('password') || ''

  // Basic strength calculation
  const getStrength = (p) => {
    if (p.length === 0) return { label: '', width: 0, color: 'bg-gray-200' }
    if (p.length < 6) return { label: 'Weak', width: 25, color: 'bg-red-400' }
    if (p.length < 10) return { label: 'Good', width: 60, color: 'bg-amber-400' }
    return { label: 'Strong', width: 100, color: 'bg-green-500' }
  }
  const strength = getStrength(passwordVal)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Create an account</h1>
        <p className="text-gray-500 font-medium">Start accelerating your merchandising today.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5 ml-1">First Name</label>
            <input
              className={cn(
                "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition-all focus:border-black focus:ring-1 focus:ring-black",
                form.formState.errors.firstName && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="Jane"
              {...form.register('firstName')}
            />
            {form.formState.errors.firstName && (
              <p className="text-red-500 text-xs mt-1.5 font-medium ml-1">{form.formState.errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5 ml-1">Last Name</label>
            <input
              className={cn(
                "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition-all focus:border-black focus:ring-1 focus:ring-black",
                form.formState.errors.lastName && "border-red-300 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="Doe"
              {...form.register('lastName')}
            />
            {form.formState.errors.lastName && (
              <p className="text-red-500 text-xs mt-1.5 font-medium ml-1">{form.formState.errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5 ml-1">Work Email</label>
          <input
            className={cn(
              "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition-all focus:border-black focus:ring-1 focus:ring-black",
              form.formState.errors.email && "border-red-300 focus:border-red-500 focus:ring-red-500"
            )}
            placeholder="jane@brand.com"
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-red-500 text-xs mt-1.5 font-medium ml-1">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5 ml-1">Password</label>
          <PasswordField
            register={form.register}
            name="password"
            placeholder="Min. 8 characters"
            error={form.formState.errors.password?.message}
          />
          {/* Password Strength Indicator */}
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

        <div className="flex items-start ml-1 mt-6">
          <div className="flex mt-0.5">
            <input
              type="checkbox"
              id="terms"
              className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
              {...form.register('terms')}
            />
          </div>
          <div className="ml-3 flex flex-col">
            <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer select-none">
              I agree to the <a href="#" className="font-medium text-black hover:underline">Terms of Service</a> and <a href="#" className="font-medium text-black hover:underline">Privacy Policy</a>
            </label>
            {form.formState.errors.terms && (
              <p className="text-red-500 text-xs mt-1 font-medium">{form.formState.errors.terms.message}</p>
            )}
          </div>
        </div>

        <Button className="w-full h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-all bg-black hover:bg-gray-900 text-white rounded-xl mt-6" disabled={loading} type="submit">
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm font-medium text-gray-600">
        Already have an account? <Link to="/login" className="text-black hover:underline">Sign in</Link>
      </div>
    </div>
  )
}
