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
            <el-input-number v-model="durationMinutes" :min="0" :max="999" :disabled="isRunning" @keyup.enter="start" />
          </div>
          <div class="field">
            <div class="label">秒</div>
            <el-input-number v-model="durationSecondsPart" :min="0" :max="59" :disabled="isRunning" @keyup.enter="start" />
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
          <el-input v-model="alarmUrl" placeholder="粘贴音频链接（支持 mp3/ogg/opus）" @keyup.enter="previewSound" />
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
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTimerStore } from '@/stores/timerStore'

const timerStore = useTimerStore()
const { remainingSeconds, isRunning, isAlarmPlaying } = storeToRefs(timerStore)

const totalSeconds = computed(() => timerStore.durationSeconds || 0)
const formattedRemaining = computed(() => timerStore.formattedRemaining)
const progressPercent = computed(() => timerStore.progressPercent)

const durationMinutes = computed({
  get: () => Math.floor((timerStore.durationSeconds || 0) / 60),
  set: (v) => {
    timerStore.setDurationSeconds((Math.max(0, Math.floor(v || 0)) * 60) + durationSecondsPart.value)
  }
})
const durationSecondsPart = computed({
  get: () => (timerStore.durationSeconds || 0) % 60,
  set: (v) => {
    timerStore.setDurationSeconds((durationMinutes.value * 60) + Math.max(0, Math.min(59, Math.floor(v || 0))))
  }
})
const soundVolume = computed({
  get: () => Math.round((timerStore.volume || 0) * 100),
  set: (v) => timerStore.setVolume(v)
})
const alarmUrl = computed({
  get: () => timerStore.audioUrl || '',
  set: (v) => timerStore.setAudioUrl(v)
})

const start = () => timerStore.start()
const pause = () => timerStore.pause()
const reset = () => timerStore.reset()
const previewSound = () => timerStore.preview()
const stopAlarm = () => timerStore.stopAlarm()

onMounted(() => {
  timerStore.hydrate()
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
