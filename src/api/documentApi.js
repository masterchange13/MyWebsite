import request from '@/utils/request'

export const documentApi = {
  getAll: () => request.get('/document/getAll/'),
  detail: (id) => request.get('/document/detail', { params: { id } }),
  publish: (data) => request.post('/publish', data)
}
