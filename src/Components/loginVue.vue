<template>
  <div class="auth-page">
    <el-card class="auth-card" shadow="always">
      <div class="auth-title">登录</div>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="88px" class="auth-form">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <div class="actions">
          <el-button type="primary" :loading="loading" @click="submitLogin">登录</el-button>
          <el-button text @click="toRegister">去注册</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: ['blur','change'] }],
  password: [{ required: true, message: '请输入密码', trigger: ['blur','change'] }]
}

const submitLogin = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    userApi.login({ username: form.value.username, password: form.value.password })
      .then((res) => {
        if (res?.success ?? res?.code === 200) {
          userStore.setUsername(form.value.username)
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

onMounted(() => {})
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
  width: 420px;
  border-radius: 12px;
}
.auth-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
}
.auth-form .actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
  
