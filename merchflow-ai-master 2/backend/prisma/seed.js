/**
 * MerchFlow AI — Database Seed Script
 * 
 * Creates the initial ADMIN user and sample data for first-run setup.
 * Run with: npm run db:seed
 * 
 * On production: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars
 * before running, then delete or disable this script.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Admin User'
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@merchflow.ai'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!'
const BRAND_NAME = process.env.SEED_BRAND_NAME || 'MerchFlow Brand'

async function main() {
  console.log('🌱 Seeding database...\n')

  // ── Admin User ─────────────────────────────────────────────────────────────
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
  if (existing) {
    console.log(`ℹ️  Admin already exists: ${ADMIN_EMAIL}`)
  } else {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12)
    const admin = await prisma.user.create({
      data: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashed,
        role: 'ADMIN',
        brandName: BRAND_NAME,
        brandColor: '#C47B2B',
        brandEmail: ADMIN_EMAIL,
      }
    })
    console.log(`✅ Admin created: ${admin.email} (role: ADMIN)`)
    console.log(`   ⚠️  Change the password immediately after first login!\n`)
  }

  // ── Sample Category ────────────────────────────────────────────────────────
  const catCount = await prisma.category.count()
  if (catCount === 0) {
    await prisma.category.createMany({
      data: [
        { name: 'Tops', slug: 'tops' },
        { name: 'Bottoms', slug: 'bottoms' },
        { name: 'Outerwear', slug: 'outerwear' },
        { name: 'Accessories', slug: 'accessories' },
        { name: 'Footwear', slug: 'footwear' },
      ]
    })
    console.log('✅ Default categories created')
  } else {
    console.log(`ℹ️  Categories already exist (${catCount})`)
  }

  // ── Sample Collection ──────────────────────────────────────────────────────
  const colCount = await prisma.collection.count()
  if (colCount === 0) {
    await prisma.collection.create({
      data: { name: 'Core Basics', description: 'Essential everyday pieces', type: 'Seasonal Drop', status: 'Draft' }
    })
    console.log('✅ Sample collection created')
  }

  console.log('\n🎉 Seed complete!')
  console.log(`\n📌 Login credentials:`)
  console.log(`   Email:    ${ADMIN_EMAIL}`)
  console.log(`   Password: ${ADMIN_PASSWORD}`)
  console.log(`\n⚠️  IMPORTANT: Change the admin password immediately after first login.\n`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
