import React, { useState } from 'react'

export default function OpponentTab({ oppPicks, myPicks, onAdd, onRemove }) {
  const [event, setEvent] = useState('')
  const [player, setPlayer] = useState('')

  function handleAdd() {
    if (!event.trim() || !player.trim()) return
    onAdd({ event: event.trim(), player: player.trim() })
    setEvent('')
    setPlayer('')
  }

  const myPickNames = new Set(myPicks.map(p => p.name.toLowerCase()))
  const conflicts = oppPicks.filter(p => myPickNames.has(p.player.toLowerCase()))
  const burned = oppPicks.length

  return (
    <div>
      <div style={card}>
        <div style={cardTitle}>Log opponent's picks</div>
        <p style={hint}>Track what your opponent picks each week to spot differentiation opportunities.</p>
        <div style={inputRow}>
          <input
            style={input}
            type="text"
            placeholder="Event name (e.g. The Masters)"
            value={event}
            onChange={e => setEvent(e.target.value)}
          />
          <input
            style={input}
            type="text"
            placeholder="Player picked"
            value={player}
            onChange={e => setPlayer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button style={addBtn} onClick={handleAdd}>Add</button>
        </div>

        {oppPicks.length === 0 ? (
          <div style={empty}>No opponent picks logged yet.</div>
        ) : (
          <div style={{ marginTop: 12 }}>
            {oppPicks.map((p, i) => (
              <div key={i} style={{ ...pickRow, borderBottom: i < oppPicks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={eventLabel}>{p.event}</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.player}</div>
                <button style={removeBtn} onClick={() => onRemove(i)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {oppPicks.length > 0 && (
        <div style={card}>
          <div style={cardTitle}>Differentiation summary</div>
          <div style={summaryRow}>
            <div style={summaryItem}>
              <div style={summaryVal}>{burned}</div>
              <div style={summaryLbl}>Opponent picks used</div>
            </div>
            <div style={summaryItem}>
              <div style={{ ...summaryVal, color: conflicts.length > 0 ? 'var(--amber)' : 'var(--green)' }}>
                {conflicts.length}
              </div>
              <div style={summaryLbl}>Overlaps with your picks</div>
            </div>
          </div>
          {conflicts.length > 0 ? (
            <div style={{ ...statusMsg, background: 'var(--amber-bg)', color: 'var(--amber)' }}>
              Overlap on: {conflicts.map(p => p.player).join(', ')}
            </div>
          ) : (
            <div style={{ ...statusMsg, background: 'var(--green-bg)', color: 'var(--green)' }}>
              No overlaps — good differentiation so far.
            </div>
          )}
          <p style={{ ...hint, marginTop: 10 }}>
            Players your opponent has already burned are flagged in this week's recommendations.
          </p>
        </div>
      )}
    </div>
  )
}

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: 12 }
const cardTitle = { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'system-ui, sans-serif', marginBottom: 8 }
const hint = { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, fontFamily: 'system-ui, sans-serif' }
const inputRow = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const input = { flex: 1, minWidth: 140, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: 'system-ui, sans-serif', background: 'var(--surface)', color: 'var(--text-primary)' }
const addBtn = { padding: '8px 14px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', background: 'var(--text-primary)', color: 'var(--bg)', fontSize: 13, cursor: 'pointer', fontFamily: 'system-ui, sans-serif' }
const empty = { color: 'var(--text-muted)', fontSize: 13, padding: '16px 0', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }
const pickRow = { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0' }
const eventLabel = { flex: 1, fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'system-ui, sans-serif' }
const removeBtn = { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', padding: '0 4px' }
const summaryRow = { display: 'flex', gap: 12, marginBottom: 12 }
const summaryItem = { flex: 1, background: '#f5f3ee', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }
const summaryVal = { fontSize: 22, fontWeight: 700, fontFamily: 'Georgia, serif', color: 'var(--text-primary)' }
const summaryLbl = { fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'system-ui, sans-serif' }
const statusMsg = { borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: 13, fontFamily: 'system-ui, sans-serif' }
