import React, { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useDataGolf } from './hooks/useDataGolf'
import PicksTab from './components/PicksTab'
import WeekTab from './components/WeekTab'
import OpponentTab from './components/OpponentTab'
import InstructionsTab from './components/InstructionsTab'

const TABS = [
  { id: 'week', label: 'This week' },
  { id: 'picks', label: 'My picks' },
  { id: 'opponent', label: 'Opponent' },
  { id: 'info', label: 'How it works' },
]

const SEASON_PICKS = 31

export default function App() {
  const [activeTab, setActiveTab] = useState('week')
  const [myPicks, setMyPicks] = useLocalStorage('sg_my_picks', [])
  const [oppPicks, setOppPicks] = useLocalStorage('sg_opp_picks', [])
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

    const { field, preds: predsData, schedule, playerList } = result

    setDebugData(predsData)
    setScheduleDebug(schedule)
    if (predsData) setPreds(predsData)

    // DataGolf schedule response: try multiple known shapes
    // { schedule: [...] } or { seasons: [...] } or top-level array
    if (schedule) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let events = []
      if (Array.isArray(schedule)) events = schedule
      else if (Array.isArray(schedule.schedule)) events = schedule.schedule
      else if (Array.isArray(schedule.seasons)) {
        // Flatten seasons array
        events = schedule.seasons.flatMap(s => s.events || s.schedule || [])
      } else {
        // Try any array value in the object
        const firstArray = Object.values(schedule).find(v => Array.isArray(v))
        if (firstArray) events = firstArray
      }

      const upcoming = events.filter(e => {
        const dateStr = e.date || e.start_date || e.event_date
        if (!dateStr) return true // include if no date
        const d = new Date(dateStr)
        d.setHours(0, 0, 0, 0)
        return d > today
      })
      setRemainingSchedule(upcoming)
    }

    // Full player list for picks search
    if (playerList && Array.isArray(playerList)) {
      setPlayerPool(playerList.map(p => ({
        dg_id: p.dg_id,
        name: p.player_name,
        rank: p.dg_rank ?? 999,
      })).sort((a, b) => a.rank - b.rank))
    } else if (field && field.field) {
      setPlayerPool(field.field.map(p => ({
        dg_id: p.dg_id,
        name: p.player_name,
        rank: p.dg_rank ?? 999,
      })))
    } else if (predsData && predsData.rankings) {
      setPlayerPool(predsData.rankings.map(p => ({
        dg_id: p.dg_id,
        name: p.player_name,
        rank: p.dg_rank ?? 999,
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
  function addOppPick(pick) {
    setOppPicks(prev => [...prev, pick])
  }
  function removeOppPick(i) {
    setOppPicks(prev => prev.filter((_, idx) => idx !== i))
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
              oppPicks={oppPicks}
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
          {activeTab === 'opponent' && (
            <OpponentTab
              oppPicks={oppPicks}
              myPicks={myPicks}
              onAdd={addOppPick}
              onRemove={removeOppPick}
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
