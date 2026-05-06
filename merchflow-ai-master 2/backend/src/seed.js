// seed.js – Seeds the MerchFlow AI database with realistic demo data
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding MerchFlow AI database...\n')

    // ─── Clear existing data ───────────────────────────────────────────────────
    await prisma.customerReminder.deleteMany()
    await prisma.customerNote.deleteMany()
    await prisma.quoteHistory.deleteMany()
    await prisma.quoteItem.deleteMany()
    await prisma.quote.deleteMany()
    await prisma.aIJob.deleteMany()
    await prisma.inventoryItem.deleteMany()
    await prisma.import.deleteMany()
    await prisma.media.deleteMany()
    await prisma.showroom.deleteMany()
    await prisma.catalog.deleteMany()
    await prisma.product.deleteMany()
    await prisma.collection.deleteMany()
    await prisma.category.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.user.deleteMany()
    console.log('✅ Cleared existing data')

    // ─── Users ────────────────────────────────────────────────────────────────
    const password = await bcrypt.hash('password', 12)
    const [admin, sarah, alex] = await Promise.all([
        prisma.user.create({ data: { name: 'Aisha Rahman', email: 'admin@merchflow.ai', password, role: 'ADMIN', title: 'Merchandising Lead', phone: '+1 (212) 555-0186' } }),
        prisma.user.create({ data: { name: 'Sarah M.', email: 'sarah@aurorastudio.co', password, role: 'SALES', title: 'Sales Manager' } }),
        prisma.user.create({ data: { name: 'Alex D.', email: 'alex@aurorastudio.co', password, role: 'MERCHANDISER', title: 'Senior Merchandiser' } }),
    ])
    console.log('✅ Created 3 users')

    // ─── Categories ───────────────────────────────────────────────────────────
    const [catTshirts, catShirts, catOuterwear, catPants, catKnitwear, catAccessories] = await Promise.all([
        prisma.category.create({ data: { name: 'T-Shirts', slug: 't-shirts', description: 'Core and graphic tees', status: 'Active', aiEnabled: true } }),
        prisma.category.create({ data: { name: 'Shirts', slug: 'shirts', description: 'Formal and casual shirts', status: 'Active', aiEnabled: true } }),
        prisma.category.create({ data: { name: 'Outerwear', slug: 'outerwear', description: 'Jackets and coats', status: 'Active', aiEnabled: false } }),
        prisma.category.create({ data: { name: 'Pants', slug: 'pants', description: 'Trousers and bottoms', status: 'Active', aiEnabled: false } }),
        prisma.category.create({ data: { name: 'Knitwear', slug: 'knitwear', description: 'Sweaters and cardigans', status: 'Active', aiEnabled: true } }),
        prisma.category.create({ data: { name: 'Accessories', slug: 'accessories', description: 'Hats, bags and more', status: 'Active', aiEnabled: false } }),
    ])
    console.log('✅ Created 6 categories')

    // ─── Collections ──────────────────────────────────────────────────────────
    const [colEssentials, colSummer26, colCoreDenim, colFall26, colWinter26] = await Promise.all([
        prisma.collection.create({ data: { name: 'Essentials', description: 'Core everyday essentials', type: 'manual', layout: 'grid', status: 'Active' } }),
        prisma.collection.create({ data: { name: 'Summer 26', description: 'Summer 2026 collection', type: 'manual', layout: 'lookbook', status: 'Active' } }),
        prisma.collection.create({ data: { name: 'Core Denim', description: 'Denim fundamentals', type: 'manual', layout: 'grid', status: 'Active' } }),
        prisma.collection.create({ data: { name: 'Fall 26', description: 'Fall 2026 collection', type: 'dynamic', layout: 'lookbook', status: 'Draft' } }),
        prisma.collection.create({ data: { name: 'Winter 26', description: 'Winter 2026 collection', type: 'manual', layout: 'grid', status: 'Draft' } }),
    ])
    console.log('✅ Created 5 collections')

    // ─── Products ─────────────────────────────────────────────────────────────
    const products = await Promise.all([
        prisma.product.create({
            data: {
                sku: 'TS-CORE-WHT', name: 'Core Cotton T-Shirt', description: 'Premium 100% organic cotton tee, pre-shrunk and durable.',
                categoryId: catTshirts.id, collectionId: colEssentials.id,
                price: 24.00, cost: 8.00, stock: 850, status: 'ACTIVE', aiAssets: 3,
                images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
                tags: ['organic', 'bestseller', 'core']
            }
        }),
        prisma.product.create({
            data: {
                sku: 'TS-CORE-BLK', name: 'Core Cotton T-Shirt – Black', description: 'Same great cut, midnight black colorway.',
                categoryId: catTshirts.id, collectionId: colEssentials.id,
                price: 24.00, cost: 8.00, stock: 42, status: 'LOW_STOCK', aiAssets: 2,
                images: ['https://images.unsplash.com/photo-1503342217505-b0a15cf70489?w=800'],
                tags: ['organic', 'core']
            }
        }),
        prisma.product.create({
            data: {
                sku: 'SH-LN-BEI', name: 'Summer Linen Button-Down', description: 'Breathable linen shirt, perfect for warm seasons.',
                categoryId: catShirts.id, collectionId: colSummer26.id,
                price: 65.00, cost: 22.00, stock: 120, status: 'ACTIVE', aiAssets: 5,
                images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800'],
                tags: ['linen', 'summer', 'bestseller']
            }
        }),
        prisma.product.create({
            data: {
                sku: 'JK-DNM-BLU', name: 'Vintage Wash Denim Jacket', description: 'Distressed denim jacket with authentic vintage wash.',
                categoryId: catOuterwear.id, collectionId: colCoreDenim.id,
                price: 110.00, cost: 38.00, stock: 8, status: 'LOW_STOCK', aiAssets: 0,
                images: ['https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800'],
                tags: ['denim', 'vintage']
            }
        }),
        prisma.product.create({
            data: {
                sku: 'TR-CRP-OD', name: 'Cropped Cargo Trousers', description: 'Relaxed fit cargo trousers with utility pockets.',
                categoryId: catPants.id, collectionId: colFall26.id,
                price: 85.00, cost: 28.00, stock: 0, status: 'DRAFT', aiAssets: 1,
                images: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800'],
                tags: ['cargo', 'fall']
            }
        }),
        prisma.product.create({
            data: {
                sku: 'SW-CASH-GRY', name: 'Cashmere Blend Sweater', description: 'Luxurious 30% cashmere blend, ultra-soft and warm.',
                categoryId: catKnitwear.id, collectionId: colWinter26.id,
                price: 145.00, cost: 52.00, stock: 210, status: 'ACTIVE', aiAssets: 4,
                images: ['https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800'],
                tags: ['cashmere', 'winter', 'premium']
            }
        }),
    ])
    console.log('✅ Created 6 products')

    // ─── Inventory ────────────────────────────────────────────────────────────
    await Promise.all(products.map(p =>
        prisma.inventoryItem.create({
            data: { productId: p.id, location: 'Main Hub', onHand: p.stock, reserved: Math.floor(p.stock * 0.1), incoming: Math.floor(Math.random() * 100) }
        })
    ))
    console.log('✅ Created inventory items for all products')

    // ─── Customers ────────────────────────────────────────────────────────────
    const [custMina, custOmar, custCamila, custKeiko, custNora, custSophie, custDylan] = await Promise.all([
        prisma.customer.create({
            data: {
                name: 'Mina Park', company: 'Aurora Atelier', email: 'mina@auroraatelier.co', phone: '+1 (212) 555-0181',
                segment: 'Wholesale Buyer', country: 'US', region: 'New York, NY', source: 'Showroom', status: 'ACTIVE',
                assignedOwner: 'Sarah M.', preferredOrderType: 'Seasonal buy', moqExpectations: 'MOQ 60 / style',
                preferredCategories: ['Shirts', 'Essentials'], preferredCollections: ['Summer 26', 'Essentials'],
                tags: ['priority', 'repeat-buyer'], lifetimeValue: 168000, ordersPlaced: 7
            }
        }),
        prisma.customer.create({
            data: {
                name: 'Omar Haddad', company: 'Saffron Wholesale', email: 'omar@saffronwholesale.com', phone: '+44 20 7946 0912',
                segment: 'Distributor', country: 'UK', region: 'London', source: 'Sales', status: 'ACTIVE',
                assignedOwner: 'Alex D.', preferredOrderType: 'Reorder program', moqExpectations: 'MOQ 120 / style',
                preferredCategories: ['Outerwear', 'Denim'], preferredCollections: ['Core Denim'],
                tags: ['negotiation'], lifetimeValue: 92000, ordersPlaced: 3
            }
        }),
        prisma.customer.create({
            data: {
                name: 'Camila Reyes', company: 'Northwind Buyers', email: 'camila@northwindbuyers.io', phone: '+1 (646) 555-0102',
                segment: 'Retail Partner', country: 'US', region: 'NYC', source: 'Inbound', status: 'PROSPECT',
                assignedOwner: 'Sarah M.', preferredOrderType: 'Test buy', moqExpectations: 'MOQ flexible',
                preferredCategories: ['Knitwear', 'Pants'], preferredCollections: ['Winter 26', 'Fall 26'],
                tags: ['viewed-quote'], lifetimeValue: 0, ordersPlaced: 0
            }
        }),
        prisma.customer.create({
            data: {
                name: 'Keiko Tanaka', company: 'Lumen Dept. Store', email: 'keiko@lumen.jp', phone: '+81 3-5555-0191',
                segment: 'Wholesale Buyer', country: 'JP', region: 'Tokyo', source: 'Sales', status: 'ACTIVE',
                assignedOwner: 'Alex D.', preferredOrderType: 'Core replenishment', moqExpectations: 'MOQ 300 / sku',
                preferredCategories: ['T-Shirts', 'Essentials'], preferredCollections: ['Essentials'],
                tags: ['high-value'], lifetimeValue: 260000, ordersPlaced: 12
            }
        }),
        prisma.customer.create({
            data: {
                name: 'Nora Fischer', company: 'Helio Concept', email: 'nora@helioconcept.de', phone: '+49 30 5550 0101',
                segment: 'Boutique', country: 'DE', region: 'Berlin', source: 'Import', status: 'INACTIVE',
                assignedOwner: 'Sarah M.', preferredOrderType: 'Capsule drops', moqExpectations: 'MOQ 30 / style',
                preferredCategories: ['Essentials'], preferredCollections: ['Essentials'],
                tags: ['expired-quote'], lifetimeValue: 14000, ordersPlaced: 1
            }
        }),
        prisma.customer.create({
            data: {
                name: 'Sophie Laurent', company: 'Maison Lumière', email: 'sophie@maisonlumiere.fr', phone: '+33 1 84 88 00 01',
                segment: 'Boutique', country: 'FR', region: 'Paris', source: 'Sales', status: 'PROSPECT',
                assignedOwner: 'Alex D.', preferredOrderType: 'Editorial selection', moqExpectations: 'MOQ 40 / style',
                preferredCategories: ['Shirts'], preferredCollections: ['Summer 26'],
                tags: ['rejected'], lifetimeValue: 0, ordersPlaced: 0
            }
        }),
        prisma.customer.create({
            data: {
                name: 'Dylan Chen', company: 'Orbit Retail', email: 'dylan@orbitretail.com', phone: '+1 (415) 555-0133',
                segment: 'Retail Partner', country: 'US', region: 'San Francisco, CA', source: 'Showroom', status: 'ACTIVE',
                assignedOwner: 'Sarah M.', preferredOrderType: 'Dropship / quick ship', moqExpectations: 'MOQ 50 / style',
                preferredCategories: ['Knitwear'], preferredCollections: ['Winter 26'],
                tags: ['converted'], lifetimeValue: 56000, ordersPlaced: 2
            }
        }),
    ])
    console.log('✅ Created 7 customers')

    // ─── Customer Notes ────────────────────────────────────────────────────────
    await Promise.all([
        prisma.customerNote.create({ data: { customerId: custMina.id, userId: sarah.id, body: 'Buyer asked for packed-by-color assortments.' } }),
        prisma.customerNote.create({ data: { customerId: custOmar.id, userId: alex.id, body: 'Emphasize limited stock on XS/S.' } }),
        prisma.customerNote.create({ data: { customerId: custKeiko.id, userId: alex.id, body: 'Approved pending PO conversion.' } }),
    ])

    // ─── Customer Reminders ────────────────────────────────────────────────────
    await Promise.all([
        prisma.customerReminder.create({ data: { customerId: custMina.id, body: 'Follow up on revised quote & lead time.', dueAt: new Date(Date.now() + 2 * 86400000) } }),
        prisma.customerReminder.create({ data: { customerId: custOmar.id, body: 'Ask for PO timeline + shipping terms.', dueAt: new Date(Date.now() + 86400000) } }),
        prisma.customerReminder.create({ data: { customerId: custDylan.id, body: 'Send fulfillment schedule + ETA.', dueAt: new Date(Date.now() + 86400000) } }),
    ])
    console.log('✅ Created customer notes & reminders')

    // ─── Quotes ───────────────────────────────────────────────────────────────
    const [q1, q2, q3, q4, q5, q6, q7] = await Promise.all([
        prisma.quote.create({
            data: {
                buyerName: 'Mina Park', buyerCompany: 'Aurora Atelier', buyerEmail: 'mina@auroraatelier.co', buyerCountry: 'US',
                source: 'Showroom', currency: 'USD', status: 'NEGOTIATING',
                expiryDate: new Date(Date.now() + 10 * 86400000), assignedToId: sarah.id, customerId: custMina.id,
                internalNotes: 'Buyer asked for updated lead times and packed by color.',
                items: {
                    create: [
                        { sku: 'SH-LN-BEI', name: 'Summer Linen Button-Down', qty: 120, unitPrice: 42, discountPct: 8, productId: products[2].id },
                        { sku: 'TS-CORE-WHT', name: 'Core Cotton T-Shirt', qty: 240, unitPrice: 12, discountPct: 0, productId: products[0].id }
                    ]
                },
                history: {
                    create: [
                        { by: 'Alex D.', action: 'Created draft' },
                        { by: 'Sarah M.', action: 'Sent to buyer' },
                        { by: 'Buyer', action: 'Requested revision (pricing)' }
                    ]
                }
            }
        }),
        prisma.quote.create({
            data: {
                buyerName: 'Omar Haddad', buyerCompany: 'Saffron Wholesale', buyerEmail: 'omar@saffronwholesale.com', buyerCountry: 'UK',
                source: 'Sales', currency: 'GBP', status: 'SENT',
                expiryDate: new Date(Date.now() + 6 * 86400000), assignedToId: alex.id, customerId: custOmar.id,
                items: { create: [{ sku: 'JK-DNM-BLU', name: 'Vintage Wash Denim Jacket', qty: 60, unitPrice: 72, discountPct: 5, productId: products[3].id }] },
                history: { create: [{ by: 'Alex D.', action: 'Created draft' }, { by: 'Alex D.', action: 'Sent to buyer' }] }
            }
        }),
        prisma.quote.create({
            data: {
                buyerName: 'Camila Reyes', buyerCompany: 'Northwind Buyers', buyerEmail: 'camila@northwindbuyers.io', buyerCountry: 'US',
                source: 'Inbound', currency: 'USD', status: 'VIEWED',
                expiryDate: new Date(Date.now() + 3 * 86400000), assignedToId: sarah.id, customerId: custCamila.id,
                items: {
                    create: [
                        { sku: 'SW-CASH-GRY', name: 'Cashmere Blend Sweater', qty: 80, unitPrice: 98, discountPct: 10, productId: products[5].id },
                        { sku: 'TR-CRP-OD', name: 'Cropped Cargo Trousers', qty: 90, unitPrice: 54, discountPct: 6, productId: products[4].id }
                    ]
                },
                history: { create: [{ by: 'System', action: 'Generated from quote request' }, { by: 'Buyer', action: 'Viewed quote' }] }
            }
        }),
        prisma.quote.create({
            data: {
                buyerName: 'Keiko Tanaka', buyerCompany: 'Lumen Dept. Store', buyerEmail: 'keiko@lumen.jp', buyerCountry: 'JP',
                source: 'Sales', currency: 'JPY', status: 'APPROVED',
                expiryDate: new Date(Date.now() + 14 * 86400000), assignedToId: alex.id, customerId: custKeiko.id,
                items: { create: [{ sku: 'TS-CORE-BLK', name: 'Core Cotton T-Shirt – Black', qty: 500, unitPrice: 11.20, discountPct: 12, productId: products[1].id }] },
                history: { create: [{ by: 'Alex D.', action: 'Created draft' }, { by: 'Alex D.', action: 'Sent to buyer' }, { by: 'Buyer', action: 'Approved' }] }
            }
        }),
        prisma.quote.create({
            data: {
                buyerName: 'Nora Fischer', buyerCompany: 'Helio Concept', buyerEmail: 'nora@helioconcept.de', buyerCountry: 'DE',
                source: 'Inbound', currency: 'EUR', status: 'EXPIRED',
                expiryDate: new Date(Date.now() - 2 * 86400000), assignedToId: sarah.id, customerId: custNora.id,
                items: { create: [{ sku: 'TS-CORE-WHT', name: 'Core Cotton T-Shirt', qty: 300, unitPrice: 12, discountPct: 0, productId: products[0].id }] },
                history: { create: [{ by: 'System', action: 'Generated from request' }, { by: 'Sarah M.', action: 'Sent to buyer' }, { by: 'System', action: 'Expired' }] }
            }
        }),
        prisma.quote.create({
            data: {
                buyerName: 'Sophie Laurent', buyerCompany: 'Maison Lumière', buyerEmail: 'sophie@maisonlumiere.fr', buyerCountry: 'FR',
                source: 'Sales', currency: 'EUR', status: 'REJECTED',
                expiryDate: new Date(Date.now() + 86400000), assignedToId: alex.id, customerId: custSophie.id,
                items: { create: [{ sku: 'SH-LN-BEI', name: 'Summer Linen Button-Down', qty: 150, unitPrice: 43, discountPct: 0, productId: products[2].id }] },
                history: { create: [{ by: 'Alex D.', action: 'Created draft' }, { by: 'Alex D.', action: 'Sent to buyer' }, { by: 'Buyer', action: 'Rejected' }] }
            }
        }),
        prisma.quote.create({
            data: {
                buyerName: 'Dylan Chen', buyerCompany: 'Orbit Retail', buyerEmail: 'dylan@orbitretail.com', buyerCountry: 'US',
                source: 'Showroom', currency: 'USD', status: 'CONVERTED_TO_ORDER',
                expiryDate: new Date(Date.now() + 20 * 86400000), assignedToId: sarah.id, customerId: custDylan.id,
                items: { create: [{ sku: 'SW-CASH-GRY', name: 'Cashmere Blend Sweater', qty: 40, unitPrice: 105, discountPct: 0, productId: products[5].id }] },
                history: {
                    create: [
                        { by: 'System', action: 'Created from showroom request' },
                        { by: 'Sarah M.', action: 'Sent to buyer' },
                        { by: 'Buyer', action: 'Approved' },
                        { by: 'System', action: 'Converted to order' }
                    ]
                }
            }
        }),
    ])
    console.log('✅ Created 7 quotes')

    // ─── Catalogs ─────────────────────────────────────────────────────────────
    await prisma.catalog.create({
        data: {
            name: 'Fall Core Essentials', description: 'B2B Wholesale catalog for Q3 2026',
            type: 'lookbook', template: 'modern', source: 'collection', audience: 'b2b', status: 'Published',
            toggles: { pricing: true, variants: true, aiAssets: true, stock: false, moq: false, specs: false, intro: true },
            items: products.slice(0, 4).map(p => ({ id: p.id, sku: p.sku, name: p.name }))
        }
    })
    await prisma.catalog.create({
        data: {
            name: 'Summer 26 Lookbook', description: 'Seasonal lookbook for warm-weather styles',
            type: 'lookbook', template: 'minimal', source: 'collection', audience: 'b2b', status: 'Draft',
            toggles: { pricing: false, variants: true, aiAssets: true, stock: false },
            items: [products[2]].map(p => ({ id: p.id, sku: p.sku, name: p.name }))
        }
    })
    console.log('✅ Created 2 catalogs')

    // ─── Showrooms ────────────────────────────────────────────────────────────
    await Promise.all([
        prisma.showroom.create({ data: { name: 'Aurora Atelier Showroom', slug: 'aurora-atelier', description: 'Private showroom for Aurora Atelier buyers', status: 'Published', coverImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200', settings: { accentColor: '#111827', showPrices: true, requireLogin: false } } }),
        prisma.showroom.create({ data: { name: 'Buyers – North America', slug: 'buyers-na', description: 'Open showroom for North American wholesale buyers', status: 'Published', settings: { accentColor: '#4f46e5', showPrices: false } } }),
        prisma.showroom.create({ data: { name: 'Coastal Demo', slug: 'coastal-demo', description: 'Demo showroom for prospective buyers', status: 'Draft', settings: {} } }),
    ])
    console.log('✅ Created 3 showrooms')

    // ─── AI Jobs ──────────────────────────────────────────────────────────────
    await Promise.all([
        prisma.aIJob.create({
            data: {
                type: 'try-on', status: 'COMPLETED', progress: 100,
                productId: products[3].id, createdById: admin.id,
                garmentUrl: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=900',
                personUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900',
                outputs: [
                    { id: 'out_seed_1', url: 'https://images.unsplash.com/photo-1520975732130-4bbf6a8a2ee0?w=1200', favorite: true, approved: true },
                    { id: 'out_seed_2', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200', favorite: false, approved: false }
                ],
                seed: 42131, quality: 'hd', variations: 2,
                finishedAt: new Date(Date.now() - 3 * 3600000), durationMs: 18400
            }
        }),
        prisma.aIJob.create({
            data: {
                type: 'try-on', status: 'FAILED', progress: 45,
                productId: products[1].id, createdById: admin.id,
                garmentUrl: 'https://images.unsplash.com/photo-1520975741975-bc1fe9b23c5c?w=900',
                personUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=900',
                outputs: [], seed: 9921, quality: 'standard', variations: 1,
                errorMsg: 'Image quality check failed (garment background too busy).',
                finishedAt: new Date(Date.now() - 40 * 60000), durationMs: 0
            }
        }),
    ])
    console.log('✅ Created 2 AI jobs')

    // ─── Imports ──────────────────────────────────────────────────────────────
    await Promise.all([
        prisma.import.create({ data: { source: 'Shopify Sync', fileName: 'API Manual Trigger', status: 'Completed', totalRows: 450, successRows: 448, failedRows: 2, createdById: alex.id } }),
        prisma.import.create({ data: { source: 'CSV Upload', fileName: 'Q3_catalog_final.csv', status: 'Failed', totalRows: 1200, successRows: 0, failedRows: 1200, createdById: sarah.id } }),
        prisma.import.create({ data: { source: 'Excel Upload', fileName: 'new_variants_mar.xlsx', status: 'Completed', totalRows: 84, successRows: 84, failedRows: 0, createdById: alex.id } }),
    ])
    console.log('✅ Created 3 imports')

    console.log('\n🎉 Database seeded successfully!')
    console.log('\n📋 Login credentials:')
    console.log('   Email:    admin@merchflow.ai')
    console.log('   Password: password')
    console.log('\n   Also: sarah@aurorastudio.co / alex@aurorastudio.co (same password)\n')
}

main()
    .catch(e => { console.error('❌ Seed failed:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
