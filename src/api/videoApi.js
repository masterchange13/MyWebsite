import { request } from '@/utils/request'

export const videoApi = {
  getStatus: (signal, checkOnly = false) => request.get('/video/status/', {
    signal, params: { check_only: checkOnly ? '1' : '0' },
    timeout: 10000, showLoading: false, silentError: true,
  }),
}
