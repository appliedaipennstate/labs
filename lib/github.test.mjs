import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openPullRequest } from './github.mjs'

function fakeFetch(responses) {
  const calls = []
  const impl = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : null })
    const [status, data] = responses.shift()
    return { status, ok: status >= 200 && status < 300, json: async () => data }
  }
  return { impl, calls }
}

const args = {
  token: 't',
  upstream: 'appliedaipennstate/labs',
  owner: 'samlee',
  branch: 'card/samlee',
  title: "Add Sam's Labs card",
  body: 'b',
}

test('opens a pull request from the fork branch', async () => {
  const { impl, calls } = fakeFetch([[201, { html_url: 'https://github.com/appliedaipennstate/labs/pull/9' }]])
  const r = await openPullRequest({ ...args, fetchImpl: impl })
  assert.deepEqual(r, { url: 'https://github.com/appliedaipennstate/labs/pull/9', existed: false })
  assert.equal(calls[0].method, 'POST')
  assert.equal(calls[0].url, 'https://api.github.com/repos/appliedaipennstate/labs/pulls')
  assert.equal(calls[0].body.head, 'samlee:card/samlee')
  assert.equal(calls[0].body.base, 'main')
})

test('when one is already open, returns that one', async () => {
  const { impl, calls } = fakeFetch([
    [422, { message: 'Validation Failed', errors: [{ message: 'A pull request already exists for samlee:card/samlee.' }] }],
    [200, [{ html_url: 'https://github.com/appliedaipennstate/labs/pull/4' }]],
  ])
  const r = await openPullRequest({ ...args, fetchImpl: impl })
  assert.deepEqual(r, { url: 'https://github.com/appliedaipennstate/labs/pull/4', existed: true })
  assert.match(calls[1].url, /pulls\?head=samlee%3Acard%2Fsamlee&state=open/)
})

test('any other failure throws with GitHub message', async () => {
  const { impl } = fakeFetch([[403, { message: 'Resource not accessible by integration' }]])
  await assert.rejects(openPullRequest({ ...args, fetchImpl: impl }), /Resource not accessible/)
})
