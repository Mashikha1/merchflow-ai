import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// GET /api/variants/:productId — list variants for a product
router.get('/product/:productId', async (req, res, next) => {
    try {
        const variants = await prisma.variant.findMany({
            where: { productId: req.params.productId },
            orderBy: [{ color: 'asc' }, { size: 'asc' }]
        })
        res.json(variants)
    } catch (err) { next(err) }
})

// POST /api/variants — create a variant
router.post('/', async (req, res, next) => {
    try {
        const { productId, sku, color, size, material, stock, price, images } = req.body
        if (!productId || !sku) return res.status(400).json({ error: 'productId and sku are required' })

        const variant = await prisma.variant.create({
            data: { productId, sku, color, size, material, stock: stock || 0, price, images: images || [] }
        })
        res.status(201).json(variant)
    } catch (err) { next(err) }
})

// POST /api/variants/bulk — create multiple variants at once
router.post('/bulk', async (req, res, next) => {
    try {
        const { productId, variants } = req.body
        if (!productId || !Array.isArray(variants) || !variants.length)
            return res.status(400).json({ error: 'productId and variants[] required' })

        // Delete existing variants for this product
        await prisma.variant.deleteMany({ where: { productId } })

        const created = await prisma.variant.createMany({
            data: variants.map(v => ({
                productId,
                sku: v.sku,
                color: v.color || null,
                size: v.size || null,
                material: v.material || null,
                stock: v.stock || 0,
                price: v.price || null,
                images: v.images || []
            }))
        })
        const result = await prisma.variant.findMany({ where: { productId } })
        res.status(201).json(result)
    } catch (err) { next(err) }
})

// PUT /api/variants/:id — update a variant
router.put('/:id', async (req, res, next) => {
    try {
        const { sku, color, size, material, stock, price, images } = req.body
        const variant = await prisma.variant.update({
            where: { id: req.params.id },
            data: {
                ...(sku && { sku }),
                ...(color !== undefined && { color }),
                ...(size !== undefined && { size }),
                ...(material !== undefined && { material }),
                ...(stock !== undefined && { stock }),
                ...(price !== undefined && { price }),
                ...(images && { images }),
            }
        })
        res.json(variant)
    } catch (err) { next(err) }
})

// DELETE /api/variants/:id
router.delete('/:id', async (req, res, next) => {
    try {
        await prisma.variant.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

// PATCH /api/variants/:id/stock — quick stock update
router.patch('/:id/stock', async (req, res, next) => {
    try {
        const { stock } = req.body
        if (stock === undefined) return res.status(400).json({ error: 'stock required' })
        const variant = await prisma.variant.update({
            where: { id: req.params.id },
            data: { stock: Number(stock) }
        })
        res.json(variant)
    } catch (err) { next(err) }
})

export default router
