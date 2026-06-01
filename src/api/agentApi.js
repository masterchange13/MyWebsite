import request from '@/utils/request'

export const agentApi = {
  listConversations: (params) => request.get('/agent/conversations/', { params }),
  createConversation: (data) => request.post('/agent/conversations/create/', data),
  listMessages: (params) => request.get('/agent/messages/', { params }),
}
