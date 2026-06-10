<template>
  <div class="detail-page">
    <!-- Subtle ambient decorations -->
    <div class="ambient-orb orb-1"></div>
    <div class="ambient-orb orb-2"></div>

    <div class="content-shell">
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <el-button text @click="goBack" class="back-button">
            <el-icon><ArrowLeft /></el-icon>
            <span>返回列表</span>
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
            <div class="author">
              <span class="author-dot"></span>
              {{ articleAuthor }}
            </div>
          </div>
        </div>
        <div class="header-right">
          <span class="meta-chip">
            <span class="chip-icon">📄</span> {{ wordCount }} 字
          </span>
          <span class="meta-chip">
            <span class="chip-icon">⏱️</span> {{ readingMinutes }} 分钟
          </span>
          <span class="meta-chip" :class="{ 'chip-private': !isPublic }">
            {{ isPublic ? '🌐 公开' : '🔒 私密' }}
          </span>
          <span class="meta-chip" :class="{ 'chip-editable': isOwner }">
            {{ isOwner ? '✏️ 可编辑' : '👁️ 仅查看' }}
          </span>
        </div>
      </div>

      <!-- Meta strip for owner -->
      <div v-if="isOwner" class="meta-strip">
        <div class="strip-item">
          <div class="strip-icon">📝</div>
          <div class="strip-info">
            <div class="strip-label">标题完整度</div>
            <div class="strip-value">{{ titleLength >= 6 ? '良好' : '建议补充' }}</div>
          </div>
        </div>
        <div class="strip-item">
          <div class="strip-icon">📊</div>
          <div class="strip-info">
            <div class="strip-label">正文完整度</div>
            <div class="strip-value">{{ wordCount >= 120 ? '良好' : '可再丰富' }}</div>
          </div>
        </div>
        <div class="strip-item">
          <div class="strip-icon">🔧</div>
          <div class="strip-info">
            <div class="strip-label">操作权限</div>
            <div class="strip-value">{{ isEditing ? '编辑模式' : '预览模式' }}</div>
          </div>
        </div>
      </div>

      <!-- Editor Panel -->
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
        <div class="editor-actions" v-if="isOwner">
          <div class="privacy-control">
            <span class="privacy-icon">{{ isPublic ? '🌐' : '🔒' }}</span>
            <span class="privacy-label">公开给别人看</span>
            <el-switch v-model="isPublic" size="small" />
          </div>
          <div class="action-buttons">
            <el-button @click="clearContent" :disabled="publishing">清空内容</el-button>
            <el-button type="primary" :loading="publishing" @click="publish">发布文章</el-button>
            <el-button type="danger" plain :loading="deleting" @click="removeDocument">删除文章</el-button>
          </div>
        </div>
      </div>

      <!-- Article Content -->
      <div v-else class="article-wrapper">
        <article class="article-content markdown-body" v-html="renderedContent"></article>

        <!-- Comments Section -->
        <div class="comments-section">
          <div class="comments-header">
            <div class="comments-title">
              <span class="comments-icon">💬</span>
              <span>评论</span>
              <span class="comments-count">{{ comments.length }}</span>
            </div>
          </div>

          <div v-if="comments.length === 0" class="comments-empty">
            暂无评论，来说点什么吧
          </div>

          <div v-else class="comments-list">
            <div v-for="c in comments" :key="c.id" class="comment-item">
              <div class="comment-avatar">
                <img :src="getCommentAvatar(c.author)" alt="" />
              </div>
              <div class="comment-body">
                <div class="comment-meta">
                  <span class="comment-author">{{ c.author }}</span>
                  <span class="comment-time">{{ formatCommentTime(c.created_time) }}</span>
                </div>
                <div class="comment-content">{{ c.content }}</div>
              </div>
              <div v-if="isCommentOwner(c)" class="comment-delete" @click="deleteComment(c.id)" title="删除评论">
                ✕
              </div>
            </div>
          </div>

          <div class="comment-composer">
            <el-input
              v-model="commentText"
              type="textarea"
              :rows="2"
              placeholder="写下你的评论..."
              maxlength="500"
              show-word-limit
            />
            <div class="comment-actions">
              <span class="comment-hint">以 {{ currentUsername }} 的身份评论</span>
              <el-button type="primary" size="small" :loading="commentSubmitting" :disabled="!commentText.trim()" @click="submitComment">
                发表评论
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating edit toggle -->
    <div class="edit-toggle" v-if="isOwner">
      <el-button @click="isEditing = !isEditing" class="toggle-btn">
        <span v-if="isEditing">👁️ 预览文章</span>
        <span v-else>✏️ 编辑文章</span>
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
import { ArrowLeft } from '@element-plus/icons-vue'
import { marked } from 'marked'
import { useUserStore } from '@/stores/userStore'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const id = route.params.id

const articleTitle = ref('文章标题加载中...')
const articleAuthor = ref('未知作者')
const isPublic = ref(true)

const editorRef = shallowRef()
const valueHtml = ref('')
const isEditing = ref(false)
const publishing = ref(false)
const deleting = ref(false)

const renderedContent = computed(() => {
  const content = valueHtml.value
  if (!content) return '<p style="color:#7a9aaa;text-align:center;padding:60px 0;">这篇文章还没有内容</p>'
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
      isPublic.value = res.data.is_public !== false
      if (!isOwner.value) {
        isEditing.value = false
      }
      loadComments()
    } else {
      ElMessage.error(res.message || '请求错误')
      if (res.code === 403) {
        router.push({ name: 'getDocument' })
      }
    }
  } catch (error) {
    const status = error?.response?.status
    const message = error?.response?.data?.message
    if (status === 403) {
      ElMessage.warning(message || '该文章仅作者可见')
      router.push({ name: 'getDocument' })
      return
    }
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
    const payload = { author, title, content: valueHtml.value, is_public: isPublic.value }
    if (id !== undefined && id !== null && String(id).trim() !== '') {
      payload.id = id
    }
    const res = await documentApi.publish(payload)
    if (res.code === 200) {
      ElMessage.success(res.message || '发布成功')
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

// ── Comments ──
const comments = ref([])
const commentText = ref('')
const commentSubmitting = ref(false)

const loadComments = async () => {
  try {
    const res = await documentApi.getComments(id)
    if (res.code === 200) {
      comments.value = res.data || []
    }
  } catch (e) {
    console.error('加载评论失败', e)
  }
}

const submitComment = async () => {
  const text = commentText.value.trim()
  if (!text || commentSubmitting.value) return
  commentSubmitting.value = true
  try {
    const res = await documentApi.addComment({
      document_id: Number(id),
      author: currentUsername.value,
      content: text,
    })
    if (res.code === 200) {
      commentText.value = ''
      await loadComments()
    } else {
      ElMessage.error(res.message || '评论失败')
    }
  } catch (e) {
    ElMessage.error('评论失败，请稍后再试')
  } finally {
    commentSubmitting.value = false
  }
}

const deleteComment = async (commentId) => {
  try {
    await ElMessageBox.confirm('确定删除这条评论吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    const res = await documentApi.deleteComment(commentId)
    if (res.code === 200) {
      ElMessage.success('已删除')
      await loadComments()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    ElMessage.error('删除失败，请稍后再试')
  }
}

const isCommentOwner = (comment) => {
  return normalizeName(comment.author) === normalizeName(currentUsername.value)
}

const getCommentAvatar = (name) => {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name || 'user')}`
}

const formatCommentTime = (s) => {
  if (!s) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (v) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.detail-page {
  position: relative;
  min-height: 100%;
  box-sizing: border-box;
  padding: 20px;
  overflow: hidden;
  background:
    radial-gradient(1000px 500px at -200px -200px, rgba(0, 245, 255, 0.05) 0%, transparent 60%),
    radial-gradient(800px 500px at 120% 0%, rgba(255, 0, 204, 0.04) 0%, transparent 60%),
    linear-gradient(180deg, #080b1a 0%, #0c1026 100%);
}

/* ── Ambient orbs (subtle, replacing jasmine) ── */
.ambient-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  animation: orbPulse 8s ease-in-out infinite;
}
.orb-1 {
  width: 300px;
  height: 300px;
  left: -100px;
  top: -80px;
  background: radial-gradient(circle, rgba(0, 245, 255, 0.08), transparent 70%);
  animation-delay: 0s;
}
.orb-2 {
  width: 250px;
  height: 250px;
  right: -80px;
  top: 40%;
  background: radial-gradient(circle, rgba(255, 0, 204, 0.06), transparent 70%);
  animation-delay: 3s;
}
@keyframes orbPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.15); opacity: 0.8; }
}

/* ── Content Shell ── */
.content-shell {
  position: relative;
  z-index: 2;
  max-width: 1040px;
  margin: 0 auto;
  border-radius: 16px;
  border: 1px solid rgba(0, 255, 255, 0.16);
  background: rgba(7, 11, 24, 0.75);
  backdrop-filter: blur(10px);
  box-shadow:
    0 0 20px rgba(0, 245, 255, 0.06),
    0 0 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* ── Header ── */
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.12);
  background: linear-gradient(105deg, rgba(0, 245, 255, 0.05), transparent 40%);
}
.header-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
  flex: 1;
}
.back-button {
  flex-shrink: 0;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6abfcc;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.15s ease;
}
.back-button:hover {
  color: #8ff4ff;
  background: rgba(0, 255, 255, 0.08) !important;
}
.header-title-wrap {
  min-width: 0;
  flex: 1;
}
.title {
  font-size: 26px;
  font-weight: 800;
  color: #d6fbff;
  line-height: 1.35;
  text-shadow: 0 0 12px rgba(0, 245, 255, 0.15);
  word-break: break-word;
}
.title-edit-input {
  max-width: 600px;
}
.author {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 14px;
  color: #7ba5b8;
  font-weight: 500;
}
.author-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00f5ff, #ff00cc);
  box-shadow: 0 0 8px rgba(0, 245, 255, 0.4);
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  padding-top: 4px;
}
.meta-chip {
  font-size: 12px;
  color: #9ee8ff;
  background: rgba(0, 255, 255, 0.08);
  border: 1px solid rgba(0, 255, 255, 0.16);
  border-radius: 999px;
  padding: 4px 12px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}
.chip-icon {
  font-size: 13px;
}
.meta-chip.chip-private {
  color: #ffc0f1;
  border-color: rgba(255, 0, 204, 0.20);
  background: rgba(255, 0, 204, 0.08);
}
.meta-chip.chip-editable {
  color: #b8f8d0;
  border-color: rgba(62, 224, 151, 0.20);
  background: rgba(62, 224, 151, 0.08);
}

/* ── Meta Strip ── */
.meta-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 24px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.10);
  background: rgba(8, 13, 30, 0.4);
}
.strip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 255, 0.10);
  background: rgba(8, 15, 34, 0.5);
}
.strip-icon {
  font-size: 22px;
  flex-shrink: 0;
}
.strip-label {
  font-size: 11px;
  color: #5f8598;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.strip-value {
  margin-top: 2px;
  font-size: 14px;
  font-weight: 600;
  color: #b8f0f8;
}

/* ── Editor ── */
.editor-panel {
  padding: 16px 24px 20px;
}
.editor-canvas {
  border: 1px solid rgba(0, 255, 255, 0.16);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(10, 15, 34, 0.6);
}
.editor-toolbar {
  border-bottom: 1px solid rgba(0, 255, 255, 0.14);
}
.editor-body {
  height: 520px;
  overflow-y: auto;
}
.editor-actions {
  margin-top: 14px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.privacy-control {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid rgba(0, 255, 255, 0.14);
  border-radius: 10px;
  background: rgba(10, 16, 35, 0.5);
}
.privacy-icon {
  font-size: 16px;
}
.privacy-label {
  font-size: 13px;
  color: #9dc5de;
  font-weight: 500;
}
.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ── Article Content ── */
.article-wrapper {
  padding: 12px 24px 32px;
}
.article-content {
  max-width: 860px;
  margin: 0 auto;
  padding: 36px 40px;
  border-radius: 14px;
  border: 1px solid rgba(0, 255, 255, 0.10);
  background: rgba(8, 12, 26, 0.5);
  line-height: 1.85;
  font-size: 16px;
  position: relative;
}
/* Decorative side accents */
.article-content::before,
.article-content::after {
  content: '';
  position: absolute;
  top: 40px;
  width: 4px;
  border-radius: 999px;
}
.article-content::before {
  left: -1px;
  height: 60px;
  background: linear-gradient(180deg, rgba(0, 245, 255, 0.6), transparent);
}
.article-content::after {
  right: -1px;
  height: 60px;
  background: linear-gradient(180deg, rgba(255, 0, 204, 0.5), transparent);
}

/* ── Markdown Typography ── */
:deep(.markdown-body) h1,
:deep(.markdown-body) h2,
:deep(.markdown-body) h3,
:deep(.markdown-body) h4 {
  color: #b8f4fa;
  font-weight: 700;
  line-height: 1.35;
  margin-top: 28px;
  margin-bottom: 14px;
}
:deep(.markdown-body) h1 { font-size: 28px; border-bottom: 2px solid rgba(0, 255, 255, 0.18); padding-bottom: 8px; }
:deep(.markdown-body) h2 { font-size: 24px; border-bottom: 1px solid rgba(0, 255, 255, 0.14); padding-bottom: 6px; }
:deep(.markdown-body) h3 { font-size: 20px; }
:deep(.markdown-body) h4 { font-size: 17px; }

:deep(.markdown-body) p {
  margin-top: 0;
  margin-bottom: 16px;
  color: #c8e8f4;
  line-height: 1.85;
}
:deep(.markdown-body) a {
  color: #5ed8e8;
  text-decoration: none;
  border-bottom: 1px solid rgba(94, 216, 232, 0.3);
  transition: all 0.15s ease;
}
:deep(.markdown-body) a:hover {
  color: #ff95ec;
  border-bottom-color: rgba(255, 149, 236, 0.4);
}
:deep(.markdown-body) strong {
  color: #e0f6ff;
  font-weight: 700;
}
:deep(.markdown-body) code {
  padding: 2px 6px;
  margin: 0 2px;
  font-size: 85%;
  color: #94f5ff;
  background: rgba(0, 245, 255, 0.10);
  border: 1px solid rgba(0, 245, 255, 0.14);
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
}
:deep(.markdown-body) pre {
  padding: 18px 20px;
  overflow: auto;
  font-size: 14px;
  line-height: 1.55;
  color: #d0eef8;
  background: rgba(6, 10, 24, 0.8);
  border: 1px solid rgba(0, 255, 255, 0.14);
  border-radius: 10px;
  margin-bottom: 18px;
}
:deep(.markdown-body) pre code {
  padding: 0;
  margin: 0;
  color: inherit;
  background: transparent;
  border: none;
  font-size: inherit;
}
:deep(.markdown-body) blockquote {
  padding: 12px 18px;
  color: #a8d8e8;
  border-left: 3px solid rgba(255, 0, 204, 0.4);
  background: rgba(255, 0, 204, 0.05);
  border-radius: 0 8px 8px 0;
  margin: 0 0 18px 0;
}
:deep(.markdown-body) blockquote p {
  margin-bottom: 0;
  color: #a8d8e8;
}
:deep(.markdown-body) ul,
:deep(.markdown-body) ol {
  padding-left: 1.5em;
  color: #c8e8f4;
  margin-bottom: 16px;
}
:deep(.markdown-body) li {
  margin-bottom: 6px;
}
:deep(.markdown-body) img {
  max-width: 100%;
  border-radius: 8px;
  margin: 12px 0;
}
:deep(.markdown-body) hr {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
  margin: 28px 0;
}
:deep(.markdown-body) table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
  font-size: 14px;
}
:deep(.markdown-body) th,
:deep(.markdown-body) td {
  padding: 8px 14px;
  border: 1px solid rgba(0, 255, 255, 0.14);
  text-align: left;
  color: #c8e8f4;
}
:deep(.markdown-body) th {
  background: rgba(0, 245, 255, 0.06);
  font-weight: 700;
  color: #b8f4fa;
}

/* ── Edit Toggle (floating) ── */
.edit-toggle {
  position: fixed;
  right: 28px;
  bottom: 40px;
  z-index: 30;
}
.toggle-btn {
  border-radius: 999px !important;
  border: 1px solid rgba(0, 255, 255, 0.24) !important;
  background: rgba(8, 16, 36, 0.85) !important;
  color: #9ef7ff !important;
  font-weight: 600 !important;
  padding: 10px 20px !important;
  font-size: 14px !important;
  backdrop-filter: blur(8px);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.4),
    0 0 16px rgba(0, 245, 255, 0.10) !important;
  transition: all 0.2s ease !important;
}
.toggle-btn:hover {
  border-color: rgba(255, 0, 204, 0.30) !important;
  color: #ff9dec !important;
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(255, 0, 204, 0.12) !important;
  transform: translateY(-2px);
}

/* ── Editor overrides ── */
:deep(.w-e-toolbar),
:deep(.w-e-bar) {
  background: #0f1328 !important;
  border-color: rgba(0, 255, 255, 0.16) !important;
}
:deep(.w-e-text-container),
:deep(.w-e-scroll) {
  background: #f9fbff !important;
}

/* ── Comments ── */
.comments-section {
  max-width: 860px;
  margin: 24px auto 0;
  padding: 0 4px;
}
.comments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.comments-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #9ef7ff;
}
.comments-icon {
  font-size: 20px;
}
.comments-count {
  font-size: 13px;
  font-weight: 400;
  color: #7fa4bd;
  background: rgba(0, 255, 255, 0.08);
  border: 1px solid rgba(0, 255, 255, 0.16);
  border-radius: 20px;
  padding: 1px 10px;
}
.comments-empty {
  text-align: center;
  color: rgba(214, 251, 255, 0.45);
  font-size: 14px;
  padding: 28px 0;
}
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}
.comment-item {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 255, 0.10);
  background: rgba(10, 16, 35, 0.45);
  transition: border-color 0.2s;
}
.comment-item:hover {
  border-color: rgba(0, 255, 255, 0.2);
}
.comment-avatar {
  flex-shrink: 0;
}
.comment-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(0, 255, 255, 0.24);
}
.comment-body {
  flex: 1;
  min-width: 0;
}
.comment-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.comment-author {
  font-size: 13px;
  font-weight: 600;
  color: #b9f6ff;
}
.comment-time {
  font-size: 11px;
  color: #7fa4bd;
}
.comment-content {
  white-space: pre-wrap;
  word-break: break-word;
  color: rgba(214, 251, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
}
.comment-delete {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: rgba(214, 251, 255, 0.3);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}
.comment-delete:hover {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.12);
}
.comment-composer {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 255, 0.14);
  background: rgba(10, 16, 35, 0.45);
}
.comment-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}
.comment-hint {
  font-size: 12px;
  color: #7fa4bd;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .detail-page {
    padding: 12px;
  }
  .header {
    flex-direction: column;
    padding: 14px 16px 12px;
  }
  .header-left {
    width: 100%;
  }
  .header-right {
    width: 100%;
    justify-content: flex-start;
  }
  .title {
    font-size: 22px;
  }
  .meta-strip {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 12px 16px;
  }
  .article-wrapper {
    padding: 8px 12px 20px;
  }
  .article-content {
    padding: 20px 16px;
  }
  .editor-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .action-buttons {
    justify-content: flex-end;
  }
  .edit-toggle {
    right: 16px;
    bottom: 24px;
  }
  .toggle-btn {
    font-size: 13px !important;
    padding: 8px 16px !important;
  }
  .ambient-orb {
    display: none;
  }
}
</style>
