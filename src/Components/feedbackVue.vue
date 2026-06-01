<template>
  <div class="page">
    <el-card class="card" shadow="hover">
      <template #header>
        <div class="card-header">🗒️ 留言板</div>
      </template>

      <div class="desc">
        你可以在这里提交想要的功能/改进点，我会在后台看到并处理。
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
        <div class="card-header">📌 我的需求</div>
      </template>

      <div v-if="!items.length" class="empty">还没有提交过需求</div>

      <div v-else class="list">
        <el-collapse>
          <el-collapse-item v-for="it in items" :key="it.id" :name="String(it.id)">
            <template #title>
              <div class="row-title">
                <span class="title">{{ it.title }}</span>
                <span class="meta">{{ formatStatus(it.status) }} · {{ formatTime(it.created_time) }}</span>
              </div>
            </template>
            <div class="content">{{ it.content }}</div>
            <div v-if="it.reply" class="reply">
              <div class="reply-label">回复</div>
              <div class="reply-content">{{ it.reply }}</div>
            </div>
          </el-collapse-item>
        </el-collapse>
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

const refresh = async () => {
  loading.value = true
  try {
    const res = await request.get('/feedback/list/', { params: { username: username.value }, showLoading: false })
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
    username: username.value,
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
  color: rgba(214, 251, 255, 0.65);
  font-size: 13px;
  padding: 8px 0;
}
.list {
  margin-top: 6px;
}
.row-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}
.title {
  font-weight: 700;
  color: #d6fbff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta {
  font-size: 12px;
  color: rgba(136, 167, 191, 0.95);
  flex: 0 0 auto;
}
.content {
  white-space: pre-wrap;
  color: rgba(214, 251, 255, 0.85);
  line-height: 1.6;
}
.reply {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 255, 0.14);
  background: rgba(8, 14, 32, 0.72);
}
.reply-label {
  font-size: 12px;
  font-weight: 700;
  color: #9ef7ff;
  margin-bottom: 6px;
}
.reply-content {
  white-space: pre-wrap;
  color: rgba(214, 251, 255, 0.85);
  line-height: 1.6;
}
</style>

