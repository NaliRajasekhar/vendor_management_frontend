const KEY = 'vendors:data'

function read() {
  const raw = localStorage.getItem(KEY)
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function listActive() {
  return read().filter(v => v.active !== false)
}

export function getById(id) {
  return read().find(v => String(v.id) === String(id)) || null
}

export function add(item) {
  const items = read()
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
  const toSave = { ...item, id, active: item.active !== false }
  items.push(toSave)
  write(items)
  return toSave
}

export function update(id, patch) {
  const items = read()
  const idx = items.findIndex(v => String(v.id) === String(id))
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...patch }
  write(items)
  return items[idx]
}

