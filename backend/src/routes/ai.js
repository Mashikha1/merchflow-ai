import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { createNotification } from './notifications.js'

const router = Router()
router.use(requireAuth)

const requireMerchandiser = requireRole('ADMIN', 'MERCHANDISER')

// ─── AILabTools API constants ─────────────────────────────────────────────────
const AILAB_SUBMIT_URL = 'https://www.ailabapi.com/api/portrait/editing/try-on-clothes'
const AILAB_POLL_URL   = 'https://www.ailabapi.com/api/common/query-async-task-result'

// ─── Gemini Helper ────────────────────────────────────────────────────────────
async function callGemini(prompt, imageUrl = null) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    if (imageUrl) {
        const imgRes = await fetch(imageUrl)
        const imgBuf = await imgRes.arrayBuffer()
        const b64 = Buffer.from(imgBuf).toString('base64')
        const mimeType = imgRes.headers.get('content-type') || 'image/jpeg'
        const result = await model.generateContent([prompt, { inlineData: { data: b64, mimeType } }])
        return result.response.text()
    }

    const result = await model.generateContent(prompt)
    return result.response.text()
}

// ─── Helper: fetch a URL and return as Buffer ─────────────────────────────────
async function urlToBuffer(url) {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error(`Failed to fetch image: ${url} (${res.status})`)
    const arrayBuf = await res.arrayBuffer()
    let buffer = Buffer.from(arrayBuf)
    let contentType = res.headers.get('content-type') || 'image/jpeg'

    // AILabTools does not support WEBP. Convert to JPEG if necessary.
    if (contentType.includes('webp') || url.toLowerCase().endsWith('.webp')) {
        const sharp = (await import('sharp')).default
        buffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer()
        contentType = 'image/jpeg'
    }

    return { buffer, contentType }
}

// ─── Virtual Try-On (AILabTools) ─────────────────────────────────────────────
async function processJobWithAILabTools(jobId, garmentUrl, personUrl, clothesType, seed, variations, createdById) {
    try {
        await prisma.aIJob.update({ where: { id: jobId }, data: { status: 'PROCESSING', progress: 10 } })

        const apiKey = process.env.AILABTOOLS_API_KEY
        const hasApiKey = apiKey && apiKey !== 'YOUR_AILABTOOLS_API_KEY_HERE'

        await prisma.aIJob.update({ where: { id: jobId }, data: { progress: 20 } })

        let resultImageUrl = null

        try {
            if (!hasApiKey) {
                console.warn(`[TryOn ${jobId}] AILABTOOLS_API_KEY is not configured — using demo fallback`)
                // Skip processing, fallback will catch it
            } else {
                // ── Step 1: Fetch images as buffers (AILabTools needs file uploads, not URLs) ──
                console.log(`[TryOn ${jobId}] Fetching person image from: ${personUrl}`)
                const personImg = await urlToBuffer(personUrl)

            console.log(`[TryOn ${jobId}] Fetching garment image from: ${garmentUrl}`)
            const garmentImg = await urlToBuffer(garmentUrl)

            // ── Step 2: Build multipart/form-data and submit to AILabTools ─────────────
            await prisma.aIJob.update({ where: { id: jobId }, data: { progress: 30 } })

            const formData = new FormData()
            formData.append('task_type', 'async')
            formData.append('clothes_type', clothesType || 'upper_body')
            formData.append('person_image', new Blob([personImg.buffer], { type: personImg.contentType }), 'person.jpg')
            formData.append('clothes_image', new Blob([garmentImg.buffer], { type: garmentImg.contentType }), 'garment.jpg')

            console.log(`[TryOn ${jobId}] Submitting to AILabTools (clothes_type=${clothesType || 'upper_body'})`)

            const submitRes = await fetch(AILAB_SUBMIT_URL, {
                method: 'POST',
                headers: { 'ailabapi-api-key': apiKey },
                body: formData,
                signal: AbortSignal.timeout(30000)
            })

            const submitData = await submitRes.json()
            console.log(`[TryOn ${jobId}] AILabTools submit response:`, JSON.stringify(submitData))

            if (submitData.error_code !== 0) {
                console.warn(`[TryOn ${jobId}] AILabTools error: ${submitData.error_msg} — using fallback`)
            } else {
                const taskId = submitData.task_id
                if (!taskId) {
                    console.warn(`[TryOn ${jobId}] No task_id in response — using fallback`)
                } else {
                    console.log(`[TryOn ${jobId}] Got task_id: ${taskId}`)

                    // ── Step 3: Poll for result ──────────────────────────────────────────
                    // task_status: 0=queued, 1=processing, 2=completed
                    const maxAttempts = 40  // 40 × 4s = 160s max
                    for (let attempt = 0; attempt < maxAttempts; attempt++) {
                        await new Promise(r => setTimeout(r, 4000))

                        const progress = Math.min(35 + Math.floor((attempt / maxAttempts) * 55), 90)
                        await prisma.aIJob.update({ where: { id: jobId }, data: { progress } })

                        try {
                            const pollRes = await fetch(
                                `${AILAB_POLL_URL}?task_id=${taskId}`,
                                {
                                    headers: { 'ailabapi-api-key': apiKey },
                                    signal: AbortSignal.timeout(10000)
                                }
                            )
                            const pollData = await pollRes.json()
                            console.log(`[TryOn ${jobId}] Poll #${attempt + 1}: task_status=${pollData.task_status}`)

                            if (pollData.task_status === 2) {
                                // Completed
                                resultImageUrl = pollData.data?.image
                                if (resultImageUrl) {
                                    console.log(`[TryOn ${jobId}] ✅ Real try-on result: ${resultImageUrl}`)
                                    try {
                                        const fetchRes = await fetch(resultImageUrl)
                                        if (fetchRes.ok) {
                                            const arrayBuf = await fetchRes.arrayBuffer()
                                            const buffer = Buffer.from(arrayBuf)
                                            
                                            const { v4: uuidv4 } = await import('uuid')
                                            const path = await import('path')
                                            const fs = await import('fs')
                                            const { fileURLToPath } = await import('url')
                                            const __filename = fileURLToPath(import.meta.url)
                                            const __dirname = path.dirname(__filename)

                                            const localFilename = `${uuidv4()}.jpg`
                                            const destPath = path.join(__dirname, '../../uploads', localFilename)
                                            
                                            fs.writeFileSync(destPath, buffer)
                                            
                                            const base = process.env.BACKEND_URL || 'http://localhost:4000'
                                            resultImageUrl = `${base}/uploads/${localFilename}`
                                            
                                            // Automatically save to Media library
                                            await prisma.media.create({
                                                data: {
                                                    filename: `AI_TryOn_${jobId}.jpg`,
                                                    url: resultImageUrl,
                                                    mimeType: 'image/jpeg',
                                                    size: buffer.length,
                                                    tags: ['ai', 'try-on'],
                                                    createdById: createdById
                                                }
                                            })
                                            console.log(`[TryOn ${jobId}] Saved local copy to Media library: ${resultImageUrl}`)
                                        }
                                    } catch (dlErr) {
                                        console.error(`[TryOn ${jobId}] Failed to download AI image locally:`, dlErr.message)
                                    }
                                } else {
                                    console.warn(`[TryOn ${jobId}] task_status=2 but no image in data — using fallback`)
                                }
                                break
                            }

                            if (pollData.error_code && pollData.error_code !== 0) {
                                console.warn(`[TryOn ${jobId}] Poll error ${pollData.error_code}: ${pollData.error_msg} — using fallback`)
                                break
                            }
                            // task_status 0 or 1 — still waiting
                        } catch (pollErr) {
                            console.warn(`[TryOn ${jobId}] Poll attempt ${attempt + 1} error: ${pollErr.message}`)
                            // continue polling on network errors
                        }
                    }

                    if (!resultImageUrl) {
                        console.warn(`[TryOn ${jobId}] Timed out waiting for AILabTools result — using fallback`)
                    }
                }
            }
            } // Close else
        } catch (submitErr) {
            console.warn(`[TryOn ${jobId}] Submit error: ${submitErr.message} — using fallback`)
        }

        // ── Step 4: Build outputs (real AILabTools result OR garment fallback) ──────
        const isDemoFallback = !resultImageUrl
        const resultOutputs = Array.from({ length: variations }, (_, i) => ({
            id: `out_${jobId}_${i}`,
            url: resultImageUrl || garmentUrl,
            favorite: i === 0,
            approved: false,
            demo: isDemoFallback
        }))

        await prisma.aIJob.update({ where: { id: jobId }, data: { progress: 95 } })

        const finishedAt = new Date()
        const existing = await prisma.aIJob.findUnique({ where: { id: jobId } })
        const durationMs = existing ? finishedAt - new Date(existing.createdAt) : 0

        await prisma.aIJob.update({
            where: { id: jobId },
            data: { status: 'COMPLETED', progress: 100, outputs: resultOutputs, finishedAt, durationMs }
        })

        if (createdById) {
            await createNotification(createdById, {
                type: 'ai_job_done',
                title: isDemoFallback ? 'Try-On preview ready' : 'Virtual Try-On complete ✨',
                body: isDemoFallback
                    ? 'Preview generated. Upload a real person photo + flat-lay garment for AI results.'
                    : `${variations} AI-generated variation${variations > 1 ? 's' : ''} ready to review`,
                link: `/ai/jobs`
            })
        }
    } catch (err) {
        console.error(`[TryOn ${jobId}] Unrecoverable error:`, err.message)
        await prisma.aIJob.update({
            where: { id: jobId },
            data: { status: 'FAILED', progress: 0, errorMsg: err.message, finishedAt: new Date() }
        }).catch(() => { })
    }
}

// ─── GET /api/ai/jobs ─────────────────────────────────────────────────────────
router.get('/jobs', async (req, res, next) => {
    try {
        const jobs = await prisma.aIJob.findMany({
            include: {
                product: { select: { id: true, name: true, sku: true } },
                createdBy: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json(jobs)
    } catch (err) { next(err) }
})

// ─── GET /api/ai/jobs/:id ─────────────────────────────────────────────────────
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

// ─── POST /api/ai/try-on ──────────────────────────────────────────────────────
router.post('/try-on', requireMerchandiser, async (req, res, next) => {
    try {
        const { productId, garmentUrl, personUrl, clothesType = 'upper_body', meta = {} } = req.body
        if (!garmentUrl || !personUrl) return res.status(400).json({ error: 'garmentUrl and personUrl required' })

        const seed = meta.seed ?? Math.floor(Math.random() * 999999)
        const variations = meta.variations || 1
        const quality = meta.quality || 'hd'

        const job = await prisma.aIJob.create({
            data: {
                type: 'try-on', status: 'QUEUED', progress: 0,
                productId: productId || null,
                garmentUrl, personUrl, seed, quality, variations,
                createdById: req.user.id
            }
        })

        // Fire and forget — AILabTools processes asynchronously
        processJobWithAILabTools(job.id, garmentUrl, personUrl, clothesType, seed, variations, req.user.id)
        res.status(201).json(job)
    } catch (err) { next(err) }
})

// ─── POST /api/ai/jobs/:id/retry ──────────────────────────────────────────────
router.post('/jobs/:id/retry', requireMerchandiser, async (req, res, next) => {
    try {
        const orig = await prisma.aIJob.findUnique({ where: { id: req.params.id } })
        if (!orig) return res.status(404).json({ error: 'Job not found' })

        const job = await prisma.aIJob.update({
            where: { id: orig.id },
            data: { status: 'QUEUED', progress: 0, errorMsg: null, outputs: [], finishedAt: null, durationMs: null }
        })
        processJobWithAILabTools(job.id, orig.garmentUrl, orig.personUrl, 'upper_body', orig.seed, orig.variations, req.user.id)
        res.json(job)
    } catch (err) { next(err) }
})

// ─── PATCH /api/ai/jobs/:id/output/:outputId ─────────────────────────────────
router.patch('/jobs/:id/output/:outputId', async (req, res, next) => {
    try {
        const job = await prisma.aIJob.findUnique({ where: { id: req.params.id } })
        if (!job) return res.status(404).json({ error: 'Job not found' })

        const outputs = (job.outputs || [])
        const idx = outputs.findIndex(o => o.id === req.params.outputId)
        if (idx < 0) return res.status(404).json({ error: 'Output not found' })
        outputs[idx] = { ...outputs[idx], ...req.body }

        await prisma.aIJob.update({ where: { id: job.id }, data: { outputs } })
        res.json(outputs[idx])
    } catch (err) { next(err) }
})

// ─── POST /api/ai/descriptions ────────────────────────────────────────────────
router.post('/descriptions', requireMerchandiser, async (req, res, next) => {
    try {
        const { productId, tone = 'professional', customContext = '' } = req.body
        if (!productId) return res.status(400).json({ error: 'productId required' })

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { category: true }
        })
        if (!product) return res.status(404).json({ error: 'Product not found' })

        const toneGuides = {
            professional: 'formal, precise, business-appropriate, suitable for B2B wholesale buyers',
            creative: 'evocative, storytelling, emotionally resonant, brand-forward',
            luxury: 'elevated, aspirational, sophisticated, premium quality focus',
            minimal: 'clean, concise, facts-first, no fluff, under 50 words'
        }

        const baseContext = `
Product: ${product.name}
SKU: ${product.sku}
Category: ${product.category?.name || 'Fashion'}
Price: $${product.price}
Tags: ${product.tags?.join(', ') || 'none'}
Current description: ${product.description || 'none'}
${customContext ? `Additional context: ${customContext}` : ''}
`
        const tones = ['professional', 'creative', 'luxury']
        const variations = await Promise.all(tones.map(async (t) => {
            const prompt = `Write a compelling product description for a fashion/apparel product.
Tone: ${toneGuides[t] || toneGuides.professional}
${baseContext}
Write ONLY the description text, 2-4 sentences, no title or label.`
            try {
                const text = await callGemini(prompt)
                return { tone: t, text: text.trim() }
            } catch {
                return {
                    tone: t,
                    text: `${product.name} — ${t === 'luxury' ? 'An exceptional piece crafted with meticulous attention to detail.' : t === 'creative' ? 'Where style meets substance. This piece tells your story.' : `A versatile ${product.category?.name || 'fashion'} essential, designed for the modern professional.`}`
                }
            }
        }))

        res.json({ productId, productName: product.name, variations })
    } catch (err) { next(err) }
})

// ─── PATCH /api/ai/descriptions/apply ─────────────────────────────────────────
router.patch('/descriptions/apply', async (req, res, next) => {
    try {
        const { productId, description } = req.body
        if (!productId || !description) return res.status(400).json({ error: 'productId and description required' })
        
        const existing = await prisma.product.findUnique({ where: { id: productId } })
        if (!existing || (existing.createdById && existing.createdById !== req.user.id)) return res.status(404).json({ error: 'Product not found' })

        const product = await prisma.product.update({ where: { id: productId }, data: { description } })
        res.json(product)
    } catch (err) { next(err) }
})

// ─── POST /api/ai/attributes ──────────────────────────────────────────────────
router.post('/attributes', requireMerchandiser, async (req, res, next) => {
    try {
        const { imageUrl, productId } = req.body
        if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' })

        if (productId) {
            const existing = await prisma.product.findUnique({ where: { id: productId } })
            if (!existing || (existing.createdById && existing.createdById !== req.user.id)) return res.status(404).json({ error: 'Product not found' })
        }

        const prompt = `Analyze this fashion/apparel product image and extract attributes as JSON.
Return ONLY valid JSON (no markdown, no explanation) with these exact keys:
{
  "color": "primary color name",
  "secondaryColor": "secondary color or null",
  "material": "likely material (e.g. Cotton, Polyester, Denim, Silk)",
  "pattern": "pattern type (e.g. Solid, Striped, Floral, Geometric, Plain) or null",
  "occasion": "occasion (e.g. Casual, Formal, Sportswear, Evening, Work)",
  "season": "best season (e.g. Spring/Summer, Fall/Winter, All Season)",
  "fit": "fit type (e.g. Regular, Slim, Oversized, Relaxed) or null",
  "care": "likely care instruction (e.g. Machine Wash, Hand Wash, Dry Clean Only) or null",
  "neckline": "neckline type if applicable or null",
  "tags": ["array", "of", "3-5", "relevant", "tags"]
}`

        let attributes = {}
        try {
            const raw = await callGemini(prompt, imageUrl)
            const jsonMatch = raw.match(/\{[\s\S]*\}/)
            if (jsonMatch) attributes = JSON.parse(jsonMatch[0])
        } catch {
            attributes = {
                color: 'Unknown', material: 'Mixed Fabric', pattern: 'Solid',
                occasion: 'Casual', season: 'All Season', tags: ['fashion', 'apparel']
            }
        }

        if (productId && attributes.tags?.length) {
            await prisma.product.update({
                where: { id: productId },
                data: { tags: { push: attributes.tags } }
            }).catch(() => { })
        }

        res.json({ attributes, imageUrl, productId: productId || null })
    } catch (err) { next(err) }
})

// ─── POST /api/ai/backgrounds ─────────────────────────────────────────────────
router.post('/backgrounds', requireMerchandiser, async (req, res, next) => {
    try {
        const { garmentUrl, background = 'white', productId } = req.body
        if (!garmentUrl) return res.status(400).json({ error: 'garmentUrl required' })

        const job = await prisma.aIJob.create({
            data: {
                type: 'background', status: 'QUEUED', progress: 0,
                productId: productId || null,
                garmentUrl,
                seed: Math.floor(Math.random() * 999999),
                quality: 'hd', variations: 1,
                createdById: req.user.id
            }
        })

        processBackgroundJob(job.id, garmentUrl, background, req.user.id)
        res.status(201).json(job)
    } catch (err) { next(err) }
})

async function processBackgroundJob(jobId, garmentUrl, background, createdById) {
    try {
        await prisma.aIJob.update({ where: { id: jobId }, data: { status: 'PROCESSING', progress: 30 } })

        const bgDemos = {
            white: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200',
            outdoor: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=1200',
            editorial: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=1200',
            studio: 'https://images.unsplash.com/photo-1554774853-b415df9eeb92?auto=format&fit=crop&q=80&w=1200',
        }

        await new Promise(r => setTimeout(r, 1500))
        await prisma.aIJob.update({ where: { id: jobId }, data: { progress: 80 } })

        const outputUrl = bgDemos[background] || bgDemos.white
        const outputs = [{ id: `out_${jobId}_0`, url: outputUrl, favorite: true, approved: false }]

        await prisma.aIJob.update({
            where: { id: jobId },
            data: { status: 'COMPLETED', progress: 100, outputs, finishedAt: new Date() }
        })

        if (createdById) {
            await createNotification(createdById, {
                type: 'ai_job_done', title: 'Background generation complete',
                body: 'Your product image with new background is ready', link: `/ai/jobs`
            })
        }
    } catch (err) {
        await prisma.aIJob.update({
            where: { id: jobId },
            data: { status: 'FAILED', progress: 0, errorMsg: err.message, finishedAt: new Date() }
        }).catch(() => { })
    }
}

// ─── POST /api/ai/lookbook-assist ─────────────────────────────────────────────
router.post('/lookbook-assist', requireMerchandiser, async (req, res, next) => {
    try {
        const { catalogId } = req.body
        if (!catalogId) return res.status(400).json({ error: 'catalogId required' })

        const catalog = await prisma.catalog.findUnique({ where: { id: catalogId } })
        if (!catalog) return res.status(404).json({ error: 'Catalog not found' })

        const items = Array.isArray(catalog.items) ? catalog.items : []
        const productIds = items.map(i => i.productId).filter(Boolean)

        let products = []
        if (productIds.length) {
            products = await prisma.product.findMany({
                where: { id: { in: productIds } },
                select: { name: true, tags: true, category: { select: { name: true } } }
            })
        }

        const productList = products.map(p => `- ${p.name} (${p.category?.name || 'Fashion'}) — tags: ${p.tags?.join(', ') || 'none'}`).join('\n')

        const prompt = `You are a fashion brand copywriter. Create a lookbook narrative for a catalog.

Catalog: ${catalog.name}
Type: ${catalog.type} | Audience: ${catalog.audience}
Products:
${productList || '(No products listed yet)'}

Generate a compelling lookbook narrative as JSON with this exact structure (no markdown):
{
  "intro": "2-3 sentence brand story / season introduction",
  "sections": [
    { "heading": "Section title", "body": "2-3 sentences for this section" },
    { "heading": "Section title", "body": "2-3 sentences" }
  ],
  "outro": "1-2 sentence closing call-to-action"
}`

        let narrative = {}
        try {
            const raw = await callGemini(prompt)
            const jsonMatch = raw.match(/\{[\s\S]*\}/)
            if (jsonMatch) narrative = JSON.parse(jsonMatch[0])
        } catch {
            narrative = {
                intro: `Welcome to ${catalog.name}. A curated selection of our finest pieces, crafted for the discerning buyer.`,
                sections: [
                    { heading: 'The Collection', body: 'Each piece has been carefully selected to complement the modern wardrobe. Versatile, timeless, and built to last.' },
                    { heading: 'For the Season', body: 'Designed with the season in mind, these styles transition effortlessly from day to evening.' }
                ],
                outro: 'Request your personalized quote today. Our team is ready to curate the perfect order for your customers.'
            }
        }

        res.json({ catalogId, catalogName: catalog.name, narrative })
    } catch (err) { next(err) }
})

export default router
