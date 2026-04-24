import { api } from '../lib/api.js'

// Transform backend AI job → frontend shape
function transformJob(j) {
  if (!j) return j
  return {
    ...j,
    // Map errorMsg → error for frontend compatibility
    error: j.errorMsg || j.error || null,
  }
}

export const aiService = {
  // List all AI jobs
  listJobs: async () => {
    const data = await api.get('/ai/jobs')
    return Array.isArray(data) ? data.map(transformJob) : data
  },

  // Get a single job (for polling)
  getJob: async (id) => {
    const data = await api.get(`/ai/jobs/${id}`)
    return transformJob(data)
  },

  // Start a new virtual try-on job (accepts both productId and inputProductId alias)
  createTryOn: ({ productId, inputProductId, garmentUrl, personUrl, clothesType = 'upper_body', meta = {} }) =>
    api.post('/ai/try-on', { productId: productId || inputProductId, garmentUrl, personUrl, clothesType, meta }).then(transformJob),


  // Retry a failed job
  retryJob: (id) => api.post(`/ai/jobs/${id}/retry`, {}).then(transformJob),

  // Update an output (approve / favorite / save)
  updateOutput: (jobId, outputId, updates) =>
    api.patch(`/ai/jobs/${jobId}/output/${outputId}`, updates),

  // Generate AI product descriptions (returns { variations: [{tone, text}] })
  generateDescriptions: ({ productId, tone, customContext }) =>
    api.post('/ai/descriptions', { productId, tone, customContext }),

  // Apply description to product
  applyDescription: ({ productId, description }) =>
    api.patch('/ai/descriptions/apply', { productId, description }),

  // Extract attributes from product image
  extractAttributes: ({ imageUrl, productId }) =>
    api.post('/ai/attributes', { imageUrl, productId }),

  // Generate background for product
  generateBackground: ({ garmentUrl, background, productId }) =>
    api.post('/ai/backgrounds', { garmentUrl, background, productId }).then(transformJob),

  // Generate lookbook narrative
  lookbookAssist: ({ catalogId }) =>
    api.post('/ai/lookbook-assist', { catalogId }),
}
