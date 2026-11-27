<script setup>
defineOptions({ name: 'GymMapView' })

import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { LngLatBounds, Map, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { loadGyms } from '../services/gyms'

setWorkerUrl(workerUrl)

const SEOUL_CENTER = [126.978, 37.5665]
const OPEN_FREE_MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

const auth = useAuthStore()
const router = useRouter()
const mapElement = ref(null)
const gyms = ref([])
const selectedGym = ref(null)
const loading = ref(true)
const query = ref('')
const errorMessage = ref('')
let map
let markers = []

const filteredGyms = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase('ko')
  if (!keyword) return gyms.value
  return gyms.value.filter((gym) =>
    [gym.name, gym.address, gym.description].some((value) =>
      String(value ?? '')
        .toLocaleLowerCase('ko')
        .includes(keyword),
    ),
  )
})

onMounted(() => initializeMap())
onBeforeUnmount(destroyMap)

async function initializeMap() {
  loading.value = true
  errorMessage.value = ''
  selectedGym.value = null
  destroyMap()

  try {
    await nextTick()
    map = new Map({
      container: mapElement.value,
      style: OPEN_FREE_MAP_STYLE,
      center: SEOUL_CENTER,
      zoom: 10.3,
      attributionControl: true,
    })
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    const gymsPromise = loadGyms()
    await waitForMapLoad(map)
    gyms.value = await gymsPromise
    renderMarkers()
  } catch {
    errorMessage.value =
      '공개 지도 또는 서울 암장 데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}

function waitForMapLoad(mapInstance) {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('MAP_LOAD_TIMEOUT')), 15000)
    mapInstance.once('load', () => {
      window.clearTimeout(timeoutId)
      resolve()
    })
    mapInstance.once('error', (event) => {
      if (mapInstance.loaded()) return
      window.clearTimeout(timeoutId)
      reject(event.error ?? new Error('MAP_LOAD_FAILED'))
    })
  })
}

function renderMarkers() {
  markers.forEach((marker) => marker.remove())
  markers = []
  if (!map || gyms.value.length === 0) return

  const bounds = new LngLatBounds()
  gyms.value.forEach((gym) => {
    const element = document.createElement('button')
    element.type = 'button'
    element.className = 'gym-map-marker'
    const pending = gym.verificationStatus === 'PENDING'
    if (pending) element.classList.add('pending')
    element.title = gym.name
    element.setAttribute('aria-label', pending ? `${gym.name} 검증 중` : `${gym.name} 상세 보기`)
    element.disabled = pending
    element.innerHTML =
      '<span class="gym-map-marker-shape"><span aria-hidden="true">▲</span></span>'
    element.addEventListener('click', (event) => {
      event.stopPropagation()
      if (!pending) selectGym(gym, false)
    })

    const marker = new Marker({ element, anchor: 'bottom' })
      .setLngLat([gym.longitude, gym.latitude])
      .addTo(map)
    bounds.extend([gym.longitude, gym.latitude])
    markers.push(marker)
  })
  map.fitBounds(bounds, { padding: 70, maxZoom: 13, duration: 0 })
}

function selectGym(gym, moveMap = true) {
  if (gym.verificationStatus !== 'VERIFIED' || !gym.active) return
  selectedGym.value = gym
  if (moveMap && map) {
    map.flyTo({ center: [gym.longitude, gym.latitude], zoom: 14, essential: false })
  }
}

function destroyMap() {
  markers.forEach((marker) => marker.remove())
  markers = []
  if (map) map.remove()
  map = undefined
}

async function logout() {
  await auth.logout()
  await router.replace('/login')
}
</script>

<template>
  <main class="board-shell gym-map-page">
    <header class="board-header">
      <RouterLink to="/" class="board-brand" aria-label="Climbers’ Hub 홈">
        <span class="board-brand-mark" aria-hidden="true">△</span>
        <span>climbers’ hub<span>.</span></span>
      </RouterLink>
      <nav class="board-nav" aria-label="주요 메뉴">
        <RouterLink :to="{ name: 'home' }">라운지</RouterLink>
        <RouterLink to="/gyms" class="active">암장 지도</RouterLink>
        <RouterLink to="/account">내 계정</RouterLink>
        <button type="button" @click="logout">로그아웃</button>
      </nav>
      <RouterLink class="board-member" to="/account">
        <span class="board-avatar" aria-hidden="true">{{
          Array.from(auth.member?.name ?? 'C')[0]
        }}</span>
        <span
          ><strong>{{ auth.member?.name }}</strong
          ><small>서울 암장 탐색 중</small></span
        >
      </RouterLink>
    </header>

    <section class="gym-map-hero">
      <div>
        <p>SEOUL CLIMBING MAP</p>
        <h1>오늘 오를 벽을<br /><span>지도에서 찾아봐요.</span></h1>
      </div>
      <p>DB에 등록된 서울 암장을 보여줘요. 회색 암장은 검증 중이라 아직 선택할 수 없어요.</p>
    </section>

    <section class="gym-map-layout" aria-label="서울 암장 지도">
      <aside class="gym-results-panel">
        <div class="gym-results-heading">
          <div>
            <span>SEOUL AREA</span>
            <strong>암장 {{ gyms.length }}곳</strong>
          </div>
          <span class="gym-live-badge"><i></i> OPEN DATA</span>
        </div>
        <label class="gym-search">
          <span class="sr-only">암장 검색</span>
          <input v-model="query" type="search" placeholder="암장 이름이나 지역 검색" />
          <span aria-hidden="true">⌕</span>
        </label>
        <p v-if="loading" class="gym-state">서울의 암장을 찾고 있어요…</p>
        <div v-else-if="errorMessage" class="gym-map-error" role="alert">
          <strong>지도를 준비하지 못했어요.</strong>
          <p>{{ errorMessage }}</p>
          <button type="button" @click="initializeMap(true)">다시 시도</button>
        </div>
        <p v-else-if="filteredGyms.length === 0" class="gym-state">
          {{
            gyms.length === 0
              ? '등록된 서울 암장을 찾지 못했어요.'
              : '검색 조건에 맞는 암장이 없어요.'
          }}
        </p>
        <div v-else class="gym-result-list">
          <button
            v-for="gym in filteredGyms"
            :key="gym.gymId"
            type="button"
            class="gym-result-item"
            :class="{
              selected: selectedGym?.gymId === gym.gymId,
              pending: gym.verificationStatus === 'PENDING',
            }"
            :disabled="gym.verificationStatus === 'PENDING'"
            @click="selectGym(gym)"
          >
            <span class="gym-result-marker" aria-hidden="true">▲</span>
            <span>
              <strong>{{ gym.name }}</strong>
              <small>{{ gym.address }}</small>
              <small v-if="gym.verificationStatus === 'PENDING'">정보 검증 중</small>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </aside>

      <div class="gym-map-stage">
        <div ref="mapElement" class="gym-map-canvas" aria-label="OpenFreeMap 서울 지도"></div>
        <div v-if="loading" class="gym-map-loading" aria-live="polite">
          <span></span>
          <strong>지도를 펼치는 중</strong>
        </div>
        <article v-if="selectedGym" class="gym-detail-card" aria-live="polite">
          <button
            type="button"
            class="gym-detail-close"
            aria-label="상세 정보 닫기"
            @click="selectedGym = null"
          >
            ×
          </button>
          <span class="gym-detail-kicker">CLIMBING SPOT</span>
          <h2>{{ selectedGym.name }}</h2>
          <dl>
            <div>
              <dt>주소</dt>
              <dd>{{ selectedGym.address }}</dd>
            </div>
            <div>
              <dt>전화</dt>
              <dd>{{ selectedGym.phone || '등록된 전화번호 없음' }}</dd>
            </div>
            <div>
              <dt>분류</dt>
              <dd>{{ selectedGym.description }}</dd>
            </div>
          </dl>
          <div class="gym-detail-actions">
            <RouterLink :to="{ name: 'gym-detail', params: { gymId: selectedGym.gymId } }">
              상세 페이지 보기 <span aria-hidden="true">→</span>
            </RouterLink>
            <a
              v-if="selectedGym.website || selectedGym.detailsUrl"
              :href="selectedGym.website || selectedGym.detailsUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ selectedGym.website ? '암장 웹사이트' : selectedGym.detailsLabel }}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </article>
      </div>
    </section>
    <p class="gym-data-note">
      지도 © OpenFreeMap · 공개 데이터 © OpenStreetMap contributors. 주요 암장 정보는 공개된
      공식·장소 정보를 함께 참고했으며, 실제 운영 정보와 다를 수 있어요.
    </p>
  </main>
</template>
