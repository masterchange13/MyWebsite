import assert from 'node:assert/strict'
import test from 'node:test'
import { getOrderedSubmenuItems } from '../src/utils/siteSettings.js'

test('existing media preferences gain the ebooks route without losing existing entries', () => {
  const media = getOrderedSubmenuItems('media', ['music', 'video', 'document', 'transfer', 'todoList'])
  assert.equal(media.find(item => item.id === 'ebooks')?.path, '/ebooks')
  assert.deepEqual(media.filter(item => item.id !== 'ebooks').map(item => item.id), ['music', 'video', 'document', 'transfer', 'todoList'])
})

test('terminal is present in tools even for saved menus predating the feature', () => {
  const tools = getOrderedSubmenuItems('tools', ['calculator', 'timer', 'qiMen', 'agent'])
  assert.equal(tools.find(item => item.id === 'terminal')?.path, '/terminal')
  assert.equal(tools.filter(item => item.id === 'terminal').length, 1)
})
