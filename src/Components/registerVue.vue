<template>
  <div class="auth-page">
    <el-card class="auth-card" shadow="always">
      <div class="auth-title">注册</div>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="88px" class="auth-form">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="不少于6位" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm">
          <el-input v-model="form.confirm" type="password" placeholder="再次输入" show-password />
        </el-form-item>
        <div class="actions">
          <el-button type="primary" :loading="loading" @click="submitRegister">注册</el-button>
          <el-button text @click="toLogin">去登录</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/userApi'
import { ElMessage } from 'element-plus'

const router = useRouter()

const formRef = ref()
const loading = ref(false)
const form = ref({
  username: '',
  email: '',
  password: '',
  confirm: ''
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
  ]
}

const submitRegister = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    userApi.register({ username: form.value.username, password: form.value.password, email: form.value.email })
      .then((res) => {
        if (res.success ?? res.code === 200) {
          ElMessage.success(res.msg || '注册成功')
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
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #eef5ff 0%, #f8fbff 100%);
  padding: 24px;
}
.auth-card {
  width: 520px;
  border-radius: 12px;
}
.auth-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
}
.tip {
  font-size: 12px;
  color: #888;
  text-align: center;
  margin-bottom: 8px;
}
.auth-form .actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
