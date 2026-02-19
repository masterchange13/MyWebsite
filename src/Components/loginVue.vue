<template>
  <div class="login-page">
    <div class="login-container">
      <div class="left-panel">
        <div class="brand">欢迎回来</div>
        <div class="slogan">快速进入你的个人聚合空间</div>
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
        <div class="panel-title">账号登录</div>
        <div class="avatar">
          <img :src="avatarUrl" alt="avatar" />
        </div>
        <el-form :model="form" :rules="rules" ref="formRef" label-width="96px" class="login-form">
          <el-row :gutter="12">
            <el-col :span="24">
              <el-form-item label="用户名" prop="username">
                <el-input v-model="form.username" placeholder="请输入用户名" @keyup.enter="submitLogin" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="密码" prop="password">
                <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password @keyup.enter="submitLogin" />
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { userApi } from '@/api/userApi'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
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
const avatarUrl = computed(() => `https://api.dicebear.com/7.x/identicon/svg?seed=${form.value.username || 'user'}`)

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
  try {
    const saved = localStorage.getItem('remember_username')
    if (saved) form.value.username = saved
  } catch {}
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #eef5ff 0%, #f8fbff 100%);
  padding: 24px;
}
.login-container {
  width: 960px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.left-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.06);
}
.brand {
  font-size: 22px;
  font-weight: 700;
}
.slogan {
  margin-top: 8px;
  color: #666;
}
.benefits {
  margin-top: 16px;
}
.benefit {
  border-radius: 10px;
}
.b-title {
  font-weight: 600;
}
.b-sub {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}
.right-panel {
  border-radius: 12px;
}
.panel-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
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
  color: #888;
  margin-bottom: 4px;
}
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.avatar img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid #eee;
}
.links {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 100%;
}
</style>
  
