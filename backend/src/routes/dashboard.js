import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// GET /api/dashboard/summary
router.get('/summary', async (req, res, next) => {
    try {
        const [
            totalProducts, activeVariants, draftProducts, lowStockItems,
            publishedShowrooms, quoteRequests, pendingAiJobs, catalogCount
        ] = await Promise.all([
            prisma.product.count(),
            prisma.product.count({ where: { status: 'ACTIVE' } }),
            prisma.product.count({ where: { status: 'DRAFT' } }),
            prisma.product.count({ where: { status: 'LOW_STOCK' } }),
            prisma.showroom.count({ where: { status: 'Published' } }),
            prisma.quote.count({ where: { status: { in: ['DRAFT', 'SENT', 'NEGOTIATING'] } } }),
            prisma.aIJob.count({ where: { status: { in: ['QUEUED', 'PROCESSING'] } } }),
            prisma.catalog.count(),
        ])
        res.json({
            totalProducts, activeVariants, draftProducts, lowStockItems,
            publishedShowrooms, quoteRequests, pendingAiJobs, catalogCount,
        })
    } catch (err) { next(err) }
})

// GET /api/dashboard/traffic
router.get('/traffic', async (req, res, next) => {
    try {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const data = days.map(name => ({
            name,
            views: Math.floor(Math.random() * 3000) + 2000,
            showrooms: Math.floor(Math.random() * 2000) + 1000
        }))
        res.json(data)
    } catch (err) { next(err) }
})

export default router
