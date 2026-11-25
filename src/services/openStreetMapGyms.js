import { SEOUL_CURATED_GYMS } from '../data/seoulCuratedGyms'

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const CACHE_KEY = 'climbers-hub:seoul-osm-gyms:v2'
const CACHE_TTL = 6 * 60 * 60 * 1000
const REQUEST_TIMEOUT = 5000

const SEOUL_BOUNDS = {
  south: 37.413294,
  west: 126.734086,
  north: 37.715133,
  east: 127.269311,
}

export async function loadSeoulClimbingGyms({ force = false } = {}) {
  if (!force) {
    const cached = readCache()
    if (cached) return mergeGyms(cached)
  }

  const bbox = [SEOUL_BOUNDS.south, SEOUL_BOUNDS.west, SEOUL_BOUNDS.north, SEOUL_BOUNDS.east].join(
    ',',
  )
  const query = `[out:json][timeout:25];
(
  nwr["sport"="climbing"](${bbox});
  nwr["name"~"클라이밍|볼더링|클라임|bouldering|climbing",i](${bbox});
);
out center tags;`

  try {
    const payload = await fetchOverpass(query)
    const gyms = normalizeElements(payload.elements ?? [])
    if (gyms.length > 0) writeCache(gyms)
    return mergeGyms(gyms)
  } catch {
    return mergeGyms([])
  }
}

async function fetchOverpass(query) {
  let lastError
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams({ data: query }),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`OVERPASS_HTTP_${response.status}`)
      return await response.json()
    } catch (error) {
      lastError = error
    } finally {
      window.clearTimeout(timeoutId)
    }
  }
  throw lastError ?? new Error('OVERPASS_UNAVAILABLE')
}

function mergeGyms(osmGyms) {
  const merged = [...SEOUL_CURATED_GYMS]
  osmGyms.forEach((osmGym) => {
    if (!merged.some((curatedGym) => isSameGym(curatedGym, osmGym))) merged.push(osmGym)
  })
  return merged.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}

function isSameGym(left, right) {
  const leftName = normalizeName(left.name)
  const rightName = normalizeName(right.name)
  const relatedName = leftName.includes(rightName) || rightName.includes(leftName)
  return relatedName && distanceInMeters(left, right) < 180
}

function normalizeName(name) {
  return String(name)
    .toLocaleLowerCase('ko')
    .replace(/클라이밍|볼더링|센터|짐|점/g, '')
    .replace(/[^0-9a-z가-힣]/g, '')
}

function distanceInMeters(left, right) {
  const radians = (degrees) => (degrees * Math.PI) / 180
  const latitudeDistance = radians(right.latitude - left.latitude)
  const longitudeDistance = radians(right.longitude - left.longitude)
  const latitude1 = radians(left.latitude)
  const latitude2 = radians(right.latitude)
  const a =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDistance / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function normalizeElements(elements) {
  const unique = new Map()
  elements.forEach((element) => {
    const tags = element.tags ?? {}
    const latitude = Number(element.lat ?? element.center?.lat)
    const longitude = Number(element.lon ?? element.center?.lon)
    if (!tags.name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return

    const id = `${element.type}-${element.id}`
    unique.set(id, {
      id,
      osmType: element.type,
      osmId: element.id,
      name: tags['name:ko'] || tags.name,
      address: formatAddress(tags),
      phone: tags.phone || tags['contact:phone'] || '',
      category: formatCategory(tags),
      latitude,
      longitude,
      website: normalizeWebsite(tags.website || tags['contact:website']),
      detailsUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
      detailsLabel: 'OpenStreetMap에서 보기',
      source: 'openstreetmap',
    })
  })
  return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}

function formatAddress(tags) {
  if (tags['addr:full']) return tags['addr:full']
  const parts = [
    tags['addr:city'] || '서울특별시',
    tags['addr:district'],
    tags['addr:street'],
    tags['addr:housenumber'],
  ].filter(Boolean)
  return parts.length > 1 ? parts.join(' ') : '서울특별시 · 상세 주소 미등록'
}

function formatCategory(tags) {
  const types = []
  if (tags.boulder === 'yes' || tags.climbing === 'boulder') types.push('볼더링')
  if (tags['climbing:indoor'] === 'yes' || tags.indoor === 'yes') types.push('실내 클라이밍')
  if (types.length === 0) types.push('클라이밍')
  return types.join(' · ')
}

function normalizeWebsite(value) {
  if (!value) return ''
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

function readCache() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY))
    if (!cached || Date.now() - cached.savedAt > CACHE_TTL || !Array.isArray(cached.gyms)) {
      return null
    }
    return cached.gyms
  } catch {
    return null
  }
}

function writeCache(gyms) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), gyms }))
  } catch {
    // The map remains usable when storage is unavailable.
  }
}
