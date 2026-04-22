<template>
  <el-container>
    <el-header class="header">
      <div class="top-bar">
        <div class="left">
          <el-button class="menu-btn" text @click="showMenuDrawer = true">
            <el-icon><icon-menu /></el-icon>
          </el-button>
          <h1 class="brand-title">Raspberrypi Console</h1>
        </div>
        <div class="user-info">
          <el-avatar class="avatar clickable" :size="40" src="https://api.dicebear.com/7.x/identicon/svg?seed=vue" @click="toProfile" />
          <span class="username">Hello, {{ username }}</span>
          <el-button v-if="timerIsAlarmPlaying" type="danger" class="timer-stop" @click="stopTimerAlarm">停止提醒</el-button>
          <el-button v-else-if="timerIsRunning" class="timer-pill" @click="toTimer">Timer {{ timerFormatted }}</el-button>
          <el-button @click="logout" class="logout-button">Logout</el-button>
        </div>
      </div>

      <el-menu
        v-if="!isMobile"
        mode="horizontal"
        menu-trigger="hover"
        class="cyber-menu"
        :ellipsis="false"
      >
        <el-sub-menu index="1" popper-class="cyber-menu-popper">
          <template #title>
            <el-icon><location /></el-icon>
            <span>Media Hub</span>
          </template>
          <el-menu-item index="1-1" @click="toVideo()">video</el-menu-item>
          <el-menu-item index="1-2" @click="toDocument()">document</el-menu-item>
          <el-menu-item index="1-3" @click="toMusic()">music</el-menu-item>
          <el-menu-item index="1-4" @click="toTransfer()">transfer</el-menu-item>
          <el-menu-item index="1-5" @click="toDoList()">to do list</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="2" popper-class="cyber-menu-popper">
          <template #title>
            <el-icon><icon-menu /></el-icon>
            <span>Tools</span>
          </template>
          <el-menu-item index="2-1" @click="toAgent()">agent</el-menu-item>
          <el-menu-item index="2-2" @click="toQiMen()">QiMenDunJia</el-menu-item>
          <el-menu-item index="2-3" @click="toTimer()">Timer</el-menu-item>
          <el-menu-item index="2-4" @click="toCalculator()">Calculator</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="3" @click="toChat()">
          <el-icon><document /></el-icon>
          <span>Chat</span>
        </el-menu-item>
        <el-menu-item index="4" @click="toNavigator()">
          <el-icon><setting /></el-icon>
          <span>Navigator</span>
        </el-menu-item>
        <el-menu-item index="5" @click="getDocument()">
          <el-icon><document /></el-icon>
          <span>blog</span>
        </el-menu-item>
      </el-menu>
    </el-header>

    <el-main class="content-main">
      <router-view></router-view>
    </el-main>

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
            <el-menu-item index="1-4" @click="toTransfer(); showMenuDrawer=false">transfer</el-menu-item>
            <el-menu-item index="1-5" @click="toDoList(); showMenuDrawer=false">to do list</el-menu-item>
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
          <el-menu-item index="2-2" @click="toQiMen(); showMenuDrawer=false">
            <el-icon><icon-menu /></el-icon>
            <span>QiMenDunJia</span>
          </el-menu-item>
          <el-menu-item index="2-3" @click="toTimer(); showMenuDrawer=false">
            <el-icon><icon-menu /></el-icon>
            <span>Timer</span>
          </el-menu-item>
          <el-menu-item index="2-4" @click="toCalculator(); showMenuDrawer=false">
            <el-icon><icon-menu /></el-icon>
            <span>Calculator</span>
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
        <el-menu-item index="5" @click="getDocument(); showMenuDrawer=false">
          <el-icon><document /></el-icon>
          <span>blog</span>
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
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/userStore";
import { useTimerStore } from "@/stores/timerStore";

const userStore = useUserStore();
const username = computed(() => userStore.getUsername());
const router = useRouter();
const timerStore = useTimerStore();
const { isRunning: timerIsRunning, isAlarmPlaying: timerIsAlarmPlaying } = storeToRefs(timerStore);
const timerFormatted = computed(() => timerStore.formattedRemaining);
const stopTimerAlarm = () => timerStore.stopAlarm();

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
const toQiMen = () => router.push("/qiMen");
const toTimer = () => router.push("/timer");
const toCalculator = () => router.push("/calculator");

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
  timerStore.hydrate()
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
  background:
    radial-gradient(1000px 420px at -10% -20%, rgba(0, 255, 255, 0.12) 0%, rgba(0, 255, 255, 0) 65%),
    radial-gradient(860px 420px at 110% 0%, rgba(255, 0, 204, 0.10) 0%, rgba(255, 0, 204, 0) 60%),
    linear-gradient(180deg, #060710 0%, #090a1a 100%);
}

.header {
  height: auto;
  padding: 12px 18px 0;
  background: rgba(6, 8, 20, 0.9);
  border-bottom: 1px solid rgba(0, 220, 230, 0.16);
  box-shadow: 0 10px 24px rgba(0, 220, 230, 0.05), inset 0 -1px 0 rgba(180, 0, 145, 0.12);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}
.header::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(520px 220px at -5% -25%, rgba(0, 210, 220, 0.09) 0%, rgba(0, 210, 220, 0) 70%),
    radial-gradient(480px 220px at 105% -20%, rgba(170, 0, 135, 0.08) 0%, rgba(170, 0, 135, 0) 70%);
  pointer-events: none;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}
.left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.menu-btn {
  display: none;
  color: #70f6ff;
}

.brand-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #8ed9de;
  text-shadow: 0 0 8px rgba(0, 220, 230, 0.3);
}

.cyber-menu {
  position: relative;
  z-index: 1;
  margin-top: 10px;
  border-bottom: none;
  background: transparent;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: #8dbec8;
  --el-menu-hover-text-color: #cc79be;
  --el-menu-active-color: #65d5dc;
}
:deep(.cyber-menu.el-menu--horizontal > .el-menu-item),
:deep(.cyber-menu.el-menu--horizontal > .el-sub-menu .el-sub-menu__title) {
  height: 46px;
  line-height: 46px;
  border-bottom: none !important;
  color: #8dbec8;
  transition: all 0.15s ease;
}
:deep(.cyber-menu.el-menu--horizontal > .el-menu-item.is-active),
:deep(.cyber-menu.el-menu--horizontal > .el-sub-menu.is-active .el-sub-menu__title) {
  color: #65d5dc;
  text-shadow: 0 0 6px rgba(101, 213, 220, 0.35);
}
:deep(.cyber-menu.el-menu--horizontal > .el-menu-item:hover),
:deep(.cyber-menu.el-menu--horizontal > .el-sub-menu .el-sub-menu__title:hover) {
  color: #cc79be;
  text-shadow: 0 0 6px rgba(204, 121, 190, 0.35);
}

:deep(.el-menu--popup) {
  background: rgba(7, 9, 22, 0.96);
  border: 1px solid rgba(0, 220, 230, 0.2);
  box-shadow: 0 0 12px rgba(0, 220, 230, 0.1), 0 0 20px rgba(170, 0, 135, 0.08);
}
:deep(.el-menu--popup .el-menu-item) {
  color: #8dbec8;
}
:deep(.el-menu--popup .el-menu-item:hover) {
  background: rgba(170, 0, 135, 0.1);
  color: #cc79be;
}
:global(.cyber-menu-popper) {
  background: rgba(7, 9, 22, 0.97) !important;
  border: 1px solid rgba(0, 220, 230, 0.24) !important;
  box-shadow: 0 0 12px rgba(0, 220, 230, 0.12), 0 0 22px rgba(170, 0, 135, 0.1) !important;
}
:global(.cyber-menu-popper .el-menu) {
  background: transparent !important;
}
:global(.cyber-menu-popper .el-menu-item) {
  color: #8dbec8 !important;
}
:global(.cyber-menu-popper .el-menu-item:hover) {
  background: rgba(170, 0, 135, 0.12) !important;
  color: #cc79be !important;
}
:global(.cyber-menu-popper .el-menu-item.is-active) {
  background: rgba(0, 220, 230, 0.12) !important;
  color: #65d5dc !important;
}
:deep(.el-menu-vertical-demo) {
  background: linear-gradient(180deg, #0a0f20 0%, #10162b 100%);
  border-right: 1px solid rgba(0, 255, 255, 0.2);
  padding: 8px;
}
:deep(.el-menu-vertical-demo .el-sub-menu__title),
:deep(.el-menu-vertical-demo .el-menu-item) {
  border-radius: 10px;
  margin: 4px 6px;
  padding-left: 14px;
  transition: background 0.15s ease, color 0.15s ease, transform 0.12s ease;
}
:deep(.el-menu-vertical-demo .el-sub-menu__title:hover),
:deep(.el-menu-vertical-demo .el-menu-item:hover) {
  background: rgba(255, 0, 204, 0.16);
  color: #ff7de7;
  transform: translateX(2px);
}
:deep(.el-menu-vertical-demo .el-menu-item.is-active) {
  background: rgba(0, 255, 255, 0.16);
  color: #00f5ff;
  font-weight: 600;
  box-shadow: inset 0 0 0 1px rgba(0, 255, 255, 0.35);
}
:deep(.el-menu-vertical-demo .el-icon) {
  color: #80f8ff;
}
:deep(.el-menu-vertical-demo .el-sub-menu.is-opened > .el-sub-menu__title) {
  background: rgba(0, 255, 255, 0.08);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  border: 2px solid rgba(255,255,255,0.9);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.clickable {
  cursor: pointer;
}

.username {
  font-size: 15px;
  font-weight: 600;
  color: #cbf7ff;
}

.logout-button {
  background: linear-gradient(90deg, #ff007f 0%, #6f00ff 100%);
  color: #fff;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  border: none;
  box-shadow: 0 0 14px rgba(255, 0, 127, 0.45);
}

.logout-button:hover {
  filter: brightness(1.12);
}

.timer-pill {
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
  background: rgba(0, 255, 255, 0.12);
  color: #8ff5ff;
  border: 1px solid rgba(0, 255, 255, 0.45);
}
.timer-pill:hover {
  background: rgba(0, 255, 255, 0.2);
}
.timer-stop {
  border-radius: 8px;
}

.content-main {
  flex: 1;
  overflow: auto;
  padding: 0;
  min-height: 0;
}

.footer {
  text-align: center;
  background: rgba(8, 10, 25, 0.86);
  color: #9ee8ff;
  padding: 20px 0;
  border-top: 1px solid rgba(0, 255, 255, 0.25);
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
  color: #8dbad1;
}
.track .bar {
  width: 280px;
  height: 4px;
  background: rgba(110, 160, 220, 0.35);
  border-radius: 4px;
  position: relative;
}
.track .bar-progress {
  height: 100%;
  background: linear-gradient(90deg, #00f5ff 0%, #ff00cc 100%);
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
    color: #8ff5ff;
  }
  .brand-title {
    font-size: 20px;
  }
  .header {
    padding: 10px 12px 0;
  }
  .username {
    display: none;
  }
  .timer-pill {
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
