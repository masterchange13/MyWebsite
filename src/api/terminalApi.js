import { request } from '@/utils/request'

export const terminalApi = {
  status: () => request.get('/terminal/status/', { showLoading: false, silentError: true }),
  createSession: (signal) => request.post('/terminal/session/', {}, { signal, showLoading: false, silentError: true }),
  closeSession: () => request.post('/terminal/session/close/', {}, { showLoading: false, silentError: true }),
}
