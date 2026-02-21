<template>
  <div class="add-form">
    <div class="form-header">
      <div class="h-title">添加导航</div>
      <div class="h-sub">填写网站名称、地址与封面图</div>
    </div>
    <div class="form-body">
      <div class="left">
        <el-form :model="website" label-width="100px">
          <el-form-item label="Name" prop="name">
            <el-input v-model="website.name" placeholder="如：GitHub" />
          </el-form-item>
          <el-form-item label="URL" prop="url">
            <el-input v-model="website.url" placeholder="如：https://github.com" />
          </el-form-item>
          <el-form-item label="Image" prop="img">
            <el-input v-model="website.img" placeholder="图片链接，可留空自动生成" />
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
          <div class="preview-name">{{ website.name || '网站名称' }}</div>
          <div class="preview-url">{{ website.url || 'https://example.com' }}</div>
        </div>
        <div class="tips">
          - Image 留空时将自动使用站点图标或随机封面
        </div>
      </div>
    </div>
  </div>
</template>
 
<script setup>
import { ref, computed } from 'vue';
import Message from '@/utils/message'
import { navigatorApi } from '@/api/navigatorApi'
import { useUserStore } from '@/stores/userStore'
const emit = defineEmits(['added'])

const website = ref({
    name: '',
    url: '',
    img: ''
});    

const userStore = useUserStore()
const username = computed(() => userStore.getUsername())

const resetForm = () => {
    website.value.name = '';
    website.value.url = '';
    website.value.img = '';
};

const submitForm = async () => {
    try {
        const res = await navigatorApi.addNavigator({ ...website.value, username: username.value })
        if (res && res.code === 200) {
            Message.success('Icon added successfully!')
            emit('added')
            resetForm()
        } else {
            Message.error(res?.msg || 'Failed to add icon')
        }
    } catch (error) {
        Message.error('Error occurred while adding icon')
        console.error(error)
    }
};

const previewImg = computed(() => {
  const img = website.value.img
  const url = website.value.url
  if (img) return img
  try {
    const u = new URL(url)
    return `https://www.google.com/s2/favicons?sz=128&domain_url=${u.origin}`
  } catch (e) {
    const seed = encodeURIComponent(website.value.name || 'nav')
    return `https://picsum.photos/seed/${seed}/128/128`
  }
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
.preview-url {
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
