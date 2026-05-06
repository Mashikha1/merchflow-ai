import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res, next) => {
    try {
        const cats = await prisma.category.findMany({
            where: { createdById: req.user.id },
            include: { _count: { select: { products: true } } },
            orderBy: { name: 'asc' }
        })
        res.json(cats)
    } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
    try {
        const cat = await prisma.category.findUnique({ where: { id: req.params.id }, include: { products: true } })
        if (!cat || (cat.createdById && cat.createdById !== req.user.id)) return res.status(404).json({ error: 'Category not found' })
        res.json(cat)
    } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
    try {
        const { name, slug, description, status, aiEnabled } = req.body
        if (!name || !slug) return res.status(400).json({ error: 'name and slug required' })
        // Make slug unique per user
        const userSlug = `${slug}-${req.user.id.substring(0, 6)}`
        const cat = await prisma.category.create({ data: { name, slug: userSlug, description, status, aiEnabled, createdById: req.user.id } })
        res.status(201).json(cat)
    } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
    try {
        const { name, slug, description, status, aiEnabled } = req.body
        const existing = await prisma.category.findUnique({ where: { id: req.params.id } })
        if (!existing || (existing.createdById && existing.createdById !== req.user.id)) return res.status(404).json({ error: 'Category not found' })

        const cat = await prisma.category.update({
            where: { id: req.params.id },
            data: { ...(name && { name }), ...(slug && { slug }), ...(description !== undefined && { description }), ...(status && { status }), ...(aiEnabled !== undefined && { aiEnabled }) }
        })
        res.json(cat)
    } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await prisma.category.findUnique({ where: { id: req.params.id } })
        if (!existing || (existing.createdById && existing.createdById !== req.user.id)) return res.status(404).json({ error: 'Category not found' })

        await prisma.category.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

export default router
