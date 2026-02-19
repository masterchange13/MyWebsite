<template>
  <div class="register-page">
    <div class="register-container">
      <div class="left-panel">
        <div class="brand">欢迎加入</div>
        <div class="slogan">更好用的个人站点聚合与影音体验</div>
        <div class="benefits">
          <el-row :gutter="12">
            <el-col :span="12">
              <el-card shadow="never" class="benefit">
                <div class="b-title">导航收藏</div>
                <div class="b-sub">常用网站一键直达</div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="never" class="benefit">
                <div class="b-title">音乐播放</div>
                <div class="b-sub">后台播放与歌词联动</div>
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
        <div class="panel-title">创建账号</div>
        <el-form :model="form" :rules="rules" ref="formRef" label-width="96px" class="register-form">
          <el-row :gutter="12">
            <el-col :span="24">
              <el-form-item label="用户名" prop="username">
                <el-input v-model="form.username" placeholder="请输入用户名" @keyup.enter="submitRegister" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="form.email" placeholder="请输入邮箱" @keyup.enter="submitRegister" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="密码" prop="password">
                <el-input v-model="form.password" type="password" placeholder="不少于6位" show-password @keyup.enter="submitRegister" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="确认密码" prop="confirm">
                <el-input v-model="form.confirm" type="password" placeholder="再次输入" show-password @keyup.enter="submitRegister" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <div class="strength">
                <div class="s-text">{{ strengthText }}</div>
                <el-progress :percentage="strengthPercent" :status="strengthStatus" :stroke-width="8" />
              </div>
            </el-col>
            <el-col :span="12">
              <el-form-item label="昵称">
                <el-input v-model="form.nickname" placeholder="可选" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="性别">
                <el-select v-model="form.gender" placeholder="可选">
                  <el-option label="男" value="male" />
                  <el-option label="女" value="female" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="年龄" prop="age">
                <el-input v-model.number="form.age" placeholder="可选，整数" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="头像">
                <div class="avatar">
                  <img :src="avatarUrl" alt="avatar" />
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="个人简介">
                <el-input v-model="form.bio" type="textarea" :rows="3" placeholder="简单介绍一下自己" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item prop="agree">
                <el-checkbox v-model="form.agree">我已阅读并同意服务条款与隐私政策</el-checkbox>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <div class="actions">
                <el-button type="primary" :loading="loading" @click="submitRegister">注册</el-button>
                <el-button text @click="toLogin">去登录</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/userApi'
import { ElMessage } from 'element-plus'
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const form = ref({
  username: '',
  email: '',
  password: '',
  confirm: '',
  nickname: '',
  gender: '',
  age: null,
  bio: '',
  agree: false
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: ['blur','change'] },
    { validator: async (_r, v, cb) => {
        if (!v) return cb()
        if (v.length < 3) return cb(new Error('用户名至少3个字符'))
        try {
          const r = await userApi.getUserDetail({ username: v })
          const exists = (r?.data ?? r)?.username
          if (exists) return cb(new Error('用户名已存在'))
        } catch {}
        cb()
      }, trigger: ['blur'] }
  ],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: ['blur','change'] }],
  password: [
    { required: true, message: '请输入密码', trigger: ['blur','change'] },
    { validator: (_r, v, cb) => { if (v && v.length < 6) cb(new Error('不少于6位')); else cb() }, trigger: ['blur','change'] }
  ],
  confirm: [
    { required: true, message: '请再次输入密码', trigger: ['blur','change'] },
    { validator: (_r, v, cb) => { if (form.value.password && v !== form.value.password) cb(new Error('两次输入不一致')); else cb() }, trigger: ['blur','change'] }
  ],
  age: [
    { validator: (_r, v, cb) => { if (v != null && (!Number.isInteger(v) || v <= 0)) cb(new Error('请输入正整数')); else cb() }, trigger: ['blur','change'] }
  ],
  agree: [
    { validator: (_r, v, cb) => { if (!v) cb(new Error('请阅读并同意条款')); else cb() }, trigger: ['change'] }
  ]
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

const submitRegister = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    userApi.register({ username: form.value.username, password: form.value.password, email: form.value.email })
      .then((res) => {
        if (res.success ?? res.code === 200) {
          ElMessage.success(res.msg || '注册成功')
          userStore.setUsername(form.value.username)
          router.push('/')
        } else {
          ElMessage.error(res.msg || '注册失败')
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

const toLogin = () => router.push('/')
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #eef5ff 0%, #f8fbff 100%);
  padding: 24px;
}
.register-container {
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
.register-form .actions {
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
  display: inline-flex;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #eee;
}
.avatar img {
  width: 48px;
  height: 48px;
}
</style>
