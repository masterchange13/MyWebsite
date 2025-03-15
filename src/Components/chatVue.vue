<template>
  <div>
    <h3>WebSocket Chat</h3>
    <select v-model="selectedUser">
      <option v-for="user in users" :key="user.username" :value="user.username">
        {{ user.username }}
      </option>
    </select><br>

    <input v-model="message" placeholder="输入消息..." @keyup.enter="sendMessage" />
    <button @click="sendMessage">发送</button>

    <ul>
      <li v-for="msg in messages" :key="msg">{{ msg }}</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { request } from "@/utils/request";
import { useUserStore } from "@/stores/userStore";

const wsUrl = "ws://localhost:8083/ws"; // WebSocket 地址
const socket = ref(null);
const message = ref("");
const messages = ref([]);
const users = ref([]);
const selectedUser = ref(""); // 存储选中的用户
const userStore = useUserStore();


const connectWebSocket = () => {
  const username = userStore.getUsername(); // 获取用户名
  const wsurl = wsUrl + `?username=${username}`; // 拼接 WebSocket URL
  socket.value = new WebSocket(wsurl);

  socket.value.onopen = () => { 
    console.log("WebSocket 连接成功");

  };

  socket.value.onmessage = (event) => {
    const msgData = JSON.parse(event.data); // 解析 JSON 数据
    messages.value.push(`${msgData.sendUsername}: ${msgData.data}`); // 显示用户名和消息
  };

  socket.value.onclose = () => {
    console.log("WebSocket 连接关闭");
  };

  socket.value.onerror = (error) => {
    console.error("WebSocket 错误:", error);
  };
};

const sendMessage = () => {
  if (socket.value && message.value.trim()) {
    const data = {
      type: "message",
      data: message.value,
      receiveUsername: selectedUser.value, // 直接使用 ref 变量
      sendUsername: userStore.getUsername()
    };

    socket.value.send(JSON.stringify(data));
    message.value = "";
  }
};

const getUsers = async () => {
  const response = await request({
    url: "/getUsers",
    method: "get",
  });
  console.log(response.data);
  users.value = response.data;

  if (users.value.length > 0) {
    selectedUser.value = users.value[0].username; // 默认选中第一个用户
  }
};

onMounted(() => {
  connectWebSocket();
  getUsers();
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.close();
  }
});
</script>

<style scoped>
input {
  padding: 5px;
  width: 200px;
}
button {
  margin-left: 10px;
}
ul {
  margin-top: 10px;
}
</style>
