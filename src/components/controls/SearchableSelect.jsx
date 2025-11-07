import { useEffect, useMemo, useRef, useState } from 'react'

export default function SearchableSelect({
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  getOptionLabel = (o) => (typeof o === 'string' ? o : o?.label ?? ''),
  getOptionValue = (o) => (typeof o === 'string' ? o : o?.value ?? ''),
}) {
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const flatOptions = useMemo(() => options.map(o => ({ label: getOptionLabel(o), value: getOptionValue(o) })), [options, getOptionLabel, getOptionValue])

  useEffect(() => {
    const selected = flatOptions.find(o => String(o.value) === String(value))
    if (selected && !open) setQuery(selected.label)
    if (!selected && !open) setQuery('')
  }, [value, flatOptions, open])

  const filtered = useMemo(() => {
    const q = String(query || '').toLowerCase()
    if (!q) return flatOptions
    return flatOptions.filter(o => o.label.toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q))
  }, [query, flatOptions])

  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target)) {
        setOpen(false)
        // restore selection label when closing if query doesn't match a selection
        const selected = flatOptions.find(o => String(o.value) === String(value))
        if (selected) setQuery(selected.label)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [flatOptions, value])

  function commit(valueToSet) {
    if (disabled) return
    const selected = flatOptions.find(o => String(o.value) === String(valueToSet))
    if (selected) setQuery(selected.label)
    onChange?.(valueToSet)
    setOpen(false)
    inputRef.current?.blur()
  }

  function onKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      e.preventDefault()
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      setActiveIndex(i => Math.min(filtered.length - 1, i + 1))
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      setActiveIndex(i => Math.max(0, i - 1))
      e.preventDefault()
    } else if (e.key === 'Enter') {
      const opt = filtered[activeIndex]
      if (opt) commit(opt.value)
      e.preventDefault()
    } else if (e.key === 'Escape') {
      setOpen(false)
      e.preventDefault()
    }
  }

  return (
    <div ref={containerRef} className={`searchable-select ${disabled ? 'disabled' : ''}`}>
      <input
        id={id}
        ref={inputRef}
        type="text"
        disabled={disabled}
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(0) }}
        onFocus={() => { setOpen(true) }}
        onKeyDown={onKeyDown}
      />
      <span className="select-caret" aria-hidden>▾</span>
      {open && (
        <div className="options" role="listbox">
          {filtered.length === 0 && (
            <div className="option empty" aria-disabled> No matches </div>
          )}
          {filtered.map((opt, idx) => (
            <div
              key={opt.value}
              className={`option ${idx === activeIndex ? 'active' : ''}`}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseDown={(e) => { e.preventDefault(); commit(opt.value) }}
              role="option"
              aria-selected={String(opt.value) === String(value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

