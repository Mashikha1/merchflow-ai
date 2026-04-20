import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// GET /api/customers
router.get('/', async (req, res, next) => {
    try {
        const { search, status, segment, archived } = req.query
        const customers = await prisma.customer.findMany({
            where: {
                archived: archived === 'true' ? true : false,
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { company: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                }),
                ...(status && { status: status.toUpperCase() }),
                ...(segment && { segment }),
            },
            include: {
                notes: { orderBy: { createdAt: 'desc' }, take: 5 },
                reminders: { where: { done: false }, orderBy: { dueAt: 'asc' } },
                _count: { select: { quotes: true } }
            },
            orderBy: { lastActivityAt: 'desc' }
        })
        res.json(customers)
    } catch (err) { next(err) }
})

// GET /api/customers/:id
router.get('/:id', async (req, res, next) => {
    try {
        const c = await prisma.customer.findUnique({
            where: { id: req.params.id },
            include: {
                notes: { orderBy: { createdAt: 'desc' } },
                reminders: { orderBy: { dueAt: 'asc' } },
                quotes: { orderBy: { createdAt: 'desc' }, take: 10 },
                activities: { orderBy: { createdAt: 'desc' }, take: 20 }
            }
        })
        if (!c) return res.status(404).json({ error: 'Customer not found' })
        res.json(c)
    } catch (err) { next(err) }
})

// POST /api/customers
router.post('/', async (req, res, next) => {
    try {
        const {
            name, company, email, phone, segment, country, region, source, status,
            assignedOwner, preferredOrderType, moqExpectations,
            preferredCategories, preferredCollections, tags
        } = req.body
        if (!name || !email || !company) return res.status(400).json({ error: 'name, email and company required' })

        const customer = await prisma.customer.create({
            data: {
                name, company, email, phone, segment, country, region, source,
                status: status?.toUpperCase() || 'PROSPECT',
                assignedOwner, preferredOrderType, moqExpectations,
                preferredCategories: preferredCategories || [],
                preferredCollections: preferredCollections || [],
                tags: tags || []
            }
        })
        res.status(201).json(customer)
    } catch (err) { next(err) }
})

// PUT /api/customers/:id
router.put('/:id', async (req, res, next) => {
    try {
        const customer = await prisma.customer.update({
            where: { id: req.params.id },
            data: { ...req.body, status: req.body.status ? req.body.status.toUpperCase() : undefined, updatedAt: new Date(), lastActivityAt: new Date() }
        })
        res.json(customer)
    } catch (err) { next(err) }
})

// POST /api/customers/:id/notes
router.post('/:id/notes', async (req, res, next) => {
    try {
        const { body } = req.body
        if (!body) return res.status(400).json({ error: 'body required' })
        const note = await prisma.customerNote.create({
            data: { customerId: req.params.id, body, userId: req.user.id }
        })
        await prisma.customer.update({ where: { id: req.params.id }, data: { lastActivityAt: new Date() } })
        res.status(201).json(note)
    } catch (err) { next(err) }
})

// POST /api/customers/:id/reminders
router.post('/:id/reminders', async (req, res, next) => {
    try {
        const { body, dueAt } = req.body
        if (!body || !dueAt) return res.status(400).json({ error: 'body and dueAt required' })
        const reminder = await prisma.customerReminder.create({
            data: { customerId: req.params.id, body, dueAt: new Date(dueAt) }
        })
        res.status(201).json(reminder)
    } catch (err) { next(err) }
})

// PATCH /api/customers/:id/archive
router.patch('/:id/archive', async (req, res, next) => {
    try {
        const customer = await prisma.customer.update({
            where: { id: req.params.id },
            data: { archived: true, updatedAt: new Date() }
        })
        res.json(customer)
    } catch (err) { next(err) }
})

export default router
