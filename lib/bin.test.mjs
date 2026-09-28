import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

test('the labs command parses and prints its help', () => {
  const r = spawnSync(process.execPath, ['bin/labs', 'help'], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /labs submit/)
})
