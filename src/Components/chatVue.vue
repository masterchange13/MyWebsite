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
          @click="chooseUser(u.username)"
        >
          <img class="avatar" :src="getAvatar(u.username)" />
          <div class="uname">{{ u.username }}</div>
        </div>
      </el-scrollbar>
    </el-card>

    <el-card class="chat-window" shadow="always">
      <div class="window-header">
        <div class="peer">
          <img class="avatar" :src="getAvatar(selectedUser)" />
          <div class="name">{{ selectedUser || '未选择' }}</div>
        </div>
      </div>
      <el-scrollbar class="messages" ref="scrollRef">
        <div v-for="(msg, idx) in messages" :key="idx" :class="['message', isMyMessage(msg) ? 'user' : 'other']">
          <div class="bubble">
            <div class="meta">
              <span class="user">{{ getUsername(msg) }}</span>
            </div>
            <div class="text">{{ getMessageText(msg) }}</div>
          </div>
        </div>
      </el-scrollbar>
      <div class="composer">
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
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from "vue";
import { useUserStore } from "@/stores/userStore";
import { chatApi } from "@/api/chatApi";

const socket = ref(null);
const message = ref("");
const messages = ref([]);
const users = ref([]);
const selectedUser = ref("");
const userStore = useUserStore();
const scrollRef = ref(null);
let loadingHistory = false;
const filter = ref('');
const filteredUsers = computed(() => {
  const f = filter.value.trim().toLowerCase()
  return f ? users.value.filter(u => u.username.toLowerCase().includes(f)) : users.value
})
const getAvatar = (name) => `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name || 'user')}`
const chooseUser = async (name) => {
  selectedUser.value = name
  await getHistory()
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
    messages.value.push(`${msgData.sendUsername}: ${msgData.data}`);
    await scrollToBottom();
  };
  socket.value.onclose = () => console.log("WebSocket 连接关闭");
  socket.value.onerror = (error) => console.error("WebSocket 错误:", error);
};

const sendMessage = () => {
  if (socket.value && message.value.trim()) {
    const data = {
      type: "message",
      data: message.value,
      receiveUsername: selectedUser.value,
      sendUsername: userStore.getUsername()
    };
    chatApi.sendMessage(socket.value, data);
    messages.value.push(`${data.sendUsername}: ${data.data}`);
    message.value = "";
    scrollToBottom();
  }
};

const getUsers = async () => {
  const response = await chatApi.getUsers();
  const me = userStore.getUsername();
  const list = response?.data ?? [];
  users.value = Array.isArray(list) ? list.filter(u => u?.username !== me) : [];
  selectedUser.value = users.value.length ? users.value[0].username : '';
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
    messages.value = list.map(item => `${item.sendUsername}: ${item.data}`)
    await scrollToBottom()
  } catch (e) {
    console.error('加载历史失败', e)
  } finally {
    loadingHistory = false
  }
}

const isMyMessage = (msg) => msg.startsWith(userStore.getUsername() + ":");
const getUsername = (msg) => msg.slice(0, msg.indexOf(":"));
const getMessageText = (msg) => msg.slice(msg.indexOf(":") + 2);

const scrollToBottom = async () => {
  await nextTick();
  const wrap = scrollRef.value?.wrapRef;
  if (wrap) wrap.scrollTop = wrap.scrollHeight;
};

onMounted(async () => {
  connectWebSocket();
  await getUsers();
  if (selectedUser.value) await getHistory()
});

onUnmounted(() => {
  if (socket.value) socket.value.close();
});
</script>

<style scoped>
.chat-layout {
  padding: 14px;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 12px;
  height: 100%;
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
  padding-bottom: 100px;
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
  padding: 8px;
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
  padding-top: 8px;
}
.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .chat-layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    height: 240px;
  }
}
</style>
