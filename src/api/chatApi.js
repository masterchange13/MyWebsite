import { request } from '@/utils/request'

// const wsBase = 'ws://localhost:8083/chat/ws'

const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
const wsBase = `${wsProtocol}://${window.location.host}/chat/ws`

export const chatApi = {
  getUsers: () => request.get('/chat/getUsers'),
  getHistory: (params) => request.get('/chat/getHistory', { params }),
  getOnlineUsers: () => request.get('/chat/onlineUsers', {
    showLoading: false,   // 不弹全屏 loading，避免页面闪烁
    silentError: true,    // 静默失败，不弹错误提示
  }),
  createSocket: (username, peer) => {
    const u = encodeURIComponent(username || '')
    const p = peer ? `&peer=${encodeURIComponent(peer)}` : ''
    return new WebSocket(`${wsBase}?username=${u}${p}`)
  },
  sendMessage: (socket, payload) => socket?.send(JSON.stringify(payload))
}
