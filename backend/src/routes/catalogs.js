import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res, next) => {
    try {
        const catalogs = await prisma.catalog.findMany({ orderBy: { updatedAt: 'desc' } })
        res.json(catalogs)
    } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
    try {
        const catalog = await prisma.catalog.findUnique({ where: { id: req.params.id } })
        if (!catalog) return res.status(404).json({ error: 'Catalog not found' })
        res.json(catalog)
    } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
    try {
        const { name, description, type, template, source, audience, toggles, items, sections } = req.body
        if (!name) return res.status(400).json({ error: 'name required' })
        const catalog = await prisma.catalog.create({
            data: {
                name, description, type: type || 'lookbook', template: template || 'modern',
                source: source || 'collection', audience: audience || 'b2b',
                toggles: toggles || {}, items: items || [], sections: sections || []
            }
        })
        res.status(201).json(catalog)
    } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
    try {
        const { name, description, type, template, source, audience, toggles, status, items, sections } = req.body
        const catalog = await prisma.catalog.update({
            where: { id: req.params.id },
            data: {
                ...(name && { name }), ...(description !== undefined && { description }),
                ...(type && { type }), ...(template && { template }),
                ...(source && { source }), ...(audience && { audience }),
                ...(toggles && { toggles }), ...(status && { status }),
                ...(items !== undefined && { items }),
                ...(sections !== undefined && { sections }),
            }
        })
        res.json(catalog)
    } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
    try {
        await prisma.catalog.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

export default router
