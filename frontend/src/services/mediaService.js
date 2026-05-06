import { api } from '../lib/api.js'

export const mediaService = {
    getMedia: () => api.get('/media'),
    getMediaItem: (id) => api.get(`/media/${id}`),
    createMedia: (data) => api.post('/media', data),
    upload: (formData) => api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteMedia: (id) => api.delete(`/media/${id}`),
    bulkDeleteMedia: (ids) => api.post('/media/bulk-delete', { ids }),
    bulkFavorite: (ids, favorite) => api.patch('/media/bulk-favorite', { ids, favorite })
}
