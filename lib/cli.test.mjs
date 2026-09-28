import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loginFromEnv, branchFor, prTitle, ownerFromRemote, headFor, existingPrUrl } from './cli.mjs'

test('loginFromEnv reads and lowercases GITHUB_USER', () => {
  assert.equal(loginFromEnv({ GITHUB_USER: 'AndySalvo' }), 'andysalvo')
  assert.equal(loginFromEnv({}), null)
})

test('branchFor names the branch after the login', () => {
  assert.equal(branchFor('andysalvo'), 'card/andysalvo')
})

test('prTitle uses the name on the card', () => {
  assert.equal(prTitle('Andy Salvo'), "Add Andy Salvo's Labs card")
})

test('ownerFromRemote handles https and ssh remotes', () => {
  assert.equal(ownerFromRemote('https://github.com/andysalvo/labs.git'), 'andysalvo')
  assert.equal(ownerFromRemote('https://github.com/appliedaipennstate/labs'), 'appliedaipennstate')
  assert.equal(ownerFromRemote('git@github.com:SomeOne/labs.git'), 'someone')
  assert.equal(ownerFromRemote('not a url'), null)
})

test('headFor points at the fork, or at the branch alone inside the club repo', () => {
  assert.equal(headFor('andysalvo', 'card/andysalvo'), 'andysalvo:card/andysalvo')
  assert.equal(headFor('appliedaipennstate', 'card/andysalvo'), 'card/andysalvo')
})

test('existingPrUrl finds the link gh prints when a PR already exists', () => {
  const err =
    'a pull request for branch "andysalvo:card/andysalvo" into branch "main" already exists:\nhttps://github.com/appliedaipennstate/labs/pull/7\n'
  assert.equal(existingPrUrl(err), 'https://github.com/appliedaipennstate/labs/pull/7')
  assert.equal(existingPrUrl('some other error'), null)
})
