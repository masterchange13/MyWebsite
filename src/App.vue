<template>
    <RouterView></RouterView>
</template>

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
    radial-gradient(1200px 520px at -240px -240px, rgba(0, 245, 255, 0.12) 0%, rgba(0, 245, 255, 0) 60%),
    radial-gradient(900px 520px at 120% 0, rgba(255, 0, 204, 0.10) 0%, rgba(255, 0, 204, 0) 60%),
    linear-gradient(180deg, var(--cyber-bg-1) 0%, var(--cyber-bg-2) 100%);
}

.el-card {
  border-color: var(--cyber-border) !important;
  background: var(--cyber-panel) !important;
  box-shadow: 0 0 18px rgba(0, 245, 255, 0.10), 0 0 34px rgba(255, 0, 204, 0.06) !important;
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
</style>
