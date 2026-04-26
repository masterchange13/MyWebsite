<template>
  <div class="chat-layout">
    <el-card class="sidebar" shadow="always">
      <div class="sidebar-top">
        <div class="title">联系人</div>
        <el-input v-model="filter" size="small" placeholder="搜索用户" />
      </div>
      <el-scrollbar class="user-list">
        <div
          v-for="u in filteredUsers"
          :key="u.username"
          :class="['user-item', selectedUser === u.username ? 'active' : '']"
          @click="chooseUser(u)"
        >
          <img class="avatar clickable" :src="getAvatar(u.username)" @click.stop="toProfile(u.id)" />
          <div class="uname">{{ u.username }}</div>
        </div>
      </el-scrollbar>
    </el-card>

    <el-card class="chat-window" shadow="always">
      <div class="window-header">
        <div class="peer">
          <img class="avatar clickable" :src="getAvatar(selectedUser)" @click.stop="toProfile(selectedUserId)" />
          <div class="name">{{ selectedUser || '未选择' }}</div>
        </div>
      </div>
      <el-scrollbar class="messages" ref="scrollRef">
        <div v-for="(msg, idx) in messages" :key="idx" :class="['message', isMyMessage(msg) ? 'user' : 'other']">
          <div class="bubble">
            <div class="meta">
              <span class="time">{{ getMessageTime(msg) }}</span>
            </div>
            <div class="text">{{ getMessageText(msg) }}</div>
          </div>
        </div>
      </el-scrollbar>
      <div class="composer">
        <div class="symbol-tools" ref="symbolToolsRef">
          <button
            class="symbol-toggle"
            type="button"
            @click="showSymbolPanel = !showSymbolPanel"
            :aria-expanded="showSymbolPanel"
            title="表情符号"
          >
            😊
          </button>
          <div v-if="showSymbolPanel" class="symbol-panel" @click.stop>
            <button
              v-for="s in quickSymbols"
              :key="s"
              class="symbol-chip"
              type="button"
              @click="insertSymbol(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>
        <el-input v-model="message" type="textarea" :rows="2" placeholder="输入消息，按 Enter 发送" @keyup.enter="sendMessage" />
        <div class="actions">
          <el-button type="primary" @click="sendMessage" :disabled="!selectedUser">发送</el-button>
          <el-button @click="message = ''">清空</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/userStore";
import { chatApi } from "@/api/chatApi";

const socket = ref(null);
const message = ref("");
const messages = ref([]);
const users = ref([]);
const selectedUser = ref("");
const selectedUserId = ref("");
const userStore = useUserStore();
const router = useRouter();
const scrollRef = ref(null);
let loadingHistory = false;
const filter = ref('');
const showSymbolPanel = ref(false);
const symbolToolsRef = ref(null);
const quickSymbols = ['😀', '😂', '😍', '🥳', '👍', '👏', '🙏', '❤️', '✨', '🔥', '🌸', '🍀', '(＾▽＾)', 'QAQ', 'OTZ', '→', '←', '✓', '★', '※'];

const insertSymbol = (symbol) => {
  message.value = `${message.value || ''}${symbol}`
}
const handleOutsideClick = (event) => {
  if (!showSymbolPanel.value) return
  const root = symbolToolsRef.value
  const target = event.target
  if (root && target && !root.contains(target)) {
    showSymbolPanel.value = false
  }
}
const filteredUsers = computed(() => {
  const f = filter.value.trim().toLowerCase()
  return f ? users.value.filter(u => String(u.username || '').toLowerCase().includes(f)) : users.value
})
const getAvatar = (name) => `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name || 'user')}`
const chooseUser = async (user) => {
  selectedUser.value = user?.username || ''
  selectedUserId.value = String(user?.id ?? user?.user_id ?? '')
  await getHistory()
}

const toProfile = (id) => {
  const target = String(id || '').trim()
  if (!target) return
  router.push(`/profile/${encodeURIComponent(target)}`)
}

const closeSocket = () => {
  if (socket.value) {
    try { socket.value.close() } catch {}
    socket.value = null
  }
}

const connectWebSocket = () => {
  const username = userStore.getUsername();
  closeSocket()
  socket.value = chatApi.createSocket(username);
  
  socket.value.onopen = () => console.log("WebSocket 连接成功");
  socket.value.onmessage = async (event) => {
    const msgData = JSON.parse(event.data);
    messages.value.push(normalizeMessage(msgData));
    await scrollToBottom();
  };
  socket.value.onclose = () => console.log("WebSocket 连接关闭");
  socket.value.onerror = (error) => console.error("WebSocket 错误:", error);
};

const sendMessage = () => {
  if (socket.value && selectedUser.value && message.value.trim()) {
    const data = {
      type: "message",
      data: message.value,
      receiveUsername: selectedUser.value,
      sendUsername: userStore.getUsername()
    };
    chatApi.sendMessage(socket.value, data);
    message.value = "";
    scrollToBottom();
  }
};

const getUsers = async () => {
  const response = await chatApi.getUsers();
  const me = userStore.getUsername();
  const list = response?.data ?? [];
  users.value = Array.isArray(list)
    ? list
        .map((u) => ({
          ...u,
          id: u?.id ?? u?.user_id ?? '',
          username: u?.username || ''
        }))
        .filter(u => u.username && u.username !== me)
    : [];
  selectedUser.value = users.value.length ? users.value[0].username : '';
  selectedUserId.value = users.value.length ? String(users.value[0].id || '') : '';
};

const getHistory = async () => {
  if (!selectedUser.value) return
  if (loadingHistory) return
  loadingHistory = true
  try {
    const from = userStore.getUsername()
    const to = selectedUser.value
    const res = await chatApi.getHistory({ from, to })
    const list = res?.data || res || []
    messages.value = list.map(item => normalizeMessage(item))
    await scrollToBottom()
  } catch (e) {
    console.error('加载历史失败', e)
  } finally {
    loadingHistory = false
  }
}

const formatTime = (value) => {
  if (!value) return '--:--'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '--:--'
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const normalizeMessage = (raw) => {
  if (typeof raw === 'string') {
    const splitIdx = raw.indexOf(':')
    const username = splitIdx > -1 ? raw.slice(0, splitIdx) : 'unknown'
    const text = splitIdx > -1 ? raw.slice(splitIdx + 1).trim() : raw
    return {
      sendUsername: username,
      data: text,
      time: new Date().toISOString()
    }
  }
  return {
    sendUsername: raw?.sendUsername || raw?.from || 'unknown',
    data: raw?.data ?? raw?.message ?? '',
    time: raw?.create_time || raw?.time || raw?.createdAt || new Date().toISOString()
  }
}

const isMyMessage = (msg) => getUsername(msg) === userStore.getUsername();
const getUsername = (msg) => msg?.sendUsername || 'unknown';
const getMessageText = (msg) => msg?.data || '';
const getMessageTime = (msg) => formatTime(msg?.time);

const scrollToBottom = async () => {
  await nextTick();
  const wrap = scrollRef.value?.wrapRef;
  if (wrap) wrap.scrollTop = wrap.scrollHeight;
};

onMounted(async () => {
  connectWebSocket();
  await getUsers();
  if (selectedUser.value) await getHistory()
  document.addEventListener('mousedown', handleOutsideClick)
});

onUnmounted(() => {
  if (socket.value) socket.value.close();
  document.removeEventListener('mousedown', handleOutsideClick)
});
</script>

<style scoped>
.chat-layout {
  padding: 14px;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 12px;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}
.sidebar :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.sidebar-top .title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #9ef7ff;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.35);
}
.user-list {
  flex: 1;
  min-height: 0;
}
.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
}
.user-item.active {
  background: rgba(0, 255, 255, 0.10);
  border-color: rgba(0, 255, 255, 0.28);
}
.user-item .avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(0, 255, 255, 0.28);
}
.clickable {
  cursor: pointer;
}
.uname {
  color: #d7f8ff;
}
.chat-window {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
  height: 100%;
}
.chat-window :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 12px;
}
.window-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.peer {
  display: flex;
  align-items: center;
  gap: 10px;
}
.peer .avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(0, 255, 255, 0.3);
}
.peer .name {
  font-weight: 600;
  color: #b9f6ff;
}
.messages {
  padding: 12px;
  background: rgba(10, 16, 35, 0.82);
  border: 1px solid rgba(0, 255, 255, 0.18);
  border-radius: 8px;
  flex: 1;
  min-height: 0;
}
.message {
  display: flex;
  margin-bottom: 8px;
}
.message.user {
  justify-content: flex-end;
}
.message.other {
  justify-content: flex-start;
}
.bubble {
  max-width: 70%;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(16, 23, 48, 0.92);
  box-shadow: 0 0 12px rgba(0, 255, 255, 0.08);
  border: 1px solid rgba(0, 255, 255, 0.18);
}
.message.other .bubble {
  background: rgba(12, 40, 46, 0.86);
}
.message.user .bubble {
  background: rgba(40, 15, 52, 0.86);
}
.meta {
  font-size: 12px;
  color: #88b3c9;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.meta .time {
  color: #7fa4bd;
  font-variant-numeric: tabular-nums;
}
.text {
  white-space: pre-wrap;
  word-break: break-word;
  color: #e0fbff;
}
.composer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: transparent;
  border-top: 1px solid rgba(0, 255, 255, 0.14);
  padding-top: 10px;
  width: 100%;
}
.symbol-tools {
  position: relative;
  width: 44px;
  height: 44px;
}
.symbol-toggle {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(0, 255, 255, 0.26);
  background: rgba(8, 14, 32, 0.8);
  color: #d9f9ff;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 245, 255, 0.1);
}
.symbol-toggle:hover {
  border-color: rgba(255, 0, 204, 0.32);
  color: #ff9be9;
}
.symbol-panel {
  position: absolute;
  left: 0;
  bottom: 52px;
  width: 320px;
  min-height: 220px;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(0, 255, 255, 0.24);
  border-radius: 12px;
  background: rgba(8, 14, 32, 0.92);
  box-shadow: 0 0 16px rgba(0, 245, 255, 0.14), 0 0 26px rgba(255, 0, 204, 0.1);
  z-index: 20;
}
.symbol-chip {
  width: 100%;
  height: 38px;
  border: 1px solid rgba(0, 255, 255, 0.22);
  background: rgba(0, 245, 255, 0.08);
  color: #d9f9ff;
  border-radius: 8px;
  padding: 0;
  cursor: pointer;
  font-size: 16px;
}
.symbol-chip:hover {
  border-color: rgba(255, 0, 204, 0.36);
  color: #ff9be9;
  background: rgba(255, 0, 204, 0.12);
}
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.composer :deep(.el-textarea__inner) {
  min-height: 92px !important;
}

@media (max-width: 900px) {
  .chat-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    height: 240px;
  }
  .symbol-panel {
    width: 280px;
    min-height: 200px;
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
