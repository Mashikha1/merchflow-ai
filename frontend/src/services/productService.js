import { api } from '../lib/api.js'

// Transform backend product shape → frontend shape
function transformProduct(p) {
    if (!p) return p
    return {
        ...p,
        // Flatten category name for the DataTable column
        category: p.category?.name || p.categoryId || '',
        // Keep the full category object accessible
        _category: p.category,
        _collection: p.collection,
    }
}

export const productService = {
    getProducts: async () => {
        const data = await api.get('/products')
        return Array.isArray(data) ? data.map(transformProduct) : data
    },
    getProduct: async (id) => {
        const data = await api.get(`/products/${id}`)
        return transformProduct(data)
    },
    createProduct: (data) => api.post('/products', data).then(transformProduct),
    updateProduct: (id, data) => api.put(`/products/${id}`, data).then(transformProduct),
    deleteProduct: (id) => api.delete(`/products/${id}`),
    bulkDelete: (ids) => api.post('/products/bulk-delete', { ids }),
    bulkUpdateStatus: (ids, status) => api.patch('/products/bulk-status', { ids, status }),
}
