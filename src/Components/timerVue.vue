<template>
  <div class="timer-page">
    <el-card class="timer-card" shadow="hover">
      <div class="header">
        <div class="title">定时器</div>
        <div class="subtitle">设置倒计时，结束后播放《好一朵茉莉花》提醒</div>
      </div>

      <div class="timer-tools">
        <section class="timer-section">
          <div class="section-title">定时器</div>
          <div class="display">
            <div class="time">{{ formattedRemaining }}</div>
            <el-progress :percentage="progressPercent" :stroke-width="10" />
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
        </section>

        <section class="timer-section">
          <div class="section-title">计时器</div>
          <div class="display stopwatch-display">
            <div class="time">{{ formattedStopwatch }}</div>
            <div class="status">{{ stopwatchRunning ? '计时中' : (stopwatchElapsedSeconds > 0 ? '已暂停' : '未开始') }}</div>
          </div>
          <div class="buttons stopwatch-buttons">
            <el-button type="primary" :disabled="stopwatchRunning" @click="startStopwatch">开始</el-button>
            <el-button :disabled="!stopwatchRunning" @click="pauseStopwatch">暂停</el-button>
            <el-button @click="resetStopwatch">重置</el-button>
          </div>
        </section>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTimerStore } from '@/stores/timerStore'

const timerStore = useTimerStore()
const { remainingSeconds, isRunning, isAlarmPlaying, stopwatchElapsedSeconds, stopwatchRunning } = storeToRefs(timerStore)

const totalSeconds = computed(() => timerStore.durationSeconds || 0)
const formattedRemaining = computed(() => timerStore.formattedRemaining)
const progressPercent = computed(() => timerStore.progressPercent)
const formattedStopwatch = computed(() => timerStore.formattedStopwatch)

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
const startStopwatch = () => timerStore.startStopwatch()
const pauseStopwatch = () => timerStore.pauseStopwatch()
const resetStopwatch = () => timerStore.resetStopwatch()

onMounted(() => {
  timerStore.hydrate()
})
</script>

<style scoped>
.timer-page {
  padding: 14px;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.timer-card {
  width: min(1080px, 100%);
  border-radius: 8px;
  background: rgba(9, 15, 34, 0.82);
  border: 1px solid rgba(0, 255, 255, 0.18);
  box-shadow: 0 0 16px rgba(0, 245, 255, 0.08);
}
.timer-card :deep(.el-card__body) {
  padding: 14px;
}
.header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.title {
  font-size: 22px;
  font-weight: 700;
  color: #a6f9ff;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.35);
}
.subtitle {
  font-size: 13px;
  color: #9dc5de;
}
.timer-tools {
  margin-top: 16px;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
  gap: 12px;
}
.timer-section {
  border: 1px solid rgba(0, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(6, 12, 28, 0.42);
  padding: 12px;
  min-width: 0;
}
.section-title {
  color: #b8f8ff;
  font-weight: 700;
  margin-bottom: 10px;
}
.controls {
  margin-top: 12px;
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
  padding: 10px;
  border: 1px solid rgba(0, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(10, 16, 35, 0.72);
}
.label {
  font-size: 12px;
  color: #9dc5de;
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
  padding: 10px;
  border: 1px solid rgba(0, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(10, 16, 35, 0.72);
}
.volume {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid rgba(0, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(10, 16, 35, 0.72);
}
.display {
  padding: 16px;
  border: 1px solid rgba(0, 255, 255, 0.18);
  border-radius: 8px;
  background: rgba(10, 16, 35, 0.82);
}
.time {
  font-size: 52px;
  font-weight: 800;
  text-align: center;
  letter-spacing: 0;
  margin-bottom: 12px;
  color: #e2fbff;
  text-shadow: 0 0 14px rgba(0, 245, 255, 0.32);
  font-variant-numeric: tabular-nums;
}
.stopwatch-display {
  min-height: 130px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.status {
  text-align: center;
  color: #9dc5de;
  font-size: 13px;
}
.stopwatch-buttons {
  margin-top: 12px;
}
.timer-card :deep(.el-input__wrapper),
.timer-card :deep(.el-input-number__decrease),
.timer-card :deep(.el-input-number__increase) {
  background: rgba(6, 12, 28, 0.9);
  border-color: rgba(0, 255, 255, 0.18);
  box-shadow: 0 0 0 1px rgba(0, 255, 255, 0.12) inset;
}
.timer-card :deep(.el-input__inner) {
  color: #e2fbff;
}
.timer-card :deep(.el-input-number__decrease),
.timer-card :deep(.el-input-number__increase) {
  color: #8cf5ff;
}
.timer-card :deep(.el-slider__runway) {
  background-color: rgba(0, 255, 255, 0.14);
}
.timer-card :deep(.el-slider__bar) {
  background-color: #00d8ff;
}
.timer-card :deep(.el-progress-bar__outer) {
  background-color: rgba(0, 255, 255, 0.12);
}
.timer-card :deep(.el-progress-bar__inner) {
  background: linear-gradient(90deg, #00d8ff 0%, #3ee097 100%);
}
.timer-card :deep(.el-progress__text) {
  color: #b8f8ff;
}

@media (max-width: 720px) {
  .timer-tools {
    grid-template-columns: 1fr;
  }
  .time-inputs {
    grid-template-columns: 1fr;
  }
  .buttons {
    flex-direction: column;
  }
  .buttons :deep(.el-button) {
    margin-left: 0;
    width: 100%;
  }
  .volume {
    align-items: stretch;
    flex-direction: column;
  }
  .time {
    font-size: 42px;
  }
}
</style>
