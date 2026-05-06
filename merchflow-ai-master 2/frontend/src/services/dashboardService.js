import { api } from '../lib/api.js'

export const dashboardService = {
    getSummary: () => api.get('/dashboard/summary'),
    getTrafficData: () => api.get('/dashboard/traffic'),
}
