import React, { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useDataGolf } from './hooks/useDataGolf'
import PicksTab from './components/PicksTab'
import WeekTab from './components/WeekTab'
import InstructionsTab from './components/InstructionsTab'

const TABS = [
  { id: 'week', label: 'This week' },
  { id: 'picks', label: 'My picks' },
  { id: 'info', label: 'How it works' },
]

const SEASON_PICKS = 31

export default function App() {
  const [activeTab, setActiveTab] = useState('week')
  const [myPicks, setMyPicks] = useLocalStorage('sg_my_picks', [])
  const [preds, setPreds] = useState(null)
  const [playerPool, setPlayerPool] = useState([])
  const [remainingSchedule, setRemainingSchedule] = useState([])
  const [debugData, setDebugData] = useState(null)
  const [scheduleDebug, setScheduleDebug] = useState(null)

  const { fetchAll, loading, error } = useDataGolf()
  const picksLeft = Math.max(0, SEASON_PICKS - myPicks.length)

  const loadData = useCallback(async () => {
    const result = await fetchAll()
    if (!result) return

    const { field, preds: predsData, schedule, playerList, dgRankings } = result

    // Build rank lookup maps from the dedicated rankings endpoint
    const rankMap = {}
    const rankByName = {}
    if (dgRankings && Array.isArray(dgRankings)) {
      dgRankings.forEach(p => {
        const rank = p.datagolf_rank ?? p.dg_rank ?? p.rank ?? 999
        if (p.dg_id) rankMap[p.dg_id] = rank
        if (p.player_name) rankByName[p.player_name.toLowerCase()] = rank
      })
    }

    // Inject dg_rank into predictions players
    if (predsData) {
      const injectRank = (players) => {
        if (!Array.isArray(players)) return players
        return players.map(p => ({
          ...p,
          dg_rank: rankMap[p.dg_id] ?? rankByName[p.player_name?.toLowerCase()] ?? p.dg_rank ?? 999
        }))
      }
      const enriched = { ...predsData }
      if (Array.isArray(enriched.baseline_history_fit)) {
        enriched.baseline_history_fit = injectRank(enriched.baseline_history_fit)
      } else if (enriched.baseline_history_fit?.players) {
        enriched.baseline_history_fit = { ...enriched.baseline_history_fit, players: injectRank(enriched.baseline_history_fit.players) }
      }
      if (Array.isArray(enriched.baseline)) {
        enriched.baseline = injectRank(enriched.baseline)
      } else if (enriched.baseline?.players) {
        enriched.baseline = { ...enriched.baseline, players: injectRank(enriched.baseline.players) }
      }
      setDebugData(enriched)
      setPreds(enriched)
    }

    // Parse schedule
    if (schedule) {
      setScheduleDebug(schedule)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let events = []
      if (Array.isArray(schedule)) events = schedule
      else if (Array.isArray(schedule.schedule)) events = schedule.schedule
      else {
        const firstArray = Object.values(schedule).find(v => Array.isArray(v))
        if (firstArray) events = firstArray
      }
      const upcoming = events.filter(e => {
        const dateStr = e.date || e.start_date || e.event_date
        if (!dateStr) return true
        const d = new Date(dateStr)
        d.setHours(0, 0, 0, 0)
        return d > today
      })
      setRemainingSchedule(upcoming)
    }

    // Player pool for picks search
    if (playerList && Array.isArray(playerList)) {
      setPlayerPool(playerList.map(p => ({
        dg_id: p.dg_id,
        name: p.player_name,
        rank: rankMap[p.dg_id] ?? rankByName[p.player_name?.toLowerCase()] ?? 999,
      })).sort((a, b) => a.rank - b.rank))
    } else if (field && field.field) {
      setPlayerPool(field.field.map(p => ({
        dg_id: p.dg_id,
        name: p.player_name,
        rank: rankMap[p.dg_id] ?? rankByName[p.player_name?.toLowerCase()] ?? 999,
      })))
    }
  }, [fetchAll])

  useEffect(() => { loadData() }, [loadData])

  function addMyPick(player) {
    if (!myPicks.find(p => p.name === player.name)) {
      setMyPicks(prev => [...prev, { name: player.name, dg_id: player.dg_id }])
    }
  }
  function removeMyPick(name) {
    setMyPicks(prev => prev.filter(p => p.name !== name))
  }

  return (
    <div style={appWrap}>
      <header style={header}>
        <div style={headerInner}>
          <h1 style={title}>Survivor Golf ⛳</h1>
          <p style={subtitle}>Prize money pick optimizer</p>
        </div>
      </header>

      <main style={main}>
        <nav style={tabNav}>
          {TABS.map(t => (
            <button
              key={t.id}
              style={{ ...tabBtn, ...(activeTab === t.id ? tabActive : {}) }}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div style={content}>
          {activeTab === 'week' && (
            <WeekTab
              preds={preds}
              picks={myPicks}
              loading={loading}
              error={error}
              onRefresh={loadData}
              debugData={debugData}
              scheduleDebug={scheduleDebug}
              remainingSchedule={remainingSchedule}
            />
          )}
          {activeTab === 'picks' && (
            <PicksTab
              picks={myPicks}
              onAdd={addMyPick}
              onRemove={removeMyPick}
              playerPool={playerPool}
              picksLeft={picksLeft}
              seasonPicks={SEASON_PICKS}
            />
          )}
          {activeTab === 'info' && <InstructionsTab />}
        </div>
      </main>
    </div>
  )
}

const appWrap = { minHeight: '100vh', display: 'flex', flexDirection: 'column' }
const header = { background: '#1a1917', padding: '20px 0 0', borderBottom: '1px solid #333' }
const headerInner = { maxWidth: 680, margin: '0 auto', padding: '0 20px 16px' }
const title = { fontSize: 22, fontWeight: 700, color: '#f9f8f5', letterSpacing: '-0.3px', fontFamily: 'Georgia, serif' }
const subtitle = { fontSize: 13, color: '#8a8880', marginTop: 2, fontFamily: 'system-ui, sans-serif' }
const main = { flex: 1, maxWidth: 680, margin: '0 auto', width: '100%', padding: '0 20px 40px' }
const tabNav = { display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20, gap: 0, overflowX: 'auto' }
const tabBtn = { padding: '12px 14px', fontSize: 14, background: 'none', border: 'none', borderBottom: '2px solid transparent', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'system-ui, sans-serif', marginBottom: -1, whiteSpace: 'nowrap' }
const tabActive = { color: 'var(--text-primary)', borderBottomColor: 'var(--text-primary)', fontWeight: 600 }
const content = { paddingTop: 4 }
