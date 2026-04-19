const ELITE_THRESHOLD = 25
const TOP_TIER_THRESHOLD = 5
const MAJOR_NAMES = ['masters', 'us open', 'open championship', 'pga championship']

const PURSE_MAP = [
  { keywords: ['players championship'], purse: 25_000_000 },
  { keywords: ['masters', 'us open', 'open championship', 'pga championship'], purse: 21_000_000 },
  { keywords: ['genesis', 'arnold palmer', 'memorial', 'travelers', 'rbc canadian',
               'bmw championship', 'tour championship', 'rbc heritage', 'aon',
               'truist', 'cj cup', 'sentry', 'signature', 'scottish open'], purse: 20_000_000 },
]

export function getPurse(eventName = '') {
  const lower = eventName.toLowerCase()
  for (const { keywords, purse } of PURSE_MAP) {
    if (keywords.some(k => lower.includes(k))) return purse
  }
  return 9_000_000
}

export function isEventMajorOrElevated(eventName = '', purse = 0) {
  const lower = eventName.toLowerCase()
  return purse >= 20_000_000 || MAJOR_NAMES.some(m => lower.includes(m))
}

export function isMajor(eventName = '') {
  return MAJOR_NAMES.some(m => eventName.toLowerCase().includes(m))
}

function estimateFutureEV(dgRank, futureEventName, futurePurse) {
  const isFutureMajor = isMajor(futureEventName)
  const isFutureElevated = isEventMajorOrElevated(futureEventName, futurePurse)

  let baseWinProb
  if (dgRank <= 1)       baseWinProb = isFutureMajor ? 0.10 : isFutureElevated ? 0.14 : 0.20
  else if (dgRank <= 3)  baseWinProb = isFutureMajor ? 0.07 : isFutureElevated ? 0.10 : 0.15
  else if (dgRank <= 5)  baseWinProb = isFutureMajor ? 0.05 : isFutureElevated ? 0.07 : 0.11
  else if (dgRank <= 10) baseWinProb = isFutureMajor ? 0.03 : isFutureElevated ? 0.05 : 0.07
  else if (dgRank <= 25) baseWinProb = isFutureMajor ? 0.015 : isFutureElevated ? 0.025 : 0.04
  else baseWinProb = 0.01

  const top5  = baseWinProb * 3.5
  const top10 = baseWinProb * 5.5
  const top20 = baseWinProb * 9
  const cut   = 0.55

  return (
    baseWinProb          * futurePurse * 0.18  +
    (top5 - baseWinProb) * futurePurse * 0.055 +
    (top10 - top5)       * futurePurse * 0.028 +
    (top20 - top10)      * futurePurse * 0.014 +
    (cut - top20)        * futurePurse * 0.004
  )
}

function getBestFutureEV(dgRank, remainingSchedule) {
  if (!remainingSchedule || remainingSchedule.length === 0) return { ev: 0, eventName: null }
  let bestEV = 0
  let bestEvent = null
  for (const event of remainingSchedule) {
    const name = event.event_name || event.name || ''
    const purse = getPurse(name)
    if (!isEventMajorOrElevated(name, purse)) continue
    const ev = estimateFutureEV(dgRank, name, purse)
    if (ev > bestEV) { bestEV = ev; bestEvent = name }
  }
  return { ev: bestEV, eventName: bestEvent }
}

export function scorePlayer(player, purse, isBigEvent, remainingSchedule) {
  const winP    = player.win      ?? 0
  const top5P   = player.top_5    ?? 0
  const top10P  = player.top_10   ?? 0
  const top20P  = player.top_20   ?? 0
  const makeCut = player.make_cut ?? 0.55

  const expPrize =
    winP                   * purse * 0.18  +
    (top5P  - winP)        * purse * 0.055 +
    (top10P - top5P)       * purse * 0.028 +
    (top20P - top10P)      * purse * 0.014 +
    (makeCut - top20P)     * purse * 0.004

  const dgRank    = player.dg_rank ?? 999
  const isElite   = dgRank <= ELITE_THRESHOLD
  const isTopTier = dgRank <= TOP_TIER_THRESHOLD

  const { ev: bestFutureEV, eventName: bestFutureEvent } = isElite
    ? getBestFutureEV(dgRank, remainingSchedule)
    : { ev: 0, eventName: null }

  let occPenalty = 1.0
  let saveWarning = null

  if (isTopTier && bestFutureEV > 0) {
    if (expPrize >= bestFutureEV * 1.20) {
      occPenalty = 1.0
      saveWarning = null
    } else if (expPrize >= bestFutureEV * 0.90) {
      occPenalty = isBigEvent ? 0.90 : 0.80
      saveWarning = 'soft'
    } else {
      occPenalty = isBigEvent ? 0.78 : 0.62
      saveWarning = 'hard'
    }
  } else if (isElite && !isBigEvent) {
    occPenalty = 0.75
    saveWarning = 'soft'
  }

  // No differentiation adjustment — pure EV + opportunity cost only
  const score = expPrize * occPenalty

  return {
    name: player.player_name,
    dgRank,
    isElite,
    isTopTier,
    winP,
    top5P,
    top10P,
    expPrize,
    occPenalty,
    score,
    saveWarning,
    bestFutureEV,
    bestFutureEvent,
  }
}

export function buildRecommendations(rankings, usedSet, purse, eventName, remainingSchedule) {
  const isBigEvent = isEventMajorOrElevated(eventName, purse)
  return rankings
    .filter(p => p.player_name && !usedSet.has(p.player_name.toLowerCase()))
    .map(p => scorePlayer(p, purse, isBigEvent, remainingSchedule))
    .filter(p => p.expPrize > 0)
    .sort((a, b) => b.score - a.score)
}

export function shouldSitOut(topScore, purse) {
  return topScore < purse * 0.008
}
