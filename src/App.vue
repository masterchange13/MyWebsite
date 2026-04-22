<template>
  <div class="app-shell">
    <div class="global-petal-layer">
      <span
        v-for="i in petals"
        :key="i"
        class="global-petal"
        :style="getPetalStyle(i)"
      ></span>
    </div>
    <RouterView></RouterView>
  </div>
</template>

<script setup>
const petals = Array.from({ length: 14 }, (_, i) => i + 1)

const getPetalStyle = (i) => {
  const left = (i * 11) % 100
  const delay = -((i * 2.1) % 18)
  const dur = 14 + ((i * 1.2) % 10)
  const size = 10 + ((i * 2.2) % 10)
  const drift = 10 + ((i * 3.4) % 18)
  const opacity = 0.14 + ((i % 5) * 0.05)
  return {
    '--x': `${left}vw`,
    '--delay': `${delay}s`,
    '--dur': `${dur}s`,
    '--size': `${size}px`,
    '--drift': `${drift}px`,
    '--opa': `${Math.min(opacity, 0.56)}`
  }
}
</script>

<style>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#app {
  height: 100vh;
  overflow: hidden;
}

.app-shell {
  position: relative;
  height: 100%;
}

.global-petal-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 999;
}

.global-petal {
  position: absolute;
  left: var(--x);
  top: -12vh;
  width: var(--size);
  height: calc(var(--size) * 0.76);
  opacity: var(--opa);
  border-radius: 70% 30% 70% 30%;
  background:
    radial-gradient(circle at 28% 30%, rgba(255, 255, 255, 0.9) 0 34%, rgba(255, 255, 255, 0.08) 75%),
    linear-gradient(145deg, rgba(255, 200, 231, 0.82), rgba(255, 245, 255, 0.5));
  animation: globalPetalFall var(--dur) linear infinite;
  animation-delay: var(--delay);
  transform-origin: center;
}

@keyframes globalPetalFall {
  0% { transform: translate3d(0, -8vh, 0) rotate(0deg); }
  50% { transform: translate3d(calc(var(--drift) * 0.8), 52vh, 0) rotate(180deg); }
  100% { transform: translate3d(calc(var(--drift) * -0.5), 112vh, 0) rotate(360deg); }
}

:root {
  --cyber-bg-1: #090a1a;
  --cyber-bg-2: #0d1022;
  --cyber-panel: rgba(8, 12, 28, 0.78);
  --cyber-border: rgba(0, 255, 255, 0.24);
  --cyber-text: #d4f7ff;
  --cyber-subtext: #88a7bf;
  --cyber-cyan: #00f5ff;
  --cyber-pink: #ff00cc;
}

body {
  color: var(--cyber-text);
  background:
    radial-gradient(1100px 500px at -260px -240px, rgba(0, 245, 255, 0.07) 0%, rgba(0, 245, 255, 0) 60%),
    linear-gradient(180deg, var(--cyber-bg-1) 0%, var(--cyber-bg-2) 100%);
}

.el-card {
  border-color: var(--cyber-border) !important;
  background: var(--cyber-panel) !important;
  box-shadow: 0 0 10px rgba(0, 245, 255, 0.06) !important;
}

.el-card__header {
  border-bottom-color: rgba(0, 255, 255, 0.16) !important;
}

.el-input__wrapper,
.el-textarea__inner,
.el-select__wrapper {
  background: rgba(11, 17, 35, 0.9) !important;
  box-shadow: inset 0 0 0 1px rgba(0, 255, 255, 0.24) !important;
  color: var(--cyber-text) !important;
}

.el-input__inner,
.el-textarea__inner {
  color: var(--cyber-text) !important;
}

.el-button:not(.is-text):not(.is-link) {
  border-radius: 10px !important;
}

@media (max-width: 900px) {
  .global-petal:nth-child(n+9) {
    display: none;
  }
}
</style>
