import React, { useState, useRef, useEffect } from 'react'

export default function PlayerSearch({ playerPool, usedPicks, onAdd, placeholder = 'Search player...' }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const usedNames = new Set(usedPicks.map(p => p.name.toLowerCase()))

  const matches = query.length >= 2
    ? playerPool
        .filter(p => p.name.toLowerCase().includes(query.toLowerCase()) && !usedNames.has(p.name.toLowerCase()))
        .slice(0, 8)
    : []

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(player) {
    onAdd(player)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={inputStyle}
      />
      {open && matches.length > 0 && (
        <div style={dropdownStyle}>
          {matches.map(p => (
            <div
              key={p.dg_id || p.name}
              style={itemStyle}
              onMouseDown={() => select(p)}
            >
              <span style={{ fontWeight: 500 }}>{p.name}</span>
              {p.rank && p.rank < 200 && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                  #{p.rank} DG
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 14,
  background: 'var(--surface)',
  color: 'var(--text-primary)',
  outline: 'none',
}

const dropdownStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: 'var(--surface)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-sm)',
  zIndex: 200,
  marginTop: 2,
  maxHeight: 220,
  overflowY: 'auto',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
}

const itemStyle = {
  padding: '9px 12px',
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  color: 'var(--text-primary)',
  borderBottom: '1px solid var(--border)',
}
