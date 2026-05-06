import { api } from '../lib/api.js'

export const mediaService = {
    getMedia: () => api.get('/media'),
    getMediaItem: (id) => api.get(`/media/${id}`),
    createMedia: (data) => api.post('/media', data), // expects multipart/form-data ideally, but we will send what's there
    deleteMedia: (id) => api.delete(`/media/${id}`),
    bulkDeleteMedia: (ids) => api.post('/media/bulk-delete', { ids }),
    bulkFavorite: (ids, favorite) => api.patch('/media/bulk-favorite', { ids, favorite })
}
