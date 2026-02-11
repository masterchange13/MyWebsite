<template>
  <div class="video-page">
    <el-card class="video-header" shadow="never">
      <div class="title">Video Stream</div>
      <div class="tools">
        <span class="label">尺寸</span>
        <el-slider
          v-model="value"
          :min="10"
          :max="100"
          :step="10"
          show-stops
          class="size-slider"
        />
      </div>
    </el-card>

    <el-card class="video-body" shadow="always">
      <div class="video-wrap">
        <img :src="videoSrc" :style="{ width: value + '%', height: 'auto' }" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 将视频流路径赋值给 videoSrc
const videoSrc = '/api/video_feed'

// 用于测试跨域访问的路径
const testSrc = '/api/test'

// 存储从 /api/test 获取的字符串
const testString = ref('')

// 在组件挂载后获取字符串
onMounted(() => {
  fetch(testSrc)
    .then(response => response.text())  // 以文本格式获取数据
    .then(data => {
      testString.value = data  // 将获取到的字符串赋值给 testString
    })
    .catch(error => {
      console.error('Error fetching /api/test:', error)
    })
})

const value = ref(80)
</script>

<style scoped>
.video-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow: hidden;
}
.video-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title {
  font-size: 18px;
  font-weight: 600;
}
.tools {
  display: flex;
  align-items: center;
  gap: 10px;
}
.label {
  font-size: 12px;
  color: #666;
}
.size-slider {
  width: 240px;
}
.video-body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0b1324;
  overflow: hidden;
}
.video-body :deep(.el-card__body) {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}
.video-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.video-wrap img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.25);
}
</style>
