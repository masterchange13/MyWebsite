<template>
  <div class="doc-editor-page">
    <div class="doc-editor-shell">
      <div class="editor-header">
        <div class="header-left">
          <div class="header-title">文档创作中心</div>
          <div class="header-sub">支持富文本编辑，内容将发布到文档列表</div>
        </div>
        <div class="header-right">
          <div class="meta">作者：{{ author || '未登录' }}</div>
          <div class="meta">字数：{{ wordCount }}</div>
          <el-button @click="clearContent">清空内容</el-button>
          <el-button type="primary" :loading="publishing" @click="publish">发布</el-button>
        </div>
      </div>

      <div class="editor-container">
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
}

// 发布方法
const publish = async () => {
  if (publishing.value) return
  const text = String(valueHtml.value || '').replace(/<[^>]+>/g, '').trim()
  if (!text) {
    ElMessage.warning('内容为空，无法发布')
    return
  }
  try {
    publishing.value = true
    const res = await request.post('/document/publish/', {
      author: author.value, // 取计算属性的值
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
  border: 1px solid rgba(0, 255, 255, 0.25);
  border-radius: 14px;
  overflow: hidden;
  background: rgba(7, 11, 24, 0.78);
  box-shadow: 0 0 18px rgba(0, 245, 255, 0.12), 0 0 36px rgba(255, 0, 204, 0.08);
  backdrop-filter: blur(6px);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
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
  margin-top: 2px;
  font-size: 12px;
  color: #8da6c4;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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
}

.editor-toolbar {
  border-bottom: 1px solid rgba(0, 255, 255, 0.18);
}

.editor-body {
  flex: 1;
  overflow-y: auto;
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
}
</style>
