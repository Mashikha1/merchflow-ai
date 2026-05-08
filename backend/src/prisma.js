import { PrismaClient } from '@prisma/client'

// Build the database URL with PgBouncer-required parameters
// These are needed for Supabase connection pooling to work with Prisma
function buildDatabaseUrl() {
    const url = process.env.DATABASE_URL
    if (!url) return url
    try {
        const parsed = new URL(url)
        // Required for PgBouncer transaction mode
        parsed.searchParams.set('pgbouncer', 'true')
        parsed.searchParams.set('connection_limit', '1')
        parsed.searchParams.set('statement_cache_size', '0')
        return parsed.toString()
    } catch {
        return url
    }
}

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: buildDatabaseUrl(),
        },
    },
})

export default prisma
