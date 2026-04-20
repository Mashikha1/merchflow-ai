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

  // Start a new virtual try-on job
  createTryOn: ({ productId, garmentUrl, personUrl, meta = {} }) =>
    api.post('/ai/try-on', { productId, garmentUrl, personUrl, meta }).then(transformJob),

  // Retry a failed job
  retryJob: (id) => api.post(`/ai/jobs/${id}/retry`, {}).then(transformJob),

  // Update an output (approve / favorite)
  updateOutput: (jobId, outputId, updates) =>
    api.patch(`/ai/jobs/${jobId}/output/${outputId}`, updates),
}
