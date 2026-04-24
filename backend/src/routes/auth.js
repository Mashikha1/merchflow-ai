import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import prisma from '../prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { sendMail, inviteEmailHtml } from '../lib/mailer.js'

const router = Router()
router.use(passport.initialize())

// ─── Google OAuth Strategy ───────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
        scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value
            if (!email) return done(new Error('No email from Google'), null)

            // Find or create user
            let user = await prisma.user.findUnique({ where: { email } })
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        name: profile.displayName || email.split('@')[0],
                        email,
                        password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
                        avatarUrl: profile.photos?.[0]?.value || null,
                        role: 'ADMIN'
                    }
                })
            }
            return done(null, user)
        } catch (err) {
            return done(err, null)
        }
    }))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser(async (id, done) => {
        const user = await prisma.user.findUnique({ where: { id } })
        done(null, user)
    })
}


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
router.post('/forgot-password', async (req, res, next) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ error: 'Email required' })

        const user = await prisma.user.findUnique({ where: { email } })
        // Always return success to prevent email enumeration
        if (!user) return res.json({ message: 'If the email exists, a reset link has been sent.' })

        // Generate a secure token and store as hashed JWT
        const resetToken = crypto.randomBytes(32).toString('hex')
        const tokenJwt = jwt.sign(
            { id: user.id, email: user.email, purpose: 'reset' },
            process.env.JWT_SECRET + resetToken,
            { expiresIn: '1h' }
        )

        // Store reset token hash in user record (we reuse password field temporarily via a separate column would be better, but here we embed in JWT)
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${tokenJwt}&key=${resetToken}`

        await sendMail({
            to: user.email,
            subject: 'Reset your MerchFlow password',
            html: `
                <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;">
                    <h2>Reset Your Password</h2>
                    <p>Hi ${user.name}, click the button below to reset your password. This link expires in 1 hour.</p>
                    <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#C47B2B;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Reset Password</a>
                    <p style="color:#999;font-size:13px;">If you didn't request this, ignore this email.</p>
                </div>
            `
        }).catch(err => console.error('[Reset] Email error:', err.message))

        res.json({ message: 'If the email exists, a reset link has been sent.' })
    } catch (err) { next(err) }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
    try {
        const { token, key, password } = req.body
        if (!token || !key || !password)
            return res.status(400).json({ error: 'token, key and password required' })
        if (password.length < 8)
            return res.status(400).json({ error: 'Password must be at least 8 characters' })

        let payload
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET + key)
        } catch {
            return res.status(400).json({ error: 'Invalid or expired reset link' })
        }

        if (payload.purpose !== 'reset')
            return res.status(400).json({ error: 'Invalid token purpose' })

        const hashed = await bcrypt.hash(password, 12)
        await prisma.user.update({ where: { id: payload.id }, data: { password: hashed } })
        res.json({ message: 'Password reset successfully. You can now log in.' })
    } catch (err) { next(err) }
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, name: true, role: true, title: true, phone: true, avatarUrl: true, brandName: true, brandLogo: true, brandColor: true, brandEmail: true, createdAt: true }
        })
        if (!user) return res.status(404).json({ error: 'User not found' })
        res.json(user)
    } catch (err) { next(err) }
})

// PATCH /api/auth/me — update profile
router.patch('/me', requireAuth, async (req, res, next) => {
    try {
        const { name, title, phone, avatarUrl, brandName, brandLogo, brandColor, brandEmail } = req.body
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name && { name }),
                ...(title !== undefined && { title }),
                ...(phone !== undefined && { phone }),
                ...(avatarUrl !== undefined && { avatarUrl }),
                ...(brandName !== undefined && { brandName }),
                ...(brandLogo !== undefined && { brandLogo }),
                ...(brandColor !== undefined && { brandColor }),
                ...(brandEmail !== undefined && { brandEmail }),
            },
            select: { id: true, email: true, name: true, role: true, title: true, phone: true, avatarUrl: true, brandName: true, brandLogo: true, brandColor: true, brandEmail: true }
        })
        res.json(user)
    } catch (err) { next(err) }
})

// PATCH /api/auth/change-password
router.patch('/change-password', requireAuth, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body
        if (!currentPassword || !newPassword)
            return res.status(400).json({ error: 'currentPassword and newPassword required' })
        if (newPassword.length < 8)
            return res.status(400).json({ error: 'New password must be at least 8 characters' })

        const user = await prisma.user.findUnique({ where: { id: req.user.id } })
        const valid = await bcrypt.compare(currentPassword, user.password)
        if (!valid) return res.status(400).json({ error: 'Current password is incorrect' })

        const hashed = await bcrypt.hash(newPassword, 12)
        await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } })
        res.json({ message: 'Password changed successfully' })
    } catch (err) { next(err) }
})

// GET /api/auth/team — list all users
router.get('/team', requireAuth, async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, title: true, avatarUrl: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
        })
        const invitations = await prisma.invitation.findMany({
            where: { usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' }
        })
        res.json({ users, invitations })
    } catch (err) { next(err) }
})

// POST /api/auth/invite — send team invitation
// POST /api/auth/invite — invite new team member (ADMIN + MERCHANDISER only)
router.post('/invite', requireAuth, requireRole('ADMIN', 'MERCHANDISER'), async (req, res, next) => {
    try {
        const { email, role = 'VIEWER' } = req.body
        if (!email) return res.status(400).json({ error: 'email required' })

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) return res.status(409).json({ error: 'User already exists with this email' })

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        const invitation = await prisma.invitation.create({
            data: { email, role, expiresAt }
        })

        const acceptUrl = `${process.env.FRONTEND_URL}/invite/accept?token=${invitation.token}`
        const inviter = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true, brandName: true } })

        await sendMail({
            to: email,
            subject: `You're invited to join ${inviter?.brandName || 'MerchFlow AI'}`,
            html: inviteEmailHtml({
                inviterName: inviter?.name || req.user.name,
                role,
                brandName: inviter?.brandName || 'MerchFlow AI',
                acceptUrl
            })
        }).catch(err => console.error('[Invite] Email error:', err.message))

        res.status(201).json({ invitation, acceptUrl })
    } catch (err) { next(err) }
})

// POST /api/auth/invite/accept — accept an invitation and create account
router.post('/invite/accept', async (req, res, next) => {
    try {
        const { token, name, password } = req.body
        if (!token || !name || !password)
            return res.status(400).json({ error: 'token, name and password required' })

        const invitation = await prisma.invitation.findUnique({ where: { token } })
        if (!invitation) return res.status(404).json({ error: 'Invitation not found' })
        if (invitation.usedAt) return res.status(400).json({ error: 'Invitation already used' })
        if (new Date(invitation.expiresAt) < new Date()) return res.status(400).json({ error: 'Invitation expired' })

        const exists = await prisma.user.findUnique({ where: { email: invitation.email } })
        if (exists) return res.status(409).json({ error: 'Account already exists' })

        const hashed = await bcrypt.hash(password, 12)
        const user = await prisma.user.create({
            data: { name, email: invitation.email, password: hashed, role: invitation.role }
        })
        await prisma.invitation.update({ where: { token }, data: { usedAt: new Date() } })

        const jwtToken = signToken(user)
        const { password: _, ...safeUser } = user
        res.status(201).json({ token: jwtToken, user: safeUser })
    } catch (err) { next(err) }
})

// PATCH /api/auth/team/:id/role — change a team member's role (ADMIN only)
router.patch('/team/:id/role', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
    try {
        const { role } = req.body
        const validRoles = ['ADMIN', 'MERCHANDISER', 'SALES', 'DESIGNER', 'VIEWER']
        if (!validRoles.includes(role?.toUpperCase()))
            return res.status(400).json({ error: 'Invalid role' })

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { role: role.toUpperCase() },
            select: { id: true, name: true, email: true, role: true }
        })
        res.json(user)
    } catch (err) { next(err) }
})

// DELETE /api/auth/team/:id — remove a team member (ADMIN only)
router.delete('/team/:id', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
    try {
        if (req.params.id === req.user.id)
            return res.status(400).json({ error: 'You cannot remove yourself' })
        await prisma.user.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

// GET /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

// GET /api/auth/google/callback
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login?error=GoogleAuthFailed' }), (req, res) => {
    const token = signToken(req.user)
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`)
})

export default router
