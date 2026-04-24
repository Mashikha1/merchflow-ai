import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'

import authRouter from './routes/auth.js'
import productsRouter from './routes/products.js'
import variantsRouter from './routes/variants.js'
import categoriesRouter from './routes/categories.js'
import collectionsRouter from './routes/collections.js'
import inventoryRouter from './routes/inventory.js'
import customersRouter from './routes/customers.js'
import quotesRouter from './routes/quotes.js'
import catalogsRouter from './routes/catalogs.js'
import showroomsRouter from './routes/showrooms.js'
import aiRouter from './routes/ai.js'
import mediaRouter from './routes/media.js'
import importsRouter from './routes/imports.js'
import dashboardRouter from './routes/dashboard.js'
import ordersRouter from './routes/orders.js'
import notificationsRouter from './routes/notifications.js'
import wishlistRouter from './routes/wishlist.js'
import publicRouter from './routes/public.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4000
const isProd = process.env.NODE_ENV === 'production'

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow /uploads images
  contentSecurityPolicy: false, // let frontend handle CSP
}))

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression())

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173', // vite preview
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else if (!isProd) {
      // In dev, allow any localhost port
      if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true)
      callback(new Error(`CORS: ${origin} not allowed`))
    } else {
      callback(new Error(`CORS: ${origin} not allowed`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Strict limit on auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: () => !isProd, // only enforce in production
})

// General API limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
  skip: () => !isProd,
})

app.use('/api/auth/login', authLimiter)
app.use('/api/auth/signup', authLimiter)
app.use('/api/auth/forgot-password', authLimiter)
app.use('/api/auth/invite', authLimiter)
app.use('/api/', apiLimiter)

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/products', productsRouter)
app.use('/api/variants', variantsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/collections', collectionsRouter)
app.use('/api/inventory', inventoryRouter)
app.use('/api/customers', customersRouter)
app.use('/api/quotes', quotesRouter)
app.use('/api/catalogs', catalogsRouter)
app.use('/api/showrooms', showroomsRouter)
app.use('/api/ai', aiRouter)
app.use('/api/media', mediaRouter)
app.use('/api/imports', importsRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/wishlist', wishlistRouter)
app.use('/api/public', publicRouter)

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    env: process.env.NODE_ENV || 'development',
  })
})

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (isProd) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${err.message}`)
  } else {
    console.error('API Error:', err)
  }
  const status = err.status || err.statusCode || 500
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(isProd ? {} : { stack: err.stack }),
  })
})

app.listen(PORT, () => {
  console.log(`\n🚀 MerchFlow API → http://localhost:${PORT}`)
  console.log(`🔒 Security: helmet ✓  rate-limit ✓  compression ✓`)
  console.log(`📦 Database: ${process.env.DATABASE_URL?.split('@')[1] || 'localhost'}`)
  console.log(`🔑 JWT: enabled`)
  console.log(`📧 Email: ${process.env.SMTP_USER ? '✓ configured' : '✗ not configured'}`)
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? '✓ configured' : '✗ not configured'}`)
  const aiEnabled = process.env.AILABTOOLS_API_KEY && process.env.AILABTOOLS_API_KEY !== 'YOUR_AILABTOOLS_API_KEY_HERE'
  console.log(`🎨 AILabTools Try-On: ${aiEnabled ? '✓ configured' : '✗ not configured'}\n`)
})
