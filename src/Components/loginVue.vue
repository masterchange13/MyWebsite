<template>
  <div class="login-page">
    <div class="login-container">
      <div class="left-panel">
        <div class="site-tag">{{ websiteSettings.siteTitle }}</div>
        <div class="brand">{{ websiteSettings.loginTitle }}</div>
        <div class="slogan">{{ websiteSettings.loginSlogan }}</div>
        <div class="benefits">
          <el-row :gutter="12">
            <el-col :span="12">
              <el-card shadow="never" class="benefit">
                <div class="b-title">快捷导航</div>
                <div class="b-sub">常用站点一键直达</div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="never" class="benefit">
                <div class="b-title">音乐后台</div>
                <div class="b-sub">切页仍可播放</div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="never" class="benefit">
                <div class="b-title">视频卡片</div>
                <div class="b-sub">更清晰的列表视图</div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="never" class="benefit">
                <div class="b-title">文档管理</div>
                <div class="b-sub">内容发布与检索</div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>

      <el-card class="right-panel" shadow="always">
        <div class="characters-container">
          <div v-for="i in 3" :key="i" 
                :ref="el => { if (el) characterRefs[i-1] = el }"
                class="character" 
                :class="['c' + i, { 'eyes-closed': isPasswordFocused, 'staring': isUsernameFocused }]"
           >
            <div class="face">
              <div class="eye left"></div>
              <div class="eye right"></div>
              <div class="mouth"></div>
            </div>
          </div>
        </div>
        <div class="panel-title">账号登录</div>
        <el-form :model="form" :rules="rules" ref="formRef" label-width="96px" class="login-form">
          <el-row :gutter="12">
            <el-col :span="24">
              <el-form-item label="用户名" prop="username">
                <el-input 
                  v-model="form.username" 
                  placeholder="请输入用户名" 
                  @keyup.enter="submitLogin" 
                  @focus="isUsernameFocused = true"
                  @blur="isUsernameFocused = false"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="密码" prop="password">
                <el-input 
                  v-model="form.password" 
                  type="password" 
                  placeholder="请输入密码" 
                  show-password 
                  @keyup.enter="submitLogin"
                  @focus="isPasswordFocused = true"
                  @blur="isPasswordFocused = false"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <div class="strength">
                <div class="s-text">{{ strengthText }}</div>
                <el-progress :percentage="strengthPercent" :status="strengthStatus" :stroke-width="8" />
              </div>
            </el-col>
            <el-col :span="12">
              <el-form-item>
                <el-checkbox v-model="form.remember">记住用户名</el-checkbox>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <div class="links">
                <el-button link type="primary" @click="toRegister">去注册</el-button>
              </div>
            </el-col>
            <el-col :span="24">
              <el-form-item label="地区">
                <el-select v-model="form.region" placeholder="可选">
                  <el-option label="中国大陆" value="cn" />
                  <el-option label="中国香港" value="hk" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="备注">
                <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <div class="actions">
                <el-button type="primary" :loading="loading" @click="submitLogin">登录</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useWebsiteSettingsStore } from '@/stores/websiteSettingsStore'
import { userApi } from '@/api/userApi'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const websiteSettings = useWebsiteSettingsStore()

const formRef = ref()
const characterRefs = ref([])
const loading = ref(false)
const isPasswordFocused = ref(false)
const isUsernameFocused = ref(false)
let latestPointerEvent = null
let eyeAnimationFrame = 0

const updateEyes = (e) => {
  if (isPasswordFocused.value) return

  characterRefs.value.forEach((el) => {
    if (!el) return
    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const dx = e.clientX - centerX
    const dy = e.clientY - centerY
    const angle = Math.atan2(dy, dx)
    const distance = Math.min(6, Math.sqrt(dx * dx + dy * dy) / 15)

    el.style.setProperty('--eye-x', `${Math.cos(angle) * distance}px`)
    el.style.setProperty('--eye-y', `${Math.sin(angle) * distance}px`)
  })
}

const handleMouseMove = (e) => {
  if (isPasswordFocused.value) return
  latestPointerEvent = e
  if (eyeAnimationFrame) return
  eyeAnimationFrame = window.requestAnimationFrame(() => {
    eyeAnimationFrame = 0
    if (latestPointerEvent) updateEyes(latestPointerEvent)
  })
}

const form = ref({
  username: '',
  password: '',
  remember: true,
  region: '',
  remark: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: ['blur','change'] }],
  password: [{ required: true, message: '请输入密码', trigger: ['blur','change'] }]
}

const strengthScore = computed(() => {
  const v = form.value.password || ''
  let s = 0
  if (v.length >= 6) s += 30
  if (/[A-Z]/.test(v)) s += 20
  if (/[a-z]/.test(v)) s += 20
  if (/\d/.test(v)) s += 15
  if (/[^A-Za-z0-9]/.test(v)) s += 15
  return Math.min(100, s)
})
const strengthPercent = computed(() => strengthScore.value)
const strengthText = computed(() => {
  const p = strengthScore.value
  if (p < 40) return '密码强度：弱'
  if (p < 70) return '密码强度：中'
  return '密码强度：强'
})
const strengthStatus = computed(() => {
  const p = strengthScore.value
  if (p < 40) return 'exception'
  if (p < 70) return 'warning'
  return 'success'
})

const submitLogin = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    userApi.login({ username: form.value.username, password: form.value.password })
      .then((res) => {
        if (res?.success ?? res?.code === 200) {
          userStore.setUsername(form.value.username)
          if (form.value.remember) {
            try { localStorage.setItem('remember_username', form.value.username) } catch {}
          } else {
            try { localStorage.removeItem('remember_username') } catch {}
          }
          router.push('/navigator')
          ElMessage.success('登录成功')
        } else {
          ElMessage.error(res.msg || '登录失败')
        }
      })
      .catch((err) => {
        ElMessage.error(err.message || '请求失败')
      })
      .finally(() => {
        loading.value = false
      })
  })
}

const toRegister = () => router.push('/register')

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove, { passive: true })
  try {
    const saved = localStorage.getItem('remember_username')
    if (saved) form.value.username = saved
  } catch {}
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  if (eyeAnimationFrame) {
    window.cancelAnimationFrame(eyeAnimationFrame)
    eyeAnimationFrame = 0
  }
})
</script>

<style scoped>
.characters-container {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}
.character {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 10px 22px rgba(0,0,0,0.18);
  animation: float 3s ease-in-out infinite;
  --eye-x: 0px;
  --eye-y: 0px;
}
.c1 { background-color: var(--login-character-1); animation-delay: 0s; }
.c2 { background-color: var(--login-character-2); animation-delay: 0.5s; }
.c3 { background-color: var(--login-character-3); animation-delay: 1s; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.face {
  position: relative;
  width: 100%;
  height: 100%;
}
.eye {
  position: absolute;
  top: 35%;
  width: 10px;
  height: 10px;
  background-color: #333;
  border-radius: 50%;
  transform: translate(var(--eye-x), var(--eye-y));
  transition: transform 0.08s linear, background-color 0.3s ease, height 0.3s ease, width 0.3s ease, top 0.3s ease, border-radius 0.3s ease;
}
.eye.left { left: 25%; }
.eye.right { right: 25%; }

.mouth {
  position: absolute;
  bottom: 25%;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 6px;
  border: 2px solid #333;
  border-top: none;
  border-radius: 0 0 10px 10px;
}

/* Eyes closed state */
.eyes-closed .eye {
  height: 2px;
  width: 12px;
  border-radius: 0;
  top: 45%;
  transform: none;
}
.eyes-closed .mouth {
  width: 8px;
  height: 4px;
  border-radius: 50%;
  border-bottom: none;
  border-top: 2px solid #333;
  bottom: 20%;
}

/* Staring state */
.staring .eye {
  background-color: #000;
  transform: translate(var(--eye-x), calc(var(--eye-y) + 4px)) scale(1.2);
}
.staring .mouth {
  width: 14px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid #333;
  background-color: #ff9a9e; /* Cute little mouth */
}

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  padding: var(--app-page-padding);
}
.login-container {
  width: 960px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.left-panel {
  background:
    linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-strong) 100%);
  border: 1px solid var(--cyber-border);
  border-radius: var(--app-radius-lg);
  padding: var(--app-card-padding);
  box-shadow: var(--app-shadow-strong);
}
.site-tag {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--app-accent-soft);
  color: var(--app-accent-strong);
  font-size: 12px;
  letter-spacing: 0.08em;
  margin-bottom: 14px;
}
.brand {
  font-size: 30px;
  font-weight: 800;
  color: var(--app-text-strong);
}
.slogan {
  margin-top: 8px;
  color: var(--app-text-soft);
  line-height: 1.7;
}
.benefits {
  margin-top: 16px;
}
.benefit {
  border-radius: var(--app-radius-md);
  border: 1px solid var(--cyber-border);
  background: linear-gradient(180deg, var(--app-surface-soft) 0%, transparent 100%);
}
.b-title {
  font-weight: 600;
  color: var(--app-text-main);
}
.b-sub {
  font-size: 12px;
  color: var(--app-text-soft);
  margin-top: 4px;
}
.right-panel {
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-strong);
}
.panel-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
  color: var(--app-text-strong);
}
.login-form .actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
.strength {
  margin: 4px 0 12px;
}
.s-text {
  font-size: 12px;
  color: var(--app-text-soft);
  margin-bottom: 4px;
}
.links {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
}

.login-form :deep(.el-form-item__label),
.login-form :deep(.el-checkbox__label) {
  color: var(--app-text-muted);
}

@media (max-width: 900px) {
  .login-container {
    width: min(100%, 560px);
    grid-template-columns: 1fr;
  }
}
</style>
  
