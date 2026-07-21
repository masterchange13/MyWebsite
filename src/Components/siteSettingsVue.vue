<template>
  <div class="site-settings-page">
    <section class="hero">
      <div>
        <div class="eyebrow">Website Config</div>
        <h1>网站基本配置</h1>
        <p>统一登录页和主界面的视觉风格，并调整顶部功能顺序。</p>
        <div class="save-status">{{ saveStatus }}</div>
      </div>
      <el-button type="primary" @click="resetDefaults">恢复默认</el-button>
    </section>

    <div class="settings-grid">
      <el-card class="settings-card" shadow="always">
        <template #header>
          <div class="card-title">基础信息</div>
        </template>
        <el-form label-width="110px" class="settings-form">
          <el-form-item label="网站标题">
            <el-input v-model="websiteSettings.siteTitle" placeholder="显示在主界面顶部" />
          </el-form-item>
          <el-form-item label="登录标题">
            <el-input v-model="websiteSettings.loginTitle" placeholder="显示在登录页左侧" />
          </el-form-item>
          <el-form-item label="登录副标题">
            <el-input v-model="websiteSettings.loginSlogan" placeholder="显示在登录页左侧说明区域" />
          </el-form-item>
          <el-form-item label="背景动效">
            <el-switch v-model="websiteSettings.showPetals" />
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="settings-card" shadow="always">
        <template #header>
          <div class="card-title">主题</div>
        </template>
        <div class="theme-list">
          <button
            v-for="theme in themeOptions"
            :key="theme.id"
            type="button"
            class="theme-card"
            :class="{ active: websiteSettings.theme === theme.id }"
            @click="websiteSettings.setTheme(theme.id)"
          >
            <div class="theme-swatches">
              <span v-for="color in theme.preview" :key="color" :style="{ background: color }"></span>
            </div>
            <div class="theme-name">{{ theme.name }}</div>
            <div class="theme-desc">{{ theme.description }}</div>
          </button>
        </div>
      </el-card>

      <el-card class="settings-card nav-card" shadow="always">
        <template #header>
          <div class="card-title">顶部功能顺序</div>
        </template>
        <div class="sort-list">
          <div v-for="(item, index) in orderedTopLevelItems" :key="item.id" class="sort-row">
            <div>
              <div class="sort-label">{{ item.label }}</div>
              <div class="sort-sub">{{ item.type === 'submenu' ? '一级菜单' : '直接入口' }}</div>
            </div>
            <div class="sort-actions">
              <el-button circle size="small" :disabled="index === 0" @click="websiteSettings.moveTopLevelItem(index, 'up')">
                <el-icon><ArrowUp /></el-icon>
              </el-button>
              <el-button circle size="small" :disabled="index === orderedTopLevelItems.length - 1" @click="websiteSettings.moveTopLevelItem(index, 'down')">
                <el-icon><ArrowDown /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="settings-card nav-card" shadow="always">
        <template #header>
          <div class="card-title">Media Hub 顺序</div>
        </template>
        <div class="sort-list">
          <div v-for="(item, index) in orderedMediaItems" :key="item.id" class="sort-row">
            <div>
              <div class="sort-label">{{ item.label }}</div>
              <div class="sort-sub">{{ item.path }}</div>
            </div>
            <div class="sort-actions">
              <el-button circle size="small" :disabled="index === 0" @click="websiteSettings.moveSubmenuItem('media', index, 'up')">
                <el-icon><ArrowUp /></el-icon>
              </el-button>
              <el-button circle size="small" :disabled="index === orderedMediaItems.length - 1" @click="websiteSettings.moveSubmenuItem('media', index, 'down')">
                <el-icon><ArrowDown /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="settings-card nav-card" shadow="always">
        <template #header>
          <div class="card-title">Tools 顺序</div>
        </template>
        <div class="sort-list">
          <div v-for="(item, index) in orderedToolItems" :key="item.id" class="sort-row">
            <div>
              <div class="sort-label">{{ item.label }}</div>
              <div class="sort-sub">{{ item.path }}</div>
            </div>
            <div class="sort-actions">
              <el-button circle size="small" :disabled="index === 0" @click="websiteSettings.moveSubmenuItem('tools', index, 'up')">
                <el-icon><ArrowUp /></el-icon>
              </el-button>
              <el-button circle size="small" :disabled="index === orderedToolItems.length - 1" @click="websiteSettings.moveSubmenuItem('tools', index, 'down')">
                <el-icon><ArrowDown /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useWebsiteSettingsStore } from '@/stores/websiteSettingsStore'
import {
  getOrderedSubmenuItems,
  getOrderedTopLevelMenu,
  themeOptions
} from '@/utils/siteSettings'

const websiteSettings = useWebsiteSettingsStore()
const saveTimer = ref(null)
const saveStatus = ref('已从数据库加载配置')
const suspendAutoSave = ref(false)

const orderedTopLevelItems = computed(() =>
  getOrderedTopLevelMenu(websiteSettings.topLevelOrder, websiteSettings.submenuOrders).map(({ items, ...rest }) => rest)
)
const orderedMediaItems = computed(() => getOrderedSubmenuItems('media', websiteSettings.submenuOrders.media))
const orderedToolItems = computed(() => getOrderedSubmenuItems('tools', websiteSettings.submenuOrders.tools))
const settingsSignature = computed(() => JSON.stringify({
  siteTitle: websiteSettings.siteTitle,
  loginTitle: websiteSettings.loginTitle,
  loginSlogan: websiteSettings.loginSlogan,
  theme: websiteSettings.theme,
  showPetals: websiteSettings.showPetals,
  topLevelOrder: websiteSettings.topLevelOrder,
  submenuOrders: websiteSettings.submenuOrders
}))

const persistSettings = async () => {
  saveStatus.value = '正在保存到数据库...'
  suspendAutoSave.value = true
  try {
    const res = await websiteSettings.saveSettings()
    if (res?.code === 200) {
      saveStatus.value = '已保存到数据库'
      return
    }
    saveStatus.value = '保存失败'
  } catch (_error) {
    saveStatus.value = '保存失败'
    ElMessage.error('网站配置保存失败')
  } finally {
    suspendAutoSave.value = false
  }
}

const scheduleSave = () => {
  if (saveTimer.value) clearTimeout(saveTimer.value)
  saveStatus.value = '等待保存...'
  saveTimer.value = setTimeout(() => {
    persistSettings()
  }, 500)
}

watch(
  settingsSignature,
  () => {
    if (!websiteSettings.loaded || suspendAutoSave.value || websiteSettings.saving) return
    scheduleSave()
  }
)

const resetDefaults = async () => {
  suspendAutoSave.value = true
  websiteSettings.resetDefaults()
  await persistSettings()
}

onBeforeUnmount(() => {
  if (saveTimer.value) clearTimeout(saveTimer.value)
})
</script>

<style scoped>
.site-settings-page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  padding: 24px 28px;
  border: 1px solid var(--cyber-border);
  border-radius: 22px;
  background:
    linear-gradient(135deg, var(--app-surface-soft) 0%, transparent 55%),
    linear-gradient(160deg, var(--app-surface-strong) 0%, var(--app-surface) 100%);
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--app-accent-strong);
  margin-bottom: 8px;
}

.hero h1 {
  margin: 0;
  font-size: 34px;
  color: var(--app-text-strong);
}

.hero p {
  margin: 8px 0 0;
  color: var(--app-text-soft);
}

.save-status {
  margin-top: 10px;
  font-size: 13px;
  color: var(--app-text-muted);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.settings-card {
  min-height: 100%;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--app-text-strong);
}

.settings-form :deep(.el-form-item__label) {
  color: var(--app-text-muted);
}

.theme-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.theme-card {
  width: 100%;
  border: 1px solid var(--cyber-border);
  border-radius: 18px;
  padding: 16px;
  background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-strong) 100%);
  color: var(--app-text-main);
  text-align: left;
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}

.theme-card:hover,
.theme-card.active {
  transform: translateY(-2px);
  border-color: var(--app-accent);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
}

.theme-swatches {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.theme-swatches span {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.theme-name {
  font-size: 16px;
  font-weight: 700;
}

.theme-desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--app-text-soft);
  line-height: 1.6;
}

.nav-card {
  align-self: start;
}

.sort-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sort-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--cyber-border);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-strong) 100%);
}

.sort-label {
  font-size: 15px;
  font-weight: 700;
  color: var(--app-text-strong);
}

.sort-sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--app-text-soft);
}

.sort-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 1100px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .theme-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .site-settings-page {
    padding: 16px;
  }

  .hero {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
