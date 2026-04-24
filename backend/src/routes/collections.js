import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res, next) => {
    try {
        const cols = await prisma.collection.findMany({
            where: { createdById: req.user.id },
            include: { _count: { select: { products: true } } },
            orderBy: { updatedAt: 'desc' }
        })
        res.json(cols)
    } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
    try {
        const col = await prisma.collection.findUnique({ where: { id: req.params.id }, include: { products: true } })
        if (!col || (col.createdById && col.createdById !== req.user.id)) return res.status(404).json({ error: 'Collection not found' })
        res.json(col)
    } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
    try {
        const { name, description, type, layout, status } = req.body
        if (!name) return res.status(400).json({ error: 'name required' })
        const col = await prisma.collection.create({ data: { name, description, type, layout, status, createdById: req.user.id } })
        res.status(201).json(col)
    } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
    try {
        const { name, description, type, layout, status } = req.body
        const existing = await prisma.collection.findUnique({ where: { id: req.params.id } })
        if (!existing || (existing.createdById && existing.createdById !== req.user.id)) return res.status(404).json({ error: 'Collection not found' })

        const col = await prisma.collection.update({
            where: { id: req.params.id },
            data: { ...(name && { name }), ...(description !== undefined && { description }), ...(type && { type }), ...(layout && { layout }), ...(status && { status }) }
        })
        res.json(col)
    } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await prisma.collection.findUnique({ where: { id: req.params.id } })
        if (!existing || (existing.createdById && existing.createdById !== req.user.id)) return res.status(404).json({ error: 'Collection not found' })

        await prisma.collection.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

// POST /api/collections/:id/products — add a product to a collection
router.post('/:id/products', async (req, res, next) => {
    try {
        const { productId } = req.body
        if (!productId) return res.status(400).json({ error: 'productId required' })
        const existingCol = await prisma.collection.findUnique({ where: { id: req.params.id } })
        if (!existingCol || (existingCol.createdById && existingCol.createdById !== req.user.id)) return res.status(404).json({ error: 'Collection not found' })

        const existingProd = await prisma.product.findUnique({ where: { id: productId } })
        if (!existingProd || (existingProd.createdById && existingProd.createdById !== req.user.id)) return res.status(404).json({ error: 'Product not found' })

        const product = await prisma.product.update({
            where: { id: productId },
            data: { collectionId: req.params.id }
        })
        res.status(201).json({ success: true, product })
    } catch (err) { next(err) }
})

// DELETE /api/collections/:id/products/:productId — remove a product from a collection
router.delete('/:id/products/:productId', async (req, res, next) => {
    try {
        const existingProd = await prisma.product.findUnique({ where: { id: req.params.productId } })
        if (!existingProd || (existingProd.createdById && existingProd.createdById !== req.user.id)) return res.status(404).json({ error: 'Product not found' })

        await prisma.product.update({
            where: { id: req.params.productId },
            data: { collectionId: null }
        })
        res.json({ success: true })
    } catch (err) { next(err) }
})

export default router
