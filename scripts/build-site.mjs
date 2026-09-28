// Builds the Labs site into _site/: the static pages plus wall.json from members/*.md.
// Run from the repo root with full git history so each card's add date is known.

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { buildWall } from '../lib/wall.mjs'

const OUT = '_site'
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT)
cpSync('site', OUT, { recursive: true })

const entries = readdirSync('members')
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const path = `members/${f}`
    let addedAt = null
    try {
      addedAt = execFileSync('git', ['log', '--diff-filter=A', '--format=%cI', '-1', '--', path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null
    } catch {}
    return { login: f.replace(/\.md$/, ''), text: readFileSync(path, 'utf8'), addedAt }
  })

const cards = buildWall(entries)
writeFileSync(`${OUT}/wall.json`, JSON.stringify({ updatedAt: new Date().toISOString(), cards }, null, 2))
writeFileSync(`${OUT}/CNAME`, 'labs.appliedaipennstate.com\n')
console.log(`Built ${OUT}/ with ${cards.length} card${cards.length === 1 ? '' : 's'} on the wall.`)
