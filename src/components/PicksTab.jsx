import React from 'react'
import PlayerSearch from './PlayerSearch'

export default function PicksTab({ picks, onAdd, onRemove, playerPool, picksLeft, seasonPicks }) {
  const usedCount = picks.length

  const poolAvailable = playerPool.filter(p =>
    !picks.find(pick => pick.name.toLowerCase() === p.name.toLowerCase())
  ).length

  return (
    <div>
      <div style={statsRow}>
        <StatCard value={usedCount} label="Picks used" />
        <StatCard value={picksLeft} label="Picks remaining" />
        <StatCard value={poolAvailable || '—'} label="Players available" />
      </div>

      <div style={card}>
        <div style={cardTitle}>Used picks</div>
        <p style={hint}>Add every golfer you've already picked this season. These players will be excluded from recommendations.</p>
        <PlayerSearch
          playerPool={playerPool}
          usedPicks={picks}
          onAdd={onAdd}
          placeholder="Search and add a used pick..."
        />
        <div style={tagsWrap}>
          {picks.length === 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No picks added yet</span>
          )}
          {picks.map(p => (
            <span key={p.name} style={tag}>
              {p.name}
              <button onClick={() => onRemove(p.name)} style={tagX}>×</button>
            </span>
          ))}
        </div>
        <div style={progressWrap}>
          <div style={{ ...progressBar, width: `${Math.min((usedCount / seasonPicks) * 100, 100)}%` }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          {usedCount} of {seasonPicks} season picks used · {picksLeft} remaining
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label }) {
  return (
    <div style={statCard}>
      <div style={statVal}>{value}</div>
      <div style={statLbl}>{label}</div>
    </div>
  )
}

const statsRow = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }
const statCard = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 12px', textAlign: 'center' }
const statVal = { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Georgia, serif' }
const statLbl = { fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'system-ui, sans-serif' }
const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }
const cardTitle = { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'system-ui, sans-serif', marginBottom: 8 }
const hint = { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, fontFamily: 'system-ui, sans-serif' }
const tagsWrap = { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, minHeight: 32 }
const tag = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0ede6', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 10px', fontSize: 13, fontFamily: 'system-ui, sans-serif', color: 'var(--text-primary)' }
const tagX = { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 15, lineHeight: 1, cursor: 'pointer', padding: 0 }
const progressWrap = { height: 4, background: '#ede9e1', borderRadius: 2, marginTop: 14 }
const progressBar = { height: 4, background: 'var(--text-primary)', borderRadius: 2, transition: 'width 0.4s' }
