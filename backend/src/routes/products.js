import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// GET /api/products
router.get('/', async (req, res, next) => {
    try {
        const { search, status, categoryId, collectionId } = req.query
        const products = await prisma.product.findMany({
            where: {
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { sku: { contains: search, mode: 'insensitive' } }
                    ]
                }),
                ...(status && { status: status.toUpperCase() }),
                ...(categoryId && { categoryId }),
                ...(collectionId && { collectionId }),
            },
            include: { category: true, collection: true },
            orderBy: { updatedAt: 'desc' }
        })
        res.json(products)
    } catch (err) { next(err) }
})

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: { category: true, collection: true, inventoryItems: true }
        })
        if (!product) return res.status(404).json({ error: 'Product not found' })
        res.json(product)
    } catch (err) { next(err) }
})

// POST /api/products
router.post('/', async (req, res, next) => {
    try {
        const { sku, name, description, categoryId, collectionId, price, cost, stock, status, images, tags } = req.body
        if (!sku || !name) return res.status(400).json({ error: 'SKU and name required' })

        const product = await prisma.product.create({
            data: {
                sku, name, description, categoryId, collectionId,
                price: price || 0, cost, stock: stock || 0,
                status: status?.toUpperCase() || 'DRAFT',
                images: images || [], tags: tags || []
            },
            include: { category: true, collection: true }
        })

        res.status(201).json(product)
    } catch (err) { next(err) }
})

// PUT /api/products/:id
router.put('/:id', async (req, res, next) => {
    try {
        const { sku, name, description, categoryId, collectionId, price, cost, stock, status, images, tags } = req.body
        const product = await prisma.product.update({
            where: { id: req.params.id },
            data: {
                ...(sku && { sku }), ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(categoryId !== undefined && { categoryId }),
                ...(collectionId !== undefined && { collectionId }),
                ...(price !== undefined && { price }),
                ...(cost !== undefined && { cost }),
                ...(stock !== undefined && { stock }),
                ...(status && { status: status.toUpperCase() }),
                ...(images && { images }),
                ...(tags && { tags }),
            },
            include: { category: true, collection: true }
        })
        res.json(product)
    } catch (err) { next(err) }
})

// DELETE /api/products/:id
router.delete('/:id', async (req, res, next) => {
    try {
        await prisma.product.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

// POST /api/products/bulk-delete
router.post('/bulk-delete', async (req, res, next) => {
    try {
        const { ids } = req.body
        if (!ids?.length) return res.status(400).json({ error: 'ids required' })
        await prisma.product.deleteMany({ where: { id: { in: ids } } })
        res.json({ success: true, deleted: ids.length })
    } catch (err) { next(err) }
})

// PATCH /api/products/bulk-status
router.patch('/bulk-status', async (req, res, next) => {
    try {
        const { ids, status } = req.body
        if (!ids?.length || !status) return res.status(400).json({ error: 'ids and status required' })
        await prisma.product.updateMany({
            where: { id: { in: ids } },
            data: { status: status.toUpperCase() }
        })
        res.json({ success: true })
    } catch (err) { next(err) }
})

export default router
