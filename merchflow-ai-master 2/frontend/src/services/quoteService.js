import { api } from '../lib/api.js'

// Transform backend quote shape → frontend shape
function transformQuote(q) {
  if (!q) return q
  return {
    ...q,
    buyer: {
      name: q.buyerName,
      company: q.buyerCompany,
      email: q.buyerEmail,
      phone: q.buyerPhone,
      country: q.buyerCountry,
    },
    assignedTo: q.assignedTo?.name || q.assignedToId || '—',
    approvalHistory: q.history || [],
  }
}

export const quoteService = {
  listQuotes: async (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    const data = await api.get(`/quotes${qs ? '?' + qs : ''}`)
    return Array.isArray(data) ? data.map(transformQuote) : data
  },
  getQuote: async (id) => {
    const data = await api.get(`/quotes/${id}`)
    return transformQuote(data)
  },
  createQuote: (data) => api.post('/quotes', data).then(transformQuote),
  updateQuote: (id, data) => api.put(`/quotes/${id}`, data).then(transformQuote),
  sendQuote: (id) => api.post(`/quotes/${id}/send`, {}).then(transformQuote),
  markApproved: (id) => api.post(`/quotes/${id}/approve`, {}).then(transformQuote),
  approveQuote: (id) => api.post(`/quotes/${id}/approve`, {}).then(transformQuote),
  convertToOrder: (id) => api.post(`/quotes/${id}/convert`, {}).then(transformQuote),
  duplicateQuote: (id) => api.post(`/quotes/${id}/duplicate`, {}).then(transformQuote),
  archiveQuote: (id) => api.patch(`/quotes/${id}/archive`, {}),
  listBuyers: () => api.get('/quotes/buyers/list'),
}

