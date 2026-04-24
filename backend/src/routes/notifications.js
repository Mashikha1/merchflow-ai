import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// GET /api/notifications
router.get('/', async (req, res, next) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        })
        const unreadCount = notifications.filter(n => !n.readAt).length
        res.json({ notifications, unreadCount })
    } catch (err) { next(err) }
})

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
    try {
        const n = await prisma.notification.update({
            where: { id: req.params.id },
            data: { readAt: new Date() }
        })
        res.json(n)
    } catch (err) { next(err) }
})

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res, next) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.id, readAt: null },
            data: { readAt: new Date() }
        })
        res.json({ success: true })
    } catch (err) { next(err) }
})

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res, next) => {
    try {
        await prisma.notification.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

// Helper to create a notification (used internally)
export async function createNotification(userId, { type, title, body, link }) {
    try {
        return await prisma.notification.create({
            data: { userId, type, title, body: body || null, link: link || null }
        })
    } catch (err) {
        console.error('[Notification] Failed to create:', err.message)
    }
}

export default router
