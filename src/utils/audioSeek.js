// Changing currentTime preserves the audio element's playing/paused state.
// fastSeek is approximate; use precise seeking for the progress controls.
export function seekAudio(audio, percent) {
  if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0 || !Number.isFinite(percent)) return false
  audio.currentTime = Math.max(0, Math.min(100, percent)) * audio.duration / 100
  return true
}
