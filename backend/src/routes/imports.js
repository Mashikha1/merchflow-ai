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
        if (!imp || imp.createdById !== req.user.id) return res.status(404).json({ error: 'Import not found' })
        res.json(imp)
    } catch (err) { next(err) }
})

// POST /api/imports/preview — parse file and return detected columns + sample rows
router.post('/preview', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'File required' })
        const rows = await parseFile(req.file.path, req.file.originalname)
        if (!rows.length) return res.status(400).json({ error: 'File is empty or could not be parsed' })

        const headers = Object.keys(rows[0])
        const columnMap = autoDetectColumnMap(headers)
        const sampleRows = rows.slice(0, 5)

        res.json({
            headers,
            columnMap,
            sampleRows,
            totalRows: rows.length,
            filePath: req.file.path,
            fileName: req.file.originalname
        })
    } catch (err) { next(err) }
})

// POST /api/imports — upload and process
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        const { source = 'CSV Upload' } = req.body
        let columnMap = {}
        try { columnMap = JSON.parse(req.body.columnMap || '{}') } catch { }

        const fileName = req.file?.originalname || 'api-sync'
        const importRecord = await prisma.import.create({
            data: { source, fileName, status: 'Processing', createdById: req.user.id }
        })

        // Process async
        processImport(importRecord.id, req.file?.path, fileName, columnMap, req.user.id)
        res.status(201).json(importRecord)
    } catch (err) { next(err) }
})

async function processImport(importId, filePath, fileName, columnMap, userId) {
    const errorLog = []
    let successRows = 0
    let failedRows = 0
    let totalRows = 0

    try {
        if (!filePath) throw new Error('No file provided')
        const rows = await parseFile(filePath, fileName)
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

                // Find or create category
                let categoryId = null
                if (data.categoryName) {
                    const slug = data.categoryName.toLowerCase().replace(/\s+/g, '-')
                    const cat = await prisma.category.findFirst({ where: { slug, createdById: userId } })
                    if (cat) {
                        categoryId = cat.id
                    } else {
                        const newCat = await prisma.category.create({
                            data: { name: data.categoryName, slug: `${slug}-${userId}`, createdById: userId }
                        })
                        categoryId = newCat.id
                    }
                }

                // Upsert product by SKU
                const existingProd = await prisma.product.findFirst({ where: { sku: data.sku, createdById: userId } })
                if (existingProd) {
                    await prisma.product.update({
                        where: { id: existingProd.id },
                        data: {
                            name: data.name, description: data.description,
                            price: data.price, cost: data.cost,
                            stock: data.stock, status: data.status,
                            tags: data.tags, categoryId
                        }
                    })
                } else {
                    // Try to avoid global unique constraint conflicts for SKU by adding suffix if needed,
                    // but usually B2B users will have unique SKUs. We'll just create it.
                    await prisma.product.create({
                        data: {
                            sku: `${data.sku}-${userId.substring(0,6)}`, name: data.name,
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
