<template>
  <div class="bg-gray-800 text-white rounded-2xl shadow-lg p-6 w-96 mx-auto">
    <div class="flex flex-col items-center">
      <img :src="cover" alt="封面" class="rounded-xl mb-4 w-60 h-60 object-cover" />
      <h2 class="text-xl font-semibold">{{ title }}</h2>
      <p class="text-gray-400">{{ artist }}</p>

      <!-- 进度条 -->
      <div class="w-full mt-4">
        <div class="flex justify-between text-sm text-gray-400 mb-1">
          <span>{{ currentTimeFormatted }}</span>
          <span>{{ durationFormatted }}</span>
        </div>
        <div class="w-full h-2 bg-gray-600 rounded-full">
          <div class="h-2 bg-green-400 rounded-full" :style="{ width: progress + '%' }"></div>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="flex justify-between items-center mt-6 w-full px-6">
        <button class="text-gray-300 hover:text-white">⏮️</button>
        <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-md" @click="togglePlay">
          {{ isPlaying ? '⏸️' : '▶️' }}
        </button>
        <button class="text-gray-300 hover:text-white">⏭️</button>
      </div>
    </div>
    <!-- 隐藏音频元素 -->
    <audio ref="audio" :src="audioSrc" @timeupdate="updateTime" @loadedmetadata="updateTime"></audio>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const audio = ref(null)
const isPlaying = ref(false)

const title = '测试歌曲'
const artist = '测试歌手'
const cover = 'https://via.placeholder.com/300x300.png?text=封面'
const audioSrc = '/audio/test.mp3' // 请放到 public/audio/test.mp3

const currentTime = ref(0)
const duration = ref(0)

const togglePlay = () => {
  if (!audio.value) return
  if (isPlaying.value) {
    audio.value.pause()
  } else {
    audio.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const updateTime = () => {
  currentTime.value = audio.value.currentTime
  duration.value = audio.value.duration
}

const currentTimeFormatted = computed(() => formatTime(currentTime.value))
const durationFormatted = computed(() => formatTime(duration.value))
const progress = computed(() =>
  duration.value ? (currentTime.value / duration.value) * 100 : 0
)

function formatTime(seconds) {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}
</script>

<style scoped>
audio {
  display: none;
}
</style>
