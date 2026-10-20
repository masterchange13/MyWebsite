<template>
  <div class="terminal-page">
    <header class="terminal-toolbar">
      <div>
        <h2>服务器终端</h2>
        <p v-if="host.platform">{{ host.platform }} · {{ host.shell }} · {{ host.cwd }}</p>
        <p v-else>在浏览器中操作网站后端服务器</p>
      </div>
      <div class="actions">
        <el-tag :type="connected ? 'success' : 'info'">{{ connected ? '已连接' : '未连接' }}</el-tag>
        <el-button @click="terminal?.clear()">清屏</el-button>
        <el-button v-if="connected || connecting" @click="disconnect">{{ connecting ? '取消连接' : '断开连接' }}</el-button>
        <el-button v-else type="primary" :loading="checking" :disabled="!authorized || closing || activeConnection" @click="connect">连接终端</el-button>
        <el-button v-if="authorized && !connected && !connecting" type="warning" plain :loading="closing" @click="closeExisting">关闭已有连接</el-button>
      </div>
    </header>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <el-alert v-if="activeConnection || closing" :title="closing ? '正在关闭原连接并释放终端，请稍候…' : '此账号在其他页面有终端连接。点击“关闭已有连接”会结束原终端及其中运行的命令，然后可以重新连接。'" type="warning" :closable="false" show-icon />
    <div ref="container" class="terminal-screen" aria-label="服务器交互式命令行"></div>
    <footer>
      <span>命令以服务器运行账号的权限执行</span>
      <div class="keys">
        <el-button size="small" :disabled="!connected" @click="sendInput('\t')">Tab</el-button>
        <el-button size="small" :disabled="!connected" @click="sendInput('\x1b[A')">↑</el-button>
        <el-button size="small" :disabled="!connected" @click="sendInput('\x1b[B')">↓</el-button>
        <el-button size="small" :disabled="!connected" @click="sendInput('\x03')">Ctrl+C</el-button>
        <el-button size="small" :disabled="!connected" @click="sendInput('\r')">Enter</el-button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { terminalApi } from '@/api/terminalApi'

const container = ref(null)
const connected = ref(false)
const connecting = ref(false)
const checking = ref(true)
const authorized = ref(false)
const activeConnection = ref(false)
const closing = ref(false)
const host = ref({})
const error = ref('')
let terminal, fit, observer, socket, heartbeat, controller, timeout, closeTimer
let disposed = false
let generation = 0

function send(data) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data))
}

function sendInput(data) {
  if (!connected.value) return
  for (const chunk of data.match(/[\s\S]{1,4096}/gu) || []) send({ type: 'input', data: chunk })
  terminal?.focus()
}

function resize() {
  if (!container.value?.clientWidth || !fit) return
  fit.fit()
  if (connected.value) send({ type: 'resize', rows: terminal.rows, cols: terminal.cols })
}

function disconnect() {
  generation++
  clearInterval(heartbeat)
  clearTimeout(timeout)
  controller?.abort()
  socket?.close()
  socket = null
  connected.value = false
  connecting.value = false
}

async function closeExisting() {
  if (disposed || closing.value) return
  closing.value = true
  error.value = ''
  try {
    await terminalApi.closeSession()
    if (disposed) return
    await checkClosed(Date.now() + 60000)
  } catch (exception) {
    if (disposed) return
    closing.value = false
    error.value = exception.response?.data?.message || '关闭原连接失败，请稍后重试。'
  }
}

async function checkClosed(deadline) {
  try {
    const response = await terminalApi.status()
    if (disposed) return
    activeConnection.value = response.data.active_connection
    if (!activeConnection.value) {
      closing.value = false
      terminal?.writeln('\r\n原连接已关闭，点击“连接终端”开始新会话。')
      return
    }
    if (Date.now() >= deadline) {
      closing.value = false
      error.value = '原连接尚未释放，请确认后端已更新，稍后再重试。'
      return
    }
    closeTimer = setTimeout(() => checkClosed(deadline), 1000)
  } catch (exception) {
    if (disposed) return
    closing.value = false
    error.value = exception.response?.data?.message || '无法确认终端是否已关闭，请重试。'
  }
}

async function connect() {
  if (disposed || connected.value || connecting.value || closing.value) return
  disconnect()
  const current = generation
  connecting.value = true
  error.value = ''
  controller = new AbortController()
  try {
    const response = await terminalApi.createSession(controller.signal)
    if (disposed || current !== generation) return
    terminal.reset()
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const connection = new WebSocket(`${protocol}//${window.location.host}/terminal/ws/?token=${encodeURIComponent(response.data.token)}`)
    socket = connection
    timeout = setTimeout(() => {
      if (current !== generation || connected.value) return
      error.value = '终端连接超时，请检查后端服务和 WebSocket 代理配置。'
      disconnect()
    }, 15000)
    connection.onmessage = (event) => {
      if (disposed || current !== generation) return
      let message
      try { message = JSON.parse(event.data) } catch { return }
      if (message.type === 'output') terminal.write(message.data)
      if (message.type === 'error') {
        error.value = message.message
        if (message.reason === 'connection_exists') activeConnection.value = true
      }
      if (message.type === 'ready') {
        clearTimeout(timeout)
        connected.value = true
        activeConnection.value = false
        connecting.value = false
        resize()
        terminal.focus()
        heartbeat = setInterval(() => send({ type: 'ping' }), 20000)
      }
    }
    connection.onclose = (event) => {
      if (disposed || current !== generation) return
      clearInterval(heartbeat)
      clearTimeout(timeout)
      connected.value = false
      connecting.value = false
      if (!error.value) error.value = event.code === 4403 ? '终端授权已失效，请重新登录后连接。' : '终端连接已结束，可以重新连接。'
    }
    connection.onerror = () => {
      if (current === generation) error.value = '无法连接终端，请检查网络及服务器 WebSocket 配置。'
    }
  } catch (exception) {
    if (!disposed && current === generation && exception.code !== 'ERR_CANCELED') {
      error.value = exception.response?.data?.message || '创建终端会话失败，请稍后重试。'
      connecting.value = false
    }
  }
}

onMounted(async () => {
  terminal = new Terminal({ cursorBlink: true, screenReaderMode: true, fontSize: 14, scrollback: 3000, theme: { background: '#0b1020', foreground: '#d7e5f5' } })
  fit = new FitAddon()
  terminal.loadAddon(fit)
  terminal.open(container.value)
  terminal.onData(sendInput)
  observer = new ResizeObserver(resize)
  observer.observe(container.value)
  await nextTick()
  resize()
  terminal.writeln('点击“连接终端”开始会话。')
  try {
    const response = await terminalApi.status()
    if (disposed) return
    host.value = response.data
    activeConnection.value = response.data.active_connection
    authorized.value = true
  } catch (exception) {
    if (!disposed) error.value = exception.response?.data?.message || '无法获取终端状态。'
  } finally {
    if (!disposed) checking.value = false
  }
})

onBeforeUnmount(() => {
  disposed = true
  disconnect()
  clearTimeout(closeTimer)
  observer?.disconnect()
  terminal?.dispose()
})
</script>

<style scoped>
.terminal-page { height: 100%; min-height: 350px; padding: 16px; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; color: var(--app-text-main); }
.terminal-toolbar { display: flex; gap: 16px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
h2 { margin: 0; font-size: 20px; }
p { margin: 6px 0 0; font-size: 12px; color: var(--app-text-muted); overflow-wrap: anywhere; }
.actions, .keys { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.actions :deep(.el-button), .keys :deep(.el-button) { margin-left: 0; }
.terminal-screen { flex: 1; min-height: 180px; padding: 12px; background: #0b1020; border: 1px solid var(--app-header-border); border-radius: 10px; overflow: hidden; }
footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; font-size: 12px; color: var(--app-text-muted); }
@media (max-width: 768px) { .terminal-page { padding: 10px; } .terminal-screen { padding: 8px; } .actions { width: 100%; } }
</style>
