<template>
  <div class="add-form">
    <div class="form-header">
      <div class="h-title">添加应用</div>
      <div class="h-sub">填写应用名称和协议链接</div>
    </div>
    <div class="form-body">
      <div class="left">
        <el-form :model="app" label-width="100px">
          <el-form-item label="Name" prop="name">
            <el-input v-model="app.name" placeholder="如：微信" @keyup.enter="submitForm" />
          </el-form-item>
          <el-form-item label="Link" prop="link">
            <el-input v-model="app.link" placeholder="如：weixin:// 或 vscode://" @keyup.enter="submitForm" />
          </el-form-item>
          <el-form-item label="Image" prop="img">
            <el-input v-model="app.img" placeholder="图标链接，可留空" @keyup.enter="submitForm" />
          </el-form-item>
          <el-form-item>
            <el-button @click="resetForm">Reset</el-button>
            <el-button type="primary" @click="submitForm">Add</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="right">
        <div class="preview-card">
          <img :src="previewImg" class="preview-img" alt="预览" />
          <div class="preview-name">{{ app.name || '应用名称' }}</div>
          <div class="preview-cmd">{{ app.link || 'link' }}</div>
        </div>
        <div class="tips">
          - Link 为应用的自定义协议链接（类似 URL）<br />
          - 例如：weixin:// 、vscode:// 、steam:// <br />
          - 也可以填写命令，系统会用后端执行<br />
          - Image 留空时将使用默认图标
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Message from '@/utils/message'
import { appLauncherApi } from '@/api/appLauncherApi'

const emit = defineEmits(['added'])

const app = ref({
    name: '',
    link: '',
    img: ''
});

const resetForm = () => {
    app.value.name = '';
    app.value.link = '';
    app.value.img = '';
};

const submitForm = async () => {
    try {
        const payload = { ...app.value }
        const res = await appLauncherApi.addAppLauncher(payload)
        if (res && res.code === 200) {
            Message.success('应用添加成功！')
            emit('added')
            resetForm()
        } else {
            Message.error(res?.msg || '添加失败')
        }
    } catch (error) {
        Message.error('添加应用时出错')
        console.error(error)
    }
};

const previewImg = computed(() => {
  if (app.value.img) return app.value.img
  const seed = encodeURIComponent(app.value.name || 'app')
  return `https://picsum.photos/seed/${seed}/128/128`
})
</script>

<style scoped>
.add-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.form-header {
  padding: 8px 12px;
  background: linear-gradient(90deg, #4f80ff 0%, #80c2ff 100%);
  color: #fff;
  border-radius: 10px;
}
.h-title {
  font-size: 20px;
  font-weight: 700;
}
.h-sub {
  font-size: 13px;
  opacity: 0.9;
}
.form-body {
  display: grid;
  grid-template-columns: 2fr 1.2fr;
  gap: 12px;
  padding: 4px;
}
.preview-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}
.preview-img {
  width: 140px;
  height: 140px;
  border-radius: 16px;
  object-fit: cover;
  box-shadow: 0 10px 24px rgba(0,0,0,0.12);
}
.preview-name {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 600;
}
.preview-cmd {
  margin-top: 2px;
  font-size: 13px;
  color: #6b7a8c;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tips {
  margin-top: 8px;
  font-size: 12px;
  color: #7a8ea8;
}
@media (max-width: 640px) {
  .form-body {
    grid-template-columns: 1fr;
  }
}
</style>
