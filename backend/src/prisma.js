import { PrismaClient } from '@prisma/client'

// DATABASE_URL must already contain pgbouncer=true&connection_limit=1
// if using Supabase connection pooler (port 6543).
// DIRECT_URL must be the direct connection (port 5432) for migrations.
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

export default prisma
