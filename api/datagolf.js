export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { endpoint, ...params } = req.query
  const apiKey = process.env.DATAGOLF_API_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' })
  }

  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint parameter' })
  }

  const ENDPOINT_MAP = {
    'field-updates': '/field-updates',
    'pre-tournament': '/preds/pre-tournament',
    'get-schedule': '/get-schedule',
    'get-player-list': '/get-player-list',
    'skill-ratings': '/preds/skill-ratings',
    'player-decompositions': '/preds/player-decompositions',
  }

  const path = ENDPOINT_MAP[endpoint]
  if (!path) {
    return res.status(400).json({ error: `Unknown endpoint: ${endpoint}` })
  }

  const qs = new URLSearchParams({ ...params, key: apiKey, file_format: 'json' })
  const url = `https://feeds.datagolf.com${path}?${qs}`

  try {
    const dgRes = await fetch(url)
    if (!dgRes.ok) {
      const text = await dgRes.text()
      return res.status(dgRes.status).json({ error: `DataGolf API error: ${dgRes.status}`, detail: text })
    }
    const data = await dgRes.json()
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch from DataGolf', detail: err.message })
  }
}
