import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Clearing mock data from MerchFlow AI database...\n')

    // Delete everything EXCEPT users
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
    await prisma.pageView.deleteMany()
    
    // Keep admin@merchflow.ai, delete others
    await prisma.user.deleteMany({
        where: { email: { not: 'admin@merchflow.ai' } }
    })

    console.log('✅ Removed all mock data (Products, Quotes, Customers, Catalogs, etc)')
    console.log('✅ Kept admin@merchflow.ai user so you can still log in')
}

main()
    .catch(e => { console.error('❌ Clean failed:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
