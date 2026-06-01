import { request } from '@/utils/request'

export const qiMenApi = {
  calc: (data) => request.post('/qimen/calc', data, { timeout: 15000 }),
  history: () => request.get('/qimen/history', { showLoading: false, silentError: true }),
  result: (id) => request.get(`/qimen/result/${id}`, { showLoading: false, silentError: true }),
}
