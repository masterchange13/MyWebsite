import { request } from '@/utils/request'

const wsBase = 'ws://localhost:8083/chat/ws'

export const chatApi = {
  getUsers: () => request.get('/chat/getUsers'),
  getHistory: (params) => request.get('/chat/getHistory', { params }),
  createSocket: (username, peer) => {
    const u = encodeURIComponent(username || '')
    const p = peer ? `&peer=${encodeURIComponent(peer)}` : ''
    return new WebSocket(`${wsBase}?username=${u}${p}`)
  },
  sendMessage: (socket, payload) => socket?.send(JSON.stringify(payload))
}
