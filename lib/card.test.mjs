import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateCard, cardPath, renderTemplate } from './card.mjs'

const good =
  'Name: Andy Salvo\nMajor: Corporate Innovation and Entrepreneurship\nI want to build: A tool that plans club meetings\n'

test('a filled card passes', () => {
  const r = validateCard(good)
  assert.equal(r.ok, true)
  assert.deepEqual(r.values, {
    name: 'Andy Salvo',
    major: 'Corporate Innovation and Entrepreneurship',
    build: 'A tool that plans club meetings',
  })
  assert.deepEqual(r.problems, [])
})

test('the untouched template fails with a placeholder problem', () => {
  const r = validateCard(renderTemplate())
  assert.equal(r.ok, false)
  assert.match(r.problems.join(' '), /still has the placeholder/)
})

test('a missing line is named', () => {
  const r = validateCard('Name: A\nMajor: B\n')
  assert.equal(r.ok, false)
  assert.match(r.problems.join(' '), /I want to build/)
})

test('an empty value is reported', () => {
  const r = validateCard('Name:\nMajor: B\nI want to build: C\n')
  assert.equal(r.ok, false)
  assert.match(r.problems.join(' '), /Name/)
})

test('too long is reported with the limit', () => {
  const r = validateCard(`Name: ${'x'.repeat(61)}\nMajor: B\nI want to build: C\n`)
  assert.equal(r.ok, false)
  assert.match(r.problems.join(' '), /60/)
})

test('angle brackets are refused', () => {
  const r = validateCard('Name: <b>A</b>\nMajor: B\nI want to build: C\n')
  assert.equal(r.ok, false)
})

test('unknown and repeated lines are refused', () => {
  assert.equal(validateCard(good + 'Website: x\n').ok, false)
  assert.equal(validateCard(good + 'Name: again\n').ok, false)
})

test('a line without a colon is refused', () => {
  assert.equal(validateCard(good + 'hello there\n').ok, false)
})

test('blank lines and extra spaces are fine', () => {
  const r = validateCard('\nName:   A  \n\nMajor: B\r\nI want to build: C')
  assert.equal(r.ok, true)
  assert.equal(r.values.name, 'A')
})

test('cardPath lowercases the login', () => {
  assert.equal(cardPath('AndySalvo'), 'members/andysalvo.md')
})
