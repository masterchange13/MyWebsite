import { request } from '@/utils/request'

export const qiMenApi = {
  calc: (data) => request.post('/qimen/calc', data, { timeout: 150000 }),
}
