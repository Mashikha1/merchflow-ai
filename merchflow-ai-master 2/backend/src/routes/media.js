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
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4']
        cb(null, allowed.includes(file.mimetype))
    }
})

const router = Router()
router.use(requireAuth)

function mediaUrl(filename) {
    const base = process.env.BACKEND_URL || 'http://localhost:4000'
    return `${base}/uploads/${filename}`
}

// GET /api/media
router.get('/', async (req, res, next) => {
    try {
        const { search, tag } = req.query
        const media = await prisma.media.findMany({
            where: {
                createdById: req.user.id,
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
        const created = await Promise.all(
            req.files.map(f => prisma.media.create({
                data: {
                    filename: f.originalname,
                    url: mediaUrl(f.filename),
                    mimeType: f.mimetype,
                    size: f.size,
                    tags: [],
                    createdById: req.user.id
                }
            }))
        )
        res.status(201).json(created)
    } catch (err) { next(err) }
})

import fs from 'fs'

// POST /api/media/upload-url — save a remote URL as a media record
router.post('/upload-url', async (req, res, next) => {
    try {
        const { url, filename = 'ai-generated.jpg', tags = [] } = req.body
        if (!url) return res.status(400).json({ error: 'url required' })

        // Download the image locally because remote AILabTools URLs expire
        let finalUrl = url
        let finalSize = 0
        try {
            const fetchRes = await fetch(url)
            if (fetchRes.ok) {
                const arrayBuf = await fetchRes.arrayBuffer()
                const buffer = Buffer.from(arrayBuf)
                
                const ext = path.extname(filename) || '.jpg'
                const localFilename = `${uuidv4()}${ext}`
                const destPath = path.join(__dirname, '../../uploads', localFilename)
                
                fs.writeFileSync(destPath, buffer)
                
                finalUrl = mediaUrl(localFilename)
                finalSize = buffer.length
            }
        } catch (downloadErr) {
            console.error('Failed to download remote url to local media library:', downloadErr)
            // fallback to just storing the URL
        }

        const created = await prisma.media.create({
            data: { filename, url: finalUrl, mimeType: 'image/jpeg', size: finalSize, tags, createdById: req.user.id }
        })
        res.status(201).json(created)
    } catch (err) { next(err) }
})

// GET /api/media/:id
router.get('/:id', async (req, res, next) => {
    try {
        const m = await prisma.media.findUnique({ where: { id: req.params.id } })
        if (!m || m.createdById !== req.user.id) return res.status(404).json({ error: 'Media not found' })
        res.json(m)
    } catch (err) { next(err) }
})

// PATCH /api/media/:id
router.patch('/:id', async (req, res, next) => {
    try {
        const { alt, tags, filename } = req.body
        const m = await prisma.media.findUnique({ where: { id: req.params.id } })
        if (!m || m.createdById !== req.user.id) return res.status(404).json({ error: 'Media not found' })

        const updated = await prisma.media.update({
            where: { id: req.params.id },
            data: {
                ...(alt !== undefined && { alt }),
                ...(tags && { tags }),
                ...(filename && { filename })
            }
        })
        res.json(updated)
    } catch (err) { next(err) }
})

// DELETE /api/media/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const m = await prisma.media.findUnique({ where: { id: req.params.id } })
        if (!m || (m.createdById && m.createdById !== req.user.id)) return res.status(404).json({ error: 'Media not found' })

        // Physically delete file if it's local
        if (m.url && m.url.includes('/uploads/')) {
            const filename = m.url.split('/uploads/')[1]
            if (filename) {
                const localPath = path.join(__dirname, '../../uploads', filename)
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath)
                }
            }
        }

        await prisma.media.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

export default router
