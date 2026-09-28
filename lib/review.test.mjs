import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decideReview, MARKER } from './review.mjs'

const good = 'Name: Sam Lee\nMajor: Finance\nI want to build: A budget helper for my club\n'
const card = (filename, status = 'added') => ({ filename, status })

test('a good card from its owner is merged', () => {
  const d = decideReview({ author: 'SamLee', authorAssociation: 'NONE', files: [card('members/samlee.md')], content: good })
  assert.equal(d.action, 'merge')
  assert.ok(d.body.startsWith(MARKER))
})

test('updating your own card is fine', () => {
  const d = decideReview({ author: 'samlee', authorAssociation: 'CONTRIBUTOR', files: [card('members/samlee.md', 'modified')], content: good })
  assert.equal(d.action, 'merge')
})

test('a card with problems gets a fix comment listing them', () => {
  const d = decideReview({ author: 'samlee', authorAssociation: 'NONE', files: [card('members/samlee.md')], content: 'Name: Sam\n' })
  assert.equal(d.action, 'fix')
  assert.match(d.body, /Major/)
  assert.match(d.body, /labs submit/)
})

test('a card named for someone else gets a fix naming the right path', () => {
  const d = decideReview({ author: 'samlee', authorAssociation: 'NONE', files: [card('members/someoneelse.md')], content: good })
  assert.equal(d.action, 'fix')
  assert.match(d.body, /members\/samlee\.md/)
})

test('two cards in one pull request is a fix', () => {
  const d = decideReview({ author: 'samlee', authorAssociation: 'NONE', files: [card('members/samlee.md'), card('members/other.md')], content: null })
  assert.equal(d.action, 'fix')
})

test('deleting a card is a fix for members', () => {
  const d = decideReview({ author: 'samlee', authorAssociation: 'NONE', files: [card('members/samlee.md', 'removed')], content: null })
  assert.equal(d.action, 'fix')
})

test('editing the template is a fix for members', () => {
  const d = decideReview({ author: 'samlee', authorAssociation: 'NONE', files: [card('members/_template.md', 'modified')], content: good })
  assert.equal(d.action, 'fix')
})

test('a change outside members/ from an outsider is not a card', () => {
  const d = decideReview({ author: 'samlee', authorAssociation: 'NONE', files: [card('site/index.html', 'modified')], content: null })
  assert.equal(d.action, 'not-a-card')
})

test('maintainers are left alone unless they submit their own valid card', () => {
  const skip = decideReview({ author: 'andysalvo', authorAssociation: 'OWNER', files: [card('site/index.html', 'modified')], content: null })
  assert.equal(skip.action, 'skip')
  assert.equal(skip.body, null)
  const other = decideReview({ author: 'andysalvo', authorAssociation: 'MEMBER', files: [card('members/samlee.md', 'removed')], content: null })
  assert.equal(other.action, 'skip')
  const own = decideReview({ author: 'andysalvo', authorAssociation: 'OWNER', files: [card('members/andysalvo.md')], content: good })
  assert.equal(own.action, 'merge')
})

test('an unreadable card is a fix, not a crash', () => {
  const d = decideReview({ author: 'samlee', authorAssociation: 'NONE', files: [card('members/samlee.md')], content: null })
  assert.equal(d.action, 'fix')
})
