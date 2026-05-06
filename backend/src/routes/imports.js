import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { createReadStream } from 'fs'
import { parse } from 'csv-parse'
import * as xlsx from 'xlsx'
import { readFile } from 'fs/promises'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { createNotification } from './notifications.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const upload = multer({ dest: path.join(__dirname, '../../uploads/imports') })
const router = Router()
router.use(requireAuth)

// Parse CSV or Excel file → array of row objects
async function parseFile(filePath, originalname) {
    const ext = path.extname(originalname).toLowerCase()

    if (ext === '.csv' || ext === '.txt') {
        return new Promise((resolve, reject) => {
            const rows = []
            createReadStream(filePath)
                .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
                .on('data', row => rows.push(row))
                .on('end', () => resolve(rows))
                .on('error', reject)
        })
    }

    if (ext === '.xlsx' || ext === '.xls') {
        const buf = await readFile(filePath)
        const wb = xlsx.read(buf, { type: 'buffer' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        return xlsx.utils.sheet_to_json(ws, { defval: '' })
    }

    throw new Error('Unsupported file type. Use CSV or Excel (.xlsx/.xls).')
}

// Map raw row headers to product fields (case-insensitive, flexible)
function mapRowToProduct(row, columnMap) {
    const get = (key) => {
        const mapped = columnMap[key]
        if (!mapped) return undefined
        return row[mapped]?.toString().trim() || undefined
    }

    const price = parseFloat(get('price')) || 0
    const cost = parseFloat(get('cost')) || undefined
    const stock = parseInt(get('stock')) || 0
    const rawStatus = get('status')?.toUpperCase()
    const validStatuses = ['ACTIVE', 'DRAFT', 'ARCHIVED', 'LOW_STOCK']
    const status = validStatuses.includes(rawStatus) ? rawStatus : 'DRAFT'

    return {
        sku: get('sku'),
        name: get('name'),
        description: get('description') || null,
        price,
        cost,
        stock,
        status,
        tags: get('tags') ? get('tags').split(',').map(t => t.trim()).filter(Boolean) : [],
        categoryName: get('category') || null,
    }
}

// Auto-detect column map from headers
function autoDetectColumnMap(headers) {
    const aliases = {
        sku: ['sku', 'product_id', 'productid', 'product id', 'item_id', 'item code'],
        name: ['name', 'product_name', 'productname', 'product name', 'title', 'item_name'],
        description: ['description', 'desc', 'details', 'product_description'],
        price: ['price', 'retail_price', 'msrp', 'unit_price', 'sale_price'],
        cost: ['cost', 'cost_price', 'wholesale_price', 'buy_price'],
        stock: ['stock', 'quantity', 'qty', 'inventory', 'on_hand', 'units'],
        status: ['status', 'availability', 'product_status'],
        category: ['category', 'category_name', 'department', 'type'],
        tags: ['tags', 'keywords', 'labels'],
    }
    const map = {}
    for (const [field, aliasList] of Object.entries(aliases)) {
        const found = headers.find(h => aliasList.includes(h.toLowerCase().replace(/\s+/g, '_')))
            || headers.find(h => aliasList.some(a => h.toLowerCase().includes(a.split('_')[0])))
        if (found) map[field] = found
    }
    return map
}

// GET /api/imports
router.get('/', async (req, res, next) => {
    try {
        const imports = await prisma.import.findMany({
            where: { createdById: req.user.id },
            include: { createdBy: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' }
        })
        res.json(imports)
    } catch (err) { next(err) }
})

// GET /api/imports/:id
router.get('/:id', async (req, res, next) => {
    try {
        const imp = await prisma.import.findUnique({ where: { id: req.params.id } })
        if (!imp) return res.status(404).json({ error: 'Import not found' })
        res.json(imp)
    } catch (err) { next(err) }
})

// POST /api/imports/preview — parse file and return detected columns + sample rows
router.post('/preview', upload.single('file'), async (req, res, next) => {
    try {
        let rows = []
        if (req.body.source === 'Shopify') {
            rows = [
                { id: 'SH-01', title: 'Shopify T-Shirt', product_type: 'Apparel', variants_price: '29.99', sku: 'SHIRT-01', inventory_quantity: '50' },
                { id: 'SH-02', title: 'Shopify Mug', product_type: 'Accessories', variants_price: '14.99', sku: 'MUG-02', inventory_quantity: '100' },
                { id: 'SH-03', title: 'Shopify Hat', product_type: 'Accessories', variants_price: '19.99', sku: 'HAT-03', inventory_quantity: '30' }
            ]
        } else {
            if (!req.file) return res.status(400).json({ error: 'File required' })
            rows = await parseFile(req.file.path, req.file.originalname)
        }

        if (!rows.length) return res.status(400).json({ error: 'Data is empty or could not be parsed' })

        const headers = Object.keys(rows[0])
        const columnMap = autoDetectColumnMap(headers)
        const sampleRows = rows.slice(0, 5)

        // Count validation issues
        let warningRows = 0
        let failedRows = 0
        for (const row of rows) {
            const data = mapRowToProduct(row, columnMap)
            if (!data.sku || !data.name) {
                failedRows++
            } else {
                const existing = await prisma.product.findUnique({ where: { sku: data.sku } })
                if (existing) warningRows++
            }
        }

        res.json({
            headers,
            columnMap,
            sampleRows,
            totalRows: rows.length,
            warningRows,
            failedRows,
            filePath: req.file?.path,
            fileName: req.file?.originalname || 'shopify_sync'
        })
    } catch (err) { next(err) }
})

// POST /api/imports — upload and process
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        const { source = 'CSV Upload', behavior = 'create_only' } = req.body
        let columnMap = {}
        try { columnMap = JSON.parse(req.body.columnMap || '{}') } catch { }

        const fileName = req.file?.originalname || (source === 'Shopify' ? 'shopify_sync' : 'manual_sync')
        const importRecord = await prisma.import.create({
            data: { source, fileName, status: 'Processing', createdById: req.user.id }
        })

        // Process async
        processImport(importRecord.id, req.file?.path, fileName, columnMap, req.user.id, source, behavior)
        res.status(201).json(importRecord)
    } catch (err) { next(err) }
})

async function processImport(importId, filePath, fileName, columnMap, userId, source, behavior) {
    const errorLog = []
    let successRows = 0
    let failedRows = 0
    let totalRows = 0

    try {
        let rows = []
        if (source === 'Shopify') {
            rows = [
                { id: 'SH-01', title: 'Shopify T-Shirt', product_type: 'Apparel', variants_price: '29.99', sku: 'SHIRT-01', inventory_quantity: '50' },
                { id: 'SH-02', title: 'Shopify Mug', product_type: 'Accessories', variants_price: '14.99', sku: 'MUG-02', inventory_quantity: '100' },
                { id: 'SH-03', title: 'Shopify Hat', product_type: 'Accessories', variants_price: '19.99', sku: 'HAT-03', inventory_quantity: '30' }
            ]
        } else {
            if (!filePath) throw new Error('No file provided')
            rows = await parseFile(filePath, fileName)
        }
        totalRows = rows.length

        // Auto-detect if no column map provided
        if (!Object.keys(columnMap).length && rows.length) {
            columnMap = autoDetectColumnMap(Object.keys(rows[0]))
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            try {
                const data = mapRowToProduct(row, columnMap)
                if (!data.sku || !data.name) {
                    errorLog.push({ row: i + 2, error: 'Missing required SKU or name', raw: row })
                    failedRows++
                    continue
                }

                let categoryId = null
                if (data.categoryName) {
                    const baseSlug = data.categoryName.toLowerCase().replace(/\s+/g, '-')
                    const targetSlug = `${baseSlug}-${userId.substring(0, 8)}`
                    
                    let cat = await prisma.category.findUnique({ where: { slug: targetSlug } })
                    if (!cat) {
                        try {
                            cat = await prisma.category.create({
                                data: { name: data.categoryName, slug: targetSlug, createdById: userId }
                            })
                        } catch (err) {
                            // Fallback if another async loop created it
                            cat = await prisma.category.findUnique({ where: { slug: targetSlug } })
                        }
                    }
                    if (cat) categoryId = cat.id
                }

                // Try to find the product globally by SKU first, then scope by owner
                const globalProd = await prisma.product.findUnique({ where: { sku: data.sku } })
                if (globalProd) {
                    if (behavior === 'skip_duplicates') {
                        errorLog.push({ row: i + 2, error: 'Duplicate skipped due to merge behavior', raw: row })
                        failedRows++
                        continue
                    }

                    if (globalProd.createdById === userId) {
                        if (behavior === 'create_only') {
                            errorLog.push({ row: i + 2, error: 'Product exists, create_only behavior skipped it', raw: row })
                            failedRows++
                            continue
                        }
                        // Own product — update it
                        await prisma.product.update({
                            where: { id: globalProd.id },
                            data: {
                                name: data.name, description: data.description,
                                price: data.price, cost: data.cost,
                                stock: data.stock, status: data.status,
                                tags: data.tags, categoryId
                            }
                        })
                    } else {
                        if (behavior === 'create_only' || behavior === 'update_existing') {
                            // SKU belongs to another user — use a namespaced SKU
                            const { v4: uuidv4 } = await import('uuid')
                            const namespacedSku = `${data.sku}-${uuidv4().split('-')[0]}`
                            await prisma.product.create({
                                data: {
                                    sku: namespacedSku, name: data.name,
                                    description: data.description, price: data.price,
                                    cost: data.cost, stock: data.stock, status: data.status,
                                    tags: data.tags, categoryId, images: [],
                                    createdById: userId
                                }
                            })
                        }
                    }
                } else {
                    // SKU is free — create with original SKU
                    await prisma.product.create({
                        data: {
                            sku: data.sku, name: data.name,
                            description: data.description, price: data.price,
                            cost: data.cost, stock: data.stock, status: data.status,
                            tags: data.tags, categoryId, images: [],
                            createdById: userId
                        }
                    })
                }
                successRows++
            } catch (rowErr) {
                errorLog.push({ row: i + 2, error: rowErr.message, raw: row })
                failedRows++
            }
        }

        await prisma.import.update({
            where: { id: importId },
            data: { status: 'Completed', totalRows, successRows, failedRows, errorLog }
        })

        // Notify user
        if (userId) {
            await createNotification(userId, {
                type: 'import_done',
                title: `Import completed — ${successRows} products imported`,
                body: failedRows > 0 ? `${failedRows} rows had errors` : 'All rows imported successfully',
                link: `/imports/${importId}`
            })
        }
    } catch (err) {
        await prisma.import.update({
            where: { id: importId },
            data: { status: 'Failed', totalRows, successRows, failedRows, errorLog: [{ error: err.message }] }
        }).catch(() => { })
    }
}

export default router
