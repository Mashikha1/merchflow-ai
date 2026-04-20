// Central API client for MerchFlow backend
// Normalizes Prisma enum values (ACTIVE → Active, etc.) for frontend compatibility

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

function getToken() {
    try {
        const auth = JSON.parse(localStorage.getItem('merchflow_auth') || '{}')
        return auth?.state?.token || null
    } catch {
        return null
    }
}

// ─── Enum normalizers ─────────────────────────────────────────────────────────
const STATUS_MAP = {
    // Product status
    ACTIVE: 'Active', DRAFT: 'Draft', ARCHIVED: 'Archived', LOW_STOCK: 'Low Stock',
    // Customer status
    PROSPECT: 'Prospect', INACTIVE: 'Inactive',
    // Quote status
    SENT: 'Sent', VIEWED: 'Viewed', NEGOTIATING: 'Negotiating',
    APPROVED: 'Approved', REJECTED: 'Rejected', EXPIRED: 'Expired',
    CONVERTED_TO_ORDER: 'Converted to Order',
    // AI Job status
    QUEUED: 'queued', PROCESSING: 'processing', COMPLETED: 'completed', FAILED: 'failed',
}

function normalizeValue(val) {
    if (typeof val === 'string' && STATUS_MAP[val]) return STATUS_MAP[val]
    return val
}

function normalizeObject(obj) {
    if (Array.isArray(obj)) return obj.map(normalizeObject)
    if (obj && typeof obj === 'object') {
        const out = {}
        for (const [k, v] of Object.entries(obj)) {
            out[k] = normalizeObject(k === 'status' || k === 'role' ? normalizeValue(v) : v)
        }
        return out
    }
    return obj
}

// ─── Request helper ────────────────────────────────────────────────────────────
async function request(method, path, body) {
    const token = getToken()
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    })

    if (!res.ok) {
        // Auto-logout on 401 (expired/missing token)
        if (res.status === 401) {
            try {
                const auth = JSON.parse(localStorage.getItem('merchflow_auth') || '{}')
                if (auth?.state) {
                    auth.state.status = 'anonymous'
                    auth.state.user = null
                    auth.state.token = null
                    localStorage.setItem('merchflow_auth', JSON.stringify(auth))
                }
            } catch { }
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                window.location.href = '/login'
            }
        }
        const err = await res.json().catch(() => ({ error: res.statusText }))
        const e = new Error(err.error || `HTTP ${res.status}`)
        e.status = res.status
        throw e
    }

    const data = await res.json()
    return normalizeObject(data)
}

export const api = {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    patch: (path, body) => request('PATCH', path, body),
    delete: (path) => request('DELETE', path),
}
