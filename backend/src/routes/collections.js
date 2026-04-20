import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res, next) => {
    try {
        const cols = await prisma.collection.findMany({
            include: { _count: { select: { products: true } } },
            orderBy: { updatedAt: 'desc' }
        })
        res.json(cols)
    } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
    try {
        const col = await prisma.collection.findUnique({ where: { id: req.params.id }, include: { products: true } })
        if (!col) return res.status(404).json({ error: 'Collection not found' })
        res.json(col)
    } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
    try {
        const { name, description, type, layout, status } = req.body
        if (!name) return res.status(400).json({ error: 'name required' })
        const col = await prisma.collection.create({ data: { name, description, type, layout, status } })
        res.status(201).json(col)
    } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
    try {
        const { name, description, type, layout, status } = req.body
        const col = await prisma.collection.update({
            where: { id: req.params.id },
            data: { ...(name && { name }), ...(description !== undefined && { description }), ...(type && { type }), ...(layout && { layout }), ...(status && { status }) }
        })
        res.json(col)
    } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
    try {
        await prisma.collection.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

export default router
