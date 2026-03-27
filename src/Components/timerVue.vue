<template>
  <div class="timer-page">
    <el-card class="timer-card" shadow="hover">
      <div class="header">
        <div class="title">定时器</div>
        <div class="subtitle">设置倒计时，结束后播放《好一朵茉莉花》提醒</div>
      </div>

      <div class="controls">
        <div class="time-inputs">
          <div class="field">
            <div class="label">分钟</div>
            <el-input-number v-model="minutes" :min="0" :max="999" @keyup.enter="start" />
          </div>
          <div class="field">
            <div class="label">秒</div>
            <el-input-number v-model="seconds" :min="0" :max="59" @keyup.enter="start" />
          </div>
        </div>

        <div class="buttons">
          <el-button type="primary" :disabled="remainingSeconds <= 0 && totalSeconds <= 0" @click="start">
            {{ isRunning ? '继续' : '开始' }}
          </el-button>
          <el-button :disabled="!isRunning" @click="pause">暂停</el-button>
          <el-button @click="reset">重置</el-button>
          <el-button @click="previewSound">试听</el-button>
          <el-button type="danger" :disabled="!isAlarmPlaying" @click="stopAlarm">停止提醒</el-button>
        </div>

        <div class="source">
          <div class="label">提醒音频链接</div>
          <el-input v-model="audioUrl" placeholder="粘贴音频链接（支持 mp3/ogg/opus）" @keyup.enter="previewSound" />
        </div>

        <div class="volume">
          <div class="label">音量</div>
          <el-slider v-model="soundVolume" :min="0" :max="100" />
        </div>
      </div>

      <div class="display">
        <div class="time">{{ formattedRemaining }}</div>
        <el-progress :percentage="progressPercent" :stroke-width="10" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const minutes = ref(0)
const seconds = ref(10)
const soundVolume = ref(50)
const audioUrl = ref('https://upload.wikimedia.org/wikipedia/commons/c/c6/%E8%8C%89%E8%8E%89%E8%8A%B1-KS%E6%BC%94%E7%A4%BA.opus')

const totalSeconds = computed(() => (minutes.value || 0) * 60 + (seconds.value || 0))
const remainingSeconds = ref(totalSeconds.value)
const isRunning = ref(false)
const timerId = ref(null)
const endAtMs = ref(0)

const alarmAudio = ref(null)
const isAlarmPlaying = ref(false)

watch(totalSeconds, (val) => {
  if (isRunning.value) return
  remainingSeconds.value = Math.max(0, val || 0)
})

watch(soundVolume, (val) => {
  const a = alarmAudio.value
  if (!a) return
  a.volume = Math.max(0, Math.min(1, (val || 0) / 100))
})

watch(audioUrl, () => {
  stopAlarm()
  if (alarmAudio.value) {
    alarmAudio.value.src = audioUrl.value || ''
    alarmAudio.value.load()
  }
})

const formattedRemaining = computed(() => {
  const s = Math.max(0, Math.floor(remainingSeconds.value || 0))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
})

const progressPercent = computed(() => {
  const total = Math.max(0, totalSeconds.value || 0)
  if (!total) return 0
  const done = Math.max(0, Math.min(total, total - (remainingSeconds.value || 0)))
  return Math.round((done / total) * 100)
})

const ensureAlarmAudio = () => {
  if (alarmAudio.value) return alarmAudio.value
  const a = new Audio()
  a.preload = 'auto'
  a.loop = true
  a.volume = Math.max(0, Math.min(1, (soundVolume.value || 0) / 100))
  a.src = audioUrl.value || ''
  a.addEventListener('ended', () => {
    isAlarmPlaying.value = false
  })
  alarmAudio.value = a
  return a
}

const primeAudio = async () => {
  const a = ensureAlarmAudio()
  try {
    a.currentTime = 0
    const prevVolume = a.volume
    a.volume = 0
    await a.play()
    window.setTimeout(() => {
      a.pause()
      a.currentTime = 0
      a.volume = prevVolume
    }, 120)
  } catch {}
}

const startAlarm = async () => {
  const a = ensureAlarmAudio()
  a.loop = true
  a.volume = Math.max(0, Math.min(1, (soundVolume.value || 0) / 100))
  a.currentTime = 0
  try {
    await a.play()
    isAlarmPlaying.value = true
  } catch (e) {
    isAlarmPlaying.value = false
    ElMessage.warning('浏览器限制自动播放声音，可先点击“试听”启用音频播放权限')
  }
}

const stopAlarm = () => {
  const a = alarmAudio.value
  if (!a) return
  a.pause()
  try { a.currentTime = 0 } catch {}
  isAlarmPlaying.value = false
}

const tick = () => {
  const leftMs = endAtMs.value - Date.now()
  const left = Math.max(0, Math.ceil(leftMs / 1000))
  remainingSeconds.value = left
  if (left <= 0) {
    stopTimer()
    ElMessage.success('倒计时结束')
    startAlarm()
  }
}

const startTimer = () => {
  stopTimer()
  isRunning.value = true
  endAtMs.value = Date.now() + Math.max(0, remainingSeconds.value || 0) * 1000
  timerId.value = window.setInterval(tick, 200)
  tick()
}

const stopTimer = () => {
  if (timerId.value != null) {
    window.clearInterval(timerId.value)
    timerId.value = null
  }
  isRunning.value = false
}

const start = async () => {
  if (isRunning.value) return
  stopAlarm()
  if ((remainingSeconds.value || 0) <= 0) {
    remainingSeconds.value = Math.max(0, totalSeconds.value || 0)
  }
  if ((remainingSeconds.value || 0) <= 0) {
    ElMessage.warning('请先设置倒计时时间')
    return
  }
  await primeAudio()
  startTimer()
}

const pause = () => {
  if (!isRunning.value) return
  const leftMs = endAtMs.value - Date.now()
  remainingSeconds.value = Math.max(0, Math.ceil(leftMs / 1000))
  stopTimer()
}

const reset = () => {
  stopTimer()
  stopAlarm()
  remainingSeconds.value = Math.max(0, totalSeconds.value || 0)
}

const previewSound = () => {
  startAlarm()
}

onBeforeUnmount(() => {
  stopTimer()
  stopAlarm()
})
</script>

<style scoped>
.timer-page {
  padding: 20px;
  min-height: 100%;
  background:
    radial-gradient(1200px 600px at -200px -200px, rgba(79, 160, 255, 0.15) 0%, rgba(79, 160, 255, 0) 60%),
    radial-gradient(800px 400px at 120% 20%, rgba(86, 220, 160, 0.12) 0%, rgba(86, 220, 160, 0) 60%),
    linear-gradient(180deg, #eef5ff 0%, #f8fbff 100%);
}
.timer-card {
  max-width: 760px;
  margin: 0 auto;
  border-radius: 14px;
}
.header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.title {
  font-size: 22px;
  font-weight: 700;
}
.subtitle {
  font-size: 13px;
  color: #6b7a8c;
}
.controls {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.time-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.label {
  font-size: 12px;
  color: #6b7a8c;
}
.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.source {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.volume {
  display: flex;
  align-items: center;
  gap: 12px;
}
.display {
  margin-top: 18px;
}
.time {
  font-size: 52px;
  font-weight: 800;
  text-align: center;
  letter-spacing: 1px;
  margin-bottom: 12px;
}
</style>
