<template>
  <div class="app-launcher">
    <el-drawer v-model="showAddIcon" title="添加应用" size="640px" class="add-drawer">
      <addAppIcon v-if="showAddIcon" @added="onAdded" />
    </el-drawer>

    <el-dialog v-model="showEdit" title="编辑应用" width="520px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="Name" prop="name">
          <el-input v-model="editForm.name" placeholder="如：微信" />
        </el-form-item>
        <el-form-item label="Link" prop="link">
          <el-input v-model="editForm.link" placeholder="如：weixin:// 或 vscode://" />
        </el-form-item>
        <el-form-item label="Image" prop="img">
          <el-input v-model="editForm.img" placeholder="图标链接，可留空" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <div class="header">
      <h2 class="title">应用启动器</h2>
      <p class="subtitle">点击图标通过协议链接启动软件</p>
    </div>

    <el-collapse class="help-panel">
      <el-collapse-item title="常见软件 Link 填写参考" name="1">
        <div class="help-table">
          <div class="help-row help-head">
            <span>软件</span><span>Link（Linux）</span><span>Link（Windows）</span>
          </div>
          <div class="help-row"><span>微信</span><span>weixin://</span><span>weixin://</span></div>
          <div class="help-row"><span>Telegram</span><span>tg://</span><span>tg://</span></div>
          <div class="help-row"><span>QQ</span><span>tencent://</span><span>tencent://</span></div>
          <div class="help-row"><span>VS Code</span><span>vscode://</span><span>vscode://</span></div>
          <div class="help-row"><span>Steam</span><span>steam://</span><span>steam://</span></div>
          <div class="help-row"><span>Spotify</span><span>spotify://</span><span>spotify://</span></div>
          <div class="help-row"><span>Discord</span><span>discord://</span><span>discord://</span></div>
          <div class="help-row"><span>Slack</span><span>slack://</span><span>slack://</span></div>
          <div class="help-row"><span>Zoom</span><span>zoommtg://</span><span>zoommtg://</span></div>
          <div class="help-row"><span>Obsidian</span><span>obsidian://</span><span>obsidian://</span></div>
          <div class="help-row"><span>Notion</span><span>notion://</span><span>notion://</span></div>
          <div class="help-row"><span>Figma</span><span>figma://</span><span>figma://</span></div>
          <div class="help-row"><span>飞书</span><span>feishu://</span><span>feishu://</span></div>
          <div class="help-row"><span>钉钉</span><span>dingtalk://</span><span>dingtalk://</span></div>
          <div class="help-row"><span>Chrome</span><span>google-chrome</span><span>chrome://</span></div>
          <div class="help-row"><span>Edge</span><span>microsoft-edge</span><span>microsoft-edge://</span></div>
          <div class="help-row"><span>Firefox</span><span>firefox</span><span>firefox://</span></div>
          <div class="help-row"><span>VLC</span><span>vlc</span><span>vlc://</span></div>
          <div class="help-row"><span>Postman</span><span>postman://</span><span>postman://</span></div>
          <div class="help-row"><span>Jupyter</span><span>jupyter-lab</span><span>jupyter-lab</span></div>
          <div class="help-row"><span>GIMP</span><span>gimp</span><span>gimp</span></div>
          <div class="help-row"><span>Blender</span><span>blender</span><span>blender</span></div>
          <div class="help-row"><span>文件管理器</span><span>nautilus / dolphin</span><span>explorer</span></div>
          <div class="help-row"><span>终端 / CMD</span><span>gnome-terminal / konsole</span><span>cmd</span></div>
          <div class="help-row"><span>计算器</span><span>gnome-calculator</span><span>calc</span></div>
          <div class="help-row"><span>记事本</span><span>gedit</span><span>notepad</span></div>
          <div class="help-row"><span>截图工具</span><span>flameshot / spectacle</span><span>snippingtool</span></div>
          <div class="help-row"><span>WPS</span><span>wps</span><span>wps</span></div>
          <div class="help-row"><span>网易云音乐</span><span>netease-cloud-music</span><span>cloudmusic</span></div>
        </div>
        <p class="help-tip">💡 含 :// 的 Link 用浏览器协议处理器直接打开；纯命令则走后端执行。Windows 上的协议名通常和 Linux 相同。如果不确定，可以终端先试试命令能不能启动，或者网上搜 "[软件名] url scheme"。</p>
      </el-collapse-item>
    </el-collapse>

    <div class="order-toolbar">
      <span class="toolbar-label">拖拽模式</span>
      <el-radio-group v-model="dragMode" size="small">
        <el-radio-button label="insert">插入</el-radio-button>
        <el-radio-button label="swap">交换</el-radio-button>
      </el-radio-group>
    </div>

    <el-row :gutter="16" class="grid">
      <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="(app, index) in apps" :key="app.id">
        <div
          class="drag-wrap"
          :class="{ 'drag-over': dragOverIndex === index }"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragenter="onDragEnter(index)"
          @dragover.prevent="onDragOver(index)"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop(index)"
          @dragend="onDragEnd"
        >
          <el-card shadow="hover" class="card" @click="openApp(app)">
            <button class="card-edit" title="编辑" @click.stop="openEdit(app)">✎</button>
            <button class="card-remove" title="删除" @click.stop="remove(app)">×</button>
            <img :src="displayImg(app)" class="card-img" />
            <div class="card-name">{{ app.name }}</div>
          </el-card>
        </div>
      </el-col>
    </el-row>

    <div class="floating-add" @click="addApp" title="添加应用">
      <img :src="add" alt="添加" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import addAppIcon from './addAppIcon.vue';
import { appLauncherApi } from '@/api/appLauncherApi'
import { ElMessage } from 'element-plus'

const apps = ref([])
const dragMode = ref('insert')

const openApp = (app) => {
  if (app.link) {
    // 浏览器原生方式：通过协议链接（如 weixin:// vscode://）打开桌面软件
    // 如果协议链接无法打开，尝试用后端执行命令作为备选
    const protocolMatch = app.link.match(/^(\w+):\/\//)
    if (protocolMatch) {
      // 看起来像协议链接，用浏览器打开
      window.open(app.link, '_blank')
      ElMessage.success(`正在打开: ${app.name}`)
    } else {
      // 没有协议前缀，尝试作为命令通过后端执行
      launchViaBackend(app)
    }
  }
}

const launchViaBackend = async (app) => {
  try {
    const res = await appLauncherApi.launchApp({ id: app.id })
    if (res.code === 200) {
      ElMessage.success(`已启动: ${app.name}`)
    } else {
      ElMessage.error(res.msg || '启动失败')
    }
  } catch (e) {
    ElMessage.error('启动失败')
  }
}

const displayImg = (app) => {
  if (app?.img) return app.img
  const seed = encodeURIComponent(app?.name || 'app')
  return `https://picsum.photos/seed/${seed}/128/128`
}

const showAddIcon = ref(false)
const add = ref('/icon/add.png')
const addApp = () => {
  showAddIcon.value = true
}

const getApps = async () => {
  const response = await appLauncherApi.getAllAppLaunchers()
  apps.value = response.data || []
}

onMounted(() => {
  getApps()
})

const onAdded = async () => {
  showAddIcon.value = false
  await getApps()
  ElMessage.success('已添加应用')
}

const remove = async (app) => {
  try {
    const res = await appLauncherApi.removeAppLauncher({ ...app })
    if (res.code === 200) {
      ElMessage.success('已删除')
      await getApps()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const showEdit = ref(false)
const editForm = ref({
  id: null,
  name: '',
  link: '',
  img: '',
})

const openEdit = (app) => {
  editForm.value = {
    id: app.id,
    name: app.name || '',
    link: app.link || '',
    img: app.img || '',
  }
  showEdit.value = true
}

const saveEdit = async () => {
  try {
    const payload = { ...editForm.value }
    const res = await appLauncherApi.updateAppLauncher(payload)
    if (res.code === 200) {
      ElMessage.success('已保存')
      showEdit.value = false
      await getApps()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const dragFromIndex = ref(null)
const dragOverIndex = ref(null)
const dragFromId = ref(null)
const dropTargetId = ref(null)
const pendingAction = ref(null)
const dragEnterCounter = ref(0)

const resetDragState = () => {
  dragFromIndex.value = null
  dragOverIndex.value = null
  dragFromId.value = null
  dropTargetId.value = null
  pendingAction.value = null
  dragEnterCounter.value = 0
}

const onDragStart = (index) => {
  dragFromIndex.value = index
  dragFromId.value = apps.value[index]?.id ?? null
  pendingAction.value = null
}

const onDragEnter = (index) => {
  dragEnterCounter.value++
  dragOverIndex.value = index
}

const onDragOver = (index) => {
  dragOverIndex.value = index
}

const onDragLeave = () => {
  dragEnterCounter.value--
  if (dragEnterCounter.value <= 0) {
    dragEnterCounter.value = 0
    dragOverIndex.value = null
  }
}

const onDrop = (toIndex) => {
  const fromIndex = dragFromIndex.value
  if (fromIndex === null || fromIndex === undefined) return
  if (toIndex === fromIndex) return

  const fromApp = apps.value[fromIndex]
  const toApp = apps.value[toIndex]
  if (!fromApp || !toApp) return

  if (dragMode.value === 'swap') {
    const draggedItem = fromApp
    apps.value.splice(fromIndex, 1, toApp)
    apps.value.splice(toIndex, 1, draggedItem)
    pendingAction.value = 'swap'
    dragFromId.value = draggedItem.id
    dropTargetId.value = toApp.id
  } else {
    const [draggedItem] = apps.value.splice(fromIndex, 1)
    apps.value.splice(toIndex, 0, draggedItem)
    pendingAction.value = 'insert'
    dragFromId.value = draggedItem.id
    dropTargetId.value = draggedItem.id
    dragFromIndex.value = toIndex
  }

  dragEnterCounter.value = 0
  dragOverIndex.value = null
}

const onDragEnd = async () => {
  if (!pendingAction.value) {
    resetDragState()
    return
  }

  try {
    let res
    if (pendingAction.value === 'swap') {
      res = await appLauncherApi.swapAppLauncherOrder({
        source_id: dragFromId.value,
        target_id: dropTargetId.value,
      })
    } else {
      const targetIndex = apps.value.findIndex(item => item.id === dragFromId.value)
      res = await appLauncherApi.insertAppLauncherOrder({
        id: dragFromId.value,
        target_index: targetIndex,
      })
    }

    if (res.code === 200) {
      ElMessage.success(dragMode.value === 'swap' ? '已交换顺序' : '已插入排序')
    } else {
      ElMessage.error(res.msg || '更新顺序失败')
      await getApps()
    }
  } catch (e) {
    ElMessage.error('更新顺序失败')
    await getApps()
  } finally {
    resetDragState()
  }
}
</script>

<style scoped>
.app-launcher {
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
.help-panel {
  margin-top: 16px;
  border: 1px solid rgba(0, 255, 255, 0.18);
  border-radius: 10px;
  background: rgba(9, 15, 34, 0.7);
  overflow: hidden;
}
.help-panel :deep(.el-collapse-item__header) {
  padding: 10px 16px;
  color: #9ef7ff;
  background: rgba(0, 245, 255, 0.06);
  border: none;
  font-size: 13px;
  font-weight: 600;
}
.help-panel :deep(.el-collapse-item__wrap) {
  background: transparent;
  border: none;
}
.help-panel :deep(.el-collapse-item__content) {
  padding: 12px 16px;
}
.help-table {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.help-row {
  display: grid;
  grid-template-columns: 1fr 2fr 2fr;
  gap: 12px;
  padding: 5px 8px;
  font-size: 12px;
  border-radius: 4px;
  color: #b8d4df;
}
.help-row:nth-child(even) {
  background: rgba(0, 245, 255, 0.04);
}
.help-head {
  color: #9ef7ff;
  font-weight: 700;
  font-size: 12px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.16);
  margin-bottom: 4px;
  padding-bottom: 6px;
}
.help-row span:nth-child(2) {
  font-family: monospace;
  color: #65d5dc;
}
.help-tip {
  margin: 10px 0 0;
  color: #88a7bf;
  font-size: 12px;
}
.order-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0 16px;
}
.toolbar-label {
  color: #88a7bf;
  font-size: 13px;
}
.grid {
  margin-top: 8px;
}
.drag-wrap {
  width: 100%;
}
.drag-wrap.drag-over .card {
  outline: 2px dashed rgba(0, 245, 255, 0.65);
  outline-offset: 2px;
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
.card-edit {
  position: absolute;
  top: 6px;
  right: 32px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 11px;
  background: rgba(0, 245, 255, 0.16);
  color: #9ef7ff;
  font-size: 14px;
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

@media (max-width: 768px) {
  .app-launcher {
    padding: 10px;
  }
  .title {
    font-size: 18px;
  }
  .card-img {
    width: 48px;
    height: 48px;
  }
  .card-name {
    font-size: 12px;
  }
  .card-remove {
    width: 24px;
    height: 24px;
    font-size: 18px;
    top: 4px;
    right: 4px;
  }
  .card-edit {
    width: 24px;
    height: 24px;
    font-size: 16px;
    top: 4px;
    right: 30px;
  }
  .floating-add {
    right: 16px;
    bottom: 24px;
    width: 52px;
    height: 52px;
  }
  .floating-add img {
    width: 28px;
    height: 28px;
  }
  .order-toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }
  .help-panel :deep(.el-collapse-item__header) {
    font-size: 12px;
    padding: 8px 12px;
  }
  .help-row {
    font-size: 10px;
    gap: 6px;
    padding: 4px 4px;
    grid-template-columns: 0.8fr 1.6fr 1.6fr;
  }
}
</style>
