<template>
  <div class="chat-container">
    <h3 class="chat-title">WebSocket Chat</h3>
    <div class="user-select">
      <label for="user">选择聊天对象：</label>
      <select v-model="selectedUser" id="user" class="user-dropdown">
        <option v-for="user in users" :key="user.username" :value="user.username">
          {{ user.username }}
        </option>
      </select>
    </div>
    <el-scrollbar height="400px" class="message-container">
      <div v-for="msg in messages" :key="msg" :class="{'my-message': isMyMessage(msg), 'other-message': !isMyMessage(msg)}" class="message-bubble">
        <p class="message-user">{{ getUsername(msg) }}</p>
        <p class="message-text">{{ getMessageText(msg) }}</p>
      </div>
    </el-scrollbar>
    <div class="input-container">
      <input v-model="message" placeholder="输入消息..." @keyup.enter="sendMessage" class="input-box" />
      <el-button @click="sendMessage" class="send-button">发送</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { request } from "@/utils/request";
import { useUserStore } from "@/stores/userStore";

const wsUrl = "ws://localhost:8083/ws";
const socket = ref(null);
const message = ref("");
const messages = ref([]);
const users = ref([]);
const selectedUser = ref("");
const userStore = useUserStore();

const connectWebSocket = () => {
  const username = userStore.getUsername();
  const wsurl = wsUrl + `?username=${username}`;
  socket.value = new WebSocket(wsurl);
  
  socket.value.onopen = () => console.log("WebSocket 连接成功");
  socket.value.onmessage = (event) => {
    const msgData = JSON.parse(event.data);
    messages.value.push(`${msgData.sendUsername}: ${msgData.data}`);
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
    messages.value.push(`${data.sendUsername}: ${data.data}`); // 立即在本地添加消息
    message.value = "";
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

onMounted(() => {
  connectWebSocket();
  getUsers();
});

onUnmounted(() => {
  if (socket.value) socket.value.close();
});
</script>

<style scoped>
.chat-container {
  width: 400px;
  margin: auto;
  background: #f9f9f9;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
}
.chat-title {
  text-align: center;
  margin-bottom: 10px;
  color: #333;
}
.user-select {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}
.user-dropdown {
  margin-left: 10px;
  padding: 5px;
  border-radius: 5px;
}
.message-container {
  padding: 10px;
  background: #fff;
  border-radius: 10px;
  height: 400px;
  overflow-y: auto;
}
.message-bubble {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 10px;
  margin: 5px 0;
  word-wrap: break-word;
}
.my-message {
  background: #007bff;
  color: white;
  align-self: flex-end;
  text-align: right;
}
.other-message {
  background: #e5e5e5;
  color: black;
  align-self: flex-start;
}
.message-user {
  font-size: 12px;
  font-weight: bold;
}
.input-container {
  display: flex;
  margin-top: 10px;
}
.input-box {
  flex: 1;
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #ccc;
}
.send-button {
  margin-left: 10px;
  background: #007bff;
  color: white;
  border-radius: 5px;
}
</style>
