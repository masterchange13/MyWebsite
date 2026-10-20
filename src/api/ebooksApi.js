import { request } from '@/utils/request'

const options = { showLoading: false, silentError: true }
export const ebooksApi = {
  list: () => request.get('/ebooks/', options),
  upload: (data) => request.post('/ebooks/', data, { ...options, timeout: 120000 }),
  remove: (id) => request.delete(`/ebooks/${id}/`, options),
  chapter: (id, index, signal) => request.get(`/ebooks/${id}/chapters/${index}/`, { ...options, signal }),
  saveProgress: (id, data) => request.post(`/ebooks/${id}/progress/`, data, options),
  fileUrl: (id) => `/api/ebooks/${id}/file/`,
}
