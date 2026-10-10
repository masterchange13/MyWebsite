<template>
  <input
    class="audio-progress"
    type="range"
    min="0"
    max="100"
    step="0.1"
    :value="displayPercent"
    :disabled="disabled"
    :aria-label="label"
    :style="{ '--progress': displayPercent + '%' }"
    @input="previewSeek"
    @change="commitSeek"
    @pointercancel="preview = null"
    @blur="preview = null"
  />
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  percent: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
  label: { type: String, default: '播放进度' },
})
const emit = defineEmits(['seek'])
const preview = ref(null)
const displayPercent = computed(() => {
  const value = preview.value ?? props.percent
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0
})

function previewSeek(event) {
  preview.value = Number(event.target.value)
}

function commitSeek(event) {
  if (!props.disabled) emit('seek', Number(event.target.value))
  preview.value = null
}
</script>

<style scoped>
.audio-progress {
  --fill: var(--app-accent, #40ce8f);
  --rail: rgba(150, 160, 175, 0.4);
  appearance: none;
  display: block;
  width: 100%;
  height: 24px;
  margin: 0;
  background: transparent;
  cursor: pointer;
  touch-action: pan-y;
}
.audio-progress:disabled { opacity: 0.5; cursor: default; }
.audio-progress::-webkit-slider-runnable-track {
  height: 5px;
  border-radius: 4px;
  background: linear-gradient(to right, var(--fill) var(--progress), var(--rail) var(--progress));
}
.audio-progress::-moz-range-track {
  height: 5px;
  border-radius: 4px;
  background: linear-gradient(to right, var(--fill) var(--progress), var(--rail) var(--progress));
}
.audio-progress::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  margin-top: -5.5px;
  border-radius: 50%;
  background: var(--fill);
}
.audio-progress::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border: 0;
  border-radius: 50%;
  background: var(--fill);
}
</style>
