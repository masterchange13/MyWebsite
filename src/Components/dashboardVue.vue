<template>
  <el-container>
    <!-- 美化后的 el-header -->
    <el-header class="header">
      <div class="left">
        <el-button class="menu-btn" text @click="showMenuDrawer = true">
          <el-icon><icon-menu /></el-icon>
        </el-button>
      </div>
      <h1 class="title title-center">Raspberry Pi</h1>

      <div class="user-info">
        <el-avatar class="avatar clickable" :size="40" src="https://api.dicebear.com/7.x/identicon/svg?seed=vue" @click="toProfile" />
        <span class="username">Hello, {{ username }}</span>
        <el-button @click="logout" class="logout-button">Logout</el-button>
      </div>
    </el-header>

    <el-row class="tac" style="flex: 1; min-height: 0; overflow: hidden; display: flex;">
      <el-col v-if="!isMobile" :span="2" style="height: 100%; overflow: hidden;">
        <el-menu default-active="4" class="el-menu-vertical-demo" @open="handleOpen" @close="handleClose" style="height: 100%; overflow-y: auto;">
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
          <el-sub-menu index="2">
            <template #title>
              <el-icon><icon-menu /></el-icon>
              <span>Navigator Two</span>
            </template>
            <el-menu-item index="2-1" @click="toAgent()">
              <el-icon><icon-menu /></el-icon>
              <span>agent</span>
            </el-menu-item>
          </el-sub-menu>
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

      <el-col :span="isMobile ? 24 : 22" style="height: 100%; overflow: hidden; display: flex; flex-direction: column;">
        <el-main style="flex: 1; overflow: auto; padding: 0;">
          <router-view></router-view>
        </el-main>
      </el-col>
    </el-row>

    <el-drawer v-model="showMenuDrawer" :with-header="false" size="240px">
      <el-menu default-active="4" class="el-menu-vertical-demo" @open="handleOpen" @close="handleClose" style="height: 100%;">
        <el-sub-menu index="1">
          <template #title>
            <el-icon><location /></el-icon>
            <span>Navigator One</span>
          </template>
          <el-menu-item-group title="Group One">
            <el-menu-item index="1-1" @click="toVideo(); showMenuDrawer=false">video</el-menu-item>
            <el-menu-item index="1-2" @click="toDocument(); showMenuDrawer=false">document</el-menu-item>
            <el-menu-item index="1-3" @click="toMusic(); showMenuDrawer=false">music</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group title="Group Two">
            <el-menu-item index="1-3" @click="toTransfer(); showMenuDrawer=false">transfer</el-menu-item>
            <el-menu-item index="1-3-2" @click="getDocument(); showMenuDrawer=false">getDocument</el-menu-item>
            <el-menu-item index="1-3-3" @click="toDoList(); showMenuDrawer=false">to do list</el-menu-item>
          </el-menu-item-group>
        </el-sub-menu>
        <el-sub-menu index="2">
          <template #title>
            <el-icon><icon-menu /></el-icon>
            <span>Navigator Two</span>
          </template>
          <el-menu-item index="2-1" @click="toAgent(); showMenuDrawer=false">
            <el-icon><icon-menu /></el-icon>
            <span>agent</span>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item index="3" @click="toChat(); showMenuDrawer=false">
          <el-icon><document /></el-icon>
          <span>Chat</span>
        </el-menu-item>
        <el-menu-item index="4" @click="toNavigator(); showMenuDrawer=false">
          <el-icon><setting /></el-icon>
          <span>Navigator Four</span>
        </el-menu-item>
      </el-menu>
    </el-drawer>

    <el-footer class="footer">
      <div class="mini-player">
        <div class="cover">
          <img :src="cover" alt="" />
        </div>
        <div class="info">
          <div class="title">{{ title }}</div>
          <div class="time">{{ currentTimeFormatted }} / {{ durationFormatted }}</div>
          <div class="track" ref="trackRef" @click="clickProgress">
            <div class="bar">
              <div class="bar-progress" :style="{ width: progress + '%' }"></div>
            </div>
          </div>
        </div>
        <div class="controls">
          <el-button link @click="prevSong">⏮️</el-button>
          <el-button link @click="togglePlay">{{ isPlaying ? '⏸️' : '▶️' }}</el-button>
          <el-button link @click="nextSong">⏭️</el-button>
        </div>
        <div class="volume">
          <el-slider v-model="volume" :min="0" :max="100" />
        </div>
      </div>
      <audio id="globalAudio" preload="auto" style="display: none"></audio>
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
const toAgent = () => router.push("/agent");
const toTransfer = () => router.push("/transfer");
const getDocument = () => router.push("/getDocument");
const toChat = () => router.push("/chat");
const toDoList = () => router.push("/todoList");
const toMusic = () => router.push("/music");
const toProfile = () => router.push("/profile");

import { ref, computed, onMounted, onUnmounted, watch } from "vue";
const audioRef = ref<HTMLAudioElement | null>(null);
const trackRef = ref<HTMLElement | null>(null);
const isPlaying = ref(false);
const title = ref<string>("");
const cover = ref<string>("");
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(15);

const currentTimeFormatted = computed(() => {
  const min = Math.floor(currentTime.value / 60);
  const sec = Math.floor(currentTime.value % 60);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
});

const durationFormatted = computed(() => {
  const min = Math.floor(duration.value / 60);
  const sec = Math.floor(duration.value % 60);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
});

const progress = computed(() =>
  duration.value ? (currentTime.value / duration.value) * 100 : 0
);

onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
  audioRef.value = document.getElementById("globalAudio") as HTMLAudioElement | null;
  if (!audioRef.value) return;
  audioRef.value.volume = volume.value / 100;
  audioRef.value.addEventListener("timeupdate", () => {
    currentTime.value = audioRef.value!.currentTime;
    duration.value = audioRef.value!.duration || 0;
  });
  audioRef.value.addEventListener("loadedmetadata", () => {
    duration.value = audioRef.value!.duration || 0;
    audioRef.value!.volume = volume.value / 100;
  });
  audioRef.value.addEventListener("play", () => {
    isPlaying.value = true;
  });
  audioRef.value.addEventListener("pause", () => {
    isPlaying.value = false;
  });
  window.addEventListener("global-player-song", (e: Event) => {
    const detail = (e as CustomEvent).detail || {};
    title.value = detail.title || "";
    cover.value = detail.cover || "";
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})

watch(volume, (val) => {
  if (audioRef.value) audioRef.value.volume = val / 100;
}, { immediate: true });

const togglePlay = () => {
  if (!audioRef.value) return;
  if (audioRef.value.paused) audioRef.value.play();
  else audioRef.value.pause();
};

const prevSong = () => {
  window.dispatchEvent(new Event("global-player-prev"));
};

const nextSong = () => {
  window.dispatchEvent(new Event("global-player-next"));
};

const clickProgress = (e: MouseEvent) => {
  if (!audioRef.value || !trackRef.value || !isFinite(audioRef.value.duration)) return;
  const rect = trackRef.value.getBoundingClientRect();
  let percent = (e.clientX - rect.left) / rect.width;
  percent = Math.max(0, Math.min(1, percent));
  const target = percent * audioRef.value.duration;
  if ((audioRef.value as any).fastSeek) (audioRef.value as any).fastSeek(target);
  else audioRef.value.currentTime = target;
};

const isMobile = ref(false)
const showMenuDrawer = ref(false)
const updateIsMobile = () => {
  isMobile.value = window.innerWidth < 768
}
</script>

<style scoped>
.el-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background-color: #409eff;
  color: white;
  font-size: 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
}

.left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.menu-btn {
  display: none;
}

.title {
  font-size: 24px;
  font-weight: bold;
}
.title-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.avatar {
  border: 2px solid white;
}
.clickable {
  cursor: pointer;
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
  text-align: center;
  background-color: #f5f5f5;
  color: #333;
  padding: 20px 0;
  border-top: 1px solid #eaeaea;
  flex-shrink: 0;
}

.mini-player {
  display: flex;
  align-items: center;
  gap: 16px;
}
.cover img {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}
.info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 240px;
}
.title {
  font-size: 14px;
  font-weight: 600;
}
.time {
  font-size: 12px;
  color: #666;
}
.track .bar {
  width: 280px;
  height: 4px;
  background: #ddd;
  border-radius: 4px;
  position: relative;
}
.track .bar-progress {
  height: 100%;
  background: #40ce8f;
  border-radius: 4px;
}
.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.volume {
  width: 140px;
}

@media (max-width: 768px) {
  .menu-btn {
    display: inline-flex;
    color: #fff;
  }
  .title {
    font-size: 18px;
  }
  .header {
    padding: 10px 14px;
  }
  .username {
    display: none;
  }
  .mini-player {
    flex-wrap: wrap;
    gap: 10px;
  }
  .info {
    min-width: 180px;
  }
  .track .bar {
    width: 60vw;
    max-width: none;
  }
  .volume {
    width: 120px;
  }
}
</style>
