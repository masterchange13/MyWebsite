import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as chatSocket from '@/websocket/chatSocket'
import { chatApi } from '@/api/chatApi'

export const useChatStore = defineStore('chat', () => {
  // ---- 状态 ----
  const onlineUsers = ref(new Set())
  const unreadMessages = ref({})  // { senderUsername: [{ sendUsername, receiveUsername, data, created_time }, ...] }
  const currentPeer = ref('')     // 当前正在聊天的对象
  const isOnChatPage = ref(false)

  // ---- 计算 ----
  function getUnreadCount(username) {
    return (unreadMessages.value[username] || []).length
  }

  function getTotalUnreadCount() {
    return Object.values(unreadMessages.value).reduce((sum, msgs) => sum + msgs.length, 0)
  }

  function isOnline(username) {
    return onlineUsers.value.has(username)
  }

  // ---- 操作 ----
  function setCurrentPeer(username) {
    currentPeer.value = username
    // 进入对话时清除该用户的未读
    if (username && unreadMessages.value[username]) {
      unreadMessages.value[username] = []
    }
  }

  function setOnChatPage(val) {
    isOnChatPage.value = val
  }

  function addMessage(msg) {
    const sender = msg.sendUsername
    // 如果正在和这个人聊天且在聊天页面，不增加未读
    if (isOnChatPage.value && sender === currentPeer.value) {
      return false // 不视为未读消息
    }
    if (sender === currentPeer.value && isOnChatPage.value) {
      return false
    }
    // 如果不在聊天页面或正在和别人聊天，增加未读
    if (!unreadMessages.value[sender]) {
      unreadMessages.value[sender] = []
    }
    unreadMessages.value[sender].push(msg)
    return true // 视为未读消息
  }

  function clearUnread(username) {
    if (username) {
      unreadMessages.value[username] = []
    }
  }

  // ---- 初始化：从 HTTP 获取在线用户列表 ----
  async function fetchOnlineUsers() {
    try {
      const res = await chatApi.getOnlineUsers()
      const list = res?.data ?? []
      const online = new Set()
      list.forEach(u => {
        if (u.online) online.add(u.username)
      })
      onlineUsers.value = online
    } catch (e) {
      console.error('[chatStore] 获取在线用户失败:', e)
    }
  }

  // 不再使用 HTTP 轮询 —— WebSocket 会实时推送 online_snapshot / online_status 事件
  function startOnlineSync() {
    fetchOnlineUsers()
  }

  function stopOnlineSync() {
    // 保留接口兼容，无轮询可清理
  }

  let _socketBound = false

  // ---- 绑定 WebSocket 事件 ----
  function bindSocketEvents() {
    if (_socketBound) return
    _socketBound = true
    chatSocket.on('open', () => {
      fetchOnlineUsers()
    })
    chatSocket.on('online_snapshot', (data) => {
      const next = new Set(Array.isArray(data?.users) ? data.users : [])
      onlineUsers.value = next
    })
    chatSocket.on('online_status', (data) => {
      const next = new Set(onlineUsers.value)
      if (data.online) {
        next.add(data.username)
      } else {
        next.delete(data.username)
      }
      onlineUsers.value = next
    })
  }

  return {
    onlineUsers,
    unreadMessages,
    currentPeer,
    isOnChatPage,
    getUnreadCount,
    getTotalUnreadCount,
    isOnline,
    setCurrentPeer,
    setOnChatPage,
    addMessage,
    clearUnread,
    fetchOnlineUsers,
    startOnlineSync,
    stopOnlineSync,
    bindSocketEvents,
  }
})
