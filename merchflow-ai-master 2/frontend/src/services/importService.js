import { api } from '../lib/api.js'

export const importService = {
  getImports: () => api.get('/imports'),
  getImport: (id) => api.get(`/imports/${id}`),
  createImport: (data) => api.post('/imports', data),
}
