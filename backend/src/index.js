import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import authRouter from './routes/auth.js'
import productsRouter from './routes/products.js'
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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4000

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || origin === process.env.FRONTEND_URL) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/products', productsRouter)
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

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
})

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('API Error:', err)
  const status = err.status || err.statusCode || 500
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

app.listen(PORT, () => {
  console.log(`\n🚀 MerchFlow API running at http://localhost:${PORT}`)
  console.log(`📦 Database: PostgreSQL (merchflow)`)
  console.log(`🔑 JWT Auth: enabled\n`)
})
