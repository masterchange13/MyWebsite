<template>
  <div class="decision-page">
    <div class="header">
      <h2 class="title">决策助手</h2>
      <p class="subtitle">抛硬币 · 掷骰子 · 随机选择</p>
    </div>

    <el-row :gutter="16" class="widgets">
      <!-- 抛硬币 -->
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="widget">
          <template #header><span class="widget-title">🪙 抛硬币</span></template>
          <div class="coin-area" @click="flipCoin">
            <div class="coin" :class="{ flipping: coinFlipping, heads: coinResult === 'heads' }">
              <div class="coin-face front">🪙</div>
              <div class="coin-face back">{{ coinDone ? (coinResult === 'heads' ? '🌕' : '🌑') : '❓' }}</div>
            </div>
          </div>
          <div class="result-text" v-if="coinDone">{{ coinResult === 'heads' ? '正面' : '反面' }}</div>
          <div class="result-text muted" v-else>点击硬币</div>
        </el-card>
      </el-col>

      <!-- 掷骰子 -->
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="widget">
          <template #header><span class="widget-title">🎲 掷骰子</span></template>
          <div class="dice-select">
            <el-radio-group v-model="diceSides" size="small">
              <el-radio-button :value="4">D4</el-radio-button>
              <el-radio-button :value="6">D6</el-radio-button>
              <el-radio-button :value="8">D8</el-radio-button>
              <el-radio-button :value="10">D10</el-radio-button>
              <el-radio-button :value="12">D12</el-radio-button>
              <el-radio-button :value="20">D20</el-radio-button>
            </el-radio-group>
          </div>
          <div class="dice-area" @click="rollDice">
            <div class="dice-display" :class="{ rolling: diceRolling }">
              <span v-if="!diceDone">🎲</span>
              <span v-else class="dice-result">{{ diceValue }}</span>
            </div>
          </div>
          <div class="result-text" v-if="diceDone">D{{ diceSides }} → {{ diceValue }}</div>
          <div class="result-text muted" v-else>点击骰子</div>
        </el-card>
      </el-col>

      <!-- Yes / No -->
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="widget">
          <template #header><span class="widget-title">✅ Yes or No</span></template>
          <div class="yn-area" @click="askYesNo">
            <div class="yn-ball" :class="{ bouncing: ynBouncing }">
              <span v-if="ynDone" class="yn-result">{{ ynAnswer }}</span>
              <span v-else>🤔</span>
            </div>
          </div>
          <div class="result-text muted" v-if="!ynDone">点击球问一个问题</div>
        </el-card>
      </el-col>

      <!-- 随机数 -->
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="widget">
          <template #header><span class="widget-title">🔢 随机数</span></template>
          <div class="range-inputs">
            <el-input-number v-model="randMin" :min="0" :max="9999" size="small" controls-position="right" />
            <span class="range-sep">~</span>
            <el-input-number v-model="randMax" :min="1" :max="99999" size="small" controls-position="right" />
          </div>
          <div class="rand-area" @click="generateRandom">
            <div class="rand-display" :class="{ popping: randPopping }">
              {{ randDone ? randValue : '?' }}
            </div>
          </div>
          <div class="result-text muted" v-if="!randDone">点击生成</div>
        </el-card>
      </el-col>

      <!-- 多选一 -->
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="widget">
          <template #header><span class="widget-title">📋 多选一</span></template>
          <el-input
            v-model="pickInput"
            type="textarea"
            :rows="2"
            placeholder="每行一个选项，或用逗号分隔"
            size="small"
            class="pick-input"
          />
          <div class="pick-area" @click="pickOne">
            <div class="pick-display" :class="{ popping: pickPopping }">
              {{ pickDone ? pickResult : '🎯' }}
            </div>
          </div>
          <div class="result-text muted" v-if="!pickDone">点击抽取</div>
          <div class="result-text" v-else>抽中：{{ pickResult }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 历史记录 -->
    <el-card shadow="hover" class="history-card" v-if="showHistory">
      <template #header>
        <div class="history-header">
          <span>📜 决策记录</span>
          <el-button size="small" type="danger" text @click="clearHistory">清空</el-button>
        </div>
      </template>
      <div class="history-list" v-if="history.length > 0">
        <div class="history-item" v-for="h in history.slice(0, 20)" :key="h.id">
          <span class="h-type">{{ typeLabel[h.type] || h.type }}</span>
          <span class="h-result">{{ h.result }}</span>
          <span class="h-detail" v-if="h.detail">{{ h.detail }}</span>
          <span class="h-time">{{ new Date(h.created_at).toLocaleTimeString() }}</span>
        </div>
      </div>
      <div class="history-empty" v-else>暂无记录，开始做决策吧 🎯</div>
    </el-card>
    <div class="history-toggle" @click="showHistory = !showHistory">
      {{ showHistory ? '隐藏记录 ▲' : '查看记录 ▼' }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { decisionApi } from '@/api/decisionApi'

// --- 历史记录 ---
const history = ref([])
const showHistory = ref(false)

const loadHistory = async () => {
  try {
    const res = await decisionApi.getHistory({ limit: 20 })
    history.value = res.data || []
  } catch {}
}

const saveDecision = (type, result, detail = '') => {
  decisionApi.record({ type, result, detail }).catch(() => {})
  // 同时插入本地列表顶部
  history.value.unshift({
    id: Date.now(),
    type,
    result: String(result),
    detail,
    created_at: new Date().toISOString(),
  })
}

const clearHistory = async () => {
  try {
    await decisionApi.clearHistory()
    history.value = []
  } catch {}
}

const typeLabel = {
  coin: '🪙抛硬币',
  dice: '🎲掷骰子',
  yesno: '✅Yes/No',
  random: '🔢随机数',
  pick: '📋多选一',
}

onMounted(() => {
  loadHistory()
})

// --- 抛硬币 ---
const coinFlipping = ref(false)
const coinDone = ref(false)
const coinResult = ref('')

const flipCoin = () => {
  if (coinFlipping.value) return
  coinFlipping.value = true
  coinDone.value = false
  coinResult.value = ''
  setTimeout(() => {
    coinResult.value = Math.random() < 0.5 ? 'heads' : 'tails'
    coinDone.value = true
    coinFlipping.value = false
    saveDecision('coin', coinResult.value === 'heads' ? '正面' : '反面')
  }, 600)
}

// --- 掷骰子 ---
const diceSides = ref(6)
const diceRolling = ref(false)
const diceDone = ref(false)
const diceValue = ref(0)

const rollDice = () => {
  if (diceRolling.value) return
  diceRolling.value = true
  diceDone.value = false
  // 滚动过程中快速切换数字
  let count = 0
  const interval = setInterval(() => {
    diceValue.value = Math.floor(Math.random() * diceSides.value) + 1
    count++
    if (count >= 10) {
      clearInterval(interval)
      diceValue.value = Math.floor(Math.random() * diceSides.value) + 1
      diceDone.value = true
      diceRolling.value = false
      saveDecision('dice', String(diceValue.value), `D${diceSides.value}`)
    }
  }, 60)
}

// --- Yes / No ---
const ynBouncing = ref(false)
const ynDone = ref(false)
const ynAnswer = ref('')

const askYesNo = () => {
  if (ynBouncing.value) return
  ynBouncing.value = true
  ynDone.value = false
  ynAnswer.value = ''
  setTimeout(() => {
    ynAnswer.value = Math.random() < 0.5 ? 'YES' : 'NO'
    ynDone.value = true
    ynBouncing.value = false
    saveDecision('yesno', ynAnswer.value)
  }, 700)
}

// --- 随机数 ---
const randMin = ref(1)
const randMax = ref(100)
const randPopping = ref(false)
const randDone = ref(false)
const randValue = ref(0)

const generateRandom = () => {
  if (randPopping.value) return
  const min = Math.min(randMin.value, randMax.value)
  const max = Math.max(randMin.value, randMax.value)
  randPopping.value = true
  randDone.value = false
  let count = 0
  const interval = setInterval(() => {
    randValue.value = Math.floor(Math.random() * (max - min + 1)) + min
    count++
    if (count >= 10) {
      clearInterval(interval)
      randValue.value = Math.floor(Math.random() * (max - min + 1)) + min
      randDone.value = true
      randPopping.value = false
      saveDecision('random', String(randValue.value), `${min}~${max}`)
    }
  }, 50)
}

// --- 多选一 ---
const pickInput = ref('')
const pickPopping = ref(false)
const pickDone = ref(false)
const pickResult = ref('')

const pickOne = () => {
  if (pickPopping.value) return
  const text = pickInput.value.trim()
  if (!text) return
  // 支持换行或逗号分隔
  const items = text
    .split(/[\n,，]/)
    .map(s => s.trim())
    .filter(Boolean)
  if (items.length === 0) return

  pickPopping.value = true
  pickDone.value = false
  pickResult.value = ''
  let count = 0
  const interval = setInterval(() => {
    pickResult.value = items[Math.floor(Math.random() * items.length)]
    count++
    if (count >= 12) {
      clearInterval(interval)
      pickResult.value = items[Math.floor(Math.random() * items.length)]
      pickDone.value = true
      pickPopping.value = false
      saveDecision('pick', pickResult.value, `${items.length}个选项中抽取`)
    }
  }, 50)
}
</script>

<style scoped>
.decision-page {
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
  overflow: auto;
}
.header {
  margin-bottom: 16px;
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
.widgets {
  margin: 0;
}
.widget {
  margin-bottom: 16px;
  min-height: 240px;
}
.widget-title {
  font-size: 15px;
  font-weight: 700;
  color: #d6fbff;
}

/* --- Coin --- */
.coin-area {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  cursor: pointer;
  user-select: none;
}
.coin {
  width: 80px;
  height: 80px;
  perspective: 400px;
}
.coin-face {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  backface-visibility: hidden;
  position: absolute;
  top: 0; left: 0;
}
.coin-face.front {
  z-index: 2;
}
.coin-face.back {
  transform: rotateY(180deg);
}
.coin.flipping {
  animation: coinFlip 0.6s ease-in-out;
}
@keyframes coinFlip {
  0%   { transform: rotateY(0deg); }
  100% { transform: rotateY(720deg); }
}
.coin.flipping .coin-face.front { animation: showFront 0.6s step-end; }
.coin.flipping .coin-face.back  { animation: hideBack 0.6s step-end; }
@keyframes showFront { 0%, 100% { z-index: 2; } 50% { z-index: 0; } }
@keyframes hideBack  { 0%, 100% { z-index: 0; } 50% { z-index: 2; } }

/* --- Dice --- */
.dice-select {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}
.dice-area {
  display: flex;
  justify-content: center;
  padding: 8px 0;
  cursor: pointer;
  user-select: none;
}
.dice-display {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: rgba(0, 245, 255, 0.06);
  border: 1px solid rgba(0, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  transition: transform 0.1s;
}
.dice-display.rolling {
  animation: diceShake 0.1s infinite;
}
@keyframes diceShake {
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(8deg) scale(1.05); }
  50% { transform: rotate(-8deg) scale(1.05); }
  75% { transform: rotate(4deg) scale(1.02); }
  100% { transform: rotate(0deg) scale(1); }
}
.dice-result {
  font-size: 44px;
  font-weight: 800;
  color: #9ef7ff;
  text-shadow: 0 0 12px rgba(0, 245, 255, 0.5);
}

/* --- Yes/No --- */
.yn-area {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  cursor: pointer;
  user-select: none;
}
.yn-ball {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 245, 255, 0.15), rgba(255, 0, 204, 0.15));
  border: 2px solid rgba(255, 0, 204, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}
.yn-ball.bouncing {
  animation: bounce 0.7s ease;
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  20% { transform: translateY(-30px); }
  40% { transform: translateY(0); }
  60% { transform: translateY(-15px); }
  80% { transform: translateY(0); }
}
.yn-result {
  font-size: 22px;
  font-weight: 900;
  color: #ff92e7;
  text-shadow: 0 0 14px rgba(255, 0, 204, 0.6);
}

/* --- Random Number --- */
.range-inputs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}
.range-sep {
  color: #88a7bf;
  font-size: 16px;
}
.rand-area {
  display: flex;
  justify-content: center;
  padding: 10px 0;
  cursor: pointer;
  user-select: none;
}
.rand-display {
  width: 80px;
  height: 80px;
  border-radius: 14px;
  background: rgba(255, 0, 204, 0.06);
  border: 1px solid rgba(255, 0, 204, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 800;
  color: #d6fbff;
  transition: transform 0.1s;
}
.rand-display.popping {
  animation: pop 0.5s ease;
}
@keyframes pop {
  0% { transform: scale(1); }
  30% { transform: scale(1.2); }
  60% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

/* --- Pick One --- */
.pick-input {
  margin-bottom: 8px;
}
.pick-area {
  display: flex;
  justify-content: center;
  padding: 6px 0;
  cursor: pointer;
  user-select: none;
}
.pick-display {
  min-width: 80px;
  min-height: 56px;
  padding: 8px 18px;
  border-radius: 14px;
  background: rgba(0, 245, 255, 0.05);
  border: 1px solid rgba(0, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: #d6fbff;
  transition: transform 0.1s;
}
.pick-display.popping {
  animation: pop 0.5s ease;
}

/* --- Shared result text --- */
.result-text {
  text-align: center;
  margin-top: 6px;
  font-size: 15px;
  font-weight: 700;
  color: #65d5dc;
}
.result-text.muted {
  color: #6b8090;
  font-weight: 400;
  font-size: 12px;
}

/* --- History --- */
.history-card {
  margin-top: 8px;
  max-height: 300px;
  overflow: auto;
}
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 700;
  color: #d6fbff;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.history-item {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.8fr 0.8fr;
  gap: 8px;
  padding: 6px 8px;
  font-size: 12px;
  border-radius: 4px;
  align-items: center;
  color: #b8d4df;
}
.history-item:nth-child(even) {
  background: rgba(0, 245, 255, 0.04);
}
.h-type {
  color: #88a7bf;
}
.h-result {
  font-weight: 700;
  color: #65d5dc;
}
.h-detail {
  color: #6b8090;
  font-size: 11px;
}
.h-time {
  color: #6b8090;
  text-align: right;
  font-size: 11px;
}
.history-empty {
  text-align: center;
  padding: 16px;
  color: #6b8090;
  font-size: 13px;
}
.history-toggle {
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
  color: #65d5dc;
  cursor: pointer;
  user-select: none;
}
.history-toggle:hover {
  color: #9ef7ff;
}

@media (max-width: 768px) {
  .decision-page {
    padding: 10px;
  }
  .title {
    font-size: 18px;
  }
  .widget {
    margin-bottom: 10px;
    min-height: 180px;
  }
  .widget-title {
    font-size: 14px;
  }
  .coin,
  .coin-face {
    width: 64px;
    height: 64px;
  }
  .coin-face {
    font-size: 36px;
  }
  .dice-display {
    width: 64px;
    height: 64px;
    font-size: 28px;
  }
  .dice-result {
    font-size: 34px;
  }
  .yn-ball {
    width: 64px;
    height: 64px;
    font-size: 26px;
  }
  .rand-display {
    width: 64px;
    height: 64px;
    font-size: 28px;
  }
  .pick-display {
    min-width: 64px;
    min-height: 44px;
    font-size: 20px;
    padding: 6px 12px;
  }
  .pick-input {
    font-size: 12px;
  }
  .history-item {
    grid-template-columns: 1fr 0.8fr 1fr 0.7fr;
    font-size: 10px;
    gap: 4px;
  }
  .range-inputs {
    flex-wrap: wrap;
  }
}
</style>
