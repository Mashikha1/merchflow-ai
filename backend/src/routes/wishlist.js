import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/wishlist — get user's wishlist (auth optional)
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const items = await prisma.wishlistItem.findMany({
            where: { userId: req.user.id },
            include: { product: { include: { category: true } } },
            orderBy: { createdAt: 'desc' }
        })
        res.json(items)
    } catch (err) { next(err) }
})

// POST /api/wishlist — add item
router.post('/', requireAuth, async (req, res, next) => {
    try {
        const { productId } = req.body
        if (!productId) return res.status(400).json({ error: 'productId required' })

        const item = await prisma.wishlistItem.upsert({
            where: { userId_productId: { userId: req.user.id, productId } },
            create: { userId: req.user.id, productId },
            update: {},
            include: { product: true }
        })
        res.status(201).json(item)
    } catch (err) { next(err) }
})

// DELETE /api/wishlist/:productId — remove item
router.delete('/:productId', requireAuth, async (req, res, next) => {
    try {
        await prisma.wishlistItem.deleteMany({
            where: { userId: req.user.id, productId: req.params.productId }
        })
        res.json({ success: true })
    } catch (err) { next(err) }
})

// DELETE /api/wishlist — clear all
router.delete('/', requireAuth, async (req, res, next) => {
    try {
        await prisma.wishlistItem.deleteMany({ where: { userId: req.user.id } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

export default router
