<template>
  <div class="agent-container">
    <el-card class="agent-header" shadow="never">
      <div class="title">Agent</div>
      <div class="subtitle">对话助手</div>
    </el-card>

    <el-card class="agent-body" shadow="always">
      <el-scrollbar class="messages" ref="scrollRef">
        <div v-for="(m, i) in messages" :key="i" :class="['message', m.role]">
          <div class="bubble">
            <div class="role">{{ m.role === 'user' ? '我' : 'Agent' }}</div>
            <div class="content">{{ m.content }}</div>
            <div class="time">{{ formatTime(m.time) }}</div>
          </div>
        </div>
      </el-scrollbar>

      <div class="composer">
        <el-input
          v-model="input"
          type="textarea"
          :rows="3"
          placeholder="输入你的问题..."
          @keydown.ctrl.enter="send"
        />
        <div class="actions">
          <el-button type="primary" @click="send" :loading="loading">发送</el-button>
          <el-button @click="clear">清空</el-button>
        </div>
      </div>
    </el-card>
  </div>
  </template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { request } from '@/utils/request'

const messages = ref([
  { role: 'assistant', content: '你好！我是你的 Agent，有什么可以帮你？', time: Date.now() }
])
const input = ref('')
const loading = ref(false)
const scrollRef = ref(null)

const formatTime = (t) => {
  const d = new Date(t)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

const scrollToBottom = async () => {
  await nextTick()
  const wrap = scrollRef.value?.wrapRef
  if (wrap) wrap.scrollTop = wrap.scrollHeight
}

const send = async () => {
  const text = input.value.trim()
  if (!text) return
  messages.value.push({ role: 'user', content: text, time: Date.now() })
  input.value = ''
  loading.value = true
  await scrollToBottom()

  try {
    const res = await request.post('/agent/ask', { message: text })
    const reply = res?.data?.answer || '后端暂未配置，我先给出占位回复：收到你的问题。'
    messages.value.push({ role: 'assistant', content: reply, time: Date.now() })
  } catch (e) {
    ElMessage.warning('服务暂不可用，使用占位回复')
    messages.value.push({ role: 'assistant', content: '服务暂不可用，请稍后再试。', time: Date.now() })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

const clear = () => {
  messages.value = []
}
</script>

<style scoped>
.agent-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.agent-header .title {
  font-size: 18px;
  font-weight: 600;
}
.agent-header .subtitle {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}
.agent-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.messages {
  height: 420px;
  padding: 8px;
  background: #fafafa;
  border-radius: 8px;
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
  max-width: 70%;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.assistant .bubble {
  background: #eaf6f1;
}
.user .bubble {
  background: #e9f1ff;
}
.role {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.content {
  white-space: pre-wrap;
  word-break: break-word;
}
.time {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
  text-align: right;
}
.composer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
