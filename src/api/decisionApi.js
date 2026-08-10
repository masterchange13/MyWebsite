import { request } from '@/utils/request'

export const decisionApi = {
  record: (data) => request.post('decision/record/', data),
  getHistory: (params) => request.get('decision/history/', { params }),
  clearHistory: () => request.delete('decision/clear/'),
}
