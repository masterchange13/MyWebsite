<template>
  <div ref="wrapper" class="pdf-reader">
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-else-if="loading" role="status">正在加载 PDF…</p>
    <canvas ref="canvas" :aria-label="`PDF 第 ${page} 页`" role="img"></canvas>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
const resourceUrl = (folder) => import.meta.env.DEV
  ? new URL(`/node_modules/pdfjs-dist/${folder}/`, window.location.href).href
  : new URL(`pdfjs/${folder}/`, new URL(import.meta.env.BASE_URL, document.baseURI)).href
const props = defineProps({ url: { type: String, required: true }, page: { type: Number, default: 1 } })
const emit = defineEmits(['loaded'])
const wrapper = ref(null)
const canvas = ref(null)
const loading = ref(true)
const error = ref('')
let pdf, loadTask, renderTask, observer, controller
let generation = 0
let disposed = false
let width = 0

async function render() {
  if (!pdf || !canvas.value || disposed) return
  const current = ++generation
  loading.value = true
  error.value = ''
  try {
    if (renderTask) {
      renderTask.cancel()
      await renderTask.promise.catch(() => {})
    }
    const page = await pdf.getPage(Math.max(1, Math.min(pdf.numPages, props.page)))
    if (disposed || current !== generation) return
    const base = page.getViewport({ scale: 1 })
    const scale = Math.min((wrapper.value.clientWidth || 700) / base.width, 2)
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const viewport = page.getViewport({ scale: Math.min(scale * ratio, 8192 / base.height, 4096 / base.width) })
    canvas.value.width = Math.ceil(viewport.width)
    canvas.value.height = Math.ceil(viewport.height)
    canvas.value.style.width = Math.min(base.width * scale, viewport.width / ratio) + 'px'
    const task = page.render({ canvasContext: canvas.value.getContext('2d'), viewport })
    renderTask = task
    await task.promise
  } catch (exception) {
    if (!disposed && current === generation && exception.name !== 'RenderingCancelledException') error.value = '当前 PDF 页面无法渲染，请尝试重新打开或下载原文件。'
  } finally {
    if (!disposed && current === generation) loading.value = false
  }
}

onMounted(async () => {
  controller = new AbortController()
  observer = new ResizeObserver(() => {
    if (wrapper.value && Math.abs(wrapper.value.clientWidth - width) > 1) {
      width = wrapper.value.clientWidth
      render()
    }
  })
  observer.observe(wrapper.value)
  try {
    const response = await fetch(props.url, { credentials: 'same-origin', signal: controller.signal })
    if (!response.ok) throw new Error('file unavailable')
    const data = new Uint8Array(await response.arrayBuffer())
    if (disposed) return
    loadTask = pdfjs.getDocument({ data, isEvalSupported: false, enableXfa: false,
      cMapUrl: resourceUrl('cmaps'), cMapPacked: true, standardFontDataUrl: resourceUrl('standard_fonts'),
    })
    pdf = await loadTask.promise
    if (disposed) { await pdf.destroy(); return }
    emit('loaded', pdf.numPages)
    await nextTick()
    await render()
  } catch (exception) {
    if (!disposed && exception.name !== 'AbortError') {
      error.value = 'PDF 打开失败，请确认文件有效且未加密，或下载原文件查看。'
      loading.value = false
    }
  }
})

watch(() => props.page, render)
onBeforeUnmount(() => {
  disposed = true
  generation++
  controller?.abort()
  observer?.disconnect()
  renderTask?.cancel()
  loadTask?.destroy().catch(() => {})
})
</script>

<style scoped>
.pdf-reader { width: 100%; min-height: 100px; text-align: center; }
canvas { display: block; max-width: 100%; height: auto; margin: 0 auto; box-shadow: 0 2px 12px #0002; }
p { padding: 12px; }
</style>
