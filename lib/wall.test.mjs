import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildWall } from './wall.mjs'

const card = (name) => `Name: ${name}\nMajor: Finance\nI want to build: Something useful\n`

test('cards come out newest first with their fields', () => {
  const wall = buildWall([
    { login: 'a', text: card('Ada'), addedAt: '2026-10-01T22:01:00Z' },
    { login: 'b', text: card('Ben'), addedAt: '2026-10-01T22:05:00Z' },
  ])
  assert.deepEqual(
    wall.map((c) => c.name),
    ['Ben', 'Ada']
  )
  assert.deepEqual(Object.keys(wall[0]).sort(), ['addedAt', 'build', 'login', 'major', 'name'])
})

test('invalid cards and the template are left off', () => {
  const wall = buildWall([
    { login: 'a', text: card('Ada'), addedAt: '2026-10-01T22:01:00Z' },
    { login: 'b', text: 'Name: [x]\n', addedAt: '2026-10-01T22:02:00Z' },
    { login: '_template', text: card('Nope'), addedAt: '2026-10-01T22:03:00Z' },
  ])
  assert.deepEqual(
    wall.map((c) => c.login),
    ['a']
  )
})

test('a card with no date sorts last', () => {
  const wall = buildWall([
    { login: 'a', text: card('Ada'), addedAt: null },
    { login: 'b', text: card('Ben'), addedAt: '2026-10-01T22:05:00Z' },
  ])
  assert.deepEqual(
    wall.map((c) => c.login),
    ['b', 'a']
  )
})
