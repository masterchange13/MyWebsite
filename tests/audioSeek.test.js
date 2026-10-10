import assert from 'node:assert/strict'
import test from 'node:test'
import { seekAudio } from '../src/utils/audioSeek.js'

test('seeking forward and backward is exact and keeps the same source', () => {
  const audio = { duration: 200, currentTime: 3, paused: false, src: '/api/media/music/audio/song.mp3', fastSeek() { throw new Error('Approximate seek must not be used') } }
  const source = audio.src
  assert.equal(seekAudio(audio, 75), true)
  assert.equal(audio.currentTime, 150)
  assert.equal(seekAudio(audio, 25), true)
  assert.equal(audio.currentTime, 50)
  assert.equal(audio.src, source)
  assert.equal(audio.paused, false)
})

test('seeking paused audio leaves it paused', () => {
  const audio = { duration: 100, currentTime: 0, paused: true, play() { throw new Error('Must stay paused') } }
  seekAudio(audio, 45)
  assert.equal(audio.currentTime, 45)
  assert.equal(audio.paused, true)
})

test('metadata must be available before seeking', () => {
  for (const duration of [NaN, Infinity, 0, -1]) {
    const audio = { duration, currentTime: 7 }
    assert.equal(seekAudio(audio, 50), false)
    assert.equal(audio.currentTime, 7)
  }
  assert.equal(seekAudio(null, 50), false)
})

test('progress bounds are clamped and invalid values ignored', () => {
  const audio = { duration: 80, currentTime: 2 }
  seekAudio(audio, -10)
  assert.equal(audio.currentTime, 0)
  seekAudio(audio, 110)
  assert.equal(audio.currentTime, 80)
  assert.equal(seekAudio(audio, NaN), false)
  assert.equal(audio.currentTime, 80)
})
