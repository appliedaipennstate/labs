// Shapes member cards into the rows the wall shows.

import { validateCard } from './card.mjs'

/**
 * @param {{login: string, text: string, addedAt: string|null}[]} entries
 * @returns {{login: string, name: string, major: string, build: string, addedAt: string|null}[]}
 */
export function buildWall(entries) {
  return entries
    .filter((e) => !e.login.startsWith('_'))
    .map((e) => ({ e, card: validateCard(e.text) }))
    .filter(({ card }) => card.ok)
    .map(({ e, card }) => ({ login: e.login, ...card.values, addedAt: e.addedAt }))
    .sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''))
}
