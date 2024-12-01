<template>
  <el-row>
    <!-- 显示从 /api/test 获取的字符串 -->
    <!-- <h1>{{ testString }}</h1> -->

    <el-col :span="20">
      <!-- 使用 video 标签来展示视频流 -->      
      <img
        :src="videoSrc" 
        :style="{ width: value + '%', height: 'auto' }" 
        autoplay
        loop
        muted
      />
    </el-col>
    <el-col :span="4">
      <el-select v-model="value" placeholder="Size" size="large" style="width: 240px">
        <el-option
          v-for="item in optionOfSize"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-col>
  </el-row>
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

const value = ref('80') // 默认值为 80%

const optionOfSize = [
  { value: '10', label: '10%' },
  { value: '20', label: '20%' },
  { value: '30', label: '30%' },
  { value: '40', label: '40%' },
  { value: '50', label: '50%' },
  { value: '60', label: '60%' },
  { value: '70', label: '70%' },
  { value: '80', label: '80%' },
  { value: '90', label: '90%' },
  { value: '100', label: '100%' },
]
</script>
