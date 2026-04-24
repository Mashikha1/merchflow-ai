import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// GET /api/dashboard/summary
router.get('/summary', async (req, res, next) => {
    try {
        const userId = req.user.id
        const [
            totalProducts, activeVariants, draftProducts, lowStockItems,
            publishedShowrooms, quoteRequests, pendingAiJobs, catalogCount,
            totalCustomers, completedJobs
        ] = await Promise.all([
            prisma.product.count({ where: { createdById: userId } }),
            prisma.product.count({ where: { status: 'ACTIVE', createdById: userId } }),
            prisma.product.count({ where: { status: 'DRAFT', createdById: userId } }),
            prisma.product.count({ where: { status: 'LOW_STOCK', createdById: userId } }),
            prisma.showroom.count({ where: { status: 'Published', createdById: userId } }),
            prisma.quote.count({ where: { status: { in: ['DRAFT', 'SENT', 'NEGOTIATING'] }, createdById: userId } }),
            prisma.aIJob.count({ where: { status: { in: ['QUEUED', 'PROCESSING'] }, createdById: userId } }),
            prisma.catalog.count({ where: { createdById: userId } }),
            prisma.customer.count({ where: { archived: false, createdById: userId } }),
            prisma.aIJob.count({ where: { status: 'COMPLETED', createdById: userId } }),
        ])
        res.json({
            totalProducts, activeVariants, draftProducts, lowStockItems,
            publishedShowrooms, quoteRequests, pendingAiJobs, catalogCount,
            totalCustomers, completedJobs,
        })
    } catch (err) { next(err) }
})

// GET /api/dashboard/traffic — real pageview data (last 7 days)
router.get('/traffic', async (req, res, next) => {
    try {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        // Note: PageView might not have createdById directly, but Showrooms do.
        // We'll join or just fetch pageviews for showrooms owned by the user
        const showrooms = await prisma.showroom.findMany({
            where: { createdById: req.user.id },
            select: { id: true }
        })
        const showroomIds = showrooms.map(s => s.id)

        const views = await prisma.pageView.findMany({
            where: { 
                createdAt: { gte: sevenDaysAgo },
                showroomId: { in: showroomIds }
            },
            select: { createdAt: true, entity: true }
        })

        // Group by day of week
        const byDay = {}
        views.forEach(v => {
            const day = days[new Date(v.createdAt).getDay() === 0 ? 6 : new Date(v.createdAt).getDay() - 1]
            if (!byDay[day]) byDay[day] = { views: 0, showrooms: 0 }
            byDay[day].views++
            if (v.entity === 'showroom') byDay[day].showrooms++
        })

        const data = days.map((name) => {
            if (byDay[name]) {
                return { name, views: byDay[name].views, showrooms: byDay[name].showrooms }
            }
            return { name, views: 0, showrooms: 0 }
        })

        res.json(data)
    } catch (err) { next(err) }
})

// GET /api/dashboard/activity — recent events feed
router.get('/activity', async (req, res, next) => {
    try {
        const userId = req.user.id
        const [quotes, imports, aiJobs] = await Promise.all([
            prisma.quote.findMany({
                where: { archived: false, createdById: userId },
                orderBy: { updatedAt: 'desc' },
                take: 5,
                select: { id: true, buyerName: true, buyerCompany: true, status: true, updatedAt: true }
            }),
            prisma.import.findMany({
                where: { createdById: userId },
                orderBy: { createdAt: 'desc' },
                take: 3,
                select: { id: true, fileName: true, status: true, successRows: true, createdAt: true }
            }),
            prisma.aIJob.findMany({
                where: { createdById: userId },
                orderBy: { createdAt: 'desc' },
                take: 3,
                select: { id: true, type: true, status: true, createdAt: true, finishedAt: true }
            })
        ])

        const activity = [
            ...quotes.map(q => ({
                id: q.id, type: 'quote',
                title: `Quote ${q.status.toLowerCase()} — ${q.buyerCompany}`,
                subtitle: q.buyerName, at: q.updatedAt, link: '/quotes'
            })),
            ...imports.map(i => ({
                id: i.id, type: 'import',
                title: `Import ${i.status.toLowerCase()} — ${i.fileName}`,
                subtitle: `${i.successRows} rows`, at: i.createdAt, link: '/imports'
            })),
            ...aiJobs.map(j => ({
                id: j.id, type: 'ai',
                title: `AI ${j.type} — ${j.status.toLowerCase()}`,
                subtitle: j.finishedAt ? 'Completed' : 'Processing', at: j.createdAt, link: '/ai/jobs'
            }))
        ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 10)

        res.json(activity)
    } catch (err) { next(err) }
})

export default router
