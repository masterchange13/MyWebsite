/**
 * 全局 WebSocket 单例管理器
 * 页面加载后立即连接，跨路由保持连接
 */
import { ref } from 'vue'

const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
const WS_URL = `${wsProtocol}://${window.location.host}/chat/ws`

// 事件回调列表
const listeners = {
  message: [],
  online_status: [],
  open: [],
  close: [],
  error: [],
}

let socket = null
let reconnectTimer = null
let username = ''
let reconnectAttempts = 0
const MAX_RECONNECT_DELAY = 30000

export const isConnected = ref(false)

export function getSocket() {
  return socket
}

export function on(event, callback) {
  if (!listeners[event]) listeners[event] = []
  listeners[event].push(callback)
  // 返回取消订阅函数
  return () => {
    listeners[event] = listeners[event].filter(cb => cb !== callback)
  }
}

function emit(event, data) {
  if (!listeners[event]) return
  listeners[event].forEach(cb => {
    try { cb(data) } catch (e) { console.error(`[chatSocket] ${event} handler error:`, e) }
  })
}

export function connect(name) {
  if (name) username = name
  if (!username) {
    console.warn('[chatSocket] 无法连接：没有用户名')
    return
  }
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return
  }

  close()

  const url = `${WS_URL}?username=${encodeURIComponent(username)}`
  socket = new WebSocket(url)

  socket.onopen = () => {
    console.log('[chatSocket] WebSocket 已连接')
    isConnected.value = true
    reconnectAttempts = 0
    emit('open')
  }

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'online_status') {
        emit('online_status', data)
      } else {
        emit('message', data)
      }
    } catch (e) {
      console.error('[chatSocket] 解析消息失败:', e)
    }
  }

  socket.onclose = () => {
    console.log('[chatSocket] WebSocket 已断开')
    isConnected.value = false
    emit('close')
    scheduleReconnect()
  }

  socket.onerror = (err) => {
    console.error('[chatSocket] WebSocket 错误:', err)
    emit('error', err)
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY)
  reconnectAttempts++
  console.log(`[chatSocket] ${delay / 1000}s 后重连 (第 ${reconnectAttempts} 次)`)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, delay)
}

export function close() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (socket) {
    try { socket.close() } catch (e) { /* ignore */ }
    socket = null
    isConnected.value = false
  }
}

export function send(data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data))
  } else {
    console.warn('[chatSocket] 无法发送：WebSocket 未连接')
  }
}
