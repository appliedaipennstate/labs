// Small pieces of the labs command that do not touch git, the network, or the disk.

export const UPSTREAM = 'appliedaipennstate/labs'
export const WALL_URL = 'https://labs.appliedaipennstate.com/wall/'

export function loginFromEnv(env) {
  return env.GITHUB_USER ? String(env.GITHUB_USER).toLowerCase() : null
}

export function branchFor(login) {
  return `card/${login}`
}

export function prTitle(name) {
  return `Add ${name}'s Labs card`
}

/** The account that owns a GitHub remote URL, lowercased. */
export function ownerFromRemote(url) {
  const match = String(url).match(/github\.com[/:]([^/]+)\//)
  return match ? match[1].toLowerCase() : null
}

/** What `gh pr create --head` needs: owner:branch from a fork, the bare branch inside the club repo. */
export function headFor(originOwner, branch) {
  return originOwner === UPSTREAM.split('/')[0] ? branch : `${originOwner}:${branch}`
}

/** When a pull request already exists, gh prints its link in the error. */
export function existingPrUrl(stderr) {
  if (!/already exists/.test(stderr)) return null
  const match = stderr.match(/https:\/\/github\.com\/\S+\/pull\/\d+/)
  return match ? match[0] : null
}

export const PR_BODY = `This pull request adds one Labs card.

A pull request is how you propose a change to a project you don't own. The club's review bot will read the card, leave a comment, and merge it if everything checks out. Then it shows up on the wall: ${WALL_URL}
`
