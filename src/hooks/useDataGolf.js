import { useState, useCallback } from 'react'

async function dgFetch(endpoint, params = {}) {
  const qs = new URLSearchParams({ endpoint, ...params })
  const res = await fetch(`/api/datagolf?${qs}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useDataGolf() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [field, preds, schedule, playerList, dgRankings] = await Promise.all([
        dgFetch('field-updates', { tour: 'pga' }),
        dgFetch('pre-tournament', { tour: 'pga', add_position: '1,2,3' }),
        dgFetch('get-schedule', { tour: 'pga', upcoming_only: 'no' }),
        dgFetch('get-player-list'),
        dgFetch('get-dg-rankings'),
      ])
      return { field, preds, schedule, playerList, dgRankings }
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetchAll, loading, error }
}
