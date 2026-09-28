// What the review bot does with a pull request, decided from data alone.
// The workflow fetches the files and the card text; nothing here touches the network.

import { validateCard, cardPath } from './card.mjs'

export const MARKER = '<!-- labs-review -->'
const WALL_URL = 'https://labs.appliedaipennstate.com/wall/'
const MAINTAINERS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR'])

const MERGED_BODY = `${MARKER}
**Your card passed review and has been merged.**

Here's what just happened:

1. You opened a **pull request**, which is a proposal to add your change to someone else's project. Here, that's the club's.
2. The club's review bot read your card and checked it against the rules. That's a **review**. On real teams, every change gets reviewed by a teammate or an automated check before it goes in.
3. Your card passed, so the bot **merged** it. It's now part of the project.

Your card will show up on the wall in about a minute: ${WALL_URL}
`

const fixBody = (problems) => `${MARKER}
**Almost there. Your card needs ${problems.length === 1 ? 'one fix' : 'a few fixes'} before it can be merged:**

${problems.map((p) => `- ${p}`).join('\n')}

To fix it, open your card in your Codespace, make the change, and run \`labs submit\` again. This pull request will update, and the bot will check it again.
`

const NOT_A_CARD_BODY = `${MARKER}
Thanks for the pull request. This bot only reviews Labs cards, which are a single file in \`members/\`, so a board member will take a look at this one.
`

/**
 * @param {{author: string, authorAssociation: string, files: {filename: string, status: string}[], content: string|null}} pr
 * @returns {{action: 'merge'|'fix'|'skip'|'not-a-card', body: string|null}}
 */
export function decideReview({ author, authorAssociation, files, content }) {
  const maintainer = MAINTAINERS.has(authorAssociation)
  const expected = cardPath(author)
  const onlyCards = files.length > 0 && files.every((f) => f.filename.startsWith('members/'))
  const ownCard =
    files.length === 1 && files[0].filename.toLowerCase() === expected && files[0].status !== 'removed'

  if (maintainer && !ownCard) return { action: 'skip', body: null }
  if (!onlyCards) return { action: 'not-a-card', body: NOT_A_CARD_BODY }

  if (files.length !== 1) {
    return {
      action: 'fix',
      body: fixBody([`This pull request changes ${files.length} files. A card pull request changes just one: \`${expected}\`.`]),
    }
  }
  const [file] = files
  if (file.status === 'removed') {
    return { action: 'fix', body: fixBody(['This pull request deletes a card. It should add or update yours instead.']) }
  }
  if (file.filename.toLowerCase() !== expected) {
    return {
      action: 'fix',
      body: fixBody([`Your card is at \`${file.filename}\`. It needs to be at \`${expected}\` so it matches your GitHub username.`]),
    }
  }
  if (content === null) {
    return { action: 'fix', body: fixBody(["The bot couldn't read your card. Run `labs submit` again."]) }
  }

  const result = validateCard(content)
  if (!result.ok) return { action: 'fix', body: fixBody(result.problems) }
  return { action: 'merge', body: MERGED_BODY }
}
