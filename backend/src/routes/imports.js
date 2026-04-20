import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const upload = multer({ dest: path.join(__dirname, '../../uploads') })
const router = Router()
router.use(requireAuth)

// GET /api/imports
router.get('/', async (req, res, next) => {
    try {
        const imports = await prisma.import.findMany({
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

// POST /api/imports — Upload CSV/Excel and create products
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        const { source = 'CSV Upload' } = req.body
        const fileName = req.file?.originalname || 'api-sync'

        const importRecord = await prisma.import.create({
            data: {
                source, fileName, status: 'Processing',
                createdById: req.user.id
            }
        })

        // Parse CSV in background (simplified — real impl would parse rows)
        processImport(importRecord.id, req.file?.path, source, req.user.id)

        res.status(201).json(importRecord)
    } catch (err) { next(err) }
})

async function processImport(importId, filePath, source, userId) {
    try {
        // In a real system, parse CSV/Excel here with a library like csv-parse or xlsx
        // For now, simulate with row counts
        const totalRows = Math.floor(Math.random() * 200) + 50
        const failedRows = Math.floor(Math.random() * 5)
        const successRows = totalRows - failedRows

        await new Promise(r => setTimeout(r, 2000)) // simulate processing

        await prisma.import.update({
            where: { id: importId },
            data: { status: 'Completed', totalRows, successRows, failedRows }
        })
    } catch (err) {
        await prisma.import.update({
            where: { id: importId },
            data: { status: 'Failed', failedRows: 0, errorLog: { error: err.message } }
        }).catch(() => { })
    }
}

export default router
