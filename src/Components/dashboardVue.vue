<template>
  <el-container>
    <!-- 美化后的 el-header -->
    <el-header class="header">
      <h1 class="title">Raspberry Pi</h1>

      <div class="user-info">
        <el-avatar class="avatar" :size="40" src="https://api.dicebear.com/7.x/identicon/svg?seed=vue" />
        <span class="username">Hello, {{ username }}</span>
        <el-button @click="logout" class="logout-button">Logout</el-button>
      </div>
    </el-header>

    <el-row class="tac">
      <el-col :span="2">
        <el-menu default-active="4" class="el-menu-vertical-demo" @open="handleOpen" @close="handleClose">
          <el-sub-menu index="1">
            <template #title>
              <el-icon>
                <location />
              </el-icon>
              <span>Navigator One</span>
            </template>
            <el-menu-item-group title="Group One">
              <el-menu-item index="1-1" @click="toVideo()">video</el-menu-item>
              <el-menu-item index="1-2" @click="toDocument()">document</el-menu-item>
              <el-menu-item index="1-3" @click="toMusic()">music</el-menu-item>
            </el-menu-item-group>
            <el-menu-item-group title="Group Two">
              <el-menu-item index="1-3" @click="toTransfer()">transfer</el-menu-item>
              <el-menu-item index="1-3-2" @click="getDocument()">getDocument</el-menu-item>
              <el-menu-item index="1-3-3" @click="toDoList()">to do list</el-menu-item>
            </el-menu-item-group>
          </el-sub-menu>
          <el-menu-item index="2">
            <el-icon><icon-menu /></el-icon>
            <span>Navigator Two</span>
          </el-menu-item>
          <el-menu-item index="3">
            <el-icon>
              <document />
            </el-icon>
            <span @click="toChat()">Chat</span>
          </el-menu-item>
          <el-menu-item index="4">
            <el-icon>
              <setting />
            </el-icon>
            <span @click="toNavigator()">Navigator Four</span>
          </el-menu-item>
        </el-menu>
      </el-col>

      <el-col :span="22">
        <el-main>
          <router-view></router-view>
        </el-main>
      </el-col>
    </el-row>

    <el-footer class="footer">
      <div>Welcome to my website</div>
      <div>&copy; 2026</div>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/userStore";

const userStore = useUserStore();
const username = computed(() => userStore.getUsername());
const router = useRouter();

const logout = () => {
  router.push("/");
};

import { Document, Menu as IconMenu, Location, Setting } from "@element-plus/icons-vue";
const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath);
};
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath);
};

const toVideo = () => router.push("/video");
const toDocument = () => router.push("/document");
const toNavigator = () => router.push("/navigator");
const toTransfer = () => router.push("/transfer");
const getDocument = () => router.push("/getDocument");
const toChat = () => router.push("/chat");
const toDoList = () => router.push("/todoList");
const toMusic = () => router.push("/music");
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background-color: #409eff;
  color: white;
  font-size: 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 24px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.avatar {
  border: 2px solid white;
}

.username {
  font-size: 16px;
}

.logout-button {
  background-color: #ff4d4f;
  color: white;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  transition: background 0.3s;
}

.logout-button:hover {
  background-color: #d9363e;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  background-color: #f5f5f5;
  color: #333;
  padding: 20px 0;
  border-top: 1px solid #eaeaea;
}
</style>