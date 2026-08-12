<template>
  <div class="app-shell">
    <div v-if="websiteSettings.showPetals" class="global-petal-layer">
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
import { computed, watch, onMounted } from 'vue'
import { useWebsiteSettingsStore } from '@/stores/websiteSettingsStore'

const websiteSettings = useWebsiteSettingsStore()

onMounted(async () => {
  await websiteSettings.loadSettings()
})

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

websiteSettings.normalizeOrders()
const appearanceSignature = computed(() => [
  websiteSettings.theme,
  websiteSettings.density,
  websiteSettings.surfaceStyle,
  websiteSettings.cornerStyle,
  websiteSettings.fontScale
].join('|'))
watch(
  appearanceSignature,
  () => websiteSettings.applyAppearance(),
  { immediate: true }
)
</script>

<style>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
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
  --app-bg-glow-left: rgba(0, 245, 255, 0.07);
  --app-bg-glow-right: rgba(255, 0, 204, 0.06);
  --app-shell-bg: linear-gradient(180deg, #090a1a 0%, #0d1022 100%);
  --app-header-bg: rgba(6, 8, 20, 0.9);
  --app-header-border: rgba(0, 220, 230, 0.16);
  --app-surface: rgba(8, 12, 28, 0.82);
  --app-surface-strong: rgba(6, 8, 20, 0.92);
  --app-surface-soft: rgba(0, 245, 255, 0.08);
  --app-surface-soft-alt: rgba(255, 0, 204, 0.12);
  --app-text-main: #d4f7ff;
  --app-text-strong: #f0feff;
  --app-text-muted: #8dbec8;
  --app-text-soft: #88a7bf;
  --app-accent: #00f5ff;
  --app-accent-strong: #65d5dc;
  --app-accent-soft: rgba(0, 245, 255, 0.12);
  --app-accent-alt: #ff00cc;
  --app-accent-alt-strong: #cc79be;
  --app-accent-alt-soft: rgba(255, 0, 204, 0.12);
  --app-shadow-soft: 0 0 10px rgba(0, 245, 255, 0.06);
  --app-shadow-strong: 0 10px 24px rgba(0, 220, 230, 0.05);
  --app-button-primary: linear-gradient(90deg, #ff007f 0%, #6f00ff 100%);
  --app-button-text: #ffffff;
  --login-character-1: #ff9a9e;
  --login-character-2: #a18cd1;
  --login-character-3: #fad0c4;
  --app-page-padding: 24px;
  --app-page-gap: 18px;
  --app-card-padding: 20px;
  --app-card-backdrop: blur(14px);
  --app-card-outline-width: 1px;
  --app-card-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
  --app-radius-sm: 10px;
  --app-radius-md: 16px;
  --app-radius-lg: 22px;
  --app-font-scale: 1;
}

body {
  font-size: calc(16px * var(--app-font-scale));
  color: var(--cyber-text);
  background:
    radial-gradient(1100px 500px at -260px -240px, var(--app-bg-glow-left) 0%, rgba(0, 245, 255, 0) 60%),
    radial-gradient(900px 440px at 120% -10%, var(--app-bg-glow-right) 0%, rgba(255, 0, 204, 0) 60%),
    var(--app-shell-bg);
}

.el-card {
  border-color: var(--cyber-border) !important;
  background: var(--cyber-panel) !important;
  border-width: var(--app-card-outline-width) !important;
  border-radius: var(--app-radius-lg) !important;
  box-shadow: var(--app-card-shadow) !important;
  backdrop-filter: var(--app-card-backdrop);
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
  border-radius: var(--app-radius-md) !important;
}

.el-input__inner,
.el-textarea__inner {
  color: var(--cyber-text) !important;
}

.el-button:not(.is-text):not(.is-link) {
  border-radius: var(--app-radius-md) !important;
}

/* Global dropdown tone down */
.el-select-dropdown {
  background: rgba(8, 12, 26, 0.96) !important;
  border: 1px solid rgba(0, 220, 230, 0.2) !important;
  box-shadow: 0 0 10px rgba(0, 220, 230, 0.08) !important;
}

.el-select-dropdown__item {
  color: #9abec7 !important;
}

.el-select-dropdown__item.hover,
.el-select-dropdown__item:hover {
  background: rgba(170, 0, 135, 0.12) !important;
  color: #cc79be !important;
}

.el-select-dropdown__item.is-selected {
  color: #65d5dc !important;
  background: rgba(0, 220, 230, 0.12) !important;
}

@media (max-width: 900px) {
  .global-petal:nth-child(n+9) {
    display: none;
  }
}

/* 移动端触摸优化 */
button, .el-button, .el-card, .el-menu-item, .el-radio-button, .guide-link {
  touch-action: manipulation;
}

@media (max-width: 768px) {
  .el-dialog {
    width: 92% !important;
    max-width: 92vw !important;
  }
  .el-drawer {
    width: 85% !important;
    max-width: 300px !important;
  }
  .el-message {
    min-width: auto !important;
    max-width: 85vw;
    padding: 10px 16px;
    font-size: 13px;
  }
}
</style>
