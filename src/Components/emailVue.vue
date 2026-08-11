<template>
  <div class="email-page">
    <div class="header">
      <h2 class="title">📧 邮件发送</h2>
      <p class="subtitle">配置 SMTP 后即可通过网站发送邮件</p>
    </div>

    <el-row :gutter="16">
      <!-- 写邮件 -->
      <el-col :xs="24" :md="14">
        <el-card shadow="hover" class="compose-card" @paste="onPaste">
          <template #header><span class="card-title">✉️ 撰写邮件</span></template>
          <el-form label-width="80px" :label-position="isMobile ? 'top' : 'right'">
            <el-form-item label="收件人">
              <el-input v-model="form.to" placeholder="多个收件人用逗号分隔" />
            </el-form-item>
            <el-form-item label="主题">
              <el-input v-model="form.subject" placeholder="邮件主题" />
            </el-form-item>
            <el-form-item label="正文">
              <el-input v-model="form.body" type="textarea" :rows="10" placeholder="邮件正文内容..." />
            </el-form-item>
            <el-form-item label="附件">
              <div class="attach-area">
                <el-upload
                  ref="uploadRef"
                  v-model:file-list="fileList"
                  :auto-upload="false"
                  :limit="10"
                  multiple
                  drag
                >
                  <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                  <div class="el-upload__text">拖拽文件到此处，或 <em>点击选择</em></div>
                  <template #tip>
                    <div class="el-upload__tip">支持 PDF / Word / Excel / 图片 / 压缩包等，总大小不超过 50MB。也可以直接 Ctrl+V 粘贴文件</div>
                  </template>
                </el-upload>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="sending" @click="doSend">
                {{ sending ? '发送中...' : '发送邮件' }}
              </el-button>
              <el-button @click="resetForm">清空</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧面板 -->
      <el-col :xs="24" :md="10">
        <!-- SMTP 配置 -->
        <el-card shadow="hover" class="config-card">
          <template #header>
            <div class="card-title-row">
              <span class="card-title">⚙️ SMTP 配置</span>
              <el-button size="small" text @click="showConfig = !showConfig">
                {{ showConfig ? '收起' : '展开' }}
              </el-button>
            </div>
          </template>
          <el-collapse-transition>
            <div v-show="showConfig">
              <el-form label-width="90px" :label-position="isMobile ? 'top' : 'right'" size="small">
                <el-form-item label="SMTP 服务器">
                  <el-input v-model="cfg.host" placeholder="smtp.qq.com" />
                </el-form-item>
                <el-form-item label="端口">
                  <el-input-number v-model="cfg.port" :min="1" :max="65535" />
                  <el-checkbox v-model="cfg.use_ssl" style="margin-left:8px">SSL</el-checkbox>
                </el-form-item>
                <el-form-item label="账号">
                  <el-input v-model="cfg.username" placeholder="your@email.com" />
                </el-form-item>
                <el-form-item label="密码/授权码">
                  <el-input v-model="cfg.password" type="password" show-password placeholder="SMTP 授权码" />
                </el-form-item>
                <el-form-item label="发件人名称">
                  <el-input v-model="cfg.sender_name" placeholder="可选，显示在发件人处" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="small" @click="saveConfig">保存配置</el-button>
                </el-form-item>
              </el-form>

              <div class="config-tips">
                <p>常用 SMTP：</p>
                <table>
                  <tr><th>邮箱</th><th>服务器</th><th>端口</th></tr>
                  <tr><td>QQ 邮箱</td><td>smtp.qq.com</td><td>465 (SSL)</td></tr>
                  <tr><td>163 邮箱</td><td>smtp.163.com</td><td>465 (SSL)</td></tr>
                  <tr><td>Gmail</td><td>smtp.gmail.com</td><td>587 (TLS)</td></tr>
                  <tr><td>Outlook</td><td>smtp.office365.com</td><td>587 (TLS)</td></tr>
                </table>
                <p>💡 密码处填写邮箱的 <b>SMTP 授权码</b>，不是登录密码。</p>
                <div class="auth-guide">
                  <p><b>如何获取授权码：</b></p>
                  <p>📮 <b>QQ 邮箱</b>：登录 QQ 邮箱 → 设置 → 账户 → POP3/SMTP 服务 → 开启 → 按提示发短信 → 获取授权码</p>
                  <p>📮 <b>163 邮箱</b>：登录 163 邮箱 → 设置 → POP3/SMTP/IMAP → 开启 SMTP → 设置授权码</p>
                  <p>📮 <b>Gmail</b>：Google 账户 → 安全性 → 两步验证 → 应用专用密码 → 选择"邮件"和"其他" → 生成</p>
                  <p>📮 <b>Outlook</b>：Microsoft 账户 → 安全性 → 高级安全性选项 → 应用密码 → 创建</p>
                </div>
              </div>
            </div>
          </el-collapse-transition>
        </el-card>

        <!-- 发送历史 -->
        <el-card shadow="hover" class="history-card">
          <template #header>
            <div class="card-title-row">
              <span class="card-title">📜 发送记录</span>
              <el-button size="small" type="danger" text @click="clearHistory" :disabled="!history.length">清空</el-button>
            </div>
          </template>
          <div class="history-list" v-if="history.length">
            <div class="h-item" v-for="h in history" :key="h.id">
              <div class="h-to">{{ h.to_email }}</div>
              <div class="h-subject">{{ h.subject }}</div>
              <div class="h-time">{{ new Date(h.created_at).toLocaleString() }}</div>
              <span class="h-status" :class="{ fail: !h.success }">{{ h.success ? '✅' : '❌' }}</span>
            </div>
          </div>
          <div class="history-empty" v-else>暂无发送记录</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { emailApi } from '@/api/emailApi'
import { ElMessage } from 'element-plus'

const isMobile = ref(window.innerWidth < 768)
const uploadRef = ref(null)

const form = reactive({ to: '', subject: '', body: '' })
const fileList = ref([])
const sending = ref(false)
const showConfig = ref(false)
const history = ref([])

const cfg = reactive({
  host: 'smtp.qq.com',
  port: 465,
  use_ssl: true,
  username: '',
  password: '',
  sender_name: '',
})

const loadConfig = async () => {
  try {
    const res = await emailApi.getConfig()
    if (res?.code === 200 && res.data) {
      Object.assign(cfg, res.data)
    }
  } catch {}
}

const saveConfig = async () => {
  try {
    const res = await emailApi.saveConfig({ ...cfg })
    if (res?.code === 200) {
      ElMessage.success('SMTP 配置已保存')
      loadConfig()
    } else {
      ElMessage.error(res?.msg || '保存失败')
    }
  } catch {
    ElMessage.error('保存失败')
  }
}

const doSend = async () => {
  if (!form.to.trim()) return ElMessage.warning('请填写收件人')
  if (!form.subject.trim()) return ElMessage.warning('请填写主题')
  sending.value = true
  try {
    const fd = new FormData()
    fd.append('to', form.to)
    fd.append('subject', form.subject)
    fd.append('body', form.body)
    fileList.value.forEach(f => {
      fd.append('attachments', f.raw)
    })
    const res = await emailApi.send(fd)
    if (res?.code === 200) {
      const fileCount = res.data?.files || 0
      ElMessage.success(fileCount ? `邮件发送成功（含 ${fileCount} 个附件）` : '邮件发送成功')
      fileList.value = []
      loadHistory()
    } else {
      ElMessage.error(res?.msg || '发送失败')
    }
  } catch {
    ElMessage.error('发送失败')
  } finally {
    sending.value = false
  }
}

const onPaste = (e) => {
  const items = e.clipboardData?.items || []
  const files = e.clipboardData?.files
  if (!files || files.length === 0) return

  // 如果焦点在文本框中，只处理文件粘贴（不拦截文本粘贴）
  const activeEl = document.activeElement
  const isTextInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA'
  const hasOnlyText = Array.from(items).every(i => i.kind === 'string' || i.type === 'text/plain')
  if (isTextInput && hasOnlyText && files.length === 1 && files[0].name === 'image.png') {
    // 剪贴板里的图片被浏览器当作文本占位符，跳过
    return
  }

  // 只处理真实文件粘贴
  const realFiles = Array.from(files).filter(f => f.size > 0)
  if (realFiles.length === 0) return

  e.preventDefault()

  for (const file of realFiles) {
    // 去重：同名同大小的跳过
    if (fileList.value.some(f => f.name === file.name && f.size === file.size)) continue

    fileList.value.push({
      uid: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      raw: file,
      status: 'ready',
    })
  }

  ElMessage.success(`已添加 ${realFiles.length} 个文件`)
}

const resetForm = () => {
  form.to = ''
  form.subject = ''
  form.body = ''
  fileList.value = []
}

const loadHistory = async () => {
  try {
    const res = await emailApi.getHistory({ limit: 30 })
    history.value = res?.data || []
  } catch {}
}

const clearHistory = async () => {
  try {
    await emailApi.deleteHistory({})
    history.value = []
    ElMessage.success('已清空')
  } catch {}
}

onMounted(() => {
  loadConfig()
  loadHistory()
})
</script>

<style scoped>
.email-page {
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
  overflow: auto;
}
.header { margin-bottom: 16px; }
.title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #9ef7ff;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.35);
}
.subtitle { margin: 4px 0 0; color: #88a7bf; font-size: 12px; }
.card-title { font-size: 15px; font-weight: 700; color: #d6fbff; }
.card-title-row { display: flex; justify-content: space-between; align-items: center; }

.compose-card, .config-card, .history-card { margin-bottom: 16px; }

/* Upload area */
.attach-area :deep(.el-upload-dragger) {
  background: rgba(9, 15, 34, 0.6);
  border: 1px dashed rgba(0, 255, 255, 0.25);
  border-radius: 10px;
  padding: 20px;
}
.attach-area :deep(.el-upload-dragger:hover) {
  border-color: rgba(0, 245, 255, 0.5);
}
.attach-area :deep(.el-icon--upload) {
  font-size: 28px;
  color: #65d5dc;
}
.attach-area :deep(.el-upload__text) {
  color: #88a7bf;
  font-size: 13px;
}
.attach-area :deep(.el-upload__text em) {
  color: #9ef7ff;
}
.attach-area :deep(.el-upload__tip) {
  color: #6b8090;
  font-size: 11px;
}
.attach-area :deep(.el-upload-list__item) {
  background: rgba(0, 245, 255, 0.04);
  border: 1px solid rgba(0, 255, 255, 0.12);
  border-radius: 6px;
  margin-top: 4px;
}
.attach-area :deep(.el-upload-list__item-name) {
  color: #d6fbff;
}

/* Config tips */
.config-tips {
  margin-top: 12px;
  font-size: 12px;
  color: #88a7bf;
}
.config-tips p { margin: 4px 0; }
.config-tips table { width: 100%; border-collapse: collapse; margin: 6px 0; }
.config-tips th, .config-tips td {
  padding: 4px 8px;
  text-align: left;
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
  color: #9dc5de;
}
.config-tips th { color: #9ef7ff; }
.auth-guide {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(0, 245, 255, 0.05);
  border: 1px solid rgba(0, 255, 255, 0.12);
}
.auth-guide p {
  margin: 2px 0;
  font-size: 11px;
  line-height: 1.6;
}
.auth-guide b { color: #9ef7ff; }

/* History */
.history-card { max-height: 360px; overflow: auto; }
.history-list { display: flex; flex-direction: column; gap: 4px; }
.h-item {
  display: grid;
  grid-template-columns: 1.6fr 2fr 1.8fr 0.4fr;
  gap: 6px;
  padding: 6px 8px;
  font-size: 12px;
  border-radius: 4px;
  align-items: center;
  color: #b8d4df;
}
.h-item:nth-child(even) { background: rgba(0, 245, 255, 0.04); }
.h-to { color: #65d5dc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.h-subject { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.h-time { color: #6b8090; font-size: 11px; }
.h-status { text-align: center; }
.h-status.fail { color: #ff6b8f; }
.history-empty { text-align: center; padding: 20px; color: #6b8090; font-size: 13px; }

@media (max-width: 768px) {
  .email-page { padding: 10px; }
  .title { font-size: 18px; }
  .h-item { grid-template-columns: 1.2fr 1.5fr 1.5fr 0.4fr; font-size: 10px; gap: 4px; }
}
</style>
