import request from '@/utils/request'

export const agentApi = {
  ask: (data) => request.post('/agent/ask', data)
}
