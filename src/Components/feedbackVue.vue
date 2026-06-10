<template>
  <div class="page">
    <el-card class="card" shadow="hover">
      <template #header>
        <div class="card-header">🗒️ 留言板</div>
      </template>

      <div class="desc">
        你可以在这里提交想要的功能/改进点，所有人都会看到你的留言。
      </div>

      <el-form :model="form" label-width="90px" class="form">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="一句话说明你的需求" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="尽量描述清楚：场景 / 期望效果 / 参考示例" />
        </el-form-item>
        <el-form-item label="联系方式" prop="contact">
          <el-input v-model="form.contact" placeholder="可选：邮箱/QQ/微信/手机号（任选其一）" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submit">提交</el-button>
          <el-button @click="reset">重置</el-button>
          <el-button @click="refresh" :loading="loading" style="margin-left: auto;">刷新</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>📌 所有留言</span>
          <span class="count-badge">{{ items.length }} 条</span>
        </div>
      </template>

      <div v-if="!items.length" class="empty">还没有留言，快来发布第一条吧！</div>

      <div v-else class="message-list">
        <div v-for="it in items" :key="it.id" class="message-item">
          <div class="message-header">
            <div class="user-info">
              <img class="user-avatar" :src="getAvatar(it.username)" />
              <span class="user-name">{{ it.username || '匿名' }}</span>
            </div>
            <div class="message-meta">
              <span :class="['status-tag', statusClass(it.status)]">{{ formatStatus(it.status) }}</span>
              <span class="time">{{ formatTime(it.created_time) }}</span>
            </div>
          </div>
          <div class="message-title">{{ it.title }}</div>
          <div class="message-content">{{ it.content }}</div>
          <div v-if="it.reply" class="message-reply">
            <div class="reply-label">📢 回复</div>
            <div class="reply-body">{{ it.reply }}</div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const username = computed(() => userStore.getUsername())

const loading = ref(false)
const items = ref([])

const form = ref({
  title: '',
  content: '',
  contact: '',
})

const reset = () => {
  form.value.title = ''
  form.value.content = ''
  form.value.contact = ''
}

const getAvatar = (name) => `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name || 'user')}`

const formatTime = (s) => {
  if (!s) return ''
  const d = new Date(s)
  const pad = (v) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const formatStatus = (status) => {
  if (status === 'done') return '已完成'
  if (status === 'processing') return '处理中'
  return '新提交'
}

const statusClass = (status) => {
  if (status === 'done') return 'done'
  if (status === 'processing') return 'processing'
  return 'new'
}

const refresh = async () => {
  loading.value = true
  try {
    const res = await request.get('/feedback/list/', { showLoading: false })
    items.value = res?.data || []
  } catch (e) {
    items.value = []
  } finally {
    loading.value = false
  }
}

const submit = async () => {
  const payload = {
    title: form.value.title,
    content: form.value.content,
    contact: form.value.contact,
  }
  try {
    const res = await request.post('/feedback/submit/', payload)
    if (res?.code === 200) {
      ElMessage.success('已提交')
      reset()
      await refresh()
    } else {
      ElMessage.error(res?.message || '提交失败')
    }
  } catch (e) {
    ElMessage.error('提交失败')
  }
}

onMounted(() => {
  refresh()
})
</script>

<style scoped>
.page {
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card {
  border-radius: 14px;
}
.card-header {
  font-size: 20px;
  font-weight: 600;
  color: #9ef7ff;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.count-badge {
  font-size: 13px;
  font-weight: 400;
  color: #7fa4bd;
  text-shadow: none;
  background: rgba(0, 255, 255, 0.08);
  border: 1px solid rgba(0, 255, 255, 0.18);
  border-radius: 20px;
  padding: 2px 12px;
}
.desc {
  margin-bottom: 12px;
  color: rgba(214, 251, 255, 0.75);
  font-size: 13px;
}
.form :deep(.el-form-item__label) {
  color: rgba(214, 251, 255, 0.75);
}
.empty {
  color: rgba(214, 251, 255, 0.55);
  font-size: 14px;
  padding: 24px 0;
  text-align: center;
}

/* ==================== 消息列表 ==================== */
.message-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.message-item {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 255, 0.14);
  background: rgba(10, 16, 35, 0.62);
  transition: border-color 0.2s;
}
.message-item:hover {
  border-color: rgba(0, 255, 255, 0.28);
}
.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(0, 255, 255, 0.28);
}
.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #b9f6ff;
}
.message-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.status-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid;
  font-weight: 500;
}
.status-tag.new {
  color: #88b3c9;
  border-color: rgba(136, 179, 201, 0.4);
  background: rgba(136, 179, 201, 0.08);
}
.status-tag.processing {
  color: #f0c060;
  border-color: rgba(240, 192, 96, 0.4);
  background: rgba(240, 192, 96, 0.08);
}
.status-tag.done {
  color: #5cdb8b;
  border-color: rgba(92, 219, 139, 0.4);
  background: rgba(92, 219, 139, 0.08);
}
.time {
  font-size: 12px;
  color: #7fa4bd;
  font-variant-numeric: tabular-nums;
}
.message-title {
  font-size: 15px;
  font-weight: 700;
  color: #d6fbff;
  margin-bottom: 6px;
}
.message-content {
  white-space: pre-wrap;
  color: rgba(214, 251, 255, 0.8);
  line-height: 1.65;
  font-size: 14px;
}
.message-reply {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(0, 255, 255, 0.16);
  background: rgba(8, 16, 36, 0.7);
}
.reply-label {
  font-size: 12px;
  font-weight: 700;
  color: #9ef7ff;
  margin-bottom: 6px;
}
.reply-body {
  white-space: pre-wrap;
  color: rgba(214, 251, 255, 0.85);
  line-height: 1.6;
}

@media (max-width: 900px) {
  .message-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .message-meta {
    align-self: flex-start;
  }
}
</style>
