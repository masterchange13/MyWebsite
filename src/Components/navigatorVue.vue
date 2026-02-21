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
  padding: 20px;
}
.add-drawer :deep(.el-drawer__header) {
  background: linear-gradient(90deg, #4f80ff 0%, #80c2ff 100%);
  color: #fff;
  padding: 18px 22px;
  margin-bottom: 0;
  border-bottom: 1px solid rgba(255,255,255,0.25);
}
.add-drawer :deep(.el-drawer__header .el-drawer__title) {
  font-size: 18px;
  font-weight: 700;
}
.add-drawer :deep(.el-drawer__body) {
  background:
    radial-gradient(900px 400px at -120px -120px, rgba(79, 160, 255, 0.12) 0%, rgba(79, 160, 255, 0) 60%),
    radial-gradient(600px 300px at 110% 0%, rgba(86, 220, 160, 0.10) 0%, rgba(86, 220, 160, 0) 60%),
    linear-gradient(180deg, #f6f9ff 0%, #eef5ff 100%);
  padding: 20px;
}
.header {
  margin-bottom: 12px;
}
.title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
.subtitle {
  margin: 4px 0 0;
  color: #888;
  font-size: 12px;
}
.grid {
  margin-top: 8px;
}
.card {
  text-align: center;
  cursor: pointer;
  position: relative;
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
}
.card-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 11px;
  background: #ffecec;
  color: #d9363e;
  font-size: 16px;
  line-height: 22px;
  cursor: pointer;
}
.floating-add {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.floating-add img {
  width: 28px;
  height: 28px;
}
.floating-add:hover {
  transform: translateY(-1px);
  transition: transform 0.15s ease;
}
</style>
