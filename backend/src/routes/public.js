import { Router } from 'express'
import prisma from '../prisma.js'

const router = Router()

// POST /api/public/track — log a page view (no auth required)
router.post('/track', async (req, res) => {
    try {
        const { entity, entityId, showroomId, visitorId } = req.body
        if (!entity || !entityId) return res.status(400).json({ error: 'entity and entityId required' })

        await prisma.pageView.create({
            data: {
                entity,
                entityId,
                showroomId: showroomId || null,
                visitorId: visitorId || null,
                userAgent: req.headers['user-agent'] || null
            }
        })
        res.json({ tracked: true })
    } catch (err) {
        // Don't fail the page load if tracking fails
        res.json({ tracked: false })
    }
})

// GET /api/public/showroom/:slug — public showroom data (no auth)
router.get('/showroom/:slug', async (req, res, next) => {
    try {
        const showroom = await prisma.showroom.findUnique({
            where: { slug: req.params.slug }
        })
        if (!showroom || showroom.status !== 'Published') {
            return res.status(404).json({ error: 'Showroom not found or not published' })
        }
        res.json(showroom)
    } catch (err) { next(err) }
})

// GET /api/public/catalog/:id — public catalog data (no auth)
router.get('/catalog/:id', async (req, res, next) => {
    try {
        const catalog = await prisma.catalog.findUnique({ where: { id: req.params.id } })
        if (!catalog || catalog.status !== 'Published') {
            return res.status(404).json({ error: 'Catalog not found or not published' })
        }
        res.json(catalog)
    } catch (err) { next(err) }
})

// POST /api/public/quote-request — create quote from public showroom (no auth)
router.post('/quote-request', async (req, res, next) => {
    try {
        const { buyer, items = [], showroomSlug, currency = 'USD' } = req.body
        if (!buyer?.name || !buyer?.email) {
            return res.status(400).json({ error: 'buyer.name and buyer.email required' })
        }

        let showroomId = null
        if (showroomSlug) {
            const sr = await prisma.showroom.findUnique({ where: { slug: showroomSlug } })
            showroomId = sr?.id || null
        }

        const quote = await prisma.quote.create({
            data: {
                buyerName: buyer.name,
                buyerCompany: buyer.company || '',
                buyerEmail: buyer.email,
                buyerPhone: buyer.phone || null,
                buyerCountry: buyer.country || null,
                source: 'Showroom',
                showroomId,
                currency,
                status: 'DRAFT',
                expiryDate: new Date(Date.now() + 14 * 86400000),
                items: {
                    create: items.map(i => ({
                        sku: i.sku || 'N/A',
                        name: i.name,
                        qty: i.qty || 1,
                        unitPrice: i.unitPrice || 0,
                        discountPct: 0,
                        productId: i.productId || null
                    }))
                },
                history: { create: { by: 'Buyer', action: 'Submitted via public showroom' } }
            },
            include: { items: true }
        })
        res.status(201).json({ quoteId: quote.id, success: true })
    } catch (err) { next(err) }
})

export default router
