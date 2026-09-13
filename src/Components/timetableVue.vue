<template>
  <div class="tt-page">
    <!-- 顶部：标题 + 操作 -->
    <div class="tt-header">
      <div class="tt-heading">
        <h2 class="tt-title">学生课表</h2>
        <p class="tt-subtitle">自行填写上课时间与地点 · 支持周次</p>
      </div>
      <div class="tt-actions">
        <el-select v-model="currentWeekFilter" size="small" class="tt-week-filter" placeholder="周次筛选">
          <el-option :value="0" label="全部周次" />
          <el-option v-for="w in 25" :key="w" :value="w" :label="`第 ${w} 周`" />
        </el-select>
        <el-button size="small" @click="openConfigDialog">节次设置</el-button>
        <el-button type="primary" size="small" @click="openAdd(0, 0)">添加课程</el-button>
      </div>
    </div>

    <!-- 加载态 -->
    <div v-if="loading" class="tt-state">
      <div class="tt-state-icon">⏳</div>
      <p>加载中...</p>
    </div>

    <!-- 未登录 -->
    <div v-else-if="authError" class="tt-state">
      <div class="tt-state-icon">🔒</div>
      <p>请先登录后使用课表</p>
    </div>

    <!-- 空态 -->
    <div v-else-if="entries.length === 0" class="tt-state">
      <div class="tt-state-icon">📭</div>
      <p>暂无课程</p>
      <el-button type="primary" size="small" @click="openAdd(0, 0)">添加第一门课</el-button>
    </div>

    <!-- 课表网格 -->
    <div v-else class="tt-grid-scroll">
      <div class="tt-grid" :style="{ '--period-count': config.total }">
        <!-- 左上角 -->
        <div class="tt-corner">节次</div>
        <!-- 星期表头 -->
        <div
          v-for="(d, i) in DAYS"
          :key="d"
          class="tt-day-head"
          :style="{ gridColumn: i + 2, gridRow: 1 }"
        >{{ d }}</div>
        <!-- 节次标签 -->
        <div
          v-for="p in config.total"
          :key="p"
          class="tt-period-label"
          :style="{ gridColumn: 1, gridRow: p + 1 }"
        >
          <span class="tt-period-n">第{{ p }}节</span>
          <span class="tt-period-t">{{ periodTime(p) }}</span>
        </div>
        <!-- 背景点击格（点击添加该时段课程） -->
        <div
          v-for="cell in bgCells"
          :key="cell.key"
          class="tt-cell"
          :style="{ gridColumn: cell.day + 1, gridRow: `${cell.period + 1} / ${cell.period + 2}` }"
          @click="openAdd(cell.day, cell.period)"
        ></div>
        <!-- 课程块（最后渲染，覆盖在背景格上） -->
        <div
          v-for="e in visibleEntries"
          :key="e.id"
          class="course-block"
          :class="{ dimmed: isDimmed(e) }"
          :style="blockStyle(e)"
          @click.stop="openEdit(e)"
        >
          <div class="course-name">{{ e.name }}</div>
          <div class="course-loc">📍 {{ e.location }}</div>
          <div v-if="e.teacher" class="course-teacher">👤 {{ e.teacher }}</div>
          <div class="week-badge">{{ weekBadge(e) }}</div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑课程对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑课程' : '添加课程'" width="520px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="课程名称" required>
          <el-input v-model="editForm.name" placeholder="如：高等数学" maxlength="120" />
        </el-form-item>
        <el-form-item label="教师">
          <el-input v-model="editForm.teacher" placeholder="选填" maxlength="120" />
        </el-form-item>
        <el-form-item label="上课地点" required>
          <el-input v-model="editForm.location" placeholder="如：教学楼A-101" maxlength="120" />
        </el-form-item>
        <el-form-item label="星期">
          <el-select v-model="editForm.day_of_week">
            <el-option v-for="(d, i) in DAYS" :key="d" :value="i + 1" :label="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="节次">
          <div class="range-row">
            <el-input-number v-model="editForm.start_period" :min="1" :max="config.total" size="small" />
            <span class="range-sep">至</span>
            <el-input-number v-model="editForm.end_period" :min="1" :max="config.total" size="small" />
            <span class="range-hint">第 {{ editForm.start_period }}~{{ editForm.end_period }} 节</span>
          </div>
        </el-form-item>
        <el-form-item label="周次">
          <div class="range-row">
            <el-input-number v-model="editForm.week_start" :min="1" :max="25" size="small" />
            <span class="range-sep">至</span>
            <el-input-number v-model="editForm.week_end" :min="1" :max="25" size="small" />
            <span class="range-hint">周</span>
          </div>
        </el-form-item>
        <el-form-item label="单双周">
          <el-radio-group v-model="editForm.week_type">
            <el-radio value="all">每周</el-radio>
            <el-radio value="odd">单周</el-radio>
            <el-radio value="even">双周</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="颜色">
          <div class="color-row">
            <button
              v-for="c in PALETTE"
              :key="c"
              type="button"
              class="color-swatch"
              :class="{ active: editForm.color === c }"
              :style="{ background: c }"
              @click="editForm.color = c"
            ></button>
            <input v-model="editForm.color" type="color" class="color-input" title="自定义颜色" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="isEdit" type="danger" link @click="removeEntry()">删除课程</el-button>
          <span class="footer-spacer"></span>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEntry">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 节次设置对话框 -->
    <el-dialog v-model="configDialogVisible" title="节次设置" width="520px">
      <p class="config-hint">配置每天的节次与上课时间（1~20 节）</p>
      <div class="config-list">
        <div v-for="(p, i) in configDraft" :key="i" class="config-row">
          <span class="config-n">第{{ i + 1 }}节</span>
          <el-time-picker v-model="p.start" format="HH:mm" value-format="HH:mm" size="small" placeholder="开始时间" />
          <span class="range-sep">-</span>
          <el-time-picker v-model="p.end" format="HH:mm" value-format="HH:mm" size="small" placeholder="结束时间" />
          <el-button link type="danger" :disabled="configDraft.length <= 1" @click="removePeriodRow(i)">删除</el-button>
        </div>
      </div>
      <div class="config-actions">
        <el-button size="small" :disabled="configDraft.length >= 20" @click="addPeriodRow">+ 添加节次</el-button>
      </div>
      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { timetableApi } from '@/api/timetableApi'

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const PALETTE = ['#00f5ff', '#ff00cc', '#40ce8f', '#ffb020', '#7c6cff', '#ff6b6b', '#4da3ff', '#f7a1c4']

const DEFAULT_EDIT_FORM = () => ({
  id: null,
  name: '',
  teacher: '',
  location: '',
  day_of_week: 1,
  start_period: 1,
  end_period: 1,
  week_start: 1,
  week_end: 16,
  week_type: 'all',
  color: PALETTE[0],
})

const entries = ref([])
const config = ref({ periods: [], total: 0 })
const loading = ref(true)
const authError = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editForm = reactive(DEFAULT_EDIT_FORM())
const currentWeekFilter = ref(0)
const configDialogVisible = ref(false)
const configDraft = ref([])

/* ---------- 数据加载 ---------- */
const loadData = async () => {
  loading.value = true
  authError.value = false
  try {
    const [listRes, configRes] = await Promise.all([timetableApi.getList(), timetableApi.getConfig()])
    if (listRes.code === 200) {
      entries.value = listRes.data || []
    } else {
      ElMessage.error(listRes.message || '加载失败')
    }
    if (configRes.code === 200) {
      config.value = { periods: configRes.data.periods || [], total: configRes.data.total || 0 }
    }
  } catch (err) {
    // 401 由 request 拦截器统一 toast，这里只标记空态
    if (err?.response?.status === 401) authError.value = true
    else console.log(err)
  } finally {
    loading.value = false
  }
}

/* ---------- 网格辅助 ---------- */
const bgCells = computed(() => {
  const cells = []
  for (let day = 1; day <= 7; day++) {
    for (let p = 1; p <= config.value.total; p++) {
      cells.push({ key: `${day}-${p}`, day, period: p })
    }
  }
  return cells
})

// 节数调小后越界的课程不渲染（数据保留）
const visibleEntries = computed(() => entries.value.filter(e => e.start_period <= config.value.total))

// 贪心 lane 分配：同一天时间重叠的课程并排
const laneInfo = computed(() => {
  const info = {}
  const byDay = {}
  for (const e of visibleEntries.value) {
    (byDay[e.day_of_week] = byDay[e.day_of_week] || []).push(e)
  }
  Object.values(byDay).forEach(list => {
    const sorted = [...list].sort((a, b) => a.start_period - b.start_period || a.id - b.id)
    const laneEnds = []
    const laneOf = {}
    for (const e of sorted) {
      let lane = laneEnds.findIndex(end => end < e.start_period)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(e.end_period)
      } else {
        laneEnds[lane] = e.end_period
      }
      laneOf[e.id] = lane
    }
    for (const e of sorted) info[e.id] = { lane: laneOf[e.id], lanes: laneEnds.length }
  })
  return info
})

const blockStyle = (e) => {
  const li = laneInfo.value[e.id] || { lane: 0, lanes: 1 }
  return {
    gridColumn: e.day_of_week + 1,
    gridRow: `${e.start_period + 1} / ${e.end_period + 2}`,
    '--course-color': e.color || PALETTE[0],
    '--lane': li.lane,
    '--lanes': li.lanes,
  }
}

const periodTime = (n) => {
  const p = config.value.periods.find(x => Number(x.n) === n)
  return p ? `${p.start}-${p.end}` : ''
}

const weekBadge = (e) => {
  const range = e.week_start === e.week_end ? `${e.week_start}周` : `${e.week_start}-${e.week_end}周`
  const suffix = e.week_type === 'odd' ? '·单周' : e.week_type === 'even' ? '·双周' : ''
  return range + suffix
}

const matchesWeek = (e, w) => {
  if (w < e.week_start || w > e.week_end) return false
  if (e.week_type === 'odd') return w % 2 === 1
  if (e.week_type === 'even') return w % 2 === 0
  return true
}

const isDimmed = (e) => currentWeekFilter.value > 0 && !matchesWeek(e, currentWeekFilter.value)

/* ---------- 添加/编辑 ---------- */
const openAdd = (day = 0, period = 0) => {
  isEdit.value = false
  Object.assign(editForm, DEFAULT_EDIT_FORM())
  if (day) editForm.day_of_week = day
  if (period) {
    editForm.start_period = period
    editForm.end_period = period
  }
  dialogVisible.value = true
}

const openEdit = (e) => {
  isEdit.value = true
  Object.assign(editForm, {
    id: e.id,
    name: e.name,
    teacher: e.teacher || '',
    location: e.location,
    day_of_week: e.day_of_week,
    start_period: e.start_period,
    end_period: e.end_period,
    week_start: e.week_start,
    week_end: e.week_end,
    week_type: e.week_type,
    color: e.color || PALETTE[0],
  })
  dialogVisible.value = true
}

const saveEntry = async () => {
  if (!editForm.name.trim()) return ElMessage.warning('请输入课程名称')
  if (!editForm.location.trim()) return ElMessage.warning('请输入上课地点')
  if (editForm.end_period < editForm.start_period) return ElMessage.warning('结束节次不能小于开始节次')
  if (editForm.week_end < editForm.week_start) return ElMessage.warning('结束周不能小于起始周')

  const payload = { ...editForm, name: editForm.name.trim(), location: editForm.location.trim() }
  const api = isEdit.value ? timetableApi.updateEntry : timetableApi.addEntry
  try {
    const res = await api(payload)
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '课程已更新' : '课程已添加')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (err) {
    console.log(err)
  }
}

const removeEntry = async () => {
  if (!editForm.id) return
  try {
    await ElMessageBox.confirm('确定删除该课程吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    const res = await timetableApi.removeEntry({ id: editForm.id })
    if (res.code === 200) {
      ElMessage.success('课程已删除')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (err) {
    console.log(err)
  }
}

/* ---------- 节次配置 ---------- */
const openConfigDialog = () => {
  configDraft.value = config.value.periods.map(p => ({ start: p.start || '08:00', end: p.end || '08:45' }))
  configDialogVisible.value = true
}

const addPeriodRow = () => configDraft.value.push({ start: '08:00', end: '08:45' })

const removePeriodRow = (i) => configDraft.value.splice(i, 1)

const saveConfig = async () => {
  for (const p of configDraft.value) {
    if (!p.start || !p.end) return ElMessage.warning('请补全每节的开始与结束时间')
  }
  const periods = configDraft.value.map((p, i) => ({ n: i + 1, start: p.start, end: p.end }))
  try {
    const res = await timetableApi.saveConfig({ periods })
    if (res.code === 200) {
      ElMessage.success('节次设置已保存')
      const overflow = entries.value.filter(e => e.end_period > res.data.total).length
      if (overflow > 0) {
        ElMessage.warning(`${overflow} 门课程超出节次数，将被隐藏（数据仍保留）`)
      }
      configDialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (err) {
    console.log(err)
  }
}

onMounted(loadData)
</script>

<style scoped>
.tt-page {
  height: 100%;
  padding: var(--app-page-padding);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  background:
    radial-gradient(900px 400px at -160px -120px, rgba(0, 245, 255, 0.05) 0%, transparent 60%),
    radial-gradient(700px 360px at 115% -10%, rgba(255, 0, 204, 0.04) 0%, transparent 60%),
    linear-gradient(180deg, #080b1a 0%, #0c1026 100%);
}

/* ── 头部 ── */
.tt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.tt-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--app-text-strong);
}
.tt-subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--app-text-muted);
}
.tt-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.tt-week-filter {
  width: 130px;
}

/* ── 网格 ── */
.tt-grid-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.tt-grid {
  display: grid;
  min-width: 640px;
  grid-template-columns: 70px repeat(7, minmax(0, 1fr));
  grid-template-rows: 44px repeat(var(--period-count), 56px);
  background: var(--app-surface);
  border: 1px solid var(--cyber-border);
  border-radius: var(--app-radius-md);
  overflow: hidden;
}
.tt-corner {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-muted);
  background: var(--app-surface-strong);
  border-right: 1px solid var(--cyber-border);
  border-bottom: 1px solid var(--cyber-border);
}
.tt-day-head {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--app-text-main);
  background: var(--app-surface-strong);
  border-bottom: 1px solid var(--cyber-border);
}
.tt-period-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: var(--app-surface-strong);
  border-right: 1px solid var(--cyber-border);
  border-bottom: 1px solid var(--cyber-border);
}
.tt-period-n {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-main);
}
.tt-period-t {
  font-size: 10px;
  color: var(--app-text-muted);
}
.tt-cell {
  border-right: 1px solid rgba(0, 255, 255, 0.06);
  border-bottom: 1px solid rgba(0, 255, 255, 0.06);
  cursor: pointer;
  transition: background 0.15s ease;
}
.tt-cell:hover {
  background: var(--app-accent-soft);
}

/* ── 课程块 ── */
.course-block {
  z-index: 2;
  width: calc((100% - 8px) / var(--lanes));
  margin-left: calc(2px + var(--lane) * (100% - 8px) / var(--lanes));
  margin-top: 2px;
  margin-bottom: 2px;
  padding: 4px 6px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: color-mix(in srgb, var(--course-color) 22%, transparent);
  border-left: 3px solid var(--course-color);
  border-radius: var(--app-radius-sm);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.2s ease;
}
.course-block:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.course-block.dimmed {
  opacity: 0.4;
}
.course-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.course-loc,
.course-teacher {
  font-size: 11px;
  color: var(--app-text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.week-badge {
  margin-top: 2px;
  align-self: flex-start;
  font-size: 10px;
  padding: 0 6px;
  border-radius: 999px;
  color: var(--course-color);
  background: color-mix(in srgb, var(--course-color) 14%, transparent);
  white-space: nowrap;
}

/* ── 空态 / 加载态 ── */
.tt-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--app-text-muted);
}
.tt-state-icon {
  font-size: 44px;
}
.tt-state p {
  margin: 0;
  font-size: 15px;
}

/* ── 对话框 ── */
.range-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.range-sep {
  color: var(--app-text-muted);
  font-size: 13px;
}
.range-hint {
  margin-left: 4px;
  font-size: 12px;
  color: var(--app-text-muted);
}
.color-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.color-swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: transform 0.15s ease, border-color 0.15s ease;
}
.color-swatch:hover {
  transform: scale(1.15);
}
.color-swatch.active {
  border-color: var(--app-text-strong);
}
.color-input {
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}
.dialog-footer {
  display: flex;
  align-items: center;
  width: 100%;
}
.footer-spacer {
  flex: 1;
}
.config-hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--app-text-muted);
}
.config-list {
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.config-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.config-n {
  width: 52px;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-main);
}
.config-row .el-time-picker {
  width: 120px;
}
.config-actions {
  margin-top: 12px;
}

/* ── 移动端 ── */
@media (max-width: 768px) {
  .tt-page {
    padding: 10px;
    gap: 10px;
  }
  .tt-title {
    font-size: 18px;
  }
  .tt-grid {
    grid-template-columns: 56px repeat(7, minmax(0, 1fr));
  }
  .course-block {
    padding: 3px 4px;
    font-size: 11px;
  }
  .course-name {
    font-size: 12px;
  }
  .course-loc,
  .course-teacher {
    font-size: 10px;
  }
  .week-badge {
    font-size: 9px;
  }
}
@media (max-width: 480px) {
  .tt-grid {
    min-width: 560px;
  }
}
</style>
