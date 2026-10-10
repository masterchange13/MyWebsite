import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { compileScript, parse } from '@vue/compiler-sfc'
import { computed, ref } from 'vue'

const filename = new URL('../src/Components/music/AudioProgress.vue', import.meta.url)
const { descriptor } = parse(fs.readFileSync(filename, 'utf8'))
const compiled = compileScript(descriptor, { id: 'audio-progress-test', genDefaultAs: 'component' })
const component = new Function('computed', 'ref', `${compiled.content.replace(/^import .*$/gm, '')}\nreturn component`)(computed, ref)

function mount(props) {
  const events = []
  const state = component.setup(props, { expose() {}, emit: (...event) => events.push(event) })
  return { state, events }
}

test('drag preview stays at the selected position despite playback updates', () => {
  const props = { percent: 10, disabled: false }
  const { state, events } = mount(props)
  state.previewSeek({ target: { value: '72.5' } })
  props.percent = 11
  assert.equal(state.displayPercent.value, 72.5)
  assert.deepEqual(events, [])
  state.commitSeek({ target: { value: '72.5' } })
  assert.deepEqual(events, [['seek', 72.5]])
  assert.equal(state.preview.value, null)
})

test('disabled progress does not seek before metadata arrives', () => {
  const { state, events } = mount({ percent: 0, disabled: true })
  state.commitSeek({ target: { value: '50' } })
  assert.deepEqual(events, [])
})

test('invalid duration-derived progress never displays NaN or infinity', () => {
  for (const percent of [NaN, Infinity]) {
    const { state } = mount({ percent, disabled: true })
    assert.equal(state.displayPercent.value, 0)
  }
})
