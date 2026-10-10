<template>
  <div class="sm-page">
    <!-- 顶部 -->
    <div class="sm-header">
      <div class="sm-heading">
        <h2 class="sm-title">系统监控</h2>
        <p class="sm-subtitle" v-if="status.hostname">{{ status.hostname }} · {{ platformLabel }} · {{ status.platform_info.machine }}</p>
        <p class="sm-subtitle" v-if="lastUpdate">{{ status.platform_info.mode === 'auto' ? '自动识别服务器平台' : '使用部署时的平台设置' }}<template v-if="status.platform_info.model"> · {{ status.platform_info.model }}</template></p>
      </div>
      <div class="sm-refresh">
        <span class="sm-dot" :class="{ live: !!lastUpdate && !authError && !errorMessage }"></span>
        <span>{{ lastUpdateText }}</span>
        <span v-if="!authError">· 每 5 秒自动刷新</span>
        <el-button size="small" :loading="inFlight" @click="loadStatus">刷新</el-button>
      </div>
    </div>

    <!-- 未登录 -->
    <div v-if="authError" class="sm-state">
      <div class="sm-state-icon">🔒</div>
      <p>请先登录后使用系统监控</p>
    </div>

    <!-- 加载中 -->
    <div v-else-if="loading" class="sm-state">
      <div class="sm-state-icon">⏳</div>
      <p>加载中...</p>
    </div>

    <div v-else-if="errorMessage && !lastUpdate" class="sm-state" role="alert">
      <div class="sm-state-icon">⚠️</div>
      <p>{{ errorMessage }}</p>
      <el-button @click="loadStatus" :loading="inFlight">重试</el-button>
    </div>

    <!-- 内容 -->
    <div v-else class="sm-content">
      <el-alert v-if="errorMessage" :title="errorMessage + '；当前保留上次成功获取的数据。'" type="warning" :closable="false" show-icon />
      <el-alert v-for="warning in status.warnings" :key="warning" :title="warning" type="warning" :closable="false" show-icon />
      <!-- 统计卡 -->
      <div class="sm-grid">
        <!-- CPU -->
        <div class="sm-card">
          <div class="sm-card-label">CPU 使用率</div>
          <div class="sm-big">{{ cpu.percent != null ? cpu.percent.toFixed(1) + '%' : '--' }}</div>
          <div class="sm-sub">{{ cpu.core_count }} 核 · {{ cpu.freq_mhz != null ? cpu.freq_mhz + ' MHz' : '--' }}</div>
          <div v-if="cpu.per_core" class="sm-cores">
            <div v-for="(c, i) in cpu.per_core" :key="i" class="sm-core">
              <span class="sm-core-n">{{ i + 1 }}</span>
              <span class="sm-core-bar"><span class="sm-core-fill" :style="{ width: c + '%' }"></span></span>
            </div>
          </div>
        </div>

        <!-- 内存 -->
        <div class="sm-card">
          <div class="sm-card-label">内存</div>
          <div class="sm-big">{{ memory.percent != null ? memory.percent.toFixed(1) + '%' : '--' }}</div>
          <el-progress v-if="memory.percent != null" :percentage="Math.round(memory.percent)" :stroke-width="8" :show-text="false" />
          <div class="sm-sub">{{ formatBytes(memory.used) }} / {{ formatBytes(memory.total) }}</div>
        </div>

        <!-- 磁盘 -->
        <div class="sm-card">
          <div class="sm-card-label">磁盘</div>
          <div class="sm-big">{{ disk.percent != null ? disk.percent.toFixed(1) + '%' : '--' }}</div>
          <el-progress v-if="disk.percent != null" :percentage="Math.round(disk.percent)" :stroke-width="8" :show-text="false" />
          <div class="sm-sub">剩余 {{ formatBytes(disk.free) }} / {{ formatBytes(disk.total) }}</div>
          <div class="sm-sub">监控分区：{{ disk.mount }}</div>
        </div>

        <!-- 温度 -->
        <div class="sm-card">
          <div class="sm-card-label">温度</div>
          <div class="sm-big">
            {{ temperature.cpu_celsius != null ? temperature.cpu_celsius.toFixed(1) + '°C' : '--' }}
          </div>
          <span v-if="temperature.cpu_celsius != null" class="sm-temp-badge" :class="tempLevel">
            🌡 {{ tempLevelText }}
          </span>
          <div class="sm-sub">{{ temperatureText }}</div>
        </div>

        <!-- 运行时间 -->
        <div class="sm-card">
          <div class="sm-card-label">运行时长</div>
          <div class="sm-big sm-uptime">{{ status.uptime_seconds != null ? formatUptime(status.uptime_seconds) : '--' }}</div>
          <div class="sm-sub">开机于 {{ bootTimeText }}</div>
        </div>

        <!-- 负载 -->
        <div class="sm-card">
          <div class="sm-card-label">平均负载</div>
          <div v-if="cpu.load" class="sm-load">
            <div class="sm-load-row"><span>1 分钟</span><strong>{{ cpu.load[0] }}</strong></div>
            <div class="sm-load-row"><span>5 分钟</span><strong>{{ cpu.load[1] }}</strong></div>
            <div class="sm-load-row"><span>15 分钟</span><strong>{{ cpu.load[2] }}</strong></div>
          </div>
          <div v-else class="sm-big sm-uptime">--</div>
          <div class="sm-sub">{{ status.platform === 'Windows' ? 'Windows 不提供该负载指标' : '系统负载（1 / 5 / 15 分钟）' }}</div>
        </div>

        <!-- 网络 -->
        <div class="sm-card">
          <div class="sm-card-label">网络</div>
          <div class="sm-net">
            <div class="sm-net-row"><span class="sm-net-arrow down">↓</span><span>接收 {{ formatBytes(status.network.bytes_recv) }}</span></div>
            <div class="sm-net-row"><span class="sm-net-arrow up">↑</span><span>发送 {{ formatBytes(status.network.bytes_sent) }}</span></div>
          </div>
          <div class="sm-sub">
            <template v-if="status.network.interfaces.length">
              <span v-for="(it, i) in status.network.interfaces" :key="i" class="sm-ip">{{ it.name }}: {{ it.address }}</span>
            </template>
            <template v-else>无网络数据</template>
          </div>
        </div>
      </div>

      <!-- 历史走势 -->
      <div class="sm-history">
        <spark-card
          title="CPU 使用率"
          :history="cpuHistory"
          unit="%"
          color="#00f5ff"
        />
        <spark-card
          title="内存使用率"
          :history="memHistory"
          unit="%"
          color="#9085e9"
        />
        <spark-card
          title="温度"
          :history="tempHistory"
          unit="°C"
          color="#d95926"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, defineComponent, h } from 'vue'
import { systemApi } from '@/api/systemApi'

const MAX_POINTS = 120
const POLL_MS = 5000

const status = reactive({
  hostname: '', platform: '', boot_time: null, uptime_seconds: null,
  platform_info: { mode: 'auto', label: '', machine: '', model: '', collector: '' },
  warnings: [],
  cpu: { percent: null, core_count: null, freq_mhz: null, per_core: null, load: null },
  memory: { total: null, used: null, available: null, percent: null },
  disk: { total: null, used: null, free: null, percent: null, mount: '/' },
  temperature: { cpu_celsius: null, source: null },
  network: { bytes_sent: null, bytes_recv: null, interfaces: [] },
})
const cpuHistory = ref([])
const memHistory = ref([])
const tempHistory = ref([])
const loading = ref(true)
const authError = ref(false)
const errorMessage = ref('')
const lastUpdate = ref(null)
let pollTimer = null
const inFlight = ref(false)
let disposed = false
let requestController = null

const cpu = computed(() => status.cpu)
const memory = computed(() => status.memory)
const disk = computed(() => status.disk)
const temperature = computed(() => status.temperature)
const platformLabel = computed(() => status.platform_info.label || status.platform)
const temperatureText = computed(() => {
  if (temperature.value.source === 'thermal_zone') {
    return status.platform_info.collector === 'raspberrypi' ? '树莓派 CPU 热区' : 'Linux CPU 热区'
  }
  if (temperature.value.source === 'psutil') return 'CPU 温度传感器'
  return status.platform === 'Windows' ? 'Windows 暂无可用的 CPU 温度传感器' : '未检测到可读取的 CPU 温度传感器'
})

const tempLevel = computed(() => {
  const t = status.temperature.cpu_celsius
  if (t == null) return ''
  if (t < 60) return 'good'
  if (t < 75) return 'warning'
  return 'critical'
})
const tempLevelText = computed(() => ({ good: '正常', warning: '偏高', critical: '高温' })[tempLevel.value] || '')

const lastUpdateText = computed(() => lastUpdate.value ? `更新于 ${formatClock(lastUpdate.value)}` : '等待数据')
const bootTimeText = computed(() => status.boot_time ? formatClock(new Date(status.boot_time * 1000)) : '--')

function formatBytes(bytes) {
  if (bytes == null || isNaN(bytes)) return '--'
  if (bytes >= 1024 ** 4) return (bytes / 1024 ** 4).toFixed(1) + ' TB'
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + ' GB'
  if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(1) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return bytes + ' B'
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}天 ${h}小时 ${m}分钟`
  if (h > 0) return `${h}小时 ${m}分钟`
  return `${m}分钟`
}

function formatClock(date) {
  const p = (n) => String(n).padStart(2, '0')
  return `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
}

function pushSample(target, value) {
  target.value.push({ t: new Date(), v: value })
  if (target.value.length > MAX_POINTS) target.value.shift()
}

async function loadStatus() {
  if (inFlight.value || disposed) return
  inFlight.value = true
  requestController = new AbortController()
  try {
    const res = await systemApi.getStatus({ signal: requestController.signal })
    if (disposed) return
    if (res.code === 200) {
      const d = res.data
      if (!d || !d.cpu || !d.memory || !d.disk || !d.network || !d.temperature) {
        throw new Error('系统监控返回的数据不完整，请检查后端版本。')
      }
      for (const key of ['cpu', 'memory', 'disk', 'temperature', 'network', 'platform_info']) {
        Object.assign(status[key], d[key] || {})
      }
      for (const key of ['hostname', 'platform', 'boot_time', 'uptime_seconds']) {
        status[key] = d[key] ?? null
      }
      status.network.interfaces = d.network.interfaces || []
      status.warnings = d.warnings || []
      authError.value = false
      errorMessage.value = ''
      pushSample(cpuHistory, d.cpu?.percent ?? null)
      pushSample(memHistory, d.memory?.percent ?? null)
      pushSample(tempHistory, d.temperature?.cpu_celsius ?? null)
      lastUpdate.value = new Date()
    } else if (res.code === 401) {
      authError.value = true
    } else {
      errorMessage.value = res.message || '系统监控暂时不可用，请重试。'
    }
  } catch (err) {
    if (disposed || err?.code === 'ERR_CANCELED') return
    if (err?.response?.status === 401) {
      authError.value = true
    } else {
      errorMessage.value = err?.response?.data?.message || (
        ['ECONNABORTED', 'ETIMEDOUT'].includes(err?.code)
          ? '获取系统状态超时，请检查后端服务是否正常运行。'
          : err?.response?.status
            ? `获取系统状态失败（HTTP ${err.response.status}），请检查后端服务。`
            : err?.message === 'Network Error'
              ? '无法连接监控服务，请检查网络和后端地址。'
              : err?.message || '获取系统状态失败，请重试。'
      )
    }
  } finally {
    inFlight.value = false
    loading.value = false
    requestController = null
    if (authError.value) stopPolling()
    else startPolling()
  }
}

function startPolling() {
  if (pollTimer === null && !disposed && !authError.value) {
    pollTimer = setInterval(loadStatus, POLL_MS)
  }
}

function stopPolling() {
  if (pollTimer !== null) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

onMounted(() => {
  startPolling()
  loadStatus()
})

onBeforeUnmount(() => {
  disposed = true
  stopPolling()
  requestController?.abort()
})

/* ===== 走势图卡片（内联 SVG，单序列迷你面积图） ===== */
const SparkCard = defineComponent({
  name: 'SparkCard',
  props: {
    title: { type: String, required: true },
    history: { type: Array, default: () => [] },
    unit: { type: String, default: '' },
    color: { type: String, default: '#00f5ff' },
  },
  setup(props) {
    const W = 120
    const H = 40
    const hover = ref(null) // { index, x, y, v, t }
    const gradId = 'grad-' + props.color.replace('#', '')

    const valid = computed(() => props.history.filter(p => p.v != null))

    const bounds = computed(() => {
      if (!valid.value.length) return null
      const vs = valid.value.map(p => p.v)
      let min = Math.min(...vs)
      let max = Math.max(...vs)
      if (max - min < 1e-6) { min -= 1; max += 1 }
      const pad = (max - min) * 0.1
      return { min: min - pad, max: max + pad }
    })

    const linePoints = computed(() => {
      if (!valid.value.length || !bounds.value) return ''
      const n = valid.value.length
      const { min, max } = bounds.value
      return valid.value.map((p, i) => {
        const x = n === 1 ? W / 2 : (i / (n - 1)) * W
        const y = H - ((p.v - min) / (max - min)) * H
        return `${x.toFixed(2)},${y.toFixed(2)}`
      }).join(' ')
    })

    const areaPoints = computed(() => {
      if (!valid.value.length || !bounds.value) return ''
      const first = linePoints.value.split(' ')[0]
      const last = linePoints.value.split(' ').pop()
      return `0,${H} ${linePoints.value} ${W},${H} ${first}`
    })

    const stat = computed(() => {
      const list = valid.value
      if (!list.length) return { current: '--', min: '--', max: '--' }
      const vs = list.map(p => p.v)
      return {
        current: (list[list.length - 1].v).toFixed(1),
        min: Math.min(...vs).toFixed(1),
        max: Math.max(...vs).toFixed(1),
      }
    })

    function onMove(e) {
      const list = valid.value
      if (!list.length) return
      const rect = e.currentTarget.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      const index = Math.max(0, Math.min(list.length - 1, Math.round(ratio * (list.length - 1))))
      const p = list[index]
      const { min, max } = bounds.value
      const x = list.length === 1 ? W / 2 : (index / (list.length - 1)) * W
      const y = H - ((p.v - min) / (max - min)) * H
      hover.value = { x, y, v: p.v, t: p.t }
    }

    function onLeave() { hover.value = null }

    function fmtTime(t) {
      const p = (n) => String(n).padStart(2, '0')
      return `${p(t.getHours())}:${p(t.getMinutes())}:${p(t.getSeconds())}`
    }

    return () => h('div', { class: 'sm-card sm-spark' }, [
      h('div', { class: 'sm-card-label' }, props.title),
      h('div', { class: 'sm-spark-stat' }, [
        h('span', { class: 'sm-spark-current' }, stat.value.current + (props.unit || '')),
        h('span', { class: 'sm-spark-range' }, `min ${stat.value.min} · max ${stat.value.max}`),
      ]),
      valid.value.length
        ? h('div', { class: 'sm-spark-wrap' }, [
            h('svg', {
              viewBox: `0 0 ${W} ${H}`,
              preserveAspectRatio: 'none',
              class: 'sm-spark-svg',
              onPointermove: onMove,
              onPointerleave: onLeave,
            }, [
              h('defs', null, [
                h('linearGradient', { id: gradId, x1: '0', y1: '0', x2: '0', y2: '1' }, [
                  h('stop', { offset: '0%', style: `stop-color:${props.color};stop-opacity:0.28` }),
                  h('stop', { offset: '100%', style: `stop-color:${props.color};stop-opacity:0.02` }),
                ]),
              ]),
              h('polygon', { points: areaPoints.value, fill: `url(#${gradId})`, stroke: 'none' }),
              h('polyline', {
                points: linePoints.value,
                fill: 'none',
                stroke: props.color,
                'stroke-width': '2',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
                'vector-effect': 'non-scaling-stroke',
              }),
              hover.value
                ? h('g', null, [
                    h('line', {
                      x1: hover.value.x, y1: 0, x2: hover.value.x, y2: H,
                      stroke: 'rgba(255,255,255,0.28)', 'stroke-width': '1', 'vector-effect': 'non-scaling-stroke',
                    }),
                    h('circle', {
                      cx: hover.value.x, cy: hover.value.y, r: '4',
                      fill: props.color, stroke: 'var(--sm-surface, #0b0e1e)', 'stroke-width': '2',
                    }),
                  ])
                : null,
            ]),
            hover.value
              ? h('div', { class: 'sm-spark-tip' }, [
                  h('strong', null, hover.value.v.toFixed(1) + (props.unit || '')),
                  h('span', null, fmtTime(hover.value.t)),
                ])
              : null,
          ])
        : h('div', { class: 'sm-spark-empty' }, '暂无数据'),
    ])
  },
})
</script>

<style scoped>
.sm-page {
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
  --sm-surface: #0b0e1e;
}

/* ── 头部 ── */
.sm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.sm-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--app-text-strong);
}
.sm-subtitle {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--app-text-muted);
}
.sm-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--app-text-muted);
}
.sm-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #555;
}
.sm-dot.live {
  background: #0ca30c;
  box-shadow: 0 0 6px rgba(12, 163, 12, 0.6);
}

/* ── 状态页 ── */
.sm-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--app-text-muted);
}
.sm-state-icon { font-size: 44px; }
.sm-state p { margin: 0; font-size: 15px; }

/* ── 内容区 ── */
.sm-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 2px;
}

.sm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: var(--app-page-gap);
}

.sm-card {
  background: var(--app-surface);
  border: 1px solid var(--cyber-border);
  border-radius: var(--app-radius-md);
  padding: var(--app-card-padding);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.sm-card-label {
  font-size: 12px;
  color: var(--app-text-muted);
}

.sm-big {
  font-size: 28px;
  font-weight: 600;
  color: var(--app-text-strong);
  font-variant-numeric: tabular-nums;
}
.sm-uptime { font-size: 20px; }

.sm-sub {
  font-size: 12px;
  color: var(--app-text-soft);
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
}

/* CPU 每核迷你条 */
.sm-cores {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 2px;
}
.sm-core {
  display: flex;
  align-items: center;
  gap: 6px;
}
.sm-core-n {
  width: 16px;
  font-size: 10px;
  color: var(--app-text-muted);
  text-align: right;
}
.sm-core-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}
.sm-core-fill {
  display: block;
  height: 100%;
  background: #00f5ff;
  border-radius: 2px;
  transition: width 0.6s ease;
}

/* 温度状态徽章（图标+文字，状态色不作唯一通道） */
.sm-temp-badge {
  align-self: flex-start;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 600;
}
.sm-temp-badge.good { color: #0ca30c; background: rgba(12, 163, 12, 0.14); }
.sm-temp-badge.warning { color: #fab219; background: rgba(250, 178, 25, 0.14); }
.sm-temp-badge.critical { color: #d03b3b; background: rgba(208, 59, 59, 0.16); }

/* 负载 */
.sm-load {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sm-load-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 13px;
  color: var(--app-text-muted);
}
.sm-load-row strong {
  font-size: 16px;
  color: var(--app-text-main);
  font-variant-numeric: tabular-nums;
}

/* 网络 */
.sm-net {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--app-text-main);
}
.sm-net-row { display: flex; align-items: center; gap: 6px; }
.sm-net-arrow { font-weight: 700; width: 14px; }
.sm-net-arrow.down { color: #0ca30c; }
.sm-net-arrow.up { color: #fab219; }
.sm-ip {
  font-size: 11px;
  color: var(--app-text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 8px;
  border-radius: 999px;
}

/* ── 历史走势 ── */
.sm-history {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--app-page-gap);
}
.sm-spark-stat {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.sm-spark-current {
  font-size: 20px;
  font-weight: 600;
  color: var(--app-text-strong);
  font-variant-numeric: tabular-nums;
}
.sm-spark-range {
  font-size: 11px;
  color: var(--app-text-muted);
}
.sm-spark-wrap {
  position: relative;
  flex: 1;
  min-height: 64px;
}
.sm-spark-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
}
.sm-spark-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 64px;
  font-size: 12px;
  color: var(--app-text-muted);
}
.sm-spark-tip {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  pointer-events: none;
  background: var(--app-surface-strong);
  border: 1px solid var(--cyber-border);
  border-radius: 8px;
  padding: 4px 10px;
  z-index: 5;
}
.sm-spark-tip strong {
  font-size: 14px;
  color: var(--app-text-strong);
}
.sm-spark-tip span {
  font-size: 11px;
  color: var(--app-text-muted);
}

/* ── 移动端 ── */
@media (max-width: 768px) {
  .sm-page { padding: 10px; gap: 10px; }
  .sm-title { font-size: 18px; }
  .sm-grid { grid-template-columns: repeat(2, 1fr); }
  .sm-big { font-size: 24px; }
  .sm-history { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .sm-grid { grid-template-columns: 1fr; }
}
</style>
