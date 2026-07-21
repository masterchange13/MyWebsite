<template>
  <el-container>
    <el-header class="header">
      <div class="top-bar">
        <div class="left">
          <el-button class="menu-btn" text @click="showMenuDrawer = true">
            <el-icon><icon-menu /></el-icon>
          </el-button>
          <h1 class="brand-title">{{ brandTitle }}</h1>
        </div>
        <div class="user-info">
          <el-avatar class="avatar clickable" :size="40" src="https://api.dicebear.com/7.x/identicon/svg?seed=vue" @click="toProfile" />
          <span class="username">Hello, {{ username }}</span>
          <el-button v-if="stopwatchVisible" class="timer-pill stopwatch-pill" @click="toTimer">Stopwatch {{ stopwatchFormatted }}</el-button>
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
        <template v-for="entry in menuEntries" :key="entry.id">
          <el-sub-menu
            v-if="entry.type === 'submenu'"
            :index="entry.id"
            popper-class="cyber-menu-popper"
            :class="{ 'is-active': isMenuActive(entry.id) }"
          >
            <template #title>
              <el-icon><component :is="resolveIcon(entry.icon)" /></el-icon>
              <span>{{ entry.label }}</span>
            </template>
            <el-menu-item
              v-for="child in entry.items"
              :key="child.id"
              :index="child.id"
              :class="{ 'is-active': isMenuActive(child.id) }"
              @click="navigateTo(child.path)"
            >
              {{ child.label }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item
            v-else
            :index="entry.id"
            :class="{ 'is-active': isMenuActive(entry.id) }"
            @click="navigateTo(entry.path)"
          >
            <el-icon><component :is="resolveIcon(entry.icon)" /></el-icon>
            <span v-if="entry.id === 'chat'" class="chat-menu-label">
              {{ entry.label }}
              <span v-if="totalUnread > 0" class="unread-badge">{{ totalUnread > 99 ? '99+' : totalUnread }}</span>
            </span>
            <span v-else>{{ entry.label }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-header>

    <el-main class="content-main">
      <router-view></router-view>
    </el-main>

    <el-drawer v-model="showMenuDrawer" :with-header="false" size="240px">
      <el-menu class="el-menu-vertical-demo" @open="handleOpen" @close="handleClose" style="height: 100%;">
        <template v-for="entry in menuEntries" :key="entry.id">
          <el-sub-menu v-if="entry.type === 'submenu'" :index="entry.id" :class="{ 'is-active': isMenuActive(entry.id) }">
            <template #title>
              <el-icon><component :is="resolveIcon(entry.icon)" /></el-icon>
              <span>{{ entry.label }}</span>
            </template>
            <el-menu-item
              v-for="child in entry.items"
              :key="child.id"
              :index="child.id"
              :class="{ 'is-active': isMenuActive(child.id) }"
              @click="navigateTo(child.path); showMenuDrawer = false"
            >
              {{ child.label }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item
            v-else
            :index="entry.id"
            :class="{ 'is-active': isMenuActive(entry.id) }"
            @click="navigateTo(entry.path); showMenuDrawer = false"
          >
            <el-icon><component :is="resolveIcon(entry.icon)" /></el-icon>
            <span class="chat-menu-label" v-if="entry.id === 'chat'">
              {{ entry.label }}
              <span v-if="totalUnread > 0" class="unread-badge">{{ totalUnread > 99 ? '99+' : totalUnread }}</span>
            </span>
            <span v-else>{{ entry.label }}</span>
          </el-menu-item>
        </template>
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
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/stores/userStore";
import { useWebsiteSettingsStore } from "@/stores/websiteSettingsStore";
import { useTimerStore } from "@/stores/timerStore";
import { useChatStore } from "@/stores/chatStore";
import { userApi } from "@/api/userApi";
import * as chatSocket from "@/websocket/chatSocket";
import { playMessageSound, sendNotification, requestNotificationPermission } from "@/utils/notify";
import { getOrderedTopLevelMenu } from "@/utils/siteSettings";
import { Document, Menu as IconMenu, Location, Setting, User } from "@element-plus/icons-vue";

const userStore = useUserStore();
const websiteSettings = useWebsiteSettingsStore();
websiteSettings.normalizeOrders()
const username = computed(() => userStore.getUsername());
const router = useRouter();
const route = useRoute();
const brandTitle = computed(() => websiteSettings.siteTitle || 'Raspberrypi Console')

const iconMap = {
  Document,
  IconMenu,
  Location,
  Setting,
  User
}

const resolveIcon = (iconName: string) => iconMap[iconName as keyof typeof iconMap] || Setting
const menuEntries = computed(() => getOrderedTopLevelMenu(websiteSettings.topLevelOrder, websiteSettings.submenuOrders))

const isPathActive = (activePaths: string[] = []) => activePaths.some((target) => route.path.startsWith(target))

const menuActiveSet = computed(() => {
  const active = new Set<string>()
  for (const entry of menuEntries.value) {
    if (entry.type === 'submenu') {
      const current = entry.items.find((item) => isPathActive(item.activePaths))
      if (current) {
        active.add(entry.id)
        active.add(current.id)
      }
      continue
    }
    if (isPathActive(entry.activePaths)) {
      active.add(entry.id)
    }
  }
  return active
})
const isMenuActive = (index: string) => menuActiveSet.value.has(index)
const timerStore = useTimerStore();
const {
  isRunning: timerIsRunning,
  isAlarmPlaying: timerIsAlarmPlaying,
  stopwatchRunning,
  stopwatchElapsedSeconds
} = storeToRefs(timerStore);
const timerFormatted = computed(() => timerStore.formattedRemaining);
const stopwatchFormatted = computed(() => timerStore.formattedStopwatch);
const stopwatchVisible = computed(() => stopwatchRunning.value || stopwatchElapsedSeconds.value > 0);
const stopTimerAlarm = () => timerStore.stopAlarm();

// 在线状态 & 全局消息
const chatStore = useChatStore();
const totalUnread = computed(() => chatStore.getTotalUnreadCount());

// 初始化全局 WebSocket 并处理消息
function initGlobalChat() {
  if (!username.value) return
  chatSocket.connect(username.value)
  chatStore.bindSocketEvents()
  chatStore.fetchOnlineUsers()

  // 监听新消息
  chatSocket.on('message', (msg) => {
    const me = username.value
    const sender = msg.sendUsername
    if (sender === me) return // 自己的消息不通知

    // 判断是否需要通知（不在聊天页或不在和这人聊天）
    const isNew = chatStore.addMessage(msg)
    if (isNew) {
      playMessageSound()
      sendNotification(`${sender} 发来消息`, msg.data || '')
    }
  })
}

// 监听登录态变化：用户登录后立即连接 WebSocket
watch(username, (newVal) => {
  if (newVal) initGlobalChat()
}, { immediate: true })

const logout = async () => {
  // 关闭 WebSocket，触发服务端 SREM 从在线集合移除
  chatSocket.close();
  // 清除服务端 session
  try { await userApi.logout(); } catch (e) { /* ignore */ }
  // 清除前端用户状态
  userStore.setUsername('');
  userStore.setUser('', 0);
  router.push("/");
};

const handleOpen = () => {};
const handleClose = () => {};

const navigateTo = (path: string) => router.push(path)
const toProfile = async () => {
  try {
    const res = await userApi.getCurrentUser()
    const data = res?.data ?? res
    const id = data?.id ?? data?.user_id
    if (id != null) {
      router.push(`/profile/${encodeURIComponent(String(id))}`)
      return
    }
  } catch {}
  const fallback = username.value ? encodeURIComponent(username.value) : 'me'
  router.push(`/profile/${fallback}`)
};
const toTimer = () => router.push("/timer");

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
  requestNotificationPermission()
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
    radial-gradient(1000px 420px at -10% -20%, var(--app-bg-glow-left) 0%, rgba(0, 255, 255, 0) 65%),
    radial-gradient(860px 420px at 110% 0%, var(--app-bg-glow-right) 0%, rgba(255, 0, 204, 0) 60%),
    linear-gradient(180deg, var(--cyber-bg-1) 0%, var(--cyber-bg-2) 100%);
}

.header {
  height: auto;
  padding: 12px 18px 0;
  background: var(--app-header-bg);
  border-bottom: 1px solid var(--app-header-border);
  box-shadow: var(--app-shadow-strong), inset 0 -1px 0 var(--app-surface-soft-alt);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}
.header::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(520px 220px at -5% -25%, var(--app-bg-glow-left) 0%, rgba(0, 210, 220, 0) 70%),
    radial-gradient(480px 220px at 105% -20%, var(--app-bg-glow-right) 0%, rgba(170, 0, 135, 0) 70%);
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
  color: var(--app-accent-strong);
}

.brand-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--app-text-strong);
  text-shadow: 0 0 8px var(--app-accent-soft);
}

.cyber-menu {
  position: relative;
  z-index: 1;
  margin-top: 10px;
  border-bottom: none;
  background: transparent;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: var(--app-text-muted);
  --el-menu-hover-text-color: var(--app-accent-alt-strong);
  --el-menu-active-color: var(--app-accent-strong);
}
:deep(.cyber-menu.el-menu--horizontal > .el-menu-item),
:deep(.cyber-menu.el-menu--horizontal > .el-sub-menu .el-sub-menu__title) {
  height: 46px;
  line-height: 46px;
  border-bottom: none !important;
  color: var(--app-text-muted);
  transition: all 0.15s ease;
}
:deep(.cyber-menu.el-menu--horizontal > .el-menu-item.is-active),
:deep(.cyber-menu.el-menu--horizontal > .el-sub-menu.is-active .el-sub-menu__title) {
  color: var(--app-accent-strong);
  text-shadow: 0 0 6px var(--app-accent-soft);
}
:deep(.cyber-menu.el-menu--horizontal > .el-menu-item:hover),
:deep(.cyber-menu.el-menu--horizontal > .el-sub-menu .el-sub-menu__title:hover) {
  color: var(--app-accent-alt-strong);
  text-shadow: 0 0 6px var(--app-accent-alt-soft);
}

:deep(.el-menu--popup) {
  background: var(--app-surface-strong);
  border: 1px solid var(--cyber-border);
  box-shadow: 0 0 12px var(--app-accent-soft), 0 0 20px var(--app-accent-alt-soft);
}
:deep(.el-menu--popup .el-menu-item) {
  color: var(--app-text-muted);
}
:deep(.el-menu--popup .el-menu-item:hover) {
  background: var(--app-accent-alt-soft);
  color: var(--app-accent-alt-strong);
}
:global(.cyber-menu-popper) {
  background: var(--app-surface-strong) !important;
  border: 1px solid var(--cyber-border) !important;
  box-shadow: 0 0 8px var(--app-accent-soft), 0 0 14px var(--app-accent-alt-soft) !important;
}
:global(.cyber-menu-popper .el-menu) {
  background: transparent !important;
}
:global(.cyber-menu-popper .el-menu-item) {
  color: var(--app-text-muted) !important;
}
:global(.cyber-menu-popper .el-menu-item:hover) {
  background: var(--app-accent-alt-soft) !important;
  color: var(--app-accent-alt-strong) !important;
}
:global(.cyber-menu-popper .el-menu-item.is-active) {
  background: var(--app-accent-soft) !important;
  color: var(--app-accent-strong) !important;
}
:deep(.el-menu-vertical-demo) {
  background: linear-gradient(180deg, var(--app-surface-strong) 0%, var(--app-surface) 100%);
  border-right: 1px solid var(--cyber-border);
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
  background: var(--app-accent-alt-soft);
  color: var(--app-accent-alt-strong);
  transform: translateX(2px);
}
:deep(.el-menu-vertical-demo .el-menu-item.is-active) {
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-weight: 600;
  box-shadow: inset 0 0 0 1px var(--cyber-border);
}
:deep(.el-menu-vertical-demo .el-sub-menu.is-active > .el-sub-menu__title) {
  color: var(--app-accent-strong);
  text-shadow: 0 0 6px var(--app-accent-soft);
}
:deep(.el-menu-vertical-demo .el-icon) {
  color: var(--app-accent-strong);
}
:deep(.el-menu-vertical-demo .el-sub-menu.is-opened > .el-sub-menu__title) {
  background: var(--app-accent-soft);
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
  color: var(--app-text-main);
}

.logout-button {
  background: var(--app-button-primary);
  color: var(--app-button-text);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  border: none;
  box-shadow: 0 0 14px var(--app-accent-alt-soft);
}

.logout-button:hover {
  filter: brightness(1.12);
}

.timer-pill {
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
  background: var(--app-accent-soft);
  color: var(--app-accent-strong);
  border: 1px solid var(--cyber-border);
}
.timer-pill:hover {
  background: var(--app-surface-soft);
}
.stopwatch-pill {
  background: var(--app-accent-alt-soft);
  color: var(--app-accent-alt-strong);
  border-color: var(--app-accent-alt-soft);
}
.stopwatch-pill:hover {
  background: var(--app-accent-alt-soft);
}
.timer-stop {
  border-radius: 8px;
}

.chat-menu-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.unread-badge {
  position: relative;
  top: -1px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  color: var(--app-button-text);
  background: linear-gradient(135deg, var(--app-accent-alt), var(--app-accent));
  box-shadow: 0 0 10px var(--app-accent-alt-soft);
  animation: pulse-badge 1.5s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% { box-shadow: 0 0 6px rgba(255, 0, 204, 0.4); }
  50% { box-shadow: 0 0 14px rgba(255, 0, 204, 0.8); }
}

.content-main {
  flex: 1;
  overflow: auto;
  padding: 0;
  min-height: 0;
}

.footer {
  text-align: center;
  background: var(--app-surface-strong);
  color: var(--app-text-main);
  padding: 20px 0;
  border-top: 1px solid var(--cyber-border);
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
  color: var(--app-text-soft);
}
.track .bar {
  width: 280px;
  height: 4px;
  background: var(--app-surface-soft-alt);
  border-radius: 4px;
  position: relative;
}
.track .bar-progress {
  height: 100%;
  background: linear-gradient(90deg, var(--app-accent) 0%, var(--app-accent-alt) 100%);
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
  .stopwatch-pill {
    display: inline-flex;
    padding: 6px 9px;
    font-size: 12px;
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
