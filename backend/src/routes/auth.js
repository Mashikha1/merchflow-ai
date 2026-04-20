import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prisma.js'

const router = Router()

function signToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )
}

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password required' })

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return res.status(401).json({ error: 'Invalid credentials' })

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

        const token = signToken(user)
        const { password: _, ...safeUser } = user
        res.json({ token, user: safeUser })
    } catch (err) { next(err) }
})

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
    try {
        const { name, email, password, role = 'VIEWER' } = req.body
        if (!name || !email || !password)
            return res.status(400).json({ error: 'Name, email and password required' })

        const exists = await prisma.user.findUnique({ where: { email } })
        if (exists) return res.status(409).json({ error: 'Email already registered' })

        const hashed = await bcrypt.hash(password, 12)
        const user = await prisma.user.create({
            data: { name, email, password: hashed, role }
        })
        const token = signToken(user)
        const { password: _, ...safeUser } = user
        res.status(201).json({ token, user: safeUser })
    } catch (err) { next(err) }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    // In production: send reset email. For now, acknowledge.
    res.json({ message: 'If the email exists, a reset link has been sent.' })
})

export default router
