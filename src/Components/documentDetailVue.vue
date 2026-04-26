<template>
  <div class="detail-page">
    <div class="jasmine jasmine-left"></div>
    <div class="jasmine jasmine-right"></div>
    <div class="jasmine-bottom"></div>

    <div class="content-shell">
      <div class="header">
        <div class="header-left">
          <el-button text @click="goBack" type="primary" class="back-button">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回</span>
          </el-button>
          <div class="header-title-wrap">
            <div v-if="!isEditing" class="title">{{ articleTitle }}</div>
            <el-input
              v-else
              v-model="articleTitle"
              class="title-edit-input"
              maxlength="80"
              show-word-limit
              placeholder="请输入标题"
            />
            <div class="author">作者：{{ articleAuthor }}</div>
          </div>
        </div>
        <div class="header-right">
          <div class="meta-pill">字数：{{ wordCount }}</div>
          <div class="meta-pill">预计阅读：{{ readingMinutes }} 分钟</div>
          <div class="meta-pill">状态：{{ isEditing ? '编辑中' : '阅读中' }}</div>
          <div class="meta-pill permission-pill" :class="{ readonly: !isOwner }">
            权限：{{ isOwner ? '可编辑' : '仅查看' }}
          </div>
        </div>
      </div>

      <div v-if="isOwner" class="meta-strip">
        <div class="strip-item">
          <div class="strip-label">标题完整度</div>
          <div class="strip-value">{{ titleLength >= 6 ? '良好' : '建议补充' }}</div>
        </div>
        <div class="strip-item">
          <div class="strip-label">正文完整度</div>
          <div class="strip-value">{{ wordCount >= 120 ? '良好' : '可再丰富' }}</div>
        </div>
        <div class="strip-item">
          <div class="strip-label">操作权限</div>
          <div class="strip-value">{{ isOwner ? (isEditing ? '可发布' : '可切换编辑') : '只读查看' }}</div>
        </div>
      </div>

      <div v-if="isEditing" class="editor-panel">
        <div class="editor-canvas">
          <Toolbar class="editor-toolbar" :editor="editorRef" :defaultConfig="toolbarConfig" :mode="mode" />
          <Editor
            class="editor-body"
            v-model="valueHtml"
            :defaultConfig="editorConfig"
            :mode="mode"
            @onCreated="handleCreated"
          />
        </div>
        <div class="editor-action" v-if="isOwner">
          <el-button @click="clearContent">清空内容</el-button>
          <el-button type="primary" :loading="publishing" @click="publish">发布</el-button>
          <el-button type="danger" plain :loading="deleting" @click="removeDocument">删除文章</el-button>
        </div>
      </div>

      <div v-else class="article-container markdown-body" v-html="renderedContent"></div>
    </div>

    <div class="switch-wrap" v-if="isOwner">
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue' // 引入图标
import { marked } from 'marked'
import { useUserStore } from '@/stores/userStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const id = route.params.id

const articleTitle = ref('文章标题加载中...')
const articleAuthor = ref('未知作者')

const editorRef = shallowRef()
const valueHtml = ref('')
const isEditing = ref(false)
const publishing = ref(false)
const deleting = ref(false)

const renderedContent = computed(() => {
  const content = valueHtml.value
  if (!content) return ''
  return marked.parse(content)
})
const plainText = computed(() => {
  return String(valueHtml.value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
})
const wordCount = computed(() => plainText.value.length)
const titleLength = computed(() => String(articleTitle.value || '').trim().length)
const readingMinutes = computed(() => Math.max(1, Math.ceil(wordCount.value / 300)))
const currentUsername = computed(() => userStore.getUsername())
const normalizeName = (name) => String(name || '').trim().toLowerCase()
const isOwner = computed(() => {
  const authorName = normalizeName(articleAuthor.value)
  const currentName = normalizeName(currentUsername.value)
  return Boolean(authorName) && Boolean(currentName) && authorName === currentName
})

onMounted(async () => {
  try {
    const res = await documentApi.detail(id)
    if (res.code === 200) {
      valueHtml.value = res.data.content || ''
      articleTitle.value = res.data.title || '未命名文章'
      articleAuthor.value = res.data.author || '匿名'
      if (!isOwner.value) {
        isEditing.value = false
      }
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
const mode = 'default'

const handleCreated = (editor) => {
  editorRef.value = editor
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) editor.destroy()
})

const clearContent = () => {
  valueHtml.value = '<p></p>'
}

const publish = async () => {
  if (!isOwner.value) {
    ElMessage.warning('你只有查看权限，无法发布该文章')
    return
  }
  if (publishing.value) return
  const title = String(articleTitle.value || '').trim()
  
  if (!title) {
    ElMessage.warning('标题不能为空')
    return
  }
  const contentText = String(valueHtml.value || '').replace(/<[^>]+>/g, '').trim()
  if (!contentText) {
    ElMessage.warning('内容为空，无法发布')
    return
  }
  try {
    publishing.value = true
    const author = String(currentUsername.value || articleAuthor.value || '匿名').trim()
    const payload = { author, title, content: valueHtml.value }
    if (id !== undefined && id !== null && String(id).trim() !== '') {
      payload.id = id      
    }
    const res = await documentApi.publish(payload)
    if (res.code === 200) {
      ElMessage.success(res.message || '发布成功')
      // 返回预览形式
      router.push({ name: 'documentDetail', params: { id } })
      isEditing.value = false
    } else {
      ElMessage.error(res.message || '发布失败')
    }
  } catch (error) {
    ElMessage.error('发布失败，请稍后再试')
    console.error(error)
  } finally {
    publishing.value = false
  }
}

const removeDocument = async () => {
  if (!isOwner.value) {
    ElMessage.warning('你只有查看权限，无法删除该文章')
    return
  }
  try {
    await ElMessageBox.confirm(
      '删除后不可恢复，确定删除这篇文章吗？',
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  try {
    deleting.value = true
    const res = await documentApi.remove(id)
    if (res.code === 200) {
      ElMessage.success(res.message || '删除成功')
      router.push({ name: 'getDocument' })
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    ElMessage.error('删除失败，请稍后再试')
    console.error(error)
  } finally {
    deleting.value = false
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.detail-page {
  position: relative;
  min-height: 100%;
  box-sizing: border-box;
  padding: 16px 16px 28px;
  overflow: hidden;
  background:
    radial-gradient(1200px 520px at -240px -240px, rgba(0, 245, 255, 0.10) 0%, rgba(0, 245, 255, 0) 60%),
    radial-gradient(900px 520px at 120% 0, rgba(255, 0, 204, 0.08) 0%, rgba(255, 0, 204, 0) 60%),
    linear-gradient(180deg, #090a1a 0%, #0d1022 100%);
}
.content-shell {
  position: relative;
  z-index: 2;
  max-width: 1240px;
  margin: 0 auto;
  border: 1px solid rgba(0, 255, 255, 0.22);
  border-radius: 14px;
  background: rgba(7, 11, 24, 0.72);
  box-shadow: 0 0 16px rgba(0, 245, 255, 0.12), 0 0 30px rgba(255, 0, 204, 0.08);
  backdrop-filter: blur(5px);
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
  border-top: 1px solid rgba(0, 255, 255, 0.18);
  background: linear-gradient(135deg, rgba(8, 14, 32, 0.9), rgba(12, 18, 40, 0.86));
  line-height: 1.6;
  font-size: 16px;
  max-width: 980px;
  margin: 0 auto 18px;
  z-index: 2;
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.18);
  background: linear-gradient(90deg, rgba(0, 245, 255, 0.08), rgba(255, 0, 204, 0.08));
  position: relative;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}
.back-button {
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.header-title-wrap {
  min-width: 0;
  flex: 1;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.meta-pill {
  font-size: 12px;
  color: #9ee8ff;
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 999px;
  padding: 4px 10px;
}
.permission-pill.readonly {
  color: #ffb7e8;
  border-color: rgba(255, 0, 204, 0.28);
  background: rgba(255, 0, 204, 0.12);
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: #abf7ff;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.35);
}
.title-edit-input {
  max-width: 680px;
}

.author {
  margin-top: 6px;
  font-size: 13px;
  color: #8fb2c9;
}
.meta-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.15);
  background: rgba(8, 13, 30, 0.62);
}
.strip-item {
  border: 1px solid rgba(0, 255, 255, 0.18);
  border-radius: 10px;
  background: rgba(8, 15, 34, 0.72);
  padding: 10px 12px;
}
.strip-label {
  font-size: 12px;
  color: #88a7bf;
}
.strip-value {
  margin-top: 4px;
  font-size: 15px;
  font-weight: 600;
  color: #c7f8ff;
}
.editor-panel {
  padding: 12px 14px 14px;
}
.editor-canvas {
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(10, 15, 34, 0.78);
}
.editor-toolbar {
  border-bottom: 1px solid rgba(0, 255, 255, 0.18);
}
.editor-body {
  height: 520px;
  overflow-y: auto;
}
.editor-action {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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
  .header {
    flex-direction: column;
  }
  .header-left {
    width: 100%;
  }
  .header-right {
    width: 100%;
    justify-content: flex-start;
  }
  .meta-strip {
    grid-template-columns: 1fr;
  }
  .article-container {
    padding: 24px 16px;
  }
}

:deep(.w-e-toolbar),
:deep(.w-e-bar) {
  background: #0f1328 !important;
  border-color: rgba(0, 255, 255, 0.2) !important;
}

:deep(.w-e-text-container),
:deep(.w-e-scroll) {
  background: #f9fbff !important;
}
</style>
