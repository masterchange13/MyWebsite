<template>
  <div class="ebooks-page">
    <template v-if="!activeBook">
      <header class="library-header">
        <div><h2>我的书架</h2><p>TXT · EPUB · PDF，阅读进度自动保存</p></div>
        <div class="library-actions">
          <el-input v-model="query" placeholder="搜索书名或作者" clearable aria-label="搜索电子书" />
          <el-button type="primary" :loading="uploading" @click="fileInput.click()">上传电子书</el-button>
          <input ref="fileInput" class="file-input" type="file" accept=".txt,.epub,.pdf" multiple @change="uploadBooks" />
        </div>
      </header>
      <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
      <p v-if="loading" role="status">正在加载书架…</p>
      <el-empty v-else-if="!filteredBooks.length" :description="query ? '没有匹配的电子书' : '上传第一本书，开始阅读'" />
      <div v-else class="book-grid">
        <article v-for="book in filteredBooks" :key="book.id" class="book-card">
          <button class="book-cover" :class="book.format" @click="openBook(book)" :aria-label="`阅读 ${book.title}`">
            <span class="format">{{ book.format.toUpperCase() }}</span><strong>{{ book.title }}</strong><span>{{ book.author || '未署名' }}</span>
          </button>
          <div class="book-meta"><h3>{{ book.title }}</h3><p>{{ book.author || '未知作者' }} · {{ formatSize(book.size) }}</p><p>{{ readingLabel(book) }}</p></div>
          <div class="book-actions">
            <el-button type="primary" text @click="openBook(book)">{{ book.last_read_at ? '继续阅读' : '开始阅读' }}</el-button>
            <a :href="ebooksApi.fileUrl(book.id)" download>下载</a>
            <el-button type="danger" text @click="removeBook(book)">删除</el-button>
          </div>
        </article>
      </div>
    </template>

    <template v-else>
      <header class="reader-header">
        <el-button @click="closeReader">返回书架</el-button>
        <div class="reader-title"><h2>{{ activeBook.title }}</h2><span>{{ saveStatus }}</span></div>
        <div class="reader-tools">
          <template v-if="activeBook.format !== 'pdf'">
            <el-button :disabled="fontSize <= 14" @click="fontSize -= 2">A−</el-button>
            <el-button :disabled="fontSize >= 32" @click="fontSize += 2">A+</el-button>
          </template>
          <el-select v-model="theme" aria-label="阅读主题" class="theme-select">
            <el-option label="护眼" value="sepia" /><el-option label="明亮" value="light" /><el-option label="夜间" value="dark" />
          </el-select>
          <a :href="ebooksApi.fileUrl(activeBook.id)" download>下载原文件</a>
        </div>
      </header>
      <div class="reader-navigation">
        <el-button :disabled="readingLoading || position <= 1" @click="navigate(-1)">{{ activeBook.format === 'pdf' ? '上一页' : '上一章' }}</el-button>
        <el-input-number v-if="activeBook.format === 'pdf'" :model-value="page" :min="1" :max="totalPages || 1" :disabled="!totalPages" controls-position="right" aria-label="PDF 页码" @change="changePage" />
        <el-select v-else :model-value="chapterIndex" :disabled="readingLoading" aria-label="章节目录" @change="changeChapter">
          <el-option v-for="(chapter, index) in activeBook.chapters" :key="index" :label="`${index + 1}. ${chapter.title}`" :value="index" />
        </el-select>
        <span>{{ position }} / {{ count || '…' }}</span>
        <el-button :disabled="readingLoading || !count || position >= count" @click="navigate(1)">{{ activeBook.format === 'pdf' ? '下一页' : '下一章' }}</el-button>
      </div>
      <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
      <main ref="readerBody" class="reader-body" :class="theme" @scroll.passive="onScroll">
        <PdfReader v-if="activeBook.format === 'pdf'" :key="activeBook.id" :url="ebooksApi.fileUrl(activeBook.id)" :page="page" @loaded="pdfLoaded" />
        <p v-else-if="readingLoading" role="status">正在加载章节…</p>
        <article v-else class="chapter" :style="{ fontSize: fontSize + 'px' }"><h3>{{ chapter.title }}</h3><div class="chapter-text">{{ chapter.text }}</div></article>
      </main>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ebooksApi } from '@/api/ebooksApi'
import PdfReader from '@/Components/ebooks/PdfReader.vue'

const books = ref([])
const loading = ref(true)
const uploading = ref(false)
const query = ref('')
const error = ref('')
const fileInput = ref(null)
const activeBook = ref(null)
const readerBody = ref(null)
const readingLoading = ref(false)
const chapter = ref({ title: '', text: '' })
const chapterIndex = ref(0)
const page = ref(1)
const totalPages = ref(0)
const fontSize = ref(18)
const theme = ref('sepia')
const saveStatus = ref('')
let scroll = 0
let saveTimer, controller
let saveChain = Promise.resolve()
let generation = 0
let disposed = false
let uploadLimit = 50
const filteredBooks = computed(() => books.value.filter(book => `${book.title} ${book.author}`.toLowerCase().includes(query.value.trim().toLowerCase())))
const position = computed(() => activeBook.value?.format === 'pdf' ? page.value : chapterIndex.value + 1)
const count = computed(() => activeBook.value?.format === 'pdf' ? totalPages.value : activeBook.value?.chapters.length)
const formatSize = bytes => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
const readingLabel = book => !book.last_read_at ? '还未开始阅读' : book.format === 'pdf' ? `上次读到第 ${book.progress.page || 1} 页` : `上次读到第 ${(book.progress.chapter || 0) + 1} 章，共 ${book.chapters.length} 章`
const message = exception => exception.response?.data?.message || '请求失败，请检查网络并重试。'

async function loadBooks() {
  try {
    const response = await ebooksApi.list()
    if (!disposed) { books.value = response.data; uploadLimit = response.max_upload_mb || 50 }
  } catch (exception) { if (!disposed) error.value = message(exception) }
  finally { if (!disposed) loading.value = false }
}

async function uploadBooks(event) {
  const files = [...event.target.files]
  uploading.value = true
  error.value = ''
  try {
    for (const file of files) {
      if (file.size > uploadLimit * 1024 * 1024) throw new Error(`每本电子书最大 ${uploadLimit} MB。`)
      const form = new FormData()
      form.append('file', file)
      const response = await ebooksApi.upload(form)
      if (disposed) return
      books.value.unshift(response.data)
    }
    ElMessage.success('电子书已加入书架')
  } catch (exception) { if (!disposed) error.value = exception.response?.data?.message || exception.message }
  finally { if (!disposed) { uploading.value = false; event.target.value = '' } }
}

async function removeBook(book) {
  try {
    await ElMessageBox.confirm(`删除《${book.title}》及其阅读进度？`, '删除电子书', { type: 'warning' })
    await ebooksApi.remove(book.id)
    books.value = books.value.filter(item => item.id !== book.id)
  } catch (exception) { if (exception !== 'cancel' && exception !== 'close') error.value = message(exception) }
}

function progress() {
  return { chapter: chapterIndex.value, page: page.value, scroll, font_size: fontSize.value, theme: theme.value }
}

function updateLocal(book, data) {
  book.progress = data
  book.last_read_at = new Date().toISOString()
}

async function saveProgress() {
  clearTimeout(saveTimer)
  const book = activeBook.value
  if (!book || readingLoading.value) return
  const data = progress()
  updateLocal(book, data)
  saveStatus.value = '正在保存…'
  try {
    saveChain = saveChain.catch(() => {}).then(() => ebooksApi.saveProgress(book.id, data))
    await saveChain
    if (!disposed && activeBook.value?.id === book.id) saveStatus.value = '进度已保存'
  } catch {
    if (!disposed && activeBook.value?.id === book.id) saveStatus.value = '保存失败，请检查网络'
  }
}

function queueSave() {
  if (!activeBook.value || readingLoading.value || disposed) return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveProgress, 800)
}

function onScroll() {
  if (readingLoading.value || activeBook.value?.format === 'pdf') return
  const body = readerBody.value
  scroll = body.scrollHeight > body.clientHeight ? body.scrollTop / (body.scrollHeight - body.clientHeight) : 0
  scroll = Math.max(0, Math.min(1, scroll))
  queueSave()
}

async function loadChapter(index, restore = 0) {
  controller?.abort()
  controller = new AbortController()
  const current = ++generation
  readingLoading.value = true
  error.value = ''
  try {
    const response = await ebooksApi.chapter(activeBook.value.id, index, controller.signal)
    if (disposed || current !== generation) return
    chapter.value = response.data
    readingLoading.value = false
    await nextTick()
    if (disposed || current !== generation || !readerBody.value) return
    scroll = restore
    readerBody.value.scrollTop = restore * Math.max(0, readerBody.value.scrollHeight - readerBody.value.clientHeight)
  } catch (exception) {
    if (!disposed && current === generation && exception.code !== 'ERR_CANCELED') error.value = message(exception)
  } finally { if (current === generation && !disposed) readingLoading.value = false }
}

async function openBook(book) {
  error.value = ''
  activeBook.value = book
  readingLoading.value = book.format !== 'pdf'
  const saved = book.progress || {}
  chapterIndex.value = Math.min(saved.chapter || 0, Math.max(0, book.chapters.length - 1))
  page.value = saved.page || 1
  scroll = saved.scroll || 0
  fontSize.value = saved.font_size || 18
  theme.value = saved.theme || 'sepia'
  saveStatus.value = ''
  totalPages.value = 0
  if (book.format !== 'pdf') await loadChapter(chapterIndex.value, scroll)
}

async function changeChapter(index) {
  if (index === chapterIndex.value) return
  clearTimeout(saveTimer)
  chapterIndex.value = index
  scroll = 0
  await loadChapter(index)
  queueSave()
}

function changePage(value) {
  if (!totalPages.value) return
  page.value = Math.min(totalPages.value, Math.max(1, Number(value) || 1))
  if (readerBody.value) readerBody.value.scrollTop = 0
  queueSave()
}

function pdfLoaded(pages) {
  totalPages.value = pages
  page.value = Math.min(pages, page.value)
  queueSave()
}

function navigate(direction) {
  if (activeBook.value.format === 'pdf') changePage(page.value + direction)
  else changeChapter(chapterIndex.value + direction)
}

async function closeReader() {
  await saveProgress()
  controller?.abort()
  generation++
  activeBook.value = null
  readingLoading.value = false
  error.value = ''
}

watch([fontSize, theme], async () => {
  const restore = scroll
  await nextTick()
  if (activeBook.value?.format !== 'pdf' && readerBody.value) readerBody.value.scrollTop = restore * Math.max(0, readerBody.value.scrollHeight - readerBody.value.clientHeight)
  queueSave()
})

onMounted(loadBooks)
onBeforeUnmount(() => {
  clearTimeout(saveTimer)
  controller?.abort()
  generation++
  if (activeBook.value && !readingLoading.value) {
    const data = progress()
    updateLocal(activeBook.value, data)
    const csrf = document.cookie.split('; ').find(cookie => cookie.startsWith('csrftoken='))?.split('=')[1] || ''
    fetch(`/api/ebooks/${activeBook.value.id}/progress/`, {
      method: 'POST', credentials: 'same-origin', keepalive: true,
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf }, body: JSON.stringify(data),
    }).catch(() => {})
  }
  disposed = true
})
</script>

<style scoped>
.ebooks-page { height: 100%; box-sizing: border-box; padding: 16px; display: flex; flex-direction: column; gap: 14px; color: var(--app-text-main); overflow-y: auto; }
h2, h3 { margin: 0; }
h2 { font-size: 21px; }
.library-header, .reader-header { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.library-header { justify-content: space-between; }
.library-header p, .book-meta p { margin: 6px 0 0; font-size: 12px; color: var(--app-text-muted); }
.library-actions, .reader-tools { display: flex; align-items: center; gap: 10px; }
.library-actions .el-input { width: 210px; }
.file-input { display: none; }
.book-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 18px; padding-bottom: 12px; }
.book-card { background: var(--app-surface); border: 1px solid var(--app-header-border); border-radius: 12px; overflow: hidden; }
.book-cover { width: 100%; min-height: 210px; padding: 24px; display: flex; flex-direction: column; align-items: flex-start; gap: 16px; border: none; color: #f4f7ff; text-align: left; background: linear-gradient(140deg, #243c56, #111e32); cursor: pointer; }
.book-cover.epub { background: linear-gradient(140deg, #33605b, #122f33); }
.book-cover.pdf { background: linear-gradient(140deg, #754659, #321a35); }
.book-cover strong { font-size: 22px; overflow-wrap: anywhere; line-height: 1.5; }
.book-cover > span:last-child { margin-top: auto; font-size: 12px; opacity: 0.8; }
.format { border: 1px solid #ffffff55; padding: 3px 7px; border-radius: 5px; font: 11px monospace; letter-spacing: 1px; }
.book-meta { padding: 14px 16px 0; }
.book-meta h3 { font-size: 15px; overflow-wrap: anywhere; }
.book-actions { padding: 10px; display: flex; align-items: center; justify-content: space-between; }
a { color: var(--app-accent); font-size: 13px; text-decoration: none; }
.reader-title { flex: 1; min-width: 120px; }
.reader-title h2 { font-size: 17px; }
.reader-title span { color: var(--app-text-muted); font-size: 12px; }
.reader-tools { flex-wrap: wrap; }
.reader-tools :deep(.el-button) { margin-left: 0; }
.theme-select { width: 92px; }
.reader-navigation { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.reader-navigation > .el-select { flex: 1; min-width: 140px; max-width: 500px; }
.reader-navigation > span { font-size: 12px; color: var(--app-text-muted); }
.reader-body { flex: 1; min-height: 180px; overflow: auto; padding: 28px; border-radius: 12px; box-sizing: border-box; }
.reader-body.sepia { background: #f2e8d2; color: #42382c; }
.reader-body.light { background: #fafafa; color: #242b34; }
.reader-body.dark { background: #151c27; color: #ced6e2; }
.chapter { max-width: 780px; margin: 0 auto; }
.chapter h3 { margin: 0 0 24px; line-height: 1.5; }
.chapter-text { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.95; }
@media (max-width: 768px) {
  .ebooks-page { padding: 10px; gap: 10px; }
  .library-actions { width: 100%; }.library-actions .el-input { flex: 1; min-width: 100px; }
  .book-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .book-cover { min-height: 170px; padding: 16px; }.book-cover strong { font-size: 18px; }
  .book-meta { padding: 10px; }.book-actions { flex-wrap: wrap; padding: 4px; }
  .reader-tools { width: 100%; }.reader-body { padding: 18px 12px; }
  .reader-navigation { gap: 6px; }.reader-navigation .el-button { padding: 8px; }
}
</style>
