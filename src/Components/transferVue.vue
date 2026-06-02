<template>
  <div class="page">

    <!-- 普通文件上传 -->
    <el-card class="card" shadow="hover">
      <template #header>
        <div class="card-header">📁 文件上传</div>
      </template>

      <div class="upload-box">
        <input type="file" ref="fileInput" class="file-input" />
        <el-button type="primary" @click="uploadFile">上传文件</el-button>
      </div>

      <el-alert v-if="message" :title="message" type="success" show-icon class="msg" />

      <div class="history">
        <div class="history-title">已上传文件</div>
        <div v-if="!files.length" class="history-empty">暂无文件</div>
        <div v-else class="history-list">
          <div v-for="f in files" :key="f.name" class="history-item file-item">
            <div class="history-main">
              <div class="history-name">{{ f.name }}</div>
              <div class="history-meta">{{ f.sizeText }} · {{ f.timeText }}</div>
            </div>
            <div class="history-actions">
              <el-button type="primary" link @click="previewFile(f)">预览</el-button>
              <el-button type="primary" link @click="openFile(f)">打开</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 音乐上传 -->
    <el-card class="card music-card" shadow="hover">
      <template #header>
        <div class="card-header">🎵 上传音乐</div>
      </template>

      <div class="music-form">
        <el-input v-model="musicForm.title" placeholder="歌曲名" />
        <el-input v-model="musicForm.artist" placeholder="歌手" />
        <el-input v-model="musicForm.album_title" placeholder="专辑名" />
        <el-input v-model="musicForm.album_id" placeholder="专辑ID" />

        <div class="file-row">
          <label>封面：</label>
          <input type="file" @change="handleCover" accept="image/*" />
        </div>

        <div class="file-row">
          <label>音乐文件：</label>
          <input type="file" @change="handleAudio" accept=".mp3" />
        </div>

        <el-button type="success" size="large" @click="uploadMusic" class="music-btn">
          🎧 上传音乐
        </el-button>
      </div>

      <div class="history">
        <div class="history-title">已上传音乐</div>
        <div v-if="!musics.length" class="history-empty">暂无音乐</div>
        <div v-else class="history-list">
          <div v-for="m in musics" :key="m.id" class="history-item music-item">
            <div class="music-thumb" :style="{ backgroundImage: m.coverUrl ? `url(${m.coverUrl})` : '' }"></div>
            <div class="history-main">
              <div class="history-name">{{ m.title || m.name || '未命名' }}</div>
              <div class="history-meta">{{ [m.artist, m.album_title].filter(Boolean).join(' · ') }}</div>
            </div>
            <div class="history-actions">
              <el-button type="primary" link @click="previewMusic(m)">预览</el-button>
              <el-button type="primary" link @click="openMusic(m)">打开</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="showPreview" :title="previewTitle" width="860px">
      <div class="preview-body">
        <img v-if="previewType === 'image'" :src="previewUrl" class="preview-image" />
        <div v-else-if="previewType === 'audio'" class="preview-audio-wrap">
          <img v-if="previewCoverUrl" :src="previewCoverUrl" class="preview-cover" />
          <audio :src="previewUrl" controls class="preview-audio" />
        </div>
        <iframe v-else :key="previewUrl" :src="previewUrl" class="preview-iframe"></iframe>
      </div>
      <template #footer>
        <el-button @click="showPreview = false">关闭</el-button>
        <el-button type="primary" @click="openPreviewInNewTab">新窗口打开</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { musicApi } from "@/api/musicApi";
import { useUserStore } from '@/stores/userStore'
import request from '@/utils/request'

const message = ref("");
const fileInput = ref(null); // 用 ref 代替 getElementById
const files = ref([])
const userStore = useUserStore()
const username = computed(() => userStore.getUsername())
const showPreview = ref(false)
const previewTitle = ref('')
const previewUrl = ref('')
const previewType = ref('iframe')
const previewCoverUrl = ref('')
const musics = ref([])

const formatBytes = (bytes) => {
  const n = Number(bytes || 0)
  if (n < 1024) return `${n} B`
  const kb = n / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(1)} GB`
}

const formatTime = (unixSeconds) => {
  if (!unixSeconds) return ''
  const d = new Date(unixSeconds * 1000)
  const pad = (v) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const getFiles = async () => {
  try {
    const res = await request.get('/file/list/', { showLoading: false, silentError: true })
    const list = res?.data || []
    files.value = list.map(f => ({
      ...f,
      sizeText: formatBytes(f.size),
      timeText: formatTime(f.mtime),
    }))
  } catch (e) {
    files.value = []
  }
}

const openFile = (row) => {
  if (!row?.url) return
  window.open(row.url, '_blank')
}

const toApiUrl = (u) => {
  if (!u) return ''
  const s = String(u)
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (s.startsWith('/api/')) return s
  if (s.startsWith('/')) return `/api${s}`
  return `/api/${s}`
}

const getPreviewType = (filename) => {
  const name = String(filename || '').toLowerCase()
  const ext = name.includes('.') ? name.split('.').pop() : ''
  const imageExt = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'])
  const audioExt = new Set(['mp3', 'wav', 'ogg'])
  if (imageExt.has(ext)) return 'image'
  if (audioExt.has(ext)) return 'audio'
  return 'iframe'
}

const previewFile = (row) => {
  if (!row?.url) return
  previewTitle.value = row.name || '预览'
  previewUrl.value = row.url
  previewType.value = getPreviewType(row.name)
  previewCoverUrl.value = ''
  showPreview.value = true
}

const getMusics = async () => {
  try {
    const res = await request.get('/music/get_all', { showLoading: false, silentError: true })
    const list = res?.data || []
    musics.value = list.map(m => {
      const audioUrl = toApiUrl(m.url || m.audio || '')
      const coverUrl = toApiUrl(m.cover || '')
      return { ...m, audioUrl, coverUrl }
    }).reverse()
  } catch (e) {
    musics.value = []
  }
}

const previewMusic = (m) => {
  const url = m?.audioUrl
  if (!url) return
  previewTitle.value = m?.title || '预览'
  previewUrl.value = url
  previewType.value = 'audio'
  previewCoverUrl.value = m?.coverUrl || ''
  showPreview.value = true
}

const openMusic = (m) => {
  const url = m?.audioUrl
  if (!url) return
  window.open(url, '_blank')
}

const openPreviewInNewTab = () => {
  if (!previewUrl.value) return
  window.open(previewUrl.value, '_blank')
}

const uploadFile = async () => {
  const file = fileInput.value.files[0]; // 直接获取文件

  if (!file) {
    message.value = "请选择文件";
    return;
  }

  message.value = "上传中...";
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await request.post('/file/upload/', formData);
    message.value = response.message || "上传成功！";
    ElMessage.success(response.message || "上传成功！");
    await getFiles()
  } catch (error) {
    const errorMessage = error.response?.data?.error || "上传失败";
    console.error(errorMessage);
    message.value = errorMessage;
  }
};

const musicForm = ref({
  title: "",
  album_id: "",
  album_title: "",
  artist: "",
  cover: null,
  audio: null,
});

const handleCover = (e) => {
  musicForm.value.cover = e.target.files[0];
};

const handleAudio = (e) => {
  musicForm.value.audio = e.target.files[0];
};

const uploadMusic = async () => {
  const formData = new FormData();

  for (let key in musicForm.value) {
    formData.append(key, musicForm.value[key]);
  }

  try {
    const res = await musicApi.uploadMusic(formData);
    ElMessage.success(res.message);
    await getMusics()
  } catch (err) {
    ElMessage.error("上传失败");
  }
};

onMounted(() => {
  getFiles()
  getMusics()
})
</script>

<style scoped>
.page {
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.card {
  border-radius: 14px;
  height: fit-content;
}

.card-header {
  font-size: 20px;
  font-weight: 600;
  color: #9ef7ff;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.35);
}

.upload-box {
  display: flex;
  gap: 12px;
  align-items: center;
}

.file-input {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 255, 0.24);
  background: rgba(8, 14, 32, 0.88);
  color: #d6fbff;
}

.msg {
  margin-top: 15px;
}

.history {
  margin-top: 14px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(0, 255, 255, 0.18);
  background: rgba(9, 15, 34, 0.82);
}
.history-title {
  font-size: 14px;
  font-weight: 700;
  color: #9ef7ff;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}
.history-empty {
  color: rgba(214, 251, 255, 0.65);
  font-size: 13px;
  padding: 10px 0;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 340px;
  overflow: auto;
}
.history-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 255, 0.14);
  background: rgba(8, 14, 32, 0.72);
}
.history-item.music-item {
  grid-template-columns: 44px 1fr auto;
}
.history-item:hover {
  border-color: rgba(0, 245, 255, 0.45);
  box-shadow: 0 0 16px rgba(0, 245, 255, 0.12);
}
.history-main {
  min-width: 0;
}
.history-name {
  color: #d6fbff;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-meta {
  margin-top: 2px;
  color: rgba(136, 167, 191, 0.95);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-actions {
  display: flex;
  gap: 6px;
}
.music-thumb {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(0, 245, 255, 0.10);
  border: 1px solid rgba(0, 255, 255, 0.18);
  background-position: center;
  background-size: cover;
}

.preview-body {
  width: 100%;
}
.preview-image {
  max-width: 100%;
  max-height: 70vh;
  display: block;
  margin: 0 auto;
  border-radius: 10px;
}
.preview-audio-wrap {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: center;
}
.preview-cover {
  width: 120px;
  height: 120px;
  border-radius: 14px;
  object-fit: cover;
  border: 1px solid rgba(0, 255, 255, 0.18);
}
.preview-audio {
  width: 100%;
}
.preview-iframe {
  width: 100%;
  height: 70vh;
  border: 0;
  border-radius: 10px;
  background: #0a0f20;
}

.music-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #9ec2da;
}

.music-btn {
  margin-top: 10px;
  width: 100%;
  border-radius: 10px;
  font-size: 16px;
}

@media (max-width: 768px) {
  .page {
    padding: 10px;
    grid-template-columns: 1fr;
  }
  .upload-box {
    flex-direction: column;
    align-items: stretch;
  }
}

</style>
