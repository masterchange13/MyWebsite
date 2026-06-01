import { request } from '@/utils/request'

export const qiMenApi = {
  calc: (data) => request.post('/qimen/calc', data, { timeout: 15000 }),
  result: (id) => request.get(`/qimen/result/${id}`, { showLoading: false, silentError: true }),
}
