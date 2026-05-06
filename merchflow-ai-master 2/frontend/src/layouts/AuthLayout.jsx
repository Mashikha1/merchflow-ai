import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ShoppingBag } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const SELLER_IMAGES = [
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80',
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80'
]

const BUYER_IMAGES = [
  'https://images.unsplash.com/photo-1534126416832-a88fdf2911c2?w=800&q=80',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80'
]

export function AuthLayout() {
  const location = useLocation()
  const loginMode = useAuthStore((s) => s.loginMode)
  const images = loginMode === 'buyer' ? BUYER_IMAGES : SELLER_IMAGES
  
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans selection:bg-brand-soft selection:text-brand-strong">

      {/* Left Column: Form Area */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 xl:px-32 relative z-10 bg-white">
        <div className="absolute top-8 left-8 lg:left-12 flex items-center gap-2">
          <div className="h-8 w-8 bg-brand rounded-md flex items-center justify-center text-white font-bold text-lg shadow-sm">
            M
          </div>
          <span className="font-semibold text-[18px] tracking-tight text-content-primary">MerchFlow AI</span>
        </div>

        <div className="w-full max-w-[400px] mx-auto mt-12 md:mt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-8 left-8 lg:left-12 text-xs text-content-tertiary font-medium">
          © {new Date().getFullYear()} MerchFlow AI. Professional Merchandising.
        </div>
      </div>

      {/* Right Column: Visual Area (Hidden on mobile) */}
      <div className="hidden md:flex flex-1 relative bg-app-sidebar items-center justify-center p-12 overflow-hidden border-l border-border-subtle">
        <div className="relative z-10 w-full max-w-[540px]">
          {/* Editorial Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-12"
          >
            {loginMode === 'buyer' ? (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-border-subtle shadow-sm text-[11px] font-semibold tracking-wider uppercase text-brand mb-6">
                  Buyer Experience
                </div>
                <h2 className="text-[44px] lg:text-[52px] font-bold tracking-tight text-content-primary leading-[1.1] mb-6">
                  Source with <span className="text-content-secondary italic font-serif font-normal">precision</span>.
                </h2>
                <p className="text-[17px] text-content-secondary leading-relaxed max-w-md">
                  Explore curated collections, discover new brands, and request quotes with a streamlined B2B workflow.
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-border-subtle shadow-sm text-[11px] font-semibold tracking-wider uppercase text-brand mb-6">
                  Merchant OS
                </div>
                <h2 className="text-[44px] lg:text-[52px] font-bold tracking-tight text-content-primary leading-[1.1] mb-6">
                  Merchandising <br />
                  <span className="text-content-secondary italic font-serif font-normal">reimagined</span>.
                </h2>
                <p className="text-[17px] text-content-secondary leading-relaxed max-w-md">
                  Turn product data into sellable stories. Manage your entire wholesale operation from a single, beautiful interface.
                </p>
              </>
            )}
          </motion.div>

          {/* Product Grid Preview with Real Images */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-2 gap-4"
          >
            {images.map((url, i) => (
              <div key={i} className="bg-white p-3 rounded-lg border border-border-subtle shadow-card">
                <div className="aspect-[4/5] bg-app-card-muted rounded-md mb-3 overflow-hidden flex items-center justify-center text-content-tertiary relative">
                  <img 
                    src={url} 
                    alt={`Preview ${i + 1}`} 
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                    onLoad={(e) => e.target.style.opacity = 1}
                    style={{ opacity: 0 }}
                  />
                  <ShoppingBag size={24} strokeWidth={1.5} className="relative z-0" />
                </div>
                <div className="h-3 w-2/3 bg-app-card-muted rounded-full mb-2" />
                <div className="h-2 w-1/3 bg-app-card-muted rounded-full" />
              </div>
            ))}
          </motion.div>
          
          <div className="mt-12 flex items-center gap-6 text-content-tertiary">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 size={16} className="text-brand" /> Trusted by 500+ brands
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 size={16} className="text-brand" /> Enterprise ready
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
