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
  online_snapshot: [],
  open: [],
  close: [],
  error: [],
}

let socket = null
let reconnectTimer = null
let username = ''
let reconnectAttempts = 0
let _closing = false  // 手动关闭标志，防止 onclose 触发自动重连
const MAX_RECONNECT_DELAY = 30000
const HEARTBEAT_INTERVAL = 30000
let heartbeatTimer = null

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

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

function startHeartbeat() {
  stopHeartbeat()
  heartbeatTimer = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'heartbeat' }))
    }
  }, HEARTBEAT_INTERVAL)
}

export function connect(name) {
  if (name && username && username !== name) {
    // 用户名变化：关闭旧连接（SREM 旧用户名），用新用户名重连（SADD 新用户名）
    _closing = true
    close()
    _closing = false
    username = name
  } else if (name) {
    username = name
  }
  if (!username) {
    console.warn('[chatSocket] 无法连接：没有用户名')
    return
  }
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return
  }

  close()

  _closing = false  // 重置标志，允许新连接断线后自动重连
  const url = `${WS_URL}?username=${encodeURIComponent(username)}`
  socket = new WebSocket(url)

  socket.onopen = () => {
    console.log('[chatSocket] WebSocket 已连接')
    isConnected.value = true
    reconnectAttempts = 0
    startHeartbeat()
    emit('open')
  }

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'online_status') {
        emit('online_status', data)
      } else if (data.type === 'online_snapshot') {
        emit('online_snapshot', data)
      } else if (data.type === 'pong') {
        return
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
    stopHeartbeat()
    emit('close')
    scheduleReconnect()
  }

  socket.onerror = (err) => {
    console.error('[chatSocket] WebSocket 错误:', err)
    emit('error', err)
  }
}

function scheduleReconnect() {
  if (_closing || reconnectTimer) return
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY)
  reconnectAttempts++
  console.log(`[chatSocket] ${delay / 1000}s 后重连 (第 ${reconnectAttempts} 次)`)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, delay)
}

export function close() {
  _closing = true
  stopHeartbeat()
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
