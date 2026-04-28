import React, { useState } from 'react'
import { estimateFutureEV, getPurse, isEventMajorOrElevated, isMajor } from '../scoring'

const INITIAL_SHOW = 12

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function ScheduleTab({ remainingSchedule, playerPool, picks }) {
  const [showAll, setShowAll] = useState(false)

  if (remainingSchedule.length === 0) {
    return (
      <div style={centered}>
        No upcoming schedule data. Load data from the <strong>This week</strong> tab first.
      </div>
    )
  }

  const usedSet = new Set(picks.map(p => p.name.toLowerCase()))
  const available = playerPool.filter(p => !usedSet.has(p.name.toLowerCase()))

  const events = showAll ? remainingSchedule : remainingSchedule.slice(0, INITIAL_SHOW)

  return (
    <div>
      <div style={infoNote}>
        Future picks are estimated from DataGolf player rankings only — no live field predictions
        exist until tournament week. Use this as a planning guide, not a definitive ranking.
      </div>

      {events.map((event, i) => (
        <EventCard key={i} event={event} available={available} />
      ))}

      {!showAll && remainingSchedule.length > INITIAL_SHOW && (
        <button style={showMoreBtn} onClick={() => setShowAll(true)}>
          Show {remainingSchedule.length - INITIAL_SHOW} more events
        </button>
      )}
    </div>
  )
}

function EventCard({ event, available }) {
  const name = event.event_name || event.name || 'Unknown Event'
  const dateStr = event.date || event.start_date || event.event_date
  const purse = getPurse(name)
  const isBig = isEventMajorOrElevated(name, purse)
  const isMajorEvent = isMajor(name)
  const pickCount = isBig ? 5 : 3

  const topPicks = available
    .map(p => ({ ...p, ev: estimateFutureEV(p.rank, name, purse) }))
    .sort((a, b) => b.ev - a.ev)
    .slice(0, pickCount)

  return (
    <div style={{ ...card, ...(isBig ? elevatedBorder : {}) }}>
      <div style={eventHeader}>
        <div>
          <div style={eventNameStyle}>{name}</div>
          <div style={eventMeta}>
            {dateStr && <span>{formatDate(dateStr)} · </span>}
            <span>${(purse / 1_000_000).toFixed(0)}M purse</span>
          </div>
        </div>
        <div style={badgeGroup}>
          {isMajorEvent && <Badge type="amber">Major</Badge>}
          {!isMajorEvent && isBig && <Badge type="blue">Elevated</Badge>}
          {!isBig && <Badge type="muted">Standard</Badge>}
        </div>
      </div>

      {topPicks.length === 0 ? (
        <div style={noPicksNote}>All available players already used.</div>
      ) : (
        <div style={pickList}>
          {topPicks.map((p, i) => (
            <PickRow key={p.name} player={p} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function PickRow({ player, rank }) {
  const isTop = rank === 1
  return (
    <div style={{ ...pickRow, borderTop: rank > 1 ? '1px solid var(--border)' : 'none' }}>
      <div style={{ ...rankNum, color: isTop ? 'var(--text-primary)' : 'var(--text-muted)' }}>{rank}</div>
      <div style={pickName}>{player.name}</div>
      <div style={pickMeta}>DG #{player.rank}</div>
      <div style={pickEv}>${Math.round(player.ev / 1000)}k est.</div>
    </div>
  )
}

function Badge({ type, children }) {
  const colors = {
    amber: { bg: 'var(--amber-bg)', color: 'var(--amber)' },
    blue:  { bg: 'var(--blue-bg)',  color: 'var(--blue)'  },
    muted: { bg: '#f0ede6',         color: 'var(--text-muted)' },
  }
  const c = colors[type] || colors.muted
  return (
    <span style={{ display: 'inline-block', fontSize: 11, padding: '2px 7px', borderRadius: 10, background: c.bg, color: c.color, fontFamily: 'system-ui, sans-serif', fontWeight: 600 }}>
      {children}
    </span>
  )
}

const centered = { textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontFamily: 'system-ui, sans-serif', fontSize: 14 }
const infoNote = { background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid #b3d4f5', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, marginBottom: 12, fontFamily: 'system-ui, sans-serif', lineHeight: 1.55 }
const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: 10 }
const elevatedBorder = { borderColor: '#c0b090' }
const eventHeader = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }
const eventNameStyle = { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }
const eventMeta = { fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'system-ui, sans-serif' }
const badgeGroup = { flexShrink: 0, marginTop: 2 }
const pickList = { borderTop: '1px solid var(--border)', paddingTop: 6 }
const pickRow = { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }
const rankNum = { fontSize: 13, fontWeight: 700, width: 20, textAlign: 'center', flexShrink: 0, fontFamily: 'Georgia, serif' }
const pickName = { flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'system-ui, sans-serif' }
const pickMeta = { fontSize: 12, color: 'var(--text-muted)', fontFamily: 'system-ui, sans-serif', flexShrink: 0 }
const pickEv = { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'Georgia, serif', flexShrink: 0, minWidth: 52, textAlign: 'right' }
const noPicksNote = { fontSize: 13, color: 'var(--text-muted)', fontFamily: 'system-ui, sans-serif', paddingTop: 4 }
const showMoreBtn = { width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'system-ui, sans-serif', marginTop: 4 }
