// Runs in the "Review card" workflow. Reads one pull request through the API, decides
// with lib/review.mjs, leaves or updates one comment, and merges when the card passes.
// It never checks out or runs code from the pull request. The card is read as text.

import { appendFileSync } from 'node:fs'
import { decideReview, MARKER } from '../lib/review.mjs'

const { GITHUB_TOKEN, REPO, PR_NUMBER, GITHUB_OUTPUT } = process.env
if (!GITHUB_TOKEN || !REPO || !PR_NUMBER) throw new Error('GITHUB_TOKEN, REPO and PR_NUMBER are required')

async function api(method, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      authorization: `Bearer ${GITHUB_TOKEN}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  return { status: res.status, ok: res.ok, data: text ? JSON.parse(text) : null }
}

function output(merged) {
  if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, `merged=${merged}\n`)
  console.log(`merged=${merged}`)
}

async function upsertComment(body) {
  const comments = await api('GET', `/repos/${REPO}/issues/${PR_NUMBER}/comments?per_page=100`)
  const mine = (comments.data || []).find((c) => c.user?.type === 'Bot' && c.body?.startsWith(MARKER))
  if (mine) await api('PATCH', `/repos/${REPO}/issues/comments/${mine.id}`, { body })
  else await api('POST', `/repos/${REPO}/issues/${PR_NUMBER}/comments`, { body })
}

const pr = (await api('GET', `/repos/${REPO}/pulls/${PR_NUMBER}`)).data
if (!pr || pr.state !== 'open') {
  console.log('Pull request is not open. Nothing to do.')
  output(false)
  process.exit(0)
}

const files = ((await api('GET', `/repos/${REPO}/pulls/${PR_NUMBER}/files?per_page=100`)).data || []).map((f) => ({
  filename: f.filename,
  status: f.status,
}))

let content = null
if (files.length === 1 && files[0].status !== 'removed' && pr.head.repo) {
  const path = files[0].filename.split('/').map(encodeURIComponent).join('/')
  const file = await api('GET', `/repos/${pr.head.repo.full_name}/contents/${path}?ref=${pr.head.sha}`)
  if (file.ok && file.data?.encoding === 'base64' && file.data.size <= 4096) {
    content = Buffer.from(file.data.content, 'base64').toString('utf8')
  }
}

const decision = decideReview({
  author: pr.user.login,
  authorAssociation: pr.author_association,
  files,
  content,
})
console.log(`Decision for #${PR_NUMBER} by ${pr.user.login}: ${decision.action}`)

if (decision.action !== 'merge') {
  if (decision.body) await upsertComment(decision.body)
  output(false)
  process.exit(0)
}

// Several cards can land at once. Each adds a different file, so a retry is enough
// when GitHub is still settling the previous merge.
let merged = false
for (let attempt = 1; attempt <= 4 && !merged; attempt++) {
  const res = await api('PUT', `/repos/${REPO}/pulls/${PR_NUMBER}/merge`, {
    merge_method: 'squash',
    sha: pr.head.sha,
    commit_title: `${pr.title} (#${PR_NUMBER})`,
  })
  merged = res.ok
  if (!merged) {
    console.log(`Merge attempt ${attempt} returned ${res.status}: ${res.data?.message}`)
    await new Promise((done) => setTimeout(done, attempt * 3000))
  }
}

await upsertComment(
  merged
    ? decision.body
    : `${MARKER}\n**Your card passed review**, but the bot couldn't merge it automatically. A board member will merge it shortly.\n`
)
output(merged)
