<template>
  <div class="navigator">
    <el-drawer v-model="showAddIcon" title="添加导航" size="640px" class="add-drawer">
      <addIconVue v-if="showAddIcon" @added="onAdded" />
    </el-drawer>

    <div class="header">
      <h2 class="title">我的导航</h2>
      <p class="subtitle">常用网站快捷入口</p>
    </div>

    <el-row :gutter="16" class="grid">
      <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="(icon, index) in icons" :key="index">
        <el-card shadow="hover" class="card" @click="openLink(icon.url)">
          <button class="card-remove" title="删除" @click.stop="remove(icon)">×</button>
          <img :src="icon.img" class="card-img" />
          <div class="card-name">{{ icon.name }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 悬浮添加按钮（固定在右下角） -->
    <div class="floating-add" @click="addIcon" title="添加导航">
      <img :src="add" alt="添加" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import addIconVue from './addIcon.vue';
import { navigatorApi } from '@/api/navigatorApi'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userStore'

// 数据
const icons = ref([]);
const userStore = useUserStore()
const username = computed(() => userStore.getUsername())

// 打开链接
const openLink = (url) => {
  window.open(url, '_blank');
};

// 添加入口
const showAddIcon = ref(false);
const add = ref('/icon/add.png');
const addIcon = () => {
  showAddIcon.value = true;
};

// 获取导航数据
const getIcons = async () => {
  const response = await navigatorApi.getAllNavigators({ username: username.value })
  icons.value = response.data || [];
}

onMounted(() => {
  getIcons();
})

const onAdded = async () => {
  showAddIcon.value = false
  await getIcons()
  ElMessage.success('已添加导航')
}

const remove = async (icon) => {
  try {
    const res = await navigatorApi.removeNavigator({ ...icon, username: username.value })
    if (res.code === 200) {
      ElMessage.success('已删除')
      await getIcons()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    ElMessage.error('删除失败')
  }
}
</script>

<style scoped>
.navigator {
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
  overflow: auto;
}
.add-drawer :deep(.el-drawer__header) {
  background: linear-gradient(90deg, rgba(0, 245, 255, 0.25) 0%, rgba(255, 0, 204, 0.22) 100%);
  color: #dffbff;
  padding: 18px 22px;
  margin-bottom: 0;
  border-bottom: 1px solid rgba(0, 255, 255, 0.25);
}
.add-drawer :deep(.el-drawer__header .el-drawer__title) {
  font-size: 18px;
  font-weight: 700;
}
.add-drawer :deep(.el-drawer__body) {
  background:
    radial-gradient(900px 400px at -120px -120px, rgba(0, 245, 255, 0.12) 0%, rgba(0, 245, 255, 0) 60%),
    radial-gradient(600px 300px at 110% 0%, rgba(255, 0, 204, 0.10) 0%, rgba(255, 0, 204, 0) 60%),
    linear-gradient(180deg, #0a0f20 0%, #10162b 100%);
  padding: 20px;
}
.header {
  margin-bottom: 12px;
}
.title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #9ef7ff;
  text-shadow: 0 0 10px rgba(0, 245, 255, 0.35);
}
.subtitle {
  margin: 4px 0 0;
  color: #88a7bf;
  font-size: 12px;
}
.grid {
  margin-top: 8px;
}
.card {
  text-align: center;
  cursor: pointer;
  position: relative;
  border: 1px solid rgba(0, 255, 255, 0.18);
  background: rgba(9, 15, 34, 0.88);
}
.card-img {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  object-fit: cover;
}
.card-name {
  margin-top: 8px;
  font-size: 14px;
  color: #d6fbff;
}
.card-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 11px;
  background: rgba(255, 0, 204, 0.2);
  color: #ff92e7;
  font-size: 16px;
  line-height: 22px;
  cursor: pointer;
}
.floating-add {
  position: fixed;
  right: 32px;
  bottom: 32px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(180deg, #00f5ff 0%, #ff00cc 100%);
  box-shadow: 0 0 18px rgba(0, 245, 255, 0.38), 0 0 26px rgba(255, 0, 204, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
}
.floating-add img {
  width: 36px;
  height: 36px;
  filter: brightness(0) invert(1);
}
.floating-add:hover {
  transform: translateY(-1px);
  transition: transform 0.15s ease;
}
</style>
