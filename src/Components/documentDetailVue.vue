<template>
  <div class="detail-page">
    <div class="jasmine jasmine-left"></div>
    <div class="jasmine jasmine-right"></div>
    <div class="jasmine-bottom"></div>
    <!-- 顶部栏：返回按钮 + 文章标题 + 作者 -->
    <div class="header">
      <el-button text @click="goBack" type="primary" class="back-button">
        <el-icon>
          <ArrowLeft />
        </el-icon>
      </el-button>
      <div class="title-box">
        <div class="title">{{ articleTitle }}</div>
        <div class="author">作者：{{ articleAuthor }}</div>
      </div>
    </div>

    <!-- 编辑器 -->
    <div v-if="isEditing" style="border: 1px solid #ccc">
      <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig" :mode="mode" />
      <Editor style="height: 500px; overflow-y: hidden;" v-model="valueHtml" :defaultConfig="editorConfig" :mode="mode"
        @onCreated="handleCreated" />
      <div style="margin-top: 10px;">
        <el-button @click="valueHtml = '<p></p>'">清空内容</el-button>
        <el-button type="primary" @click="publish()">发布</el-button>
      </div>
    </div>

    <!-- 文章展示（阅读模式） -->
    <div v-else class="article-container markdown-body" v-html="renderedContent"></div>

    <!-- 切换编辑模式按钮（固定位置） -->
    <div class="switch-wrap">
      <el-button @click="isEditing = !isEditing">
        {{ isEditing ? "预览文章" : "返回编辑" }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, ref, shallowRef, onMounted, computed } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { documentApi } from '@/api/documentApi'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue' // 引入图标
import { marked } from 'marked'

const route = useRoute()
const router = useRouter()

const id = route.params.id

const articleTitle = ref('文章标题加载中...')
const articleAuthor = ref('未知作者')

const editorRef = shallowRef()
const valueHtml = ref('')
const isEditing = ref(false)

const renderedContent = computed(() => {
  // If we are in editing mode, we use HTML from wangeditor
  // If we are in viewing mode, we render it as markdown if possible
  // Many rich text editors output HTML, so we check if it's HTML or Markdown
  const content = valueHtml.value
  if (!content) return ''
  
  // If it's HTML, we might just want to show it. 
  // But the user specifically asked for MD format.
  // If the content is raw MD, marked will handle it.
  // If it's HTML, marked will also handle it (often just rendering as is).
  return marked.parse(content)
})

onMounted(async () => {
  try {
    console.log("id  is ", id)
    const res = await documentApi.detail(id)
    console.log("res  is ", res)
    if (res.code === 200) {
      console.log(res.data);
      valueHtml.value = res.data.content || ''
      articleTitle.value = res.data.title || '未命名文章'
      articleAuthor.value = res.data.author || '匿名'
    } else {
      ElMessage.error(res.message || '请求错误')
    }
  } catch (error) {
    ElMessage.error('获取文章失败，请稍后再试')
    console.error(error)
  }
})

const toolbarConfig = {}
const editorConfig = { placeholder: '请输入内容...' }

const handleCreated = (editor) => {
  editorRef.value = editor
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) editor.destroy()
})

const publish = async () => {
  try {
    const res = await documentApi.publish({ content: valueHtml.value })
    if (res.code === 200) {
      ElMessage.success(res.message)
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('发布失败，请稍后再试')
    console.error(error)
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.detail-page {
  position: relative;
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
  overflow: hidden;
  background:
    radial-gradient(1200px 520px at -240px -240px, rgba(0, 245, 255, 0.10) 0%, rgba(0, 245, 255, 0) 60%),
    radial-gradient(900px 520px at 120% 0, rgba(255, 0, 204, 0.08) 0%, rgba(255, 0, 204, 0) 60%),
    linear-gradient(180deg, #090a1a 0%, #0d1022 100%);
}
.jasmine {
  position: absolute;
  width: 120px;
  height: 120px;
  opacity: 0.34;
  pointer-events: none;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.18));
  animation: jasmineFloat 6.2s ease-in-out infinite;
}
.jasmine::before,
.jasmine::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 16%, rgba(255, 255, 255, 0.9) 0 10px, transparent 11px),
    radial-gradient(circle at 82% 38%, rgba(255, 255, 255, 0.9) 0 10px, transparent 11px),
    radial-gradient(circle at 72% 76%, rgba(255, 255, 255, 0.9) 0 10px, transparent 11px),
    radial-gradient(circle at 28% 76%, rgba(255, 255, 255, 0.9) 0 10px, transparent 11px),
    radial-gradient(circle at 18% 38%, rgba(255, 255, 255, 0.9) 0 10px, transparent 11px),
    radial-gradient(circle at 50% 50%, rgba(255, 236, 163, 0.95) 0 8px, transparent 9px);
}
.jasmine::after {
  transform: scale(0.62) translate(42px, 42px);
  opacity: 0.72;
}
.jasmine-left {
  left: 16px;
  top: 76px;
  animation-delay: 0s;
}
.jasmine-right {
  right: 16px;
  top: 76px;
  animation-delay: 1.3s;
}
.jasmine-bottom {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  width: min(92%, 980px);
  height: 68px;
  border-radius: 999px;
  opacity: 0.45;
  pointer-events: none;
  animation: jasmineGlow 5.4s ease-in-out infinite;
  background:
    radial-gradient(circle at 8% 56%, rgba(255, 255, 255, 0.85) 0 8px, transparent 9px),
    radial-gradient(circle at 14% 42%, rgba(255, 255, 255, 0.8) 0 7px, transparent 8px),
    radial-gradient(circle at 24% 56%, rgba(255, 255, 255, 0.85) 0 8px, transparent 9px),
    radial-gradient(circle at 30% 42%, rgba(255, 255, 255, 0.8) 0 7px, transparent 8px),
    radial-gradient(circle at 42% 56%, rgba(255, 255, 255, 0.85) 0 8px, transparent 9px),
    radial-gradient(circle at 48% 42%, rgba(255, 255, 255, 0.8) 0 7px, transparent 8px),
    radial-gradient(circle at 58% 56%, rgba(255, 255, 255, 0.85) 0 8px, transparent 9px),
    radial-gradient(circle at 64% 42%, rgba(255, 255, 255, 0.8) 0 7px, transparent 8px),
    radial-gradient(circle at 74% 56%, rgba(255, 255, 255, 0.85) 0 8px, transparent 9px),
    radial-gradient(circle at 80% 42%, rgba(255, 255, 255, 0.8) 0 7px, transparent 8px),
    radial-gradient(circle at 90% 56%, rgba(255, 255, 255, 0.85) 0 8px, transparent 9px),
    linear-gradient(90deg, rgba(0, 245, 255, 0.16), rgba(255, 0, 204, 0.16));
  box-shadow: 0 0 14px rgba(0, 245, 255, 0.18), 0 0 20px rgba(255, 0, 204, 0.12);
}

@keyframes jasmineFloat {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.34;
  }
  50% {
    transform: translateY(-8px) rotate(1.5deg);
    opacity: 0.45;
  }
}

@keyframes jasmineGlow {
  0%, 100% {
    opacity: 0.36;
    filter: saturate(0.95);
  }
  50% {
    opacity: 0.52;
    filter: saturate(1.12);
  }
}
.article-container {
  position: relative;
  padding: 40px;
  border: 1px solid rgba(0, 255, 255, 0.22);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(8, 14, 32, 0.9), rgba(12, 18, 40, 0.86));
  line-height: 1.6;
  font-size: 16px;
  max-width: 900px;
  margin: 0 auto;
  z-index: 2;
  box-shadow: 0 0 16px rgba(0, 245, 255, 0.12), 0 0 28px rgba(255, 0, 204, 0.08);
  overflow: visible;
}
.article-container::before,
.article-container::after {
  content: "";
  position: absolute;
  top: 30px;
  width: 8px;
  height: calc(100% - 60px);
  border-radius: 999px;
  pointer-events: none;
}
.article-container::before {
  left: -18px;
  background: linear-gradient(180deg, rgba(0, 245, 255, 0.85) 0%, rgba(0, 245, 255, 0.15) 100%);
  box-shadow: 0 0 14px rgba(0, 245, 255, 0.5);
}
.article-container::after {
  right: -18px;
  background: linear-gradient(180deg, rgba(255, 0, 204, 0.82) 0%, rgba(255, 0, 204, 0.15) 100%);
  box-shadow: 0 0 14px rgba(255, 0, 204, 0.45);
}

/* Basic Markdown Styles */
:deep(.markdown-body) h1, 
:deep(.markdown-body) h2, 
:deep(.markdown-body) h3 {
  border-bottom: 1px solid rgba(0, 255, 255, 0.26);
  color: #aef9ff;
  padding-bottom: .3em;
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}
:deep(.markdown-body) p {
  margin-top: 0;
  margin-bottom: 16px;
  color: #d8f8ff;
}
:deep(.markdown-body) code {
  padding: .2em .4em;
  margin: 0;
  font-size: 85%;
  color: #94f5ff;
  background-color: rgba(0, 245, 255, 0.12);
  border-radius: 3px;
}
:deep(.markdown-body) pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  color: #d8f8ff;
  background-color: rgba(6, 12, 28, 0.92);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 6px;
  margin-bottom: 16px;
}
:deep(.markdown-body) blockquote {
  padding: 0 1em;
  color: #bfefff;
  border-left: .25em solid rgba(255, 0, 204, 0.5);
  background: rgba(255, 0, 204, 0.08);
  margin: 0 0 16px 0;
}
:deep(.markdown-body) img {
  max-width: 100%;
  box-sizing: content-box;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
  z-index: 2;
}

.back-button {
  margin-right: 16px;
  font-size: 20px;
  display: flex;
  align-items: center;
}

.title-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.title {
  font-size: 22px;
  font-weight: bold;
  color: #abf7ff;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.35);
}

.author {
  font-size: 14px;
  color: #8fb2c9;
  margin-left: 16px;
}
.switch-wrap {
  position: fixed;
  right: 28px;
  top: 148px;
  z-index: 30;
}
.switch-wrap :deep(.el-button) {
  border-radius: 999px;
  border: 1px solid rgba(0, 255, 255, 0.3);
  background: rgba(8, 16, 36, 0.82);
  color: #9ef7ff;
  box-shadow: 0 0 12px rgba(0, 245, 255, 0.14), 0 0 18px rgba(255, 0, 204, 0.08);
}
.switch-wrap :deep(.el-button:hover) {
  border-color: rgba(255, 0, 204, 0.35);
  color: #ff9dec;
  background: rgba(24, 10, 38, 0.85);
}

@media (max-width: 900px) {
  .jasmine {
    width: 90px;
    height: 90px;
    opacity: 0.26;
    animation-duration: 7s;
  }
  .jasmine-left {
    left: 8px;
    top: 92px;
  }
  .jasmine-right {
    right: 8px;
    top: 92px;
  }
  .jasmine-bottom {
    height: 56px;
    opacity: 0.34;
  }
  .switch-wrap {
    right: 50%;
    top: auto;
    bottom: 74px;
    transform: translateX(50%);
  }
}
</style>
