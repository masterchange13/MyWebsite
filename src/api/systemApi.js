import { request } from '@/utils/request'

export const systemApi = {
  // 系统状态轮询接口：静默失败（不 toast、不弹 loading），5s 一轮
  getStatus: () => request.get('/system-status/', { showLoading: false, silentError: true }),
}
