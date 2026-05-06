import { api } from '../lib/api.js'

export const catalogService = {
    getCatalogs: () => api.get('/catalogs'),
    getCatalog: (id) => api.get(`/catalogs/${id}`),
    createCatalog: (data) => api.post('/catalogs', data),
    updateCatalog: (id, data) => api.put(`/catalogs/${id}`, data),
    deleteCatalog: (id) => api.delete(`/catalogs/${id}`),
}
