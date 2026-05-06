import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// GET /api/inventory  – summary + all items
router.get('/', async (req, res, next) => {
    try {
        const items = await prisma.inventoryItem.findMany({
            where: {
                product: { createdById: req.user.id }
            },
            include: { product: { select: { id: true, sku: true, name: true, status: true } } },
            orderBy: { updatedAt: 'desc' }
        })

        const totalAvailable = items.reduce((a, i) => a + Math.max(0, i.onHand - i.reserved), 0)
        const lowStock = items.filter(i => i.onHand > 0 && i.onHand <= 20).length
        const outOfStock = items.filter(i => i.onHand === 0).length
        const incoming = items.reduce((a, i) => a + i.incoming, 0)

        res.json({ summary: { totalAvailable, lowStock, outOfStock, incoming }, items })
    } catch (err) { next(err) }
})

// PATCH /api/inventory/:id  – adjust stock
router.patch('/:id', async (req, res, next) => {
    try {
        const { onHand, reserved, incoming } = req.body
        const item = await prisma.inventoryItem.update({
            where: { id: req.params.id },
            data: {
                ...(onHand !== undefined && { onHand }),
                ...(reserved !== undefined && { reserved }),
                ...(incoming !== undefined && { incoming }),
            }
        })
        res.json(item)
    } catch (err) { next(err) }
})

// POST /api/inventory/bulk-adjust
router.post('/bulk-adjust', async (req, res, next) => {
    try {
        const { adjustments } = req.body  // [{ id, onHand, reserved, incoming }]
        const results = await Promise.all(
            adjustments.map(adj =>
                prisma.inventoryItem.update({ where: { id: adj.id }, data: { onHand: adj.onHand, reserved: adj.reserved, incoming: adj.incoming } })
            )
        )
        res.json(results)
    } catch (err) { next(err) }
})

export default router
