<template>
  <div class="profile-page">
    <el-card class="header" shadow="never">
      <div class="title">个人信息</div>
      <div class="subtitle">账户资料</div>
    </el-card>

    <el-card class="body" shadow="always">
      <div class="row">
        <el-avatar :size="72" :src="avatarUrl" />
        <div class="info">
          <div class="name">{{ username }}</div>
          <div class="id">ID: {{ username }}</div>
        </div>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="88px" class="form">
        <el-form-item label="用户名">
          <el-input v-model="form.username" disabled />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="创建时间">
          <el-input :value="createdTimeText" readonly />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="不少于6位" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm">
          <el-input v-model="form.confirm" type="password" placeholder="再次输入" show-password />
        </el-form-item>
        <div class="actions">
          <el-button @click="goBack">返回</el-button>
          <el-button type="primary" @click="submit">保存</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { userApi } from '@/api/userApi'

const router = useRouter()
const userStore = useUserStore()
const username = computed(() => userStore.getUsername())
const avatarUrl = computed(() => `https://api.dicebear.com/7.x/identicon/svg?seed=${username.value || 'user'}`)
const goBack = () => router.back()

const formRef = ref()
const form = ref({
  username: '',
  email: '',
  password: '',
  confirm: ''
})
const createdTime = ref('')
const createdTimeText = computed(() => createdTime.value ? dayjs(createdTime.value).format('YYYY-MM-DD HH:mm') : '未知')

const rules = {
  email: [
    { type: 'email', message: '邮箱格式不正确', trigger: ['blur','change'] }
  ],
  password: [
    { validator: (_rule, val, cb) => { if (val && val.length < 6) cb(new Error('不少于6位')); else cb() }, trigger: ['blur','change'] }
  ],
  confirm: [
    { validator: (_rule, val, cb) => { if (form.value.password && val !== form.value.password) cb(new Error('两次输入不一致')); else cb() }, trigger: ['blur','change'] }
  ]
}

const loadProfile = async () => {
  try {
    const name = username.value || ''
    let data = null
    if (name) {
      const res1 = await userApi.getUserDetail({ username: name })
      data = res1?.data ?? res1
    }
    if (!data) {
      const res2 = await userApi.getCurrentUser()
      data = res2?.data ?? res2
    }
    form.value.username = data?.username || name || ''
    form.value.email = data?.email || ''
    createdTime.value = data?.created_time || ''
  } catch (e) {
    form.value.username = username.value || ''
  }
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    const payload = { email: form.value.email }
    if (form.value.password) payload.password = form.value.password
    try {
      const res = await userApi.updateUser(payload)
      if ((res.success ?? res.code === 200)) {
        ElMessage.success('保存成功')
        if (payload.email) form.value.email = payload.email
        form.value.password = ''
        form.value.confirm = ''
        await loadProfile()
      } else {
        ElMessage.error(res.msg || '保存失败')
      }
    } catch (e) {
      ElMessage.error('请求失败')
    }
  })
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}
.subtitle {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
  text-align: center;
}
.header,
.body {
  width: 100%;
  max-width: 680px;
}
.body .row {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
}
.info .name {
  font-size: 16px;
  font-weight: 600;
}
.info .id {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}
.actions {
  margin-top: 16px;
}
.form {
  margin-top: 16px;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
}
.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
