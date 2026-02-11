<template>
  <div class="chat-wrap">
    <el-card class="chat-header" shadow="never">
      <div class="header-left">
        <div class="title">WebSocket Chat</div>
        <div class="subtitle">实时聊天</div>
      </div>
      <div class="header-right">
        <span class="label">聊天对象</span>
        <el-select v-model="selectedUser" placeholder="选择用户" size="small" class="user-select">
          <el-option v-for="user in users" :key="user.username" :label="user.username" :value="user.username" />
        </el-select>
      </div>
    </el-card>

    <el-card class="chat-body" shadow="always">
      <el-scrollbar class="messages" ref="scrollRef">
        <div v-for="msg in messages" :key="msg" :class="['message', isMyMessage(msg) ? 'user' : 'other']">
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
          <el-button type="primary" @click="sendMessage">发送</el-button>
          <el-button @click="message = ''">清空</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { request } from "@/utils/request";
import { useUserStore } from "@/stores/userStore";

const wsUrl = "ws://localhost:8083/ws";
const socket = ref(null);
const message = ref("");
const messages = ref([]);
const users = ref([]);
const selectedUser = ref("");
const userStore = useUserStore();
const scrollRef = ref(null);

const connectWebSocket = () => {
  const username = userStore.getUsername();
  const wsurl = wsUrl + `?username=${username}`;
  socket.value = new WebSocket(wsurl);
  
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
    socket.value.send(JSON.stringify(data));
    messages.value.push(`${data.sendUsername}: ${data.data}`);
    message.value = "";
    scrollToBottom();
  }
};

const getUsers = async () => {
  const response = await request({ url: "/getUsers", method: "get" });
  users.value = response.data;
  if (users.value.length > 0) {
    selectedUser.value = users.value[0].username;
  }
};

const isMyMessage = (msg) => msg.startsWith(userStore.getUsername() + ":");
const getUsername = (msg) => msg.slice(0, msg.indexOf(":"));
const getMessageText = (msg) => msg.slice(msg.indexOf(":") + 2);

const scrollToBottom = async () => {
  await nextTick();
  const wrap = scrollRef.value?.wrapRef;
  if (wrap) wrap.scrollTop = wrap.scrollHeight;
};

onMounted(() => {
  connectWebSocket();
  getUsers();
});

onUnmounted(() => {
  if (socket.value) socket.value.close();
});
</script>

<style scoped>
.chat-wrap {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-left .title {
  font-size: 18px;
  font-weight: 600;
}
.header-left .subtitle {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.label {
  font-size: 12px;
  color: #666;
}
.user-select {
  width: 160px;
}
.chat-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
}
.messages {
  padding: 8px;
  background: #fafafa;
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
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.message.other .bubble {
  background: #eaf6f1;
}
.message.user .bubble {
  background: #e9f1ff;
}
.meta {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.text {
  white-space: pre-wrap;
  word-break: break-word;
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
