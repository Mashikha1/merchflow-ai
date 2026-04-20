import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

function computeTotals(items = []) {
    const subtotal = items.reduce((a, i) => a + i.qty * Number(i.unitPrice), 0)
    const discount = items.reduce((a, i) => a + i.qty * Number(i.unitPrice) * ((i.discountPct || 0) / 100), 0)
    const total = Math.max(0, subtotal - discount)
    return { subtotal, discount, tax: 0, total }
}

// Auto-expire helper
async function autoExpire(quote) {
    if (
        quote.expiryDate &&
        new Date(quote.expiryDate) < new Date() &&
        !['EXPIRED', 'CONVERTED_TO_ORDER'].includes(quote.status)
    ) {
        const updated = await prisma.quote.update({
            where: { id: quote.id },
            data: {
                status: 'EXPIRED',
                history: { create: { by: 'System', action: 'Expired automatically' } }
            },
            include: { items: true, history: true, customer: true, assignedTo: true }
        })
        return updated
    }
    return quote
}

// GET /api/quotes
router.get('/', async (req, res, next) => {
    try {
        const { status, search, archived } = req.query
        let quotes = await prisma.quote.findMany({
            where: {
                archived: archived === 'true' ? true : false,
                ...(status && { status: status.toUpperCase() }),
                ...(search && {
                    OR: [
                        { buyerName: { contains: search, mode: 'insensitive' } },
                        { buyerCompany: { contains: search, mode: 'insensitive' } },
                        { id: { contains: search, mode: 'insensitive' } }
                    ]
                })
            },
            include: { items: true, history: { orderBy: { at: 'asc' } }, customer: true, assignedTo: { select: { id: true, name: true } } },
            orderBy: { updatedAt: 'desc' }
        })
        // Auto-expire in background
        quotes = await Promise.all(quotes.map(autoExpire))
        res.json(quotes.map(q => ({ ...q, totals: computeTotals(q.items) })))
    } catch (err) { next(err) }
})

// GET /api/quotes/:id
router.get('/:id', async (req, res, next) => {
    try {
        let quote = await prisma.quote.findUnique({
            where: { id: req.params.id },
            include: { items: { include: { product: true } }, history: { orderBy: { at: 'asc' } }, customer: true, assignedTo: { select: { id: true, name: true } } }
        })
        if (!quote) return res.status(404).json({ error: 'Quote not found' })
        quote = await autoExpire(quote)
        res.json({ ...quote, totals: computeTotals(quote.items) })
    } catch (err) { next(err) }
})

// POST /api/quotes
router.post('/', async (req, res, next) => {
    try {
        const { buyer, source, items = [], currency, expiryDate, assignedToId, customerId, internalNotes } = req.body
        if (!buyer?.name || !buyer?.email) return res.status(400).json({ error: 'buyer.name and buyer.email required' })

        const quote = await prisma.quote.create({
            data: {
                buyerName: buyer.name, buyerCompany: buyer.company || '', buyerEmail: buyer.email,
                buyerPhone: buyer.phone, buyerCountry: buyer.country,
                source: source || 'Sales', currency: currency || 'USD',
                expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 14 * 86400000),
                assignedToId, customerId, internalNotes,
                items: { create: items.map(i => ({ sku: i.sku, name: i.name, qty: i.qty, unitPrice: i.unitPrice, discountPct: i.discountPct || 0, productId: i.productId })) },
                history: { create: { by: req.user.name, action: 'Created draft' } }
            },
            include: { items: true, history: true, customer: true }
        })
        res.status(201).json(quote)
    } catch (err) { next(err) }
})

// PUT /api/quotes/:id
router.put('/:id', async (req, res, next) => {
    try {
        const { items, status, internalNotes, expiryDate, assignedToId } = req.body
        const quote = await prisma.quote.update({
            where: { id: req.params.id },
            data: {
                ...(status && { status: status.toUpperCase().replace(/ /g, '_') }),
                ...(internalNotes !== undefined && { internalNotes }),
                ...(expiryDate && { expiryDate: new Date(expiryDate) }),
                ...(assignedToId !== undefined && { assignedToId }),
                ...(items && {
                    items: { deleteMany: {}, create: items.map(i => ({ sku: i.sku, name: i.name, qty: i.qty, unitPrice: i.unitPrice, discountPct: i.discountPct || 0, productId: i.productId })) }
                }),
                history: { create: { by: req.user.name, action: `Updated ${status ? '– status: ' + status : ''}` } }
            },
            include: { items: true, history: { orderBy: { at: 'asc' } }, customer: true }
        })
        res.json({ ...quote, totals: computeTotals(quote.items) })
    } catch (err) { next(err) }
})

// POST /api/quotes/:id/send
router.post('/:id/send', async (req, res, next) => {
    try {
        const quote = await prisma.quote.update({
            where: { id: req.params.id },
            data: { status: 'SENT', history: { create: { by: req.user.name, action: 'Sent to buyer' } } },
            include: { items: true, history: true }
        })
        res.json({ ...quote, totals: computeTotals(quote.items) })
    } catch (err) { next(err) }
})

// POST /api/quotes/:id/approve
router.post('/:id/approve', async (req, res, next) => {
    try {
        const quote = await prisma.quote.update({
            where: { id: req.params.id },
            data: { status: 'APPROVED', history: { create: { by: req.user.name, action: 'Approved' } } },
            include: { items: true, history: true }
        })
        res.json({ ...quote, totals: computeTotals(quote.items) })
    } catch (err) { next(err) }
})

// POST /api/quotes/:id/convert
router.post('/:id/convert', async (req, res, next) => {
    try {
        const quote = await prisma.quote.update({
            where: { id: req.params.id },
            data: { status: 'CONVERTED_TO_ORDER', history: { create: { by: req.user.name, action: 'Converted to order' } } },
            include: { items: true, history: true }
        })
        res.json({ ...quote, totals: computeTotals(quote.items) })
    } catch (err) { next(err) }
})

// POST /api/quotes/:id/duplicate
router.post('/:id/duplicate', async (req, res, next) => {
    try {
        const orig = await prisma.quote.findUnique({ where: { id: req.params.id }, include: { items: true } })
        if (!orig) return res.status(404).json({ error: 'Quote not found' })
        const copy = await prisma.quote.create({
            data: {
                buyerName: orig.buyerName, buyerCompany: orig.buyerCompany, buyerEmail: orig.buyerEmail,
                buyerPhone: orig.buyerPhone, buyerCountry: orig.buyerCountry,
                source: orig.source, currency: orig.currency, customerId: orig.customerId,
                expiryDate: new Date(Date.now() + 14 * 86400000),
                items: { create: orig.items.map(i => ({ sku: i.sku, name: i.name, qty: i.qty, unitPrice: i.unitPrice, discountPct: i.discountPct, productId: i.productId })) },
                history: { create: { by: req.user.name, action: 'Duplicated from ' + orig.id } }
            },
            include: { items: true, history: true }
        })
        res.status(201).json({ ...copy, totals: computeTotals(copy.items) })
    } catch (err) { next(err) }
})

// PATCH /api/quotes/:id/archive
router.patch('/:id/archive', async (req, res, next) => {
    try {
        await prisma.quote.update({ where: { id: req.params.id }, data: { archived: true } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

// GET /api/quotes/buyers/list
router.get('/buyers/list', async (req, res, next) => {
    try {
        const buyers = await prisma.customer.findMany({
            where: { archived: false },
            select: { id: true, name: true, company: true, email: true, country: true },
            orderBy: { name: 'asc' }
        })
        res.json(buyers)
    } catch (err) { next(err) }
})

export default router
