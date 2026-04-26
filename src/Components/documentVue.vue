<template>
  <div class="doc-editor-page">
    <div class="doc-editor-shell">
      <div class="editor-header">
        <div class="header-left">
          <div class="header-title">文档创作中心</div>
          <div class="header-sub">沉浸式编辑体验，支持标题管理与一键发布</div>
        </div>
        <div class="header-right">
          <div class="meta">作者：{{ author || '未登录' }}</div>
          <div class="meta">字数：{{ wordCount }}</div>
          <div class="meta">预计阅读：{{ readingMinutes }} 分钟</div>
        </div>
      </div>

      <div class="title-action-bar">
        <div class="title-input-wrap">
          <el-input
            v-model="docTitle"
            placeholder="请输入文章标题（必填）"
            maxlength="80"
            show-word-limit
            class="title-input"
          />
          <div class="title-tip">标题长度：{{ titleLength }}/80</div>
        </div>
        <div class="action-right">
          <el-button @click="clearContent">清空内容</el-button>
          <el-button type="primary" :loading="publishing" @click="publish">发布</el-button>
        </div>
      </div>

      <div class="quick-overview">
        <div class="ov-card">
          <div class="ov-label">发布状态</div>
          <div class="ov-value">{{ publishing ? '发布中...' : '待发布' }}</div>
        </div>
        <div class="ov-card">
          <div class="ov-label">标题完整度</div>
          <div class="ov-value">{{ titleLength >= 6 ? '良好' : '建议补充' }}</div>
        </div>
        <div class="ov-card">
          <div class="ov-label">内容完整度</div>
          <div class="ov-value">{{ wordCount >= 120 ? '良好' : '可再丰富' }}</div>
        </div>
      </div>

      <div class="editor-container">
        <div class="editor-canvas">
          <Toolbar
            class="editor-toolbar"
            :editor="editorRef"
            :defaultConfig="toolbarConfig"
            :mode="mode"
          />
          <Editor
            class="editor-body"
            v-model="valueHtml"
            :defaultConfig="editorConfig"
            :mode="mode"
            @onCreated="handleCreated"
          />
        </div>
        <div class="editor-footnote">提示：支持 Ctrl/Cmd + C/V 粘贴内容，发布前请确认标题与正文一致。</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, ref, shallowRef, onMounted, computed } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { request } from '@/utils/request'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userStore'

// 获取用户信息
const useStore = useUserStore()
const author = computed(() => useStore.getUsername()) // 计算属性放在 setup 作用域

// 编辑器实例
const editorRef = shallowRef()
const mode = 'default'
const publishing = ref(false)

// 内容 HTML
const valueHtml = ref('<p></p>')
const docTitle = ref('')

// 模拟 ajax 异步获取内容
onMounted(() => {
  setTimeout(() => {
    valueHtml.value = '<p></p>'
  }, 1500)
})

// 配置
const toolbarConfig = {}
const editorConfig = { placeholder: '请输入内容...' }
const wordCount = computed(() => {
  const text = String(valueHtml.value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length
})
const titleLength = computed(() => String(docTitle.value || '').trim().length)
const readingMinutes = computed(() => {
  const n = Math.max(1, Math.ceil((wordCount.value || 0) / 300))
  return n
})

// 组件销毁时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor) editor.destroy()
})

// 记录 editor 实例
const handleCreated = (editor) => {
  editorRef.value = editor
}

const clearContent = () => {
  valueHtml.value = '<p></p>'
  docTitle.value = ''
}

// 发布方法
const publish = async () => {
  if (publishing.value) return
  const text = String(valueHtml.value || '').replace(/<[^>]+>/g, '').trim()
  if (!text) {
    ElMessage.warning('内容为空，无法发布')
    return
  }
  const title = String(docTitle.value || '').trim()
  if (!title) {
    ElMessage.warning('请先填写标题')
    return
  }
  try {
    publishing.value = true
    const res = await request.post('/document/publish/', {
      author: author.value, // 取计算属性的值
      title: title,
      content: valueHtml.value
    })    
    if (res.code === 200) {
      ElMessage.success(res.message)
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('发布失败，请稍后再试')
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped>
.doc-editor-page {
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  background:
    radial-gradient(1200px 500px at -240px -240px, rgba(0, 245, 255, 0.12) 0%, rgba(0, 245, 255, 0) 60%),
    radial-gradient(900px 500px at 120% 0, rgba(255, 0, 204, 0.10) 0%, rgba(255, 0, 204, 0) 60%),
    linear-gradient(180deg, #090a1a 0%, #0d1022 100%);
}

.doc-editor-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  max-width: 1240px;
  margin: 0 auto;
  border: 1px solid rgba(0, 255, 255, 0.25);
  border-radius: 14px;
  overflow: hidden;
  background: rgba(7, 11, 24, 0.78);
  box-shadow: 0 0 18px rgba(0, 245, 255, 0.12), 0 0 36px rgba(255, 0, 204, 0.08);
  backdrop-filter: blur(6px);
}

.editor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
  background: linear-gradient(90deg, rgba(0, 255, 255, 0.08) 0%, rgba(255, 0, 204, 0.08) 100%);
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #a8f8ff;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.4);
}

.header-sub {
  margin-top: 4px;
  font-size: 13px;
  color: #8da6c4;
}

.title-action-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.16);
  background: rgba(8, 14, 32, 0.55);
}

.title-input-wrap {
  flex: 1;
  max-width: 760px;
}

.title-input {
  width: 100%;
}

.title-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #82a2ba;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.action-right {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.quick-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.16);
  background: rgba(7, 12, 28, 0.62);
}

.ov-card {
  border: 1px solid rgba(0, 255, 255, 0.18);
  border-radius: 10px;
  background: rgba(8, 15, 34, 0.72);
  padding: 10px 12px;
}

.ov-label {
  font-size: 12px;
  color: #88a7bf;
}

.ov-value {
  margin-top: 4px;
  font-size: 15px;
  font-weight: 600;
  color: #c7f8ff;
}

.meta {
  font-size: 12px;
  color: #9ee8ff;
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 999px;
  padding: 4px 10px;
}

.editor-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px 14px;
  gap: 10px;
}

.editor-canvas {
  flex: 1;
  min-height: 0;
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(10, 15, 34, 0.78);
}

.editor-toolbar {
  border-bottom: 1px solid rgba(0, 255, 255, 0.18);
}

.editor-body {
  flex: 1;
  overflow-y: auto;
}

.editor-footnote {
  font-size: 12px;
  color: #7997ad;
  padding: 0 4px;
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

@media (max-width: 768px) {
  .doc-editor-page {
    padding: 10px;
  }
  .editor-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .title-action-bar {
    flex-direction: column;
  }
  .action-right {
    width: 100%;
  }
  .quick-overview {
    grid-template-columns: 1fr;
  }
}
</style>
