// The Labs card format, shared by the labs command, the review bot, and the site build.
//
// A card is three lines, one field per line:
//
//   Name: ...
//   Major: ...
//   I want to build: ...

export const FIELDS = [
  { key: 'name', label: 'Name', max: 60, placeholder: 'the name you want shown' },
  { key: 'major', label: 'Major', max: 80, placeholder: 'your major, or Undecided' },
  { key: 'build', label: 'I want to build', max: 200, placeholder: 'one thing you want to build with AI' },
]

const LABELS = FIELDS.map((f) => f.label).join(', ')

export function cardPath(login) {
  return `members/${String(login).toLowerCase()}.md`
}

export function renderTemplate() {
  return FIELDS.map((f) => `${f.label}: [${f.placeholder}]`).join('\n') + '\n'
}

/** Read a card. Returns the values it found and every problem, in plain words. */
export function parseCard(text) {
  const values = {}
  const problems = []
  const seen = new Set()

  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim()
    if (line === '') continue
    const match = line.match(/^([^:]+):(.*)$/)
    if (!match) {
      problems.push(`The line "${clip(line)}" needs a label and a colon, like "Name: Sam".`)
      continue
    }
    const label = match[1].trim()
    const field = FIELDS.find((f) => f.label.toLowerCase() === label.toLowerCase())
    if (!field) {
      problems.push(`"${clip(label)}" isn't one of the card's lines. The card has three: ${LABELS}.`)
      continue
    }
    if (seen.has(field.key)) {
      problems.push(`"${field.label}" appears more than once. Keep just one.`)
      continue
    }
    seen.add(field.key)
    values[field.key] = match[2].trim()
  }

  for (const field of FIELDS) {
    if (!seen.has(field.key)) {
      problems.push(`The card is missing the line that starts with "${field.label}:".`)
    }
  }
  return { values, problems }
}

/** Parse and check every rule. `ok` is true only when there are no problems. */
export function validateCard(text) {
  const { values, problems } = parseCard(text)

  for (const field of FIELDS) {
    const value = values[field.key]
    if (value === undefined) continue
    if (value === '') {
      problems.push(`"${field.label}" is empty. Add your answer after the colon.`)
    } else if (value.includes('[') || value.includes(']')) {
      problems.push(`"${field.label}" still has the placeholder in square brackets. Replace it with your answer.`)
    } else if (value.length > field.max) {
      problems.push(`"${field.label}" is ${value.length} characters. Keep it to ${field.max} or fewer.`)
    }
    if (value.includes('<') || value.includes('>')) {
      problems.push(`"${field.label}" has a < or > in it. Cards are plain text, so leave those out.`)
    }
  }

  return { ok: problems.length === 0, values, problems }
}

function clip(s) {
  return s.length > 40 ? s.slice(0, 40) + '...' : s
}
