import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res, next) => {
    try {
        const isBuyer = req.user.role === 'VIEWER'
        const baseWhere = isBuyer 
            ? { status: { in: ['Published', 'Approved'] } } 
            : {}
            
        const catalogs = await prisma.catalog.findMany({ 
            where: baseWhere,
            orderBy: { updatedAt: 'desc' } 
        })
        res.json(catalogs)
    } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
    try {
        const catalog = await prisma.catalog.findUnique({ where: { id: req.params.id } })
        const isBuyer = req.user.role === 'VIEWER'
        if (!catalog) return res.status(404).json({ error: 'Catalog not found' })
        if (isBuyer && !['Published', 'Approved'].includes(catalog.status)) return res.status(404).json({ error: 'Catalog not available' })
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
                toggles: toggles || {}, items: items || [], sections: sections || [],
                createdById: req.user.id
            }
        })
        res.status(201).json(catalog)
    } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
    try {
        const { name, description, type, template, source, audience, toggles, status, items, sections } = req.body
        const existing = await prisma.catalog.findUnique({ where: { id: req.params.id } })
        if (!existing) return res.status(404).json({ error: 'Catalog not found' })

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
        const existing = await prisma.catalog.findUnique({ where: { id: req.params.id } })
        if (!existing) return res.status(404).json({ error: 'Catalog not found' })

        await prisma.catalog.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

// GET /api/catalogs/:id/pdf — generate catalog PDF
router.get('/:id/pdf', async (req, res, next) => {
    try {
        const catalog = await prisma.catalog.findUnique({
            where: { id: req.params.id },
            include: { products: { include: { product: { include: { media: { take: 1 } } } } } }
        })
        const isBuyer = req.user.role === 'VIEWER'
        if (!catalog) return res.status(404).json({ error: 'Catalog not found' })
        if (isBuyer && !['Published', 'Approved'].includes(catalog.status)) return res.status(404).json({ error: 'Catalog not available' })

        const items = catalog.products || []
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
            body { font-family: -apple-system, sans-serif; color: #2c2420; margin: 0; }
            .cover { background: #2c2420; color: white; padding: 60px 48px; min-height: 200px; }
            .cover h1 { font-size: 36px; margin: 0 0 8px; }
            .cover p { opacity: 0.7; margin: 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 48px; }
            .product { border: 1px solid #e8e2da; border-radius: 12px; overflow: hidden; }
            .product img { width: 100%; height: 180px; object-fit: cover; background: #f5f5f5; }
            .product-info { padding: 16px; }
            .product-info h3 { margin: 0 0 4px; font-size: 14px; }
            .product-info p { margin: 0; font-size: 12px; color: #8c7e72; }
            footer { text-align: center; padding: 32px; color: #8c7e72; font-size: 12px; border-top: 1px solid #e8e2da; }
        </style></head><body>
            <div class="cover">
                <h1>${catalog.name}</h1>
                <p>${catalog.description || ''} • ${catalog.type} • ${catalog.audience}</p>
            </div>
            <div class="grid">
                ${items.slice(0, 20).map(ci => {
                    const p = ci.product || ci
                    const imgUrl = p.media?.[0]?.url || p.imageUrl || ''
                    return `<div class="product">
                        ${imgUrl ? `<img src="${imgUrl}" alt="${p.name}" />` : '<div style="height:180px;background:#f5f5f5"></div>'}
                        <div class="product-info">
                            <h3>${p.name || 'Product'}</h3>
                            <p>SKU: ${p.sku || '—'} • $${p.price || '0'}</p>
                        </div>
                    </div>`
                }).join('')}
            </div>
            <footer>Generated by MerchFlow AI • ${new Date().toLocaleDateString()}</footer>
        </body></html>`

        try {
            const puppeteer = await import('puppeteer')
            const browser = await puppeteer.default.launch({ args: ['--no-sandbox'] })
            const page = await browser.newPage()
            await page.setContent(html, { waitUntil: 'networkidle0' })
            const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
            await browser.close()
            res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="catalog-${catalog.id}.pdf"` })
            return res.send(pdfBuffer)
        } catch {
            res.set({ 'Content-Type': 'text/html', 'Content-Disposition': `attachment; filename="catalog-${catalog.id}.html"` })
            return res.send(html)
        }
    } catch (err) { next(err) }
})

export default router
