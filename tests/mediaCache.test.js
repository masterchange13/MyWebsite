import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const source = fs.readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')

function fetchEvent({ url, destination = '', range = '' }) {
  const listeners = {}
  let handled = false
  const networkCalls = []
  vm.runInNewContext(source, {
    URL, Response,
    self: { addEventListener: (name, callback) => { listeners[name] = callback } },
    caches: { match() { throw new Error('Media must not use the offline cache') } },
    fetch: async request => { networkCalls.push(request); return new Response('ok') },
  })
  const request = { url, destination, headers: new Headers(range ? { Range: range } : {}) }
  listeners.fetch({ request, respondWith() { handled = true } })
  return { handled, networkCalls }
}

test('range requests bypass cached full responses for every URL', () => {
  for (const url of ['http://localhost/api/media/music/audio/song.mp3', 'http://localhost/audio/song.mp3', 'https://example.org/song.mp3']) {
    const result = fetchEvent({ url, range: 'bytes=8000-' })
    assert.equal(result.handled, false)
    assert.equal(result.networkCalls.length, 0)
  }
})

test('media requests always use the browser network, even before the first range', () => {
  for (const destination of ['audio', 'video']) {
    assert.equal(fetchEvent({ url: 'http://localhost/audio/song.mp3', destination }).handled, false)
  }
})

test('ordinary APIs retain their network handling', () => {
  const result = fetchEvent({ url: 'http://localhost/api/music/list' })
  assert.equal(result.handled, true)
  assert.equal(result.networkCalls.length, 1)
})
