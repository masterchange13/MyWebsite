<template>
  <div class="agent-page">
    <el-card class="agent-shell" shadow="never">
      <div class="layout">
        <aside class="sidebar">
          <div class="sidebar-head">
            <div class="sidebar-title">Agent</div>
            <el-button type="primary" size="small" @click="newConversation" :loading="convLoading">新建对话</el-button>
          </div>
          <div class="sidebar-sub">点击切换历史对话</div>
          <el-scrollbar class="conv-list">
            <button
              v-for="c in conversations"
              :key="c.id"
              type="button"
              class="conv-item"
              :class="{ active: c.id === activeConversationId }"
              @click="switchConversation(c.id)"
            >
              <div class="conv-title">{{ c.title || '新对话' }}</div>
              <div class="conv-meta">{{ formatDateTime(c.update_time || c.created_time) }}</div>
            </button>
          </el-scrollbar>
        </aside>

        <main class="main">
          <div class="main-head">
            <div class="main-title">{{ activeTitle }}</div>
            <div class="main-sub">支持流式输出与历史记录</div>
          </div>

          <el-scrollbar class="messages" ref="scrollRef">
            <div v-for="(m, i) in messages" :key="m.id || i" :class="['message', m.role]">
              <div class="bubble">
                <div class="role">{{ m.role === 'user' ? '我' : 'Agent' }}</div>
                <div class="content">{{ m.content }}</div>
                <div class="time">{{ formatTime(m.created_time || m.time) }}</div>
              </div>
            </div>
          </el-scrollbar>

          <div class="composer">
            <el-input
              v-model="input"
              type="textarea"
              :rows="3"
              placeholder="输入你的问题...（Ctrl+Enter 发送）"
              @keydown.ctrl.enter="send"
            />
            <div class="actions">
              <el-button type="primary" @click="send" :loading="sending">发送</el-button>
              <el-button @click="newConversation" :loading="convLoading">新对话</el-button>
            </div>
          </div>
        </main>
      </div>
    </el-card>
  </div>
  </template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { agentApi } from '@/api/agentApi'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const username = computed(() => userStore.getUsername())

const conversations = ref([])
const activeConversationId = ref(null)
const activeTitle = ref('新对话')
const convLoading = ref(false)

const messages = ref([])
const input = ref('')
const sending = ref(false)
const scrollRef = ref(null)

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

const formatDateTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const pad = (v) => String(v).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const scrollToBottom = async () => {
  await nextTick()
  const wrap = scrollRef.value?.wrapRef
  if (wrap) wrap.scrollTop = wrap.scrollHeight
}

const loadConversations = async () => {
  convLoading.value = true
  try {
    const res = await agentApi.listConversations()
    conversations.value = res?.data || []
  } catch (e) {
    conversations.value = []
  } finally {
    convLoading.value = false
  }
}

const loadMessages = async (conversationId) => {
  try {
    const res = await agentApi.listMessages({ conversation_id: conversationId })
    const data = res?.data || {}
    messages.value = data.messages || []
    activeTitle.value = data.conversation?.title || '新对话'
  } catch (e) {
    messages.value = []
    activeTitle.value = '新对话'
  } finally {
    await scrollToBottom()
  }
}

const newConversation = async () => {
  convLoading.value = true
  try {
    const res = await agentApi.createConversation({ title: '新对话' })
    const id = res?.data?.id
    await loadConversations()
    if (id) {
      activeConversationId.value = id
      await loadMessages(id)
    }
  } catch (e) {
    ElMessage.error('新建对话失败')
  } finally {
    convLoading.value = false
  }
}

const switchConversation = async (id) => {
  if (sending.value) return
  activeConversationId.value = id
  await loadMessages(id)
}

const getCookie = (name) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return ''
}

const startStream = async ({ conversationId, text }) => {
  const body = {
    conversation_id: conversationId,
    message: text,
  }
  const csrf = getCookie('csrftoken')
  const resp = await fetch('/api/agent/chat_stream/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRFToken': csrf } : {}) },
    body: JSON.stringify(body),
    credentials: 'include',
  })
  if (!resp.ok || !resp.body) {
    throw new Error('stream failed')
  }
  const reader = resp.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buf = ''
  let finalConversationId = conversationId

  const assistant = { id: `local_${Date.now()}`, role: 'assistant', content: '', time: Date.now() }
  messages.value.push(assistant)
  await scrollToBottom()

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const parts = buf.split('\n\n')
    buf = parts.pop() || ''
    for (const part of parts) {
      const lines = part.split('\n')
      let event = 'message'
      let dataLine = ''
      for (const ln of lines) {
        if (ln.startsWith('event:')) event = ln.slice('event:'.length).trim()
        if (ln.startsWith('data:')) dataLine += ln.slice('data:'.length).trim()
      }
      if (!dataLine) continue
      let payload
      try {
        payload = JSON.parse(dataLine)
      } catch (e) {
        continue
      }
      if (event === 'meta') {
        if (payload?.conversation_id) {
          finalConversationId = payload.conversation_id
          activeConversationId.value = payload.conversation_id
        }
        if (payload?.title) activeTitle.value = payload.title
        await loadConversations()
      } else if (event === 'delta') {
        assistant.content = assistant.content + (payload?.content || '')
      } else if (event === 'error') {
        throw new Error(payload?.message || 'error')
      } else if (event === 'done') {
        await loadConversations()
        if (finalConversationId) {
          await loadMessages(finalConversationId)
        }
        return
      }
    }
    await scrollToBottom()
  }

  await loadConversations()
  if (finalConversationId) {
    await loadMessages(finalConversationId)
  }
}

const send = async () => {
  const text = input.value.trim()
  if (!text) return
  if (!activeConversationId.value) {
    await newConversation()
  }
  const convId = activeConversationId.value
  messages.value.push({ role: 'user', content: text, time: Date.now() })
  input.value = ''
  sending.value = true
  await scrollToBottom()

  try {
    await startStream({ conversationId: convId, text })
  } catch (e) {
    ElMessage.error('发送失败')
    messages.value.push({ role: 'assistant', content: '服务暂不可用，请稍后再试。', time: Date.now() })
  } finally {
    sending.value = false
    await scrollToBottom()
  }
}

onMounted(async () => {
  await loadConversations()
  if (conversations.value.length) {
    activeConversationId.value = conversations.value[0].id
    await loadMessages(activeConversationId.value)
  } else {
    await newConversation()
  }
})
</script>

<style scoped>
.agent-page {
  padding: 14px;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}
.agent-shell {
  height: 100%;
  border: 1px solid rgba(0, 255, 255, 0.18);
  border-radius: 12px;
  background: rgba(9, 15, 34, 0.72);
}
.agent-shell :deep(.el-card__body) {
  height: 100%;
  padding: 0;
}
.layout {
  height: 100%;
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 0;
}
.sidebar {
  border-right: 1px solid rgba(0, 255, 255, 0.14);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
}
.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.sidebar-title {
  font-size: 16px;
  font-weight: 700;
  color: #9ef7ff;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.35);
}
.sidebar-sub {
  font-size: 12px;
  color: #88a7bf;
}
.conv-list {
  flex: 1;
  min-height: 0;
}
.conv-list :deep(.el-scrollbar__wrap) {
  overflow: auto;
}
.conv-item {
  width: 100%;
  text-align: left;
  border: 1px solid rgba(0, 255, 255, 0.14);
  border-radius: 10px;
  background: rgba(10, 16, 35, 0.72);
  padding: 10px;
  cursor: pointer;
  margin-bottom: 10px;
}
.conv-item:hover {
  border-color: rgba(0, 245, 255, 0.45);
  box-shadow: 0 0 16px rgba(0, 245, 255, 0.10);
}
.conv-item.active {
  border-color: rgba(255, 0, 204, 0.35);
  box-shadow: 0 0 18px rgba(255, 0, 204, 0.14);
}
.conv-title {
  color: #e2fbff;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conv-meta {
  margin-top: 4px;
  color: rgba(136, 167, 191, 0.95);
  font-size: 12px;
}
.main {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.main-head {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.14);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}
.main-title {
  font-size: 16px;
  font-weight: 700;
  color: #d6fbff;
}
.main-sub {
  font-size: 12px;
  color: #88a7bf;
}
.messages {
  min-height: 0;
  padding: 12px;
}
.messages :deep(.el-scrollbar__wrap) {
  overflow: auto;
}
.message {
  display: flex;
  margin-bottom: 10px;
}
.message.user {
  justify-content: flex-end;
}
.message.assistant {
  justify-content: flex-start;
}
.bubble {
  max-width: 78%;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(16, 23, 48, 0.92);
  box-shadow: 0 0 12px rgba(0, 255, 255, 0.08);
  border: 1px solid rgba(0, 255, 255, 0.18);
}
.assistant .bubble {
  background: rgba(12, 40, 46, 0.86);
}
.user .bubble {
  background: rgba(40, 15, 52, 0.86);
}
.role {
  font-size: 12px;
  color: #88b3c9;
  margin-bottom: 4px;
}
.content {
  white-space: pre-wrap;
  word-break: break-word;
  color: #e0fbff;
  font-size: 15px;
  line-height: 1.75;
}
.time {
  font-size: 12px;
  color: #7ea6be;
  margin-top: 6px;
  text-align: right;
}
.composer {
  padding: 12px 14px 14px;
  border-top: 1px solid rgba(0, 255, 255, 0.14);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    border-right: none;
    border-bottom: 1px solid rgba(0, 255, 255, 0.14);
  }
  .bubble {
    max-width: 90%;
  }
}
</style>
