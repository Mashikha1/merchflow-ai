import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res, next) => {
    try {
        const showrooms = await prisma.showroom.findMany({
            where: { createdById: req.user.id },
            orderBy: { updatedAt: 'desc' }
        })
        res.json(showrooms)
    } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
    try {
        const s = await prisma.showroom.findUnique({ where: { id: req.params.id } })
        if (!s || (s.createdById && s.createdById !== req.user.id)) return res.status(404).json({ error: 'Showroom not found' })
        res.json(s)
    } catch (err) { next(err) }
})

router.get('/slug/:slug', async (req, res, next) => {
    try {
        const s = await prisma.showroom.findUnique({ where: { slug: req.params.slug } })
        if (!s || (s.createdById && s.createdById !== req.user.id)) return res.status(404).json({ error: 'Showroom not found' })
        res.json(s)
    } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
    try {
        const { name, slug, description, status, coverImage, settings } = req.body
        if (!name || !slug) return res.status(400).json({ error: 'name and slug required' })
        const showroom = await prisma.showroom.create({ data: { name, slug, description, status, coverImage, settings: settings || {}, createdById: req.user.id } })
        res.status(201).json(showroom)
    } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
    try {
        const { name, slug, description, status, coverImage, settings } = req.body
        const existing = await prisma.showroom.findUnique({ where: { id: req.params.id } })
        if (!existing || (existing.createdById && existing.createdById !== req.user.id)) return res.status(404).json({ error: 'Showroom not found' })

        const showroom = await prisma.showroom.update({
            where: { id: req.params.id },
            data: { ...(name && { name }), ...(slug && { slug }), ...(description !== undefined && { description }), ...(status && { status }), ...(coverImage !== undefined && { coverImage }), ...(settings && { settings }) }
        })
        res.json(showroom)
    } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await prisma.showroom.findUnique({ where: { id: req.params.id } })
        if (!existing || (existing.createdById && existing.createdById !== req.user.id)) return res.status(404).json({ error: 'Showroom not found' })

        await prisma.showroom.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

export default router
