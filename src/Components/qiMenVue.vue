<template>
  <div class="qimen-page">
    <el-card class="qimen-form" shadow="always">
      <div class="title">奇门遁甲推盘</div>
      <el-form :model="form" label-width="90px" class="form-grid">
        <el-form-item label="时间">
          <el-date-picker v-model="form.datetime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="form.location" placeholder="请输入地点或经纬度" />
        </el-form-item>
        <el-form-item label="主题">
          <el-input v-model="form.topic" placeholder="例如：求财/姻缘/考试/出行" />
        </el-form-item>
        <el-form-item label="阳历">
          <el-switch v-model="form.solar" />
        </el-form-item>
        <el-form-item label="AI分析">
          <el-switch v-model="form.analyze" />
        </el-form-item>
        <div class="form-actions">
          <el-button type="primary" @click="calc">推盘</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </el-form>
    </el-card>

    <el-card class="qimen-result" shadow="always">
      <div class="result-header">
        <div class="meta">
          <div>时间：{{ displayDatetime }}</div>
          <div>地点：{{ form.location || '未填写' }}</div>
          <div>主题：{{ form.topic || '未填写' }}</div>
        </div>
        <div class="legend">
          <span class="lg gate">八门</span>
          <span class="lg star">九星</span>
          <span class="lg god">八神</span>
        </div>
      </div>
      <div class="palace-grid">
        <div v-for="(p, idx) in palaces" :key="idx" class="palace">
          <div class="p-head">
            <div class="p-name">{{ p.name }}</div>
            <div class="p-pos">{{ p.position }}</div>
          </div>
          <div class="p-body">
            <div class="row">
              <span class="tag gate">{{ p.gate }}</span>
              <span class="tag star">{{ p.star }}</span>
              <span class="tag god">{{ p.god }}</span>
            </div>
            <div class="row tips">{{ p.tip }}</div>
          </div>
        </div>
      </div>
    </el-card>
    <el-card class="qimen-analysis" shadow="always" v-if="analysis">
      <div class="a-title" :data-status="analyzing ? '分析中…' : ''">分析结果</div>
      <div class="a-meta">
        <span class="provider">{{ analysis.provider || '未知来源' }}</span>
        <span class="model">{{ analysis.model || '' }}</span>
      </div>
      <el-scrollbar class="a-text">
        <div class="md" v-html="analysisHtml"></div>
      </el-scrollbar>
    </el-card>
  </div>
  </template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { qiMenApi } from '@/api/qiMenApi'

const form = reactive({
  datetime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  location: '',
  topic: '',
  solar: true,
  analyze: true
})

const palaces = ref([
  { name: '坎一', position: '北', gate: '-', star: '-', god: '-', tip: '-' },
  { name: '坤二', position: '西南', gate: '-', star: '-', god: '-', tip: '-' },
  { name: '震三', position: '东', gate: '-', star: '-', god: '-', tip: '-' },
  { name: '巽四', position: '东南', gate: '-', star: '-', god: '-', tip: '-' },
  { name: '中五', position: '中', gate: '-', star: '-', god: '-', tip: '-' },
  { name: '乾六', position: '西北', gate: '-', star: '-', god: '-', tip: '-' },
  { name: '兑七', position: '西', gate: '-', star: '-', god: '-', tip: '-' },
  { name: '艮八', position: '东北', gate: '-', star: '-', god: '-', tip: '-' },
  { name: '离九', position: '南', gate: '-', star: '-', god: '-', tip: '-' }
])

const displayDatetime = ref(form.datetime)
const analysis = ref(null)
const analyzing = ref(false)
const escapeHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const renderMarkdown = (src) => {
  let text = String(src || '')
  text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => `<pre><code class="language-${lang || ''}">${escapeHtml(code)}</code></pre>`)
  const lines = text.split(/\r?\n/)
  let html = ''
  let ul = false
  let ol = false
  let bq = false
  let inTable = false
  let tableRows = []
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (/^\s*(?:---|\*\*\*|___)\s*$/.test(line)) {
      if (ul) { html += '</ul>'; ul = false }
      if (ol) { html += '</ol>'; ol = false }
      if (bq) { html += '</blockquote>'; bq = false }
      html += '<hr/>'
      continue
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (!ol) { if (ul) { html += '</ul>'; ul = false } html += '<ol>'; ol = true }
      html += `<li>${line.replace(/^\s*\d+\.\s+/, '')}</li>`
      continue
    } else if (ol) {
      html += '</ol>'
      ol = false
    }
    if (/^\s*[-*]\s+/.test(line)) {
      if (!ul) { html += '<ul>' ; ul = true }
      const taskMatch = line.match(/^\s*-\s+\[( |x|X)\]\s+(.*)$/)
      if (taskMatch) {
        const checked = /x/i.test(taskMatch[1])
        html += `<li><input type="checkbox" disabled ${checked ? 'checked' : ''}/> ${taskMatch[2]}</li>`
      } else {
        html += `<li>${line.replace(/^\s*[-*]\s+/, '')}</li>`
      }
      continue
    } else if (ul) {
      html += '</ul>'
      ul = false
    }
    const bqMatch = line.match(/^\s*>\s?(.*)$/)
    if (bqMatch) {
      if (!bq) { html += '<blockquote>'; bq = true }
      html += `<p>${bqMatch[1]}</p>`
      continue
    } else if (bq) {
      html += '</blockquote>'
      bq = false
    }
    if (/^\s*#{1}\s+/.test(line)) html += `<h1>${line.replace(/^\s*#\s+/, '')}</h1>`
    else if (/^\s*#{2}\s+/.test(line)) html += `<h2>${line.replace(/^\s*##\s+/, '')}</h2>`
    else if (/^\s*#{3}\s+/.test(line)) html += `<h3>${line.replace(/^\s*###\s+/, '')}</h3>`
    else if (/^\s*#{4}\s+/.test(line)) html += `<h4>${line.replace(/^\s*####\s+/, '')}</h4>`
    else if (/^\s*#{5}\s+/.test(line)) html += `<h5>${line.replace(/^\s*#####\s+/, '')}</h5>`
    else if (/^\s*#{6}\s+/.test(line)) html += `<h6>${line.replace(/^\s*######\s+/, '')}</h6>`
    else if (/\|/.test(line)) {
      const parts = line.split('|').map(s => s.trim())
      if (!inTable) { inTable = true; tableRows = []; }
      tableRows.push(parts)
      const next = lines[i+1] || ''
      if (!/\|/.test(next)) {
        let tHtml = '<table><tbody>'
        for (let r = 0; r < tableRows.length; r++) {
          tHtml += '<tr>' + tableRows[r].map(cell => `<td>${cell}</td>`).join('') + '</tr>'
        }
        tHtml += '</tbody></table>'
        html += tHtml
        inTable = false
        tableRows = []
      }
    } else if (line.trim() === '') {
      html += '<br/>'
    } else {
      let l = line
      l = l.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      l = l.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
      l = l.replace(/`([^`]+?)`/g, '<code>$1</code>')
      l = l.replace(/\*([^*]+?)\*/g, '<em>$1</em>')
      html += `<p>${l}</p>`
    }
  }
  if (ul) html += '</ul>'
  if (ol) html += '</ol>'
  if (bq) html += '</blockquote>'
  return html
}
const analysisHtml = computed(() => renderMarkdown(analysis.value?.text))

const gates = ['休','生','伤','杜','景','死','惊','开']
const stars = ['天蓬','天任','天冲','天辅','天英','天芮','天柱','天心','天禽']
const gods = ['值符','值使','螣蛇','朱雀','六合','白虎','玄武','九地','九天']

const genIndex = (seed, mod) => {
  let x = Math.abs(seed % mod)
  return x
}

const localCalc = () => {
  const t = dayjs(displayDatetime.value)
  const base = t.year() * 10000 + (t.month()+1) * 100 + t.date() + t.hour()*3 + t.minute()
  const locHash = String(form.location || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  for (let i = 0; i < palaces.value.length; i++) {
    const mix = base + i * 7 + locHash
    const g = gates[genIndex(mix, gates.length)]
    const s = stars[genIndex(mix * 3, stars.length)]
    const d = gods[genIndex(mix * 5, gods.length)]
    const tip = `${form.topic ? form.topic + '：' : ''}${g}、${s}、${d}`
    palaces.value[i] = { ...palaces.value[i], gate: g, star: s, god: d, tip }
  }
}

const calc = async () => {
  try {
    displayDatetime.value = form.datetime || dayjs().format('YYYY-MM-DD HH:mm:ss')
    const payload = { datetime: displayDatetime.value, location: form.location, topic: form.topic, solar: form.solar, analyze: form.analyze }
    analyzing.value = !!form.analyze
    const res = await qiMenApi.calc(payload)
    if (res?.code === 200) {
      const data = res?.data || {}
      displayDatetime.value = data?.meta?.parsed_datetime || data?.input?.datetime || displayDatetime.value
      const chart = data?.chart
      const list = Array.isArray(chart) ? chart : (Array.isArray(chart?.palaces) ? chart.palaces : null)
      if (Array.isArray(list) && list.length >= palaces.value.length) {
        palaces.value = palaces.value.map((p, i) => ({
          ...p,
          gate: list[i]?.gate ?? p.gate,
          star: list[i]?.star ?? p.star,
          god: list[i]?.god ?? p.god,
          tip: list[i]?.tip ?? p.tip
        }))
        analysis.value = data?.analysis || null
        analyzing.value = false
        ElMessage.success('推盘成功')
        return
      }
      ElMessage.warning('返回格式不符，使用本地推盘')
      localCalc()
      analysis.value = null
      analyzing.value = false
      return
    }
    ElMessage.warning(res?.message || '后端无结果，使用本地推盘')
    localCalc()
    analysis.value = null
    analyzing.value = false
  } catch (e) {
    const code = e?.response?.data?.code
    const id = e?.response?.data?.data?.id
    if (code === 502 && id) {
      analysis.value = { text: `分析任务已创建（ID: ${id}），当前排盘已保存。分析完成后请稍后重试或查看历史记录。`, provider: 'deepseek', model: '' }
      ElMessage.warning('AI分析耗时较长，任务已创建')
    } else {
      localCalc()
      ElMessage.warning('后端不可用，使用本地推盘')
      analysis.value = null
    }
    analyzing.value = false
  }
}

const reset = () => {
  form.datetime = dayjs().format('YYYY-MM-DD HH:mm:ss')
  form.location = ''
  form.topic = ''
  form.solar = true
  form.analyze = false
  palaces.value = palaces.value.map(p => ({ ...p, gate: '-', star: '-', god: '-', tip: '-' }))
  analysis.value = null
}
</script>

<style scoped>
.qimen-page {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 12px;
  padding: 12px;
  height: 100%;
}
.qimen-form { grid-column: 1; }
.qimen-result { grid-column: 2; }
.qimen-analysis { grid-column: 1 / -1; }
.qimen-form .title {
  font-weight: 600;
  margin-bottom: 8px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.qimen-result {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.qimen-analysis {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.a-title {
  font-weight: 600;
  font-size: 20px;
}
.a-meta {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 8px;
}
.a-title::after {
  content: attr(data-status);
  margin-left: 8px;
  font-size: 12px;
  color: #888;
}
.a-text {
  max-height: 70vh;
}
.a-text .md {
  word-break: break-word;
  font-size: 18px;
  line-height: 1.75;
}
.a-text .md h1, .a-text .md h2, .a-text .md h3 {
  margin: 8px 0;
}
.a-text .md pre {
  background: #f7f7f7;
  border-radius: 8px;
  padding: 10px;
  overflow: auto;
}
.a-text .md code {
  background: #f0f0f0;
  border-radius: 4px;
  padding: 0 4px;
}
.a-text .md blockquote {
  margin: 8px 0;
  padding: 8px 12px;
  background: #f9fafb;
  border-left: 4px solid #a0c4ff;
  color: #444;
}
.a-text .md table {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
}
.a-text .md td, .a-text .md th {
  border: 1px solid #e5e7eb;
  padding: 6px 8px;
  text-align: left;
}
.a-text .md hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 10px 0;
}
.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.legend .lg {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 12px;
}
.legend .gate { background: #e9f1ff; }
.legend .star { background: #eaf6f1; }
.legend .god { background: #fff3e6; }
.palace-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 8px;
  min-height: 0;
}
.palace {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.p-head {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tag {
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 12px;
}
.tag.gate { background: #e9f1ff; }
.tag.star { background: #eaf6f1; }
.tag.god { background: #fff3e6; }
.tips {
  color: #666;
  font-size: 12px;
}
</style>
