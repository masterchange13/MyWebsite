import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'

const clamp01 = (n) => Math.max(0, Math.min(1, n))

export const useTimerStore = defineStore('timer', {
  state: () => ({
    durationSeconds: 10,
    remainingSeconds: 10,
    isRunning: false,
    endAtMs: 0,
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/%E8%8C%89%E8%8E%89%E8%8A%B1-KS%E6%BC%94%E7%A4%BA.opus',
    volume: 0.5,
    isAlarmPlaying: false
  }),
  getters: {
    formattedRemaining: (state) => {
      const s = Math.max(0, Math.floor(state.remainingSeconds || 0))
      const m = Math.floor(s / 60)
      const sec = s % 60
      return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    },
    progressPercent: (state) => {
      const total = Math.max(0, state.durationSeconds || 0)
      if (!total) return 0
      const done = Math.max(0, Math.min(total, total - (state.remainingSeconds || 0)))
      return Math.round((done / total) * 100)
    }
  },
  actions: {
    setDurationSeconds(seconds) {
      const v = Math.max(0, Math.floor(seconds || 0))
      this.durationSeconds = v
      if (!this.isRunning) this.remainingSeconds = v
    },
    _ensureAudio() {
      if (this._alarmAudio) return this._alarmAudio
      const a = new Audio()
      a.preload = 'auto'
      a.loop = true
      a.src = this.audioUrl || ''
      a.volume = clamp01(this.volume)
      this._alarmAudio = a
      return a
    },
    _applyAudioSettings() {
      const a = this._ensureAudio()
      a.loop = true
      a.volume = clamp01(this.volume)
      if (a.src !== (this.audioUrl || '')) {
        a.src = this.audioUrl || ''
        try { a.load() } catch {}
      }
    },
    async primeAudio() {
      this._applyAudioSettings()
      const a = this._ensureAudio()
      try {
        const prevVolume = a.volume
        a.currentTime = 0
        a.volume = 0
        await a.play()
        window.setTimeout(() => {
          a.pause()
          try { a.currentTime = 0 } catch {}
          a.volume = prevVolume
        }, 120)
      } catch {}
    },
    async startAlarm() {
      this._applyAudioSettings()
      const a = this._ensureAudio()
      try {
        a.currentTime = 0
        await a.play()
        this.isAlarmPlaying = true
      } catch {
        this.isAlarmPlaying = false
        ElMessage.warning('浏览器限制自动播放声音，可先点击“试听”启用音频播放权限')
      }
    },
    stopAlarm() {
      const a = this._alarmAudio
      if (a) {
        a.pause()
        try { a.currentTime = 0 } catch {}
      }
      this.isAlarmPlaying = false
    },
    _stopInterval() {
      if (this._intervalId != null) {
        window.clearInterval(this._intervalId)
        this._intervalId = null
      }
    },
    _tick() {
      const leftMs = this.endAtMs - Date.now()
      const left = Math.max(0, Math.ceil(leftMs / 1000))
      this.remainingSeconds = left
      if (left <= 0) {
        this._stopInterval()
        this.isRunning = false
        ElMessage.success('倒计时结束')
        this.startAlarm()
      }
    },
    _startInterval() {
      this._stopInterval()
      this._intervalId = window.setInterval(() => this._tick(), 200)
      this._tick()
    },
    async start() {
      if (this.isRunning) return
      this.stopAlarm()
      if ((this.remainingSeconds || 0) <= 0) this.remainingSeconds = Math.max(0, this.durationSeconds || 0)
      if ((this.remainingSeconds || 0) <= 0) {
        ElMessage.warning('请先设置倒计时时间')
        return
      }
      await this.primeAudio()
      this.endAtMs = Date.now() + Math.max(0, this.remainingSeconds || 0) * 1000
      this.isRunning = true
      this._startInterval()
    },
    pause() {
      if (!this.isRunning) return
      const leftMs = this.endAtMs - Date.now()
      this.remainingSeconds = Math.max(0, Math.ceil(leftMs / 1000))
      this._stopInterval()
      this.isRunning = false
    },
    reset() {
      this._stopInterval()
      this.isRunning = false
      this.stopAlarm()
      this.remainingSeconds = Math.max(0, this.durationSeconds || 0)
    },
    async preview() {
      await this.primeAudio()
      this.startAlarm()
    },
    hydrate() {
      this._applyAudioSettings()
      if (this.isRunning) {
        const leftMs = this.endAtMs - Date.now()
        const left = Math.max(0, Math.ceil(leftMs / 1000))
        if (left > 0) {
          this.remainingSeconds = left
          this._startInterval()
        } else {
          this.isRunning = false
          this.remainingSeconds = 0
        }
      }
    },
    setAudioUrl(url) {
      this.audioUrl = url || ''
      this.stopAlarm()
      this._applyAudioSettings()
    },
    setVolume(v) {
      this.volume = clamp01((v || 0) / 100)
      this._applyAudioSettings()
    }
  },
  persist: true
})

