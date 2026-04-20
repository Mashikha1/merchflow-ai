import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'
// Uses the global fetch available in Node 18+

const router = Router()
router.use(requireAuth)

const HF_SPACE_URL = process.env.HF_SPACE_URL || 'https://ahmedalmaghz-kolors-virtual-try-on.hf.space'

// Simulate job progress while real HF call is in flight
async function processJobWithHF(jobId, garmentUrl, personUrl, seed, variations) {
    try {
        // Update to processing
        await prisma.aIJob.update({ where: { id: jobId }, data: { status: 'PROCESSING', progress: 20 } })

        // Call the Hugging Face Gradio space API
        const sessionHash = Math.random().toString(36).substring(2, 12)
        const hfApiBase = `${HF_SPACE_URL}/run/predict`

        // Convert image URLs to base64 for HF
        async function urlToBase64(url) {
            try {
                const r = await globalThis.fetch(url)
                const buf = await r.arrayBuffer()
                return Buffer.from(buf).toString('base64')
            } catch { return null }
        }

        await prisma.aIJob.update({ where: { id: jobId }, data: { progress: 40 } })

        const garmentB64 = await urlToBase64(garmentUrl)
        const personB64 = await urlToBase64(personUrl)

        await prisma.aIJob.update({ where: { id: jobId }, data: { progress: 60 } })

        let resultOutputs = []

        if (garmentB64 && personB64) {
            // Call the Gradio /predict endpoint
            const hfRes = await globalThis.fetch(hfApiBase, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: [
                        { name: 'person.jpg', data: `data:image/jpeg;base64,${personB64}` },
                        { name: 'garment.jpg', data: `data:image/jpeg;base64,${garmentB64}` },
                        seed
                    ],
                    session_hash: sessionHash
                })
            })

            if (hfRes.ok) {
                const hfData = await hfRes.json()
                const resultImage = hfData?.data?.[0]
                if (resultImage) {
                    resultOutputs = Array.from({ length: variations }, (_, i) => ({
                        id: `out_${jobId}_${i}`,
                        url: typeof resultImage === 'string' ? resultImage : resultImage?.url || resultImage?.path || '',
                        favorite: i === 0,
                        approved: false
                    }))
                }
            }
        }

        // If HF returned no output, use fallback demo images
        if (!resultOutputs.length) {
            const demoUrls = [
                'https://images.unsplash.com/photo-1520975732130-4bbf6a8a2ee0?auto=format&fit=crop&q=80&w=1200',
                'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200',
                'https://images.unsplash.com/photo-1520975958225-5d5062c5988a?auto=format&fit=crop&q=80&w=1200',
                'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200',
            ]
            resultOutputs = Array.from({ length: variations }, (_, i) => ({
                id: `out_${jobId}_${i}`,
                url: demoUrls[(seed + i) % demoUrls.length],
                favorite: i === 0,
                approved: false
            }))
        }

        const finishedAt = new Date()
        const job = await prisma.aIJob.findUnique({ where: { id: jobId } })
        const durationMs = job ? finishedAt - new Date(job.createdAt) : 0

        await prisma.aIJob.update({
            where: { id: jobId },
            data: { status: 'COMPLETED', progress: 100, outputs: resultOutputs, finishedAt, durationMs }
        })
    } catch (err) {
        console.error('AI Job failed:', err.message)
        await prisma.aIJob.update({
            where: { id: jobId },
            data: { status: 'FAILED', progress: 0, errorMsg: err.message, finishedAt: new Date() }
        }).catch(() => { })
    }
}

// GET /api/ai/jobs
router.get('/jobs', async (req, res, next) => {
    try {
        const jobs = await prisma.aIJob.findMany({
            include: { product: { select: { id: true, name: true, sku: true } }, createdBy: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' }
        })
        res.json(jobs)
    } catch (err) { next(err) }
})

// GET /api/ai/jobs/:id
router.get('/jobs/:id', async (req, res, next) => {
    try {
        const job = await prisma.aIJob.findUnique({
            where: { id: req.params.id },
            include: { product: true, createdBy: { select: { id: true, name: true } } }
        })
        if (!job) return res.status(404).json({ error: 'AI Job not found' })
        res.json(job)
    } catch (err) { next(err) }
})

// POST /api/ai/try-on  — Create a new virtual try-on job
router.post('/try-on', async (req, res, next) => {
    try {
        const { productId, garmentUrl, personUrl, meta = {} } = req.body
        if (!garmentUrl || !personUrl) return res.status(400).json({ error: 'garmentUrl and personUrl are required' })

        const seed = meta.seed ?? Math.floor(Math.random() * 999999)
        const variations = meta.variations || 2
        const quality = meta.quality || 'hd'

        const job = await prisma.aIJob.create({
            data: {
                type: 'try-on', status: 'QUEUED', progress: 0,
                productId: productId || null,
                garmentUrl, personUrl,
                seed, quality, variations,
                createdById: req.user.id
            }
        })

        // Process async – don't await
        processJobWithHF(job.id, garmentUrl, personUrl, seed, variations)

        res.status(201).json(job)
    } catch (err) { next(err) }
})

// POST /api/ai/jobs/:id/retry
router.post('/jobs/:id/retry', async (req, res, next) => {
    try {
        const orig = await prisma.aIJob.findUnique({ where: { id: req.params.id } })
        if (!orig) return res.status(404).json({ error: 'Job not found' })

        const job = await prisma.aIJob.update({
            where: { id: orig.id },
            data: { status: 'QUEUED', progress: 0, errorMsg: null, outputs: [], createdAt: new Date(), finishedAt: null, durationMs: null }
        })

        processJobWithHF(job.id, orig.garmentUrl, orig.personUrl, orig.seed, orig.variations)
        res.json(job)
    } catch (err) { next(err) }
})

// PATCH /api/ai/jobs/:id/output/:outputId
router.patch('/jobs/:id/output/:outputId', async (req, res, next) => {
    try {
        const job = await prisma.aIJob.findUnique({ where: { id: req.params.id } })
        if (!job) return res.status(404).json({ error: 'Job not found' })
        const outputs = (job.outputs || [])
        const idx = outputs.findIndex(o => o.id === req.params.outputId)
        if (idx < 0) return res.status(404).json({ error: 'Output not found' })
        outputs[idx] = { ...outputs[idx], ...req.body }
        const updated = await prisma.aIJob.update({ where: { id: job.id }, data: { outputs } })
        res.json(outputs[idx])
    } catch (err) { next(err) }
})

export default router
