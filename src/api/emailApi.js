import { request } from '@/utils/request'

export const emailApi = {
  getConfig: (params) => request.get('email/config/', { params }),
  saveConfig: (data) => request.post('email/config/save/', data),
  send: (data) => request.post('email/send/', data, {
    timeout: 120000,   // 文件附件需要较长时间
  }),
  getHistory: (params) => request.get('email/history/', { params }),
  deleteHistory: (data) => request.delete('email/history/delete/', { data }),
}
