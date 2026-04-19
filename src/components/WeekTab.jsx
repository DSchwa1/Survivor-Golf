import React from 'react'
import { buildRecommendations, shouldSitOut, isEventMajorOrElevated, getPurse } from '../scoring'

function extractRankings(preds) {
  if (!preds) return []
  if (preds.baseline_history_fit) {
    const bhf = preds.baseline_history_fit
    if (Array.isArray(bhf)) return bhf
    if (bhf.players && Array.isArray(bhf.players)) return bhf.players
  }
  if (preds.baseline) {
    const b = preds.baseline
    if (Array.isArray(b)) return b
    if (b.players && Array.isArray(b.players)) return b.players
  }
  if (Array.isArray(preds.rankings)) return preds.rankings
  if (Array.isArray(preds.field)) return preds.field
  if (Array.isArray(preds)) return preds
  return []
}

export default function WeekTab({ preds, picks, oppPicks, loading, error, onRefresh, debugData, remainingSchedule }) {
  if (loading) return <div style={centered}>Loading tournament data...</div>
  if (error) return (
    <div style={centered}>
      <div style={{ color: 'var(--red)', marginBottom: 12, fontSize: 14 }}>{error}</div>
      <button style={btn} onClick={onRefresh}>Retry</button>
    </div>
  )
  if (!preds) return (
    <div style={centered}>
      <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>No tournament data loaded.</div>
      <button style={btn} onClick={onRefresh}>Load data</button>
    </div>
  )

  const rankings = extractRankings(preds)
  const eventName = preds.event_name ?? preds.tournament_name ?? 'Current Event'
  const course = preds.course ?? preds.course_name ?? ''
  const purse = getPurse(eventName)
  const isBigEvent = isEventMajorOrElevated(eventName, purse)

  const usedSet = new Set(picks.map(p => p.name.toLowerCase()))
  const oppUsedSet = new Set(oppPicks.map(p => p.player.toLowerCase()))

  const recs = rankings.length > 0
    ? buildRecommendations(rankings, usedSet, oppUsedSet, purse, eventName, remainingSchedule)
    : []

  const top10 = recs.slice(0, 10)
  const sitOut = recs.length > 0 && shouldSitOut(recs[0].score, purse)

  return (
    <div>
      <div style={eventBox}>
        <div>
          <div style={eventName_}>{eventName}</div>
          <div style={eventMeta}>
            {course && <span>{course} · </span>}
            <span>${(purse / 1_000_000).toFixed(0)}M purse</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {isBigEvent && <Badge type="blue">Elevated</Badge>}
          {['masters','us open','open championship','pga championship'].some(m => eventName.toLowerCase().includes(m)) && <Badge type="amber">Major</Badge>}
          <button style={refreshBtn} onClick={onRefresh}>Refresh</button>
        </div>
      </div>

      {sitOut && (
        <div style={sitOutBanner}>
          ⚠ Weak week — consider sitting out and saving elite picks for a better spot.
        </div>
      )}

      <div style={card}>
        <div style={cardTitle}>Recommendations</div>
        {top10.length === 0 ? (
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '12px 0', marginBottom: 12 }}>
              {rankings.length === 0
                ? 'No field data available yet — check back closer to the tournament.'
                : `${rankings.length} players in field but all may be in your used picks.`}
            </div>
            {debugData && (
              <details style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                <summary style={{ cursor: 'pointer', marginBottom: 6 }}>Debug: raw API response</summary>
                <pre style={{ overflow: 'auto', maxHeight: 240, background: '#f5f3ee', padding: 8, borderRadius: 4, fontSize: 11 }}>
                  {JSON.stringify({
                    keys: Object.keys(debugData),
                    rankingsFound: rankings.length,
                    samplePlayer: rankings[0] ?? null,
                    bhf_type: typeof debugData.baseline_history_fit,
                    bhf_is_array: Array.isArray(debugData.baseline_history_fit),
                    bhf_has_players: !!(debugData.baseline_history_fit?.players),
                    bhf_players_length: debugData.baseline_history_fit?.players?.length ?? 'n/a',
                  }, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ) : (
          top10.map((p, i) => <RecRow key={p.name} player={p} rank={i + 1} isBigEvent={isBigEvent} />)
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'system-ui, sans-serif', marginTop: 8 }}>
        Scores combine expected prize money, opportunity cost vs. future events, and differentiation
      </div>
    </div>
  )
}

function RecRow({ player, rank, isBigEvent }) {
  const isTop3 = rank <= 3

  // Build save warning message
  let saveMsg = null
  if (player.saveWarning === 'hard' && player.bestFutureEvent) {
    saveMsg = `Strongly consider saving — higher EV at ${player.bestFutureEvent}`
  } else if (player.saveWarning === 'soft' && player.bestFutureEvent) {
    saveMsg = `Consider saving for ${player.bestFutureEvent}`
  } else if (player.saveWarning === 'soft') {
    saveMsg = 'Consider saving for an elevated event'
  }

  return (
    <div style={{ borderBottom: rank < 10 ? '1px solid var(--border)' : 'none', padding: '11px 0' }}>
      <div style={recRow}>
        <div style={{ ...rankNum, color: isTop3 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{rank}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={playerName}>
            {player.name}
            {player.saveWarning === 'hard' && <Badge type="red">Save for later</Badge>}
            {player.saveWarning === 'soft' && !isBigEvent && <Badge type="amber">Consider saving</Badge>}
            {!player.saveWarning && player.isElite && isBigEvent && <Badge type="green">Deploy now</Badge>}
            {player.oppConflict && <Badge type="blue">Opp. burned</Badge>}
          </div>
          <div style={playerMeta}>
            Win: {(player.winP * 100).toFixed(1)}% · Top 10: {(player.top10P * 100).toFixed(0)}% · DG rank #{player.dgRank}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={scoreVal}>${Math.round(player.expPrize / 1000)}k</div>
          <div style={scoreLabel}>exp. prize</div>
        </div>
      </div>
      {saveMsg && (
        <div style={{
          ...saveNote,
          background: player.saveWarning === 'hard' ? 'var(--red-bg)' : 'var(--amber-bg)',
          color: player.saveWarning === 'hard' ? 'var(--red)' : 'var(--amber)',
        }}>
          {saveMsg} — projected ${Math.round(player.bestFutureEV / 1000)}k EV there vs ${Math.round(player.expPrize / 1000)}k here
        </div>
      )}
    </div>
  )
}

function Badge({ type, children }) {
  const colors = {
    green: { bg: 'var(--green-bg)', color: 'var(--green)' },
    red:   { bg: 'var(--red-bg)',   color: 'var(--red)'   },
    amber: { bg: 'var(--amber-bg)', color: 'var(--amber)' },
    blue:  { bg: 'var(--blue-bg)',  color: 'var(--blue)'  },
  }
  const c = colors[type] || colors.blue
  return (
    <span style={{ display: 'inline-block', fontSize: 11, padding: '2px 7px', borderRadius: 10, background: c.bg, color: c.color, marginLeft: 7, fontFamily: 'system-ui, sans-serif', fontWeight: 600 }}>
      {children}
    </span>
  )
}

const centered = { textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontFamily: 'system-ui, sans-serif', fontSize: 14 }
const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: 12 }
const cardTitle = { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'system-ui, sans-serif', marginBottom: 12 }
const eventBox = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }
const eventName_ = { fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }
const eventMeta = { fontSize: 13, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'system-ui, sans-serif' }
const sitOutBanner = { background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid #f0d0a0', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 14, marginBottom: 12, fontFamily: 'system-ui, sans-serif' }
const recRow = { display: 'flex', alignItems: 'center', gap: 12 }
const rankNum = { fontSize: 17, fontWeight: 700, width: 28, textAlign: 'center', flexShrink: 0, fontFamily: 'Georgia, serif' }
const playerName = { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }
const playerMeta = { fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'system-ui, sans-serif' }
const scoreVal = { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Georgia, serif' }
const scoreLabel = { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'system-ui, sans-serif' }
const saveNote = { fontSize: 12, borderRadius: 'var(--radius-sm)', padding: '5px 10px', marginTop: 6, marginLeft: 40, fontFamily: 'system-ui, sans-serif' }
const btn = { padding: '8px 16px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', fontSize: 13, cursor: 'pointer', fontFamily: 'system-ui, sans-serif' }
const refreshBtn = { padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'transparent', fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'system-ui, sans-serif' }
