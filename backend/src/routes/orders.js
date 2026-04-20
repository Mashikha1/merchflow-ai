import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// GET /api/orders  – orders = quotes with CONVERTED_TO_ORDER status
router.get('/', async (req, res, next) => {
    try {
        const orders = await prisma.quote.findMany({
            where: { status: 'CONVERTED_TO_ORDER', archived: false },
            include: {
                items: true,
                customer: true,
                assignedTo: { select: { id: true, name: true } },
                history: { orderBy: { at: 'asc' } }
            },
            orderBy: { updatedAt: 'desc' }
        })

        const computeTotals = (items = []) => {
            const subtotal = items.reduce((a, i) => a + i.qty * Number(i.unitPrice), 0)
            const discount = items.reduce((a, i) => a + i.qty * Number(i.unitPrice) * ((i.discountPct || 0) / 100), 0)
            return { subtotal, discount, total: Math.max(0, subtotal - discount) }
        }

        // Summary stats
        const allQuotes = await prisma.quote.findMany({ where: { archived: false }, include: { items: true } })
        const totalRevenuePotential = allQuotes.reduce((a, q) => {
            const t = computeTotals(q.items)
            return a + t.total
        }, 0)

        res.json({
            orders: orders.map(o => ({ ...o, totals: computeTotals(o.items) })),
            summary: {
                total: await prisma.quote.count({ where: { archived: false } }),
                newOrders: orders.length,
                pendingQuotes: await prisma.quote.count({ where: { status: { in: ['SENT', 'NEGOTIATING'] }, archived: false } }),
                sampleRequests: 0,
                revenuePotential: Math.round(totalRevenuePotential)
            }
        })
    } catch (err) { next(err) }
})

export default router
