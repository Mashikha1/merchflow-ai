import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../../uploads'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `${uuidv4()}${ext}`)
    }
})
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4']
        cb(null, allowed.includes(file.mimetype))
    }
})

const router = Router()
router.use(requireAuth)

// GET /api/media
router.get('/', async (req, res, next) => {
    try {
        const { search, tag } = req.query
        const media = await prisma.media.findMany({
            where: {
                ...(search && { filename: { contains: search, mode: 'insensitive' } }),
                ...(tag && { tags: { has: tag } })
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json(media)
    } catch (err) { next(err) }
})

// POST /api/media/upload
router.post('/upload', upload.array('files', 20), async (req, res, next) => {
    try {
        if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' })
        const baseUrl = `${req.protocol}://${req.get('host')}`
        const created = await Promise.all(
            req.files.map(f => prisma.media.create({
                data: {
                    filename: f.originalname,
                    url: `${baseUrl}/uploads/${f.filename}`,
                    mimeType: f.mimetype,
                    size: f.size,
                    tags: []
                }
            }))
        )
        res.status(201).json(created)
    } catch (err) { next(err) }
})

// GET /api/media/:id
router.get('/:id', async (req, res, next) => {
    try {
        const m = await prisma.media.findUnique({ where: { id: req.params.id } })
        if (!m) return res.status(404).json({ error: 'Media not found' })
        res.json(m)
    } catch (err) { next(err) }
})

// PATCH /api/media/:id
router.patch('/:id', async (req, res, next) => {
    try {
        const { alt, tags } = req.body
        const m = await prisma.media.update({
            where: { id: req.params.id },
            data: { ...(alt !== undefined && { alt }), ...(tags && { tags }) }
        })
        res.json(m)
    } catch (err) { next(err) }
})

// DELETE /api/media/:id
router.delete('/:id', async (req, res, next) => {
    try {
        await prisma.media.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

export default router
