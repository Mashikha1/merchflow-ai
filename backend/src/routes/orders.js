import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// GET /api/orders  – orders = quotes with CONVERTED_TO_ORDER status
router.get('/', async (req, res, next) => {
    try {
        const isBuyer = req.user.role === 'VIEWER'
        const baseWhere = isBuyer 
            ? { status: 'CONVERTED_TO_ORDER', archived: false, buyerEmail: req.user.email }
            : { status: 'CONVERTED_TO_ORDER', archived: false, createdById: req.user.id }

        const orders = await prisma.quote.findMany({
            where: baseWhere,
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
        const allQuotesWhere = isBuyer 
            ? { archived: false, buyerEmail: req.user.email } 
            : { archived: false }
        
        const allQuotes = await prisma.quote.findMany({ where: allQuotesWhere, include: { items: true } })
        const totalRevenuePotential = allQuotes.reduce((a, q) => {
            const t = computeTotals(q.items)
            return a + t.total
        }, 0)

        res.json({
            orders: orders.map(o => ({ ...o, totals: computeTotals(o.items) })),
            summary: {
                total: await prisma.quote.count({ where: allQuotesWhere }),
                newOrders: orders.length,
                pendingQuotes: await prisma.quote.count({ where: { ...allQuotesWhere, status: { in: ['SENT', 'NEGOTIATING'] } } }),
                sampleRequests: 0,
                revenuePotential: Math.round(totalRevenuePotential)
            }
        })
    } catch (err) { next(err) }
})

export default router
