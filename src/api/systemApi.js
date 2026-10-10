import { request } from '@/utils/request'

export const systemApi = {
  // 页面展示错误；进入页面后每 5 秒轮询，未完成的请求不重复发送。
  getStatus: ({ signal } = {}) => request.get('/system-status/', {
    signal, timeout: 10000, showLoading: false, silentError: true,
  }),
}
