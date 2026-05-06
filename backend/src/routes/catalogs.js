import { Router } from 'express'
import prisma from '../prisma.js'
import { requireAuth } from '../middleware/auth.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res, next) => {
    try {
        const isBuyer = req.user.role === 'VIEWER'
        const baseWhere = isBuyer 
            ? { status: { in: ['Published', 'Approved'] } } 
            : {}
            
        const catalogs = await prisma.catalog.findMany({ 
            where: baseWhere,
            orderBy: { updatedAt: 'desc' } 
        })
        res.json(catalogs)
    } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
    try {
        const catalog = await prisma.catalog.findUnique({ where: { id: req.params.id } })
        const isBuyer = req.user.role === 'VIEWER'
        if (!catalog) return res.status(404).json({ error: 'Catalog not found' })
        if (isBuyer && !['Published', 'Approved'].includes(catalog.status)) return res.status(404).json({ error: 'Catalog not available' })
        res.json(catalog)
    } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
    try {
        const { name, description, type, template, source, audience, toggles, items, sections } = req.body
        if (!name) return res.status(400).json({ error: 'name required' })
        const catalog = await prisma.catalog.create({
            data: {
                name, description, type: type || 'lookbook', template: template || 'modern',
                source: source || 'collection', audience: audience || 'b2b',
                toggles: toggles || {}, items: items || [], sections: sections || [],
                createdById: req.user.id
            }
        })
        res.status(201).json(catalog)
    } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
    try {
        const { name, description, type, template, source, audience, toggles, status, items, sections } = req.body
        const existing = await prisma.catalog.findUnique({ where: { id: req.params.id } })
        if (!existing) return res.status(404).json({ error: 'Catalog not found' })

        const catalog = await prisma.catalog.update({
            where: { id: req.params.id },
            data: {
                ...(name && { name }), ...(description !== undefined && { description }),
                ...(type && { type }), ...(template && { template }),
                ...(source && { source }), ...(audience && { audience }),
                ...(toggles && { toggles }), ...(status && { status }),
                ...(items !== undefined && { items }),
                ...(sections !== undefined && { sections }),
            }
        })
        res.json(catalog)
    } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
    try {
        const existing = await prisma.catalog.findUnique({ where: { id: req.params.id } })
        if (!existing) return res.status(404).json({ error: 'Catalog not found' })

        await prisma.catalog.delete({ where: { id: req.params.id } })
        res.json({ success: true })
    } catch (err) { next(err) }
})

// POST /api/catalogs/:id/export-pdf — generate dynamic catalog PDF
router.post('/:id/export-pdf', async (req, res, next) => {
    try {
        const { sections, themeColor: reqThemeColor, fontFamily: reqFontFamily } = req.body
        const catalog = await prisma.catalog.findUnique({ where: { id: req.params.id } })
        if (!catalog) return res.status(404).json({ error: 'Catalog not found' })

        const themeColor = reqThemeColor || catalog.themeColor || '#111111';
        const fontFamily = reqFontFamily || catalog.fontFamily || 'Inter';

        // Fetch products if catalog has items OR if featured_product sections exist
        let productsMap = {}
        const catalogProductIds = (catalog.items && Array.isArray(catalog.items)) ? catalog.items.map(it => it.id).filter(id => !!id) : [];
        const featuredProductIds = (sections || []).filter(s => s.type === 'featured_product' && s.data?.productId).map(s => s.data.productId);
        
        const allProductIds = [...new Set([...catalogProductIds, ...featuredProductIds])];
        
        if (allProductIds.length > 0) {
            const products = await prisma.product.findMany({
                where: { id: { in: allProductIds } }
            })
            products.forEach(p => {
                productsMap[p.id] = p
            })
        }

        // Helper to convert image path to base64
        const getBase64Image = (img) => {
            if (!img) return null;
            if (img.startsWith('data:')) return img;
            
            try {
                // Handle both relative /uploads/ and absolute http://.../uploads/
                let relativePath = img;
                if (img.includes('/uploads/')) {
                    relativePath = img.substring(img.indexOf('/uploads/'));
                }

                if (relativePath.startsWith('/uploads/')) {
                    const filePath = path.join(__dirname, '../..', relativePath);
                    if (fs.existsSync(filePath)) {
                        const bitmap = fs.readFileSync(filePath);
                        const extension = path.extname(filePath).replace('.', '') || 'png';
                        return `data:image/${extension};base64,${bitmap.toString('base64')}`;
                    }
                }
            } catch (e) {
                console.error(`Base64 conversion failed for ${img}:`, e);
            }
            
            // Fallback: use absolute URL if local read fails or if it's already an external URL
            if (img.startsWith('/')) {
                const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
                return `${backendUrl}${img}`;
            }
            return img;
        };

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Roboto+Mono:wght@400;700&display=swap');
                
                body { 
                    font-family: '${fontFamily.split('/')[0].trim()}', 'Inter', -apple-system, sans-serif; 
                    color: #1a1a1a; 
                    margin: 0; 
                    padding: 0; 
                    background: white;
                }
                
                .page { 
                    padding: 60px 50px; 
                    page-break-after: always; 
                    min-height: 29.7cm;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                }
                
                .hero-section { 
                    text-align: center; 
                    padding: 100px 40px; 
                    background: #fdfdfd; 
                    border: 1px solid #f0f0f0;
                    border-radius: 24px; 
                    margin-bottom: 60px;
                    position: relative;
                }
                
                .hero-section h1 { 
                    font-size: 56px; 
                    font-weight: 700;
                    margin: 0 0 12px 0; 
                    color: #111;
                }
                
                .hero-section p { 
                    font-size: 20px; 
                    color: #666; 
                }
                
                .section-container {
                    margin-bottom: 50px;
                }
                
                .section-header {
                    margin-bottom: 30px;
                    padding-bottom: 12px;
                    border-bottom: 2px solid ${themeColor};
                    display: inline-block;
                }
                
                .section-header h2 {
                    font-size: 28px;
                    font-weight: 700;
                    margin: 0;
                }
                
                .product-grid { 
                    display: grid; 
                    grid-template-columns: repeat(2, 1fr); 
                    gap: 30px; 
                }
                
                .product-card { 
                    background: white;
                    border-radius: 16px; 
                    overflow: hidden;
                    text-align: center;
                }
                
                .product-image-container {
                    width: 100%;
                    height: 350px;
                    background: #f7f7f7;
                    border-radius: 12px;
                    overflow: hidden;
                    margin-bottom: 12px;
                }
                
                .product-image { 
                    width: 100%; 
                    height: 100%; 
                    object-fit: contain; 
                }
                
                .product-name { 
                    font-weight: 600; 
                    font-size: 16px; 
                    margin-bottom: 4px;
                    color: #111;
                }
                
                .product-sku { 
                    color: ${themeColor}; 
                    font-size: 13px; 
                    font-weight: 700;
                }

                .footer {
                    margin-top: auto;
                    padding-top: 30px;
                    border-top: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    color: #aaa;
                }

                .theme-accent {
                    color: ${themeColor};
                }

                .theme-bg {
                    background-color: ${themeColor};
                }
                
                .specs-container {
                    background: #fdfdfd; 
                    border: 1px solid #eee; 
                    border-left: 4px solid ${themeColor};
                    border-radius: 16px; 
                    padding: 30px; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    text-align: left;
                }

                .contact-container {
                    background: ${themeColor}; 
                    color: white; 
                    padding: 60px; 
                    border-radius: 24px; 
                    text-align: center; 
                    margin-top: 40px;
                }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="hero-section">
                    <div style="position: absolute; inset: 0; border: 8px solid ${themeColor}; opacity: 0.1; border-radius: 24px; pointer-events: none;"></div>
                    <h1 style="color: ${themeColor}">${catalog.name}</h1>
                    <p>${catalog.description || 'Exclusive Lookbook'}</p>
                </div>
                
                ${(sections || []).map(section => {
                    if (section.type === 'hero') {
                        const heroImg = getBase64Image(section.data?.image);
                        return `
                        <div class="hero-section" style="${heroImg ? `background-image: url(${heroImg}); background-size: cover; background-position: center; color: white;` : ''}">
                            <div style="position: absolute; inset: 0; border: 8px solid ${themeColor}; opacity: 0.1; border-radius: 24px; pointer-events: none;"></div>
                            <h1 style="${heroImg ? 'color: white; text-shadow: 0 2px 10px rgba(0,0,0,0.3);' : `color: ${themeColor}`}">${section.data?.title || catalog.name}</h1>
                            <p style="${heroImg ? 'color: white; text-shadow: 0 1px 5px rgba(0,0,0,0.3);' : ''}">${section.data?.subtitle || catalog.description || ''}</p>
                        </div>`;
                    }

                    if (section.type === 'brand_intro') {
                        const brandLogo = getBase64Image(section.data?.logo);
                        return `
                        <div class="section-container" style="text-align: center; max-width: 600px; margin: 0 auto 60px;">
                            ${brandLogo ? `<img src="${brandLogo}" style="height: 60px; margin-bottom: 30px;" />` : `<div style="height: 60px; width: 60px; background: ${themeColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px; margin: 0 auto 30px;">BR</div>`}
                            <h3 style="font-size: 24px; margin-bottom: 20px; font-family: 'Playfair Display', serif;">${section.data?.content || ''}</h3>
                            <p style="color: #666; line-height: 1.6;">${section.data?.description || ''}</p>
                            <div style="height: 2px; width: 60px; background: ${themeColor}; margin: 30px auto 0;"></div>
                        </div>`;
                    }

                    if (section.type === 'collection_intro') {
                        return `
                        <div class="section-container">
                            <div style="height: 4px; width: 40px; background: ${themeColor}; border-radius: 2px; margin-bottom: 20px;"></div>
                            <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 16px;">${section.data?.title || 'Introducing The Collection'}</h2>
                            <p style="font-size: 16px; color: #444; line-height: 1.6; border-left: 4px solid ${themeColor}; padding-left: 20px;">${section.data?.content || ''}</p>
                            ${section.data?.description ? `<p style="font-size: 14px; color: #888; font-style: italic; margin-top: 10px; border-left: 4px solid ${themeColor}40; padding-left: 20px;">${section.data.description}</p>` : ''}
                        </div>`;
                    }

                    if (section.type === 'product_grid') {
                        // Match frontend logic: Combine linked products + custom slots
                        let catalogProducts = []
                        if (catalog.items && catalog.items.length > 0) {
                            catalogProducts = catalog.items.map(item => {
                                const fullProduct = productsMap[item.id];
                                return {
                                    ...item,
                                    name: fullProduct?.name || item.name || 'Untitled Product',
                                    sku: fullProduct?.sku || item.sku || '—',
                                    price: fullProduct?.price || item.price || 0,
                                    image: fullProduct?.images?.[0] || item.image
                                }
                            });
                        }

                        const totalSlots = Math.max(9, catalogProducts.length);
                        const displayProducts = Array.from({ length: totalSlots }).map((_, i) => {
                            if (i < catalogProducts.length) return catalogProducts[i];
                            return {
                                id: `slot_${i}`,
                                isSlot: true,
                                name: `Custom Item ${i + 1}`
                            };
                        });

                        // Filter for items that actually have content (matching frontend print mode)
                        const printProducts = displayProducts.filter(p => {
                            const hasImage = !!(section.data?.[`image_${p.id}`] || p.image);
                            return hasImage;
                        });

                        if (printProducts.length === 0) return '';

                        return `
                        <div class="section-container">
                            <div class="section-header">
                                <h2 style="border-bottom: 2px solid ${themeColor}; padding-bottom: 8px;">${section.data?.content || 'The Collection'}</h2>
                            </div>
                            <div class="product-grid">
                                ${printProducts.map(p => {
                                    const rawImg = section.data?.[`image_${p.id}`] || p.image;
                                    const productImg = getBase64Image(rawImg);
                                    const customName = section.data?.[`name_${p.id}`] || p.name;
                                    const customPrice = section.data?.[`price_${p.id}`] || (p.price ? `$${Number(p.price).toFixed(2)}` : null);
                                    
                                    return `
                                    <div class="product-card">
                                        <div class="product-image-container">
                                            ${productImg ? `<img class="product-image" src="${productImg}" />` : `<div style="height:100%; background:#f0f0f0;"></div>`}
                                        </div>
                                        <div class="product-info">
                                            <div class="product-name" style="font-size: 14px; font-weight: 700; margin-top: 8px;">${customName}</div>
                                            ${customPrice ? `<div class="product-sku" style="color: ${themeColor}; font-weight: 600; font-size: 12px;">${customPrice}</div>` : ''}
                                        </div>
                                    </div>`;
                                }).join('')}
                            </div>
                        </div>`;
                    }

                    if (section.type === 'pricing') {
                        const displayItems = (catalog.items || []).map(item => {
                            const fullProduct = productsMap[item.id];
                            return {
                                ...item,
                                name: fullProduct?.name || item.name || 'Product',
                                sku: fullProduct?.sku || item.sku || '—',
                                cost: fullProduct?.cost || 0,
                                price: fullProduct?.price || 0
                            }
                        });

                        if (displayItems.length === 0) {
                            return '';
                        }
                        
                        return `
                        <div class="section-container">
                            <h3 style="font-size: 24px; font-weight: 700; margin-bottom: 30px; text-align: center;">${section.data?.content || 'Master Price List'}</h3>
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                <thead>
                                    <tr style="background: ${themeColor}10; border-bottom: 2px solid ${themeColor}; color: ${themeColor}">
                                        <th style="text-align: left; padding: 12px;">SKU</th>
                                        <th style="text-align: left; padding: 12px;">Product Name</th>
                                        <th style="text-align: right; padding: 12px;">Wholesale</th>
                                        <th style="text-align: right; padding: 12px;">MSRP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${displayItems.map(item => `
                                        <tr style="border-bottom: 1px solid #eee;">
                                            <td style="padding: 12px; font-family: monospace; color: #666;">${item.sku}</td>
                                            <td style="padding: 12px; font-weight: 600;">${item.name}</td>
                                            <td style="padding: 12px; text-align: right;">$${Number(item.cost).toFixed(2)}</td>
                                            <td style="padding: 12px; text-align: right;">$${Number(item.price).toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>`;
                    }

                    if (section.type === 'featured_product') {
                        const product = productsMap[section.data?.productId];
                        const featImg = getBase64Image(section.data?.image || product?.images?.[0]);
                        const name = section.data?.title || section.data?.name || product?.name || 'Featured Product';
                        const price = section.data?.price || product?.price || 0;
                        const cost = section.data?.cost || product?.cost || 0;
                        const description = section.data?.description || product?.description || '';

                        const hasPrice = section.data?.price !== undefined && section.data?.price !== '';
                        const hasCost = section.data?.cost !== undefined && section.data?.cost !== '';

                        return `
                        <div class="section-container" style="display: flex; gap: 40px; align-items: center; margin-bottom: 80px;">
                            <div style="flex: 1; height: 500px; background: #f7f7f7; border-radius: 20px; overflow: hidden; border: 1px solid #eee;">
                                ${featImg ? `<img src="${featImg}" style="width: 100%; height: 100%; object-fit: cover;" />` : ''}
                            </div>
                            <div style="flex: 1;">
                                <p style="text-transform: uppercase; letter-spacing: 2px; font-size: 12px; font-weight: 700; color: ${themeColor}; margin-bottom: 12px;">${section.data?.content || 'Spotlight'}</p>
                                <h3 style="font-size: 36px; margin-bottom: 20px; font-family: 'Playfair Display', serif;">${name}</h3>
                                ${(hasPrice || hasCost) ? `
                                    <p style="font-size: 18px; font-weight: 600; color: ${themeColor}; margin-bottom: 24px;">
                                        ${hasPrice ? `$${Number(price).toFixed(2)} MSRP` : ''} 
                                        ${(hasPrice && hasCost) ? ' • ' : ''} 
                                        ${hasCost ? `$${Number(cost).toFixed(2)} WHL` : ''}
                                    </p>
                                ` : ''}
                                <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">${description}</p>
                            </div>
                        </div>`;
                    }

                    if (section.type === 'ai_tryon') {
                        return `
                        <div class="section-container" style="display: flex; gap: 40px; align-items: center; padding: 40px; background: ${themeColor}05; border-radius: 24px; margin-bottom: 60px; border: 1px solid ${themeColor}15;">
                            <div style="flex: 1;">
                                <h3 style="font-size: 28px; font-weight: 700; margin-bottom: 16px;"><span style="color: ${themeColor}">AI Engine:</span> ${section.data?.content || 'Virtual Try-On'}</h3>
                                <p style="color: #666; line-height: 1.6;">${section.data?.description || ''}</p>
                            </div>
                            <div style="flex: 1; height: 300px; background: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: ${themeColor}; border: 2px dashed ${themeColor}40;">
                                <div style="text-align: center;">
                                    <div style="font-size: 40px; margin-bottom: 10px;">✨</div>
                                    <div style="font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">AI Try-On Placement</div>
                                </div>
                            </div>
                        </div>`;
                    }

                    if (section.type === 'specs') {
                        const specs = section.data?.specs || [];
                        return `
                        <div class="section-container" style="text-align: center; margin-bottom: 60px;">
                            <h3 style="font-size: 24px; font-weight: 700; margin-bottom: 30px; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                <span style="color: ${themeColor}">📋</span>
                                ${section.data?.content || 'Technical Specifications'}
                            </h3>
                            <div class="specs-container">
                                ${specs.map(spec => `
                                    <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                                        <span style="color: #666;">${spec.label}</span>
                                        <span style="font-weight: 700; color: #111;">${spec.value}</span>
                                    </div>
                                `).join('')}
                                ${specs.length === 0 ? '<p style="text-align: center; color: #999;">No specifications provided.</p>' : ''}
                            </div>
                        </div>`;
                    }

                    if (section.type === 'contact') {
                        return `
                        <div class="contact-container">
                            <h3 style="font-size: 32px; margin-bottom: 16px;">${section.data?.content || 'Get in Touch'}</h3>
                            <p style="color: #ffffff; opacity: 0.8; margin-bottom: 32px;">${section.data?.description || ''}</p>
                            <div style="display: flex; justify-content: center; gap: 40px; font-size: 14px; font-family: monospace;">
                                <div style="display: flex; align-items: center; gap: 8px;"><span>✉️</span> ${section.data?.email || ''}</div>
                                <div style="display: flex; align-items: center; gap: 8px;"><span>📞</span> ${section.data?.phone || ''}</div>
                            </div>
                        </div>`;
                    }

                    if (section.type === 'footer') {
                        return `
                        <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
                            <div style="font-weight: bold; color: ${themeColor}; letter-spacing: 2px; margin-bottom: 10px; text-transform: uppercase;">Brand</div>
                            <p>${section.data?.content || '© 2026 Brand Name. All rights reserved.'}</p>
                        </div>`;
                    }
                    
                    return '';
                }).join('')}
                
                <div class="footer">
                    <div style="color: ${themeColor}; font-weight: bold;">${catalog.name}</div>
                    <div>Generated by MerchFlow AI</div>
                </div>
            </div>
        </body>
        </html>`;

        const puppeteer = await import('puppeteer')
        const browser = await puppeteer.default.launch({ 
            headless: "new",
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--allow-file-access-from-files'
            ] 
        })
        const page = await browser.newPage()
        
        // Wait for images to load if any
        await page.setContent(html, { waitUntil: 'networkidle0' })
        
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        })
        
        await browser.close()

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.end(pdfBuffer)
    } catch (err) { 
        console.error('PDF Generation Error:', err)
        if (!res.headersSent) {
            res.status(500).json({ error: 'PDF Generation failed' })
        }
    }
})

// GET /api/catalogs/:id/pdf — generate catalog PDF
router.get('/:id/pdf', async (req, res, next) => {
    try {
        const catalog = await prisma.catalog.findUnique({
            where: { id: req.params.id },
            include: { products: { include: { product: { include: { media: { take: 1 } } } } } }
        })
        const isBuyer = req.user.role === 'VIEWER'
        if (!catalog) return res.status(404).json({ error: 'Catalog not found' })
        if (isBuyer && !['Published', 'Approved'].includes(catalog.status)) return res.status(404).json({ error: 'Catalog not available' })

        const items = catalog.products || []
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
            body { font-family: -apple-system, sans-serif; color: #2c2420; margin: 0; }
            .cover { background: #2c2420; color: white; padding: 60px 48px; min-height: 200px; }
            .cover h1 { font-size: 36px; margin: 0 0 8px; }
            .cover p { opacity: 0.7; margin: 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 48px; }
            .product { border: 1px solid #e8e2da; border-radius: 12px; overflow: hidden; }
            .product img { width: 100%; height: 180px; object-fit: cover; background: #f5f5f5; }
            .product-info { padding: 16px; }
            .product-info h3 { margin: 0 0 4px; font-size: 14px; }
            .product-info p { margin: 0; font-size: 12px; color: #8c7e72; }
            footer { text-align: center; padding: 32px; color: #8c7e72; font-size: 12px; border-top: 1px solid #e8e2da; }
        </style></head><body>
            <div class="cover">
                <h1>${catalog.name}</h1>
                <p>${catalog.description || ''} • ${catalog.type} • ${catalog.audience}</p>
            </div>
            <div class="grid">
                ${items.slice(0, 20).map(ci => {
                    const p = ci.product || ci
                    const imgUrl = p.media?.[0]?.url || p.imageUrl || ''
                    return `<div class="product">
                        ${imgUrl ? `<img src="${imgUrl}" alt="${p.name}" />` : '<div style="height:180px;background:#f5f5f5"></div>'}
                        <div class="product-info">
                            <h3>${p.name || 'Product'}</h3>
                            <p>SKU: ${p.sku || '—'} • $${p.price || '0'}</p>
                        </div>
                    </div>`
                }).join('')}
            </div>
            <footer>Generated by MerchFlow AI • ${new Date().toLocaleDateString()}</footer>
        </body></html>`

        try {
            const puppeteer = await import('puppeteer')
            const browser = await puppeteer.default.launch({ args: ['--no-sandbox'] })
            const page = await browser.newPage()
            await page.setContent(html, { waitUntil: 'networkidle0' })
            const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
            await browser.close()
            res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="catalog-${catalog.id}.pdf"` })
            return res.send(pdfBuffer)
        } catch {
            res.set({ 'Content-Type': 'text/html', 'Content-Disposition': `attachment; filename="catalog-${catalog.id}.html"` })
            return res.send(html)
        }
    } catch (err) { next(err) }
})

export default router
