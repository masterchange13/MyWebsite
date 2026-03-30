<template>
  <div class="calc-page" @keydown="onKeydown" tabindex="0">
    <el-card class="calc-card" shadow="hover">
      <div class="screen">
        <div class="expr">{{ expression || '0' }}</div>
        <div class="result">{{ result }}</div>
      </div>

      <div class="keys">
        <el-button class="key key-fn" @click="clearAll">C</el-button>
        <el-button class="key key-fn" @click="backspace">⌫</el-button>
        <el-button class="key key-op" @click="append('(')">(</el-button>
        <el-button class="key key-op" @click="append(')')">)</el-button>

        <el-button class="key" @click="append('7')">7</el-button>
        <el-button class="key" @click="append('8')">8</el-button>
        <el-button class="key" @click="append('9')">9</el-button>
        <el-button class="key key-op" @click="appendOperator('/')">÷</el-button>

        <el-button class="key" @click="append('4')">4</el-button>
        <el-button class="key" @click="append('5')">5</el-button>
        <el-button class="key" @click="append('6')">6</el-button>
        <el-button class="key key-op" @click="appendOperator('*')">×</el-button>

        <el-button class="key" @click="append('1')">1</el-button>
        <el-button class="key" @click="append('2')">2</el-button>
        <el-button class="key" @click="append('3')">3</el-button>
        <el-button class="key key-op" @click="appendOperator('-')">−</el-button>

        <el-button class="key key-wide" @click="append('0')">0</el-button>
        <el-button class="key" @click="appendDot">.</el-button>
        <el-button class="key key-op" @click="appendOperator('+')">+</el-button>
        <el-button class="key key-eq" type="primary" @click="evaluate">=</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

const expression = ref('')
const result = ref('')

const isDigit = (ch) => ch >= '0' && ch <= '9'
const isOperator = (ch) => ch === '+' || ch === '-' || ch === '*' || ch === '/'

const clearAll = () => {
  expression.value = ''
  result.value = ''
}

const backspace = () => {
  if (!expression.value) return
  expression.value = expression.value.slice(0, -1)
}

const append = (ch) => {
  expression.value += ch
}

const appendDot = () => {
  const s = expression.value
  const m = s.match(/(\d+(\.\d*)?)$/)
  if (m && m[0].includes('.')) return
  if (!s || isOperator(s.slice(-1)) || s.slice(-1) === '(') expression.value += '0'
  expression.value += '.'
}

const appendOperator = (op) => {
  const s = expression.value.trim()
  if (!s) {
    if (op === '-') expression.value = '-'
    return
  }
  const last = s.slice(-1)
  if (isOperator(last)) {
    expression.value = s.slice(0, -1) + op
    return
  }
  if (last === '(' && op !== '-') return
  expression.value = s + op
}

const tokenize = (input) => {
  const tokens = []
  let i = 0
  const s = input.replace(/\s+/g, '')
  while (i < s.length) {
    const ch = s[i]
    if (isDigit(ch) || ch === '.') {
      let j = i + 1
      while (j < s.length && (isDigit(s[j]) || s[j] === '.')) j++
      const numStr = s.slice(i, j)
      if (numStr === '.' || numStr.split('.').length > 2) throw new Error('数字格式错误')
      tokens.push({ type: 'num', value: parseFloat(numStr) })
      i = j
      continue
    }
    if (ch === '(' || ch === ')') {
      tokens.push({ type: ch })
      i++
      continue
    }
    if (isOperator(ch)) {
      tokens.push({ type: 'op', value: ch })
      i++
      continue
    }
    throw new Error('包含不支持的字符')
  }
  return tokens
}

const toRpn = (tokens) => {
  const output = []
  const stack = []
  const prec = { '+': 1, '-': 1, '*': 2, '/': 2 }
  let prev = null

  for (const t of tokens) {
    if (t.type === 'num') {
      output.push(t)
      prev = t
      continue
    }
    if (t.type === '(') {
      stack.push(t)
      prev = t
      continue
    }
    if (t.type === ')') {
      while (stack.length && stack[stack.length - 1].type !== '(') output.push(stack.pop())
      if (!stack.length) throw new Error('括号不匹配')
      stack.pop()
      prev = t
      continue
    }
    if (t.type === 'op') {
      const isUnaryMinus = t.value === '-' && (!prev || prev.type === '(' || prev.type === 'op')
      if (isUnaryMinus) {
        output.push({ type: 'num', value: 0 })
      }
      while (
        stack.length &&
        stack[stack.length - 1].type === 'op' &&
        prec[stack[stack.length - 1].value] >= prec[t.value]
      ) {
        output.push(stack.pop())
      }
      stack.push(t)
      prev = t
      continue
    }
    throw new Error('表达式错误')
  }

  while (stack.length) {
    const t = stack.pop()
    if (t.type === '(') throw new Error('括号不匹配')
    output.push(t)
  }
  return output
}

const evalRpn = (rpn) => {
  const st = []
  for (const t of rpn) {
    if (t.type === 'num') {
      st.push(t.value)
      continue
    }
    if (t.type === 'op') {
      const b = st.pop()
      const a = st.pop()
      if (a == null || b == null) throw new Error('表达式不完整')
      if (t.value === '+') st.push(a + b)
      else if (t.value === '-') st.push(a - b)
      else if (t.value === '*') st.push(a * b)
      else if (t.value === '/') st.push(a / b)
      else throw new Error('运算符错误')
      continue
    }
    throw new Error('表达式错误')
  }
  if (st.length !== 1) throw new Error('表达式不完整')
  return st[0]
}

const formatNumber = (n) => {
  if (!isFinite(n)) return '错误'
  const s = String(n)
  if (s.includes('e')) return s
  const rounded = Math.round(n * 1e12) / 1e12
  return String(rounded)
}

const evaluate = () => {
  const s = expression.value.trim()
  if (!s) return
  try {
    const tokens = tokenize(s)
    const rpn = toRpn(tokens)
    const v = evalRpn(rpn)
    result.value = formatNumber(v)
  } catch (e) {
    result.value = ''
    ElMessage.error(e?.message || '计算失败')
  }
}

const onKeydown = (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const t = e.target
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  const k = e.key
  if (k === 'Enter') {
    e.preventDefault()
    evaluate()
    return
  }
  if (k === 'Backspace') {
    e.preventDefault()
    backspace()
    return
  }
  if (k === 'Escape') {
    e.preventDefault()
    clearAll()
    return
  }
  if (k === '.' ) {
    e.preventDefault()
    appendDot()
    return
  }
  if (k === '(' || k === ')') {
    e.preventDefault()
    append(k)
    return
  }
  if (isDigit(k)) {
    e.preventDefault()
    append(k)
    return
  }
  if (isOperator(k)) {
    e.preventDefault()
    appendOperator(k)
  }
}

onMounted(() => {
  nextTick(() => {
    const el = document.querySelector('.calc-page')
    if (el && el.focus) el.focus()
  })
  window.addEventListener('keydown', onKeydown, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown, true)
})
</script>

<style scoped>
.calc-page {
  padding: 20px;
  min-height: 100%;
  outline: none;
  background:
    radial-gradient(1200px 600px at -200px -200px, rgba(79, 160, 255, 0.15) 0%, rgba(79, 160, 255, 0) 60%),
    radial-gradient(800px 400px at 120% 20%, rgba(86, 220, 160, 0.12) 0%, rgba(86, 220, 160, 0) 60%),
    linear-gradient(180deg, #eef5ff 0%, #f8fbff 100%);
}
.calc-card {
  max-width: 720px;
  margin: 0 auto;
  border-radius: 14px;
}
.screen {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 16px;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f6f9ff 100%);
  border: 1px solid #e6edf7;
}
.expr {
  font-size: 22px;
  color: #2c3e50;
  min-height: 30px;
  word-break: break-all;
}
.result {
  font-size: 40px;
  font-weight: 800;
  color: #1d3ee6;
  min-height: 48px;
  text-align: right;
}
.keys {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.key {
  height: 64px;
  font-size: 22px;
  border-radius: 14px;
}
.key-op {
  background: rgba(79, 128, 255, 0.10);
  color: #2b4eff;
}
.key-fn {
  background: rgba(255, 77, 79, 0.08);
  color: #d9363e;
}
.key-eq {
  height: 64px;
  font-weight: 700;
}
.key-wide {
  grid-column: span 2;
}
</style>
