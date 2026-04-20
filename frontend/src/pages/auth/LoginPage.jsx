import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/cn'

const schema = z.object({
  email: z.string().email('Enter a valid work email'),
  password: z.string().min(1, 'Password is required'),
})

export function PasswordField({ register, name, placeholder, error }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className={cn(
            "h-10 w-full rounded-md border border-border-subtle bg-white px-3 text-sm text-content-primary placeholder:text-content-tertiary shadow-sm outline-none transition-all focus:ring-2 focus:ring-brand focus:border-brand",
            error && "border-semantic-error focus:ring-semantic-error focus:border-semantic-error"
          )}
          placeholder={placeholder}
          {...register(name)}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-content-secondary transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-semantic-error text-xs mt-1.5 font-medium"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const loginMode = useAuthStore((s) => s.loginMode)
  const setLoginMode = useAuthStore((s) => s.setLoginMode)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@merchflow.ai', password: 'password' },
  })

  const onSubmit = async (values) => {
    try {
      setLoading(true)
      await login({ email: values.email, password: values.password, role: loginMode === 'buyer' ? 'Viewer' : 'Admin' })
      navigate(loginMode === 'buyer' ? '/buyer/home' : '/dashboard')
      toast.success('Welcome back')
    } catch (e) {
      toast.error('Login failed', { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="inline-flex rounded-md border border-border-subtle bg-app-card-muted p-1 mb-8">
          <button
            type="button"
            onClick={() => setLoginMode('seller')}
            className={cn(
              'px-4 py-1.5 text-[13px] rounded-sm transition-all duration-200 font-medium',
              loginMode === 'seller' ? 'bg-white text-content-primary shadow-sm border border-border-soft' : 'text-content-secondary hover:text-content-primary'
            )}
          >
            Seller
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('buyer')}
            className={cn(
              'px-4 py-1.5 text-[13px] rounded-sm transition-all duration-200 font-medium',
              loginMode === 'buyer' ? 'bg-white text-content-primary shadow-sm border border-border-soft' : 'text-content-secondary hover:text-content-primary'
            )}
          >
            Buyer
          </button>
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-content-primary mb-2">
          {loginMode === 'buyer' ? 'Buyer Sign in' : 'Seller Sign in'}
        </h1>
        <p className="text-content-secondary text-sm">
          Enter your credentials to access your workspace.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-content-primary mb-1.5">Work Email</label>
          <input
            className={cn(
              "h-10 w-full rounded-md border border-border-subtle bg-white px-3 text-sm text-content-primary placeholder:text-content-tertiary shadow-sm outline-none transition-all focus:ring-2 focus:ring-brand focus:border-brand",
              form.formState.errors.email && "border-semantic-error focus:ring-semantic-error focus:border-semantic-error"
            )}
            placeholder="name@company.com"
            {...form.register('email')}
          />
          <AnimatePresence>
            {form.formState.errors.email && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-semantic-error text-xs mt-1.5 font-medium"
              >
                {form.formState.errors.email.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-content-primary">Password</label>
            <Link to="/forgot-password" className="text-sm font-medium text-brand hover:text-brand-hover transition-colors">
              Forgot?
            </Link>
          </div>
          <PasswordField
            register={form.register}
            name="password"
            placeholder="••••••••"
            error={form.formState.errors.password?.message}
          />
        </div>

        <Button className="w-full h-11 text-sm font-semibold" disabled={loading} type="submit">
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Sign in'}
        </Button>
      </form>

      <div className="mt-8 flex items-center gap-3">
        <div className="h-px bg-border-subtle flex-1"></div>
        <span className="text-[11px] font-medium text-content-tertiary uppercase tracking-wider">Or continue with</span>
        <div className="h-px bg-border-subtle flex-1"></div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="outline" type="button" className="h-10 text-[13px] font-medium border-border-subtle hover:bg-app-card-muted flex items-center justify-center gap-2">
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
          Google
        </Button>
        <Button variant="outline" type="button" className="h-10 text-[13px] font-medium border-border-subtle hover:bg-app-card-muted flex items-center justify-center gap-2">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.57-.76 1.76.02 3.19.83 4.09 2.18-3.48 1.87-2.87 6.4 0 7.7-1 1.58-1.57 2.21-2.74 3.05zm-4.75-13.4c.03-1.63 1.25-3.29 2.93-3.07C15.1 5.3 13.9 7 12.3 6.88z" /></svg>
          Apple
        </Button>
      </div>

      <div className="mt-8 text-center text-[13px] font-medium text-content-secondary">
        Don't have an account? <Link to="/signup" className="text-brand hover:underline">Create one</Link>
      </div>
    </div>
  )
}
