// Fills the wall from wall.json and checks for new cards every 15 seconds.
// Card text is only ever set with textContent.

const wall = document.querySelector('[data-wall]')
const count = document.querySelector('[data-count]')
const seen = new Set()
let first = true

function el(tag, className, text) {
  const node = document.createElement(tag)
  node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function render(cards) {
  count.textContent = cards.length === 1 ? '1 card on the wall' : `${cards.length} cards on the wall`
  if (cards.length === 0) {
    wall.replaceChildren(el('p', 'empty', 'No cards yet. Yours could be the first.'))
    return
  }
  const nodes = cards.map((c) => {
    const card = el('article', 'card')
    if (!first && !seen.has(c.login)) card.classList.add('new')
    card.append(
      el('p', 'name', c.name),
      el('p', 'major', c.major),
      el('p', 'build-label', 'Wants to build'),
      el('p', 'build', c.build)
    )
    return card
  })
  wall.replaceChildren(...nodes)
  for (const c of cards) seen.add(c.login)
  first = false
}

async function refresh() {
  try {
    const res = await fetch(`/wall.json?t=${Date.now()}`, { cache: 'no-store' })
    if (res.ok) render((await res.json()).cards)
  } catch {
    // Keep showing the last good wall.
  }
}

refresh()
setInterval(refresh, 15000)

for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy)
      button.textContent = 'Copied'
      setTimeout(() => (button.textContent = 'Copy'), 2000)
    } catch {
      button.textContent = 'Select the text and copy it'
    }
  })
}
