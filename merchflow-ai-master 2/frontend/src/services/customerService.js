import { api } from '../lib/api.js'

// Transform backend customer shape → frontend shape
function transformCustomer(c) {
  if (!c) return c
  return {
    ...c,
    // Nest metrics for compatibility with frontend
    metrics: {
      lifetimeValue: Number(c.lifetimeValue) || 0,
      ordersPlaced: c.ordersPlaced || 0,
      openQuotes: c._count?.quotes || 0,
    },
    // Map notes to frontend shape
    internalNotes: (c.notes || []).map(n => ({
      id: n.id,
      by: n.user?.name || 'Unknown',
      body: n.body,
      at: n.createdAt,
    })),
    // activity from activities relation
    activity: (c.activities || []).map(a => ({
      type: a.entityType?.toLowerCase() || 'other',
      label: a.action,
      at: a.createdAt,
    })),
  }
}

export const customerService = {
  // listCustomers and getCustomers are aliases
  listCustomers: async (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    const data = await api.get(`/customers${qs ? '?' + qs : ''}`)
    return Array.isArray(data) ? data.map(transformCustomer) : data
  },
  getCustomers: async (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    const data = await api.get(`/customers${qs ? '?' + qs : ''}`)
    return Array.isArray(data) ? data.map(transformCustomer) : data
  },
  getCustomer: async (id) => {
    const data = await api.get(`/customers/${id}`)
    return transformCustomer(data)
  },
  createCustomer: (data) => api.post('/customers', data).then(transformCustomer),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data).then(transformCustomer),
  addNote: (id, body) => api.post(`/customers/${id}/notes`, { body }),
  addReminder: (id, body, dueAt) => api.post(`/customers/${id}/reminders`, { body, dueAt }),
  archiveCustomer: (id) => api.patch(`/customers/${id}/archive`, {}),
}
