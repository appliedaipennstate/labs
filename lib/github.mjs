// The one GitHub API call the labs command makes: opening the pull request.
// Uses the sign-in a Codespace already has, so nothing else needs installing.

const API = 'https://api.github.com'

/**
 * Open a pull request from owner:branch into upstream's main, or return the one already open.
 * @returns {Promise<{url: string, existed: boolean}>}
 */
export async function openPullRequest({ token, upstream, owner, branch, title, body, fetchImpl = fetch }) {
  const headers = {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'content-type': 'application/json',
  }
  const head = `${owner}:${branch}`
  const created = await fetchImpl(`${API}/repos/${upstream}/pulls`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, body, head, base: 'main', maintainer_can_modify: true }),
  })
  const data = await created.json()
  if (created.ok) return { url: data.html_url, existed: false }

  const already = (data.errors || []).some((e) => /already exists/i.test(e.message || ''))
  if (created.status === 422 && already) {
    const open = await fetchImpl(`${API}/repos/${upstream}/pulls?head=${encodeURIComponent(head)}&state=open`, { headers })
    const list = await open.json()
    if (open.ok && list.length > 0) return { url: list[0].html_url, existed: true }
  }
  throw new Error(data.message || `GitHub returned ${created.status}`)
}
