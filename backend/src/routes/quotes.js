import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { sendMail, quoteEmailHtml } from '../lib/mailer.js'
import { createNotification } from './notifications.js'

const router = Router()
router.use(requireAuth)

function computeTotals(items = []) {
    const subtotal = items.reduce((a, i) => a + i.qty * Number(i.unitPrice), 0)
    const discount = items.reduce((a, i) => a + i.qty * Number(i.unitPrice) * ((i.discountPct || 0) / 100), 0)
    const total = Math.max(0, subtotal - discount)
    return { subtotal, discount, tax: 0, total }
}

async function autoExpire(quote) {
    if (
        quote.expiryDate &&
        new Date(quote.expiryDate) < new Date() &&
        !['EXPIRED', 'CONVERTED_TO_ORDER'].includes(quote.status)
    ) {
        return await prisma.quote.update({
            where: { id: quote.id },
            data: {
                status: 'EXPIRED',
                history: { create: { by: 'System', action: 'Expired automatically' } }
            },
            include: { items: true, history: true, customer: true, assignedTo: true }
        })
    }
    return quote
}

async function getBrandSettings(userId) {
    if (!userId) return {}
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { brandName: true, brandColor: true, brandEmail: true }
    })
    return user || {}
}

// GET /api/quotes
router.get('/', async (req, res, next) => {
    try {
        const { status, search, archived } = req.query
        const isBuyer = req.user.role === 'VIEWER'
        const baseWhere = isBuyer 
            ? { archived: archived === 'true', buyerEmail: req.user.email }
            : { archived: archived === 'true', createdById: req.user.id }

        let quotes = await prisma.quote.findMany({
            where: {
                ...baseWhere,
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
        quotes = await Promise.all(quotes.map(autoExpire))
        res.json(quotes.map(q => ({ ...q, totals: computeTotals(q.items) })))
    } catch (err) { next(err) }
})

// GET /api/quotes/:id
router.get('/:id', async (req, res, next) => {
    try {
        if (req.params.id === 'buyers') return next() // handled below
        let quote = await prisma.quote.findUnique({
            where: { id: req.params.id },
            include: { items: { include: { product: true } }, history: { orderBy: { at: 'asc' } }, customer: true, assignedTo: { select: { id: true, name: true } } }
        })
        const isBuyer = req.user.role === 'VIEWER'
        if (!quote || (isBuyer && quote.buyerEmail !== req.user.email)) return res.status(404).json({ error: 'Quote not found' })
        quote = await autoExpire(quote)
        res.json({ ...quote, totals: computeTotals(quote.items) })
    } catch (err) { next(err) }
})

// POST /api/quotes
router.post('/', async (req, res, next) => {
    try {
        let { buyer, buyerName, buyerEmail, buyerCompany, buyerPhone, buyerCountry, source, items = [], currency, expiryDate, assignedToId, customerId, internalNotes } = req.body
        
        // Handle payload from Buyer Portal
        if (!buyer && buyerName && buyerEmail) {
            buyer = { name: buyerName, email: buyerEmail, company: buyerCompany, phone: buyerPhone, country: buyerCountry }
        }
        
        if (!buyer?.name || !buyer?.email) return res.status(400).json({ error: 'buyer.name and buyer.email required' })

        const isBuyer = req.user.role === 'VIEWER'

        let targetSellerId = req.user.id
        if (isBuyer && items.length > 0 && items[0].productId) {
            const firstProduct = await prisma.product.findUnique({ where: { id: items[0].productId } })
            if (firstProduct && firstProduct.createdById) {
                targetSellerId = firstProduct.createdById
            }
        }

        const quote = await prisma.quote.create({
            data: {
                buyerName: buyer.name, buyerCompany: buyer.company || '', buyerEmail: buyer.email,
                buyerPhone: buyer.phone, buyerCountry: buyer.country,
                source: source || (isBuyer ? 'Buyer Portal' : 'Sales'), currency: currency || 'USD',
                expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 14 * 86400000),
                assignedToId, customerId, internalNotes,
                items: { create: items.map(i => ({ sku: i.sku, name: i.name, qty: i.qty, unitPrice: i.unitPrice, discountPct: i.discountPct || 0, productId: i.productId })) },
                history: { create: { by: req.user.name, action: 'Created draft' } },
                createdById: targetSellerId
            },
            include: { items: true, history: true, customer: true }
        })
        res.status(201).json({ ...quote, totals: computeTotals(quote.items) })
    } catch (err) { next(err) }
})

// PUT /api/quotes/:id
router.put('/:id', async (req, res, next) => {
    try {
        const { items, status, internalNotes, expiryDate, assignedToId } = req.body
        const existing = await prisma.quote.findUnique({ where: { id: req.params.id } })
        const isBuyer = req.user.role === 'VIEWER'
        if (!existing || (isBuyer && existing.buyerEmail !== req.user.email)) return res.status(404).json({ error: 'Quote not found' })

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
                history: { create: { by: req.user.name, action: `Updated${status ? ' — status: ' + status : ''}` } }
            },
            include: { items: true, history: { orderBy: { at: 'asc' } }, customer: true }
        })
        res.json({ ...quote, totals: computeTotals(quote.items) })
    } catch (err) { next(err) }
})

// POST /api/quotes/:id/send — send quote via email
router.post('/:id/send', async (req, res, next) => {
    try {
        const existing = await prisma.quote.findUnique({ where: { id: req.params.id } })
        const isBuyer = req.user.role === 'VIEWER'
        if (!existing || (isBuyer && existing.buyerEmail !== req.user.email)) return res.status(404).json({ error: 'Quote not found' })

        const quote = await prisma.quote.update({
            where: { id: req.params.id },
            data: { status: 'SENT', history: { create: { by: req.user.name, action: 'Sent to buyer' } } },
            include: { items: true, history: true, customer: true }
        })

        const brand = await getBrandSettings(req.user.id)

        // Send real email
        sendMail({
            to: quote.buyerEmail,
            subject: `Quote from ${brand.brandName || 'MerchFlow AI'} — ${quote.id}`,
            html: quoteEmailHtml({ quote, brandName: brand.brandName, brandColor: brand.brandColor })
        }).catch(err => console.error('[Quote Email]', err.message))

        // Notify the sender
        await createNotification(req.user.id, {
            type: 'quote_sent',
            title: `Quote sent to ${quote.buyerName}`,
            body: `${quote.buyerCompany} — ${quote.id}`,
            link: `/quotes`
        })

        res.json({ ...quote, totals: computeTotals(quote.items) })
    } catch (err) { next(err) }
})

// POST /api/quotes/:id/approve
router.post('/:id/approve', async (req, res, next) => {
    try {
        const existing = await prisma.quote.findUnique({ where: { id: req.params.id } })
        const isBuyer = req.user.role === 'VIEWER'
        if (!existing || (isBuyer && existing.buyerEmail !== req.user.email)) return res.status(404).json({ error: 'Quote not found' })

        const quote = await prisma.quote.update({
            where: { id: req.params.id },
            data: { status: 'APPROVED', history: { create: { by: req.user.name, action: 'Approved' } } },
            include: { items: true, history: true }
        })

        // Send confirmation to buyer
        const brand = await getBrandSettings(req.user.id)
        sendMail({
            to: quote.buyerEmail,
            subject: `Quote Approved — ${quote.id}`,
            html: `<p>Hi ${quote.buyerName}, your quote #${quote.id} has been approved by ${brand.brandName || 'our team'}. We'll be in touch shortly.</p>`
        }).catch(err => console.error('[Approve Email]', err.message))

        res.json({ ...quote, totals: computeTotals(quote.items) })
    } catch (err) { next(err) }
})

// POST /api/quotes/:id/convert
router.post('/:id/convert', async (req, res, next) => {
    try {
        const existing = await prisma.quote.findUnique({ where: { id: req.params.id } })
        const isBuyer = req.user.role === 'VIEWER'
        if (!existing || (isBuyer && existing.buyerEmail !== req.user.email)) return res.status(404).json({ error: 'Quote not found' })

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
        const isBuyer = req.user.role === 'VIEWER'
        if (!orig || (isBuyer && orig.buyerEmail !== req.user.email)) return res.status(404).json({ error: 'Quote not found' })
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

// PATCH /api/quotes/:id — partial update (status, assignedToId, internalNotes)
router.patch('/:id', async (req, res, next) => {
    try {
        const { status, assignedToId, internalNotes } = req.body
        const existing = await prisma.quote.findUnique({ where: { id: req.params.id } })
        const isBuyer = req.user.role === 'VIEWER'
        if (!existing || (isBuyer && existing.buyerEmail !== req.user.email)) return res.status(404).json({ error: 'Quote not found' })

        const quote = await prisma.quote.update({
            where: { id: req.params.id },
            data: {
                ...(status && { status: status.toUpperCase().replace(/ /g, '_') }),
                ...(assignedToId !== undefined && { assignedToId }),
                ...(internalNotes !== undefined && { internalNotes }),
                history: {
                    create: {
                        by: req.user.name,
                        action: status ? `Status changed to ${status.replace(/_/g, ' ')}` : 'Updated'
                    }
                }
            },
            include: { items: true, history: { orderBy: { at: 'desc' } }, customer: true, assignedTo: { select: { id: true, name: true } } }
        })
        res.json({ ...quote, totals: computeTotals(quote.items) })
    } catch (err) { next(err) }
})

// POST /api/quotes/:id/notes — add internal note to audit trail
router.post('/:id/notes', async (req, res, next) => {
    try {
        const { note, user: byName } = req.body
        if (!note?.trim()) return res.status(400).json({ error: 'note is required' })
        const existing = await prisma.quote.findUnique({ where: { id: req.params.id } })
        const isBuyer = req.user.role === 'VIEWER'
        if (!existing || (isBuyer && existing.buyerEmail !== req.user.email)) return res.status(404).json({ error: 'Quote not found' })

        const entry = await prisma.quoteHistory.create({
            data: {
                quoteId: req.params.id,
                by: byName || req.user.name,
                action: `Note: ${note.trim()}`
            }
        })
        res.status(201).json(entry)
    } catch (err) { next(err) }
})

// DELETE /api/quotes/:id — hard delete a quote
router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await prisma.quote.findUnique({ where: { id: req.params.id } })
        const isBuyer = req.user.role === 'VIEWER'
        if (!existing || (isBuyer && existing.buyerEmail !== req.user.email)) return res.status(404).json({ error: 'Quote not found' })

        await prisma.quote.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

// PATCH /api/quotes/:id/archive
router.patch('/:id/archive', async (req, res, next) => {
    try {
        const existing = await prisma.quote.findUnique({ where: { id: req.params.id } })
        const isBuyer = req.user.role === 'VIEWER'
        if (!existing || (isBuyer && existing.buyerEmail !== req.user.email)) return res.status(404).json({ error: 'Quote not found' })

        await prisma.quote.update({ where: { id: req.params.id }, data: { archived: true } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

// GET /api/quotes/buyers/list
router.get('/buyers/list', async (req, res, next) => {
    try {
        const buyers = await prisma.customer.findMany({
            where: { archived: false },
            select: { id: true, name: true, company: true, email: true, country: true, phone: true },
            orderBy: { name: 'asc' }
        })
        res.json(buyers)
    } catch (err) { next(err) }
})

// GET /api/quotes/:id/pdf — generate PDF
router.get('/:id/pdf', async (req, res, next) => {
    try {
        const quote = await prisma.quote.findUnique({
            where: { id: req.params.id },
            include: { items: true, customer: true }
        })
        const isBuyer = req.user.role === 'VIEWER'
        if (!quote || (isBuyer && quote.buyerEmail !== req.user.email)) return res.status(404).json({ error: 'Quote not found' })

        const brand = await getBrandSettings(req.user.id)
        const { quoteEmailHtml: htmlFn } = await import('../lib/mailer.js')
        const html = htmlFn({ quote, brandName: brand.brandName, brandColor: brand.brandColor })

        try {
            const { default: puppeteer } = await import('puppeteer')
            const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
            const page = await browser.newPage()
            await page.setContent(html, { waitUntil: 'networkidle0' })
            const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } })
            await browser.close()

            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition', `attachment; filename="quote-${quote.id}.pdf"`)
            res.send(pdf)
        } catch (puppErr) {
            // Fallback: return HTML as download if puppeteer fails
            res.setHeader('Content-Type', 'text/html')
            res.setHeader('Content-Disposition', `attachment; filename="quote-${quote.id}.html"`)
            res.send(html)
        }
    } catch (err) { next(err) }
})

export default router
