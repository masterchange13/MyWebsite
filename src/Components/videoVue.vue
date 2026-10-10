<template>
  <div class="video-page">
    <el-card class="video-header" shadow="never">
      <div class="heading">
        <div class="title">摄像头视频</div>
        <p class="subtitle" v-if="camera.device">{{ camera.platform }} · {{ camera.backend === 'picamera2' ? '树莓派排线摄像头' : 'USB / 系统摄像头' }} · {{ camera.device }}</p>
        <p class="subtitle" v-else>查看后端服务器连接的摄像头</p>
      </div>
      <div class="tools">
        <span class="label">尺寸</span>
        <el-slider v-model="value" :min="10" :max="100" :step="10" show-stops class="size-slider" />
        <el-button @click="connectVideo" :loading="loading">重新连接</el-button>
      </div>
    </el-card>

    <el-card class="video-body" shadow="always">
      <div class="video-wrap">
        <div v-if="loading" class="video-state" role="status">正在连接摄像头...</div>
        <div v-else-if="errorMessage" class="video-state" role="alert">
          <p>{{ errorMessage }}</p>
          <el-button @click="connectVideo">重试</el-button>
        </div>
        <img v-if="videoSrc" :src="videoSrc" :style="{ width: value + '%', height: 'auto' }" alt="服务器摄像头实时画面" @error="handleStreamError" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { videoApi } from '@/api/videoApi'

const value = ref(80)
const camera = ref({})
const videoSrc = ref('')
const errorMessage = ref('')
const loading = ref(false)
let healthTimer = null
let controller = null
let checking = false
let generation = 0
let disposed = false

function errorText(error) {
  if (error?.response?.status === 401) return '请先登录后查看摄像头。'
  if (error?.response?.status === 404) return '视频接口不存在，请更新后端并检查代理地址。'
  if (error?.response?.data?.message) return error.response.data.message
  if (['ECONNABORTED', 'ETIMEDOUT'].includes(error?.code)) return '连接摄像头超时，请检查后端服务和设备。'
  return error?.message || '无法连接摄像头，请检查后端服务、设备权限和摄像头设置。'
}

function stopVideo() {
  generation += 1
  if (healthTimer !== null) clearInterval(healthTimer)
  healthTimer = null
  controller?.abort()
  controller = null
  checking = false
  videoSrc.value = ''
}

async function connectVideo() {
  if (disposed) return
  stopVideo()
  const current = generation
  controller = new AbortController()
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await videoApi.getStatus(controller.signal)
    if (disposed || current !== generation) return
    if (response.code !== 200) throw new Error(response.message || '摄像头暂时不可用。')
    camera.value = response.data || {}
    videoSrc.value = `/api/video_feed/?connection=${Date.now()}-${current}`
    healthTimer = setInterval(checkHealth, 5000)
  } catch (error) {
    if (!disposed && current === generation && error?.code !== 'ERR_CANCELED') errorMessage.value = errorText(error)
  } finally {
    if (current === generation) {
      loading.value = false
      controller = null
    }
  }
}

async function checkHealth() {
  if (checking || loading.value || !videoSrc.value || disposed) return
  const current = generation
  checking = true
  controller = new AbortController()
  try {
    const response = await videoApi.getStatus(controller.signal, true)
    if (disposed || current !== generation) return
    if (response.code !== 200) throw new Error(response.message || '摄像头连接已中断。')
    camera.value = response.data || {}
  } catch (error) {
    if (!disposed && current === generation && error?.code !== 'ERR_CANCELED') {
      errorMessage.value = errorText(error)
      stopVideo()
    }
  } finally {
    if (current === generation) {
      checking = false
      controller = null
    }
  }
}

function handleStreamError() {
  if (!videoSrc.value || disposed) return
  errorMessage.value = '视频流无法加载或已中断，请重新连接；同时检查代理是否开启了视频流缓冲。'
  stopVideo()
}

onMounted(connectVideo)
onBeforeUnmount(() => {
  disposed = true
  stopVideo()
})
</script>

<style scoped>
.video-page {
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow: hidden;
}
.video-header { flex-shrink: 0; }
.video-header :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.title { font-size: 18px; font-weight: 600; }
.subtitle { margin: 6px 0 0; font-size: 12px; color: var(--app-text-muted); overflow-wrap: anywhere; }
.tools { display: flex; align-items: center; gap: 10px; }
.label { font-size: 12px; color: var(--app-text-muted); }
.size-slider { width: 200px; }
.video-body { flex: 1; min-height: 0; background: #0b1324; overflow: hidden; }
.video-body :deep(.el-card__body) { height: 100%; box-sizing: border-box; padding: 12px; }
.video-wrap { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.video-wrap img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 24px rgba(0,0,0,0.25); }
.video-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 16px; color: #cbd5e1; text-align: center; }
.video-state p { margin: 0; overflow-wrap: anywhere; }
@media (max-width: 768px) {
  .video-page { padding: 10px; }
  .tools { width: 100%; flex-wrap: wrap; }
  .size-slider { flex: 1; min-width: 100px; width: auto; }
}
</style>
