<script setup>
defineOptions({ name: 'GymDetailView' })

import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Map, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { loadGym as loadGymDetail } from '../services/gyms'

setWorkerUrl(workerUrl)

const OPEN_FREE_MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const gym = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const mapElement = ref(null)
let map
let marker

watch(() => route.params.gymId, loadGym, { immediate: true })
onBeforeUnmount(destroyMap)

async function loadGym(gymId) {
  loading.value = true
  errorMessage.value = ''
  gym.value = null
  destroyMap()

  try {
    const foundGym = await loadGymDetail(String(gymId))
    if (!foundGym) {
      errorMessage.value = '요청한 암장 정보를 찾지 못했어요.'
      return
    }
    gym.value = foundGym
    loading.value = false
    await nextTick()
    initializeMap(foundGym)
  } catch {
    errorMessage.value = '암장 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}

function initializeMap(selectedGym) {
  map = new Map({
    container: mapElement.value,
    style: OPEN_FREE_MAP_STYLE,
    center: [selectedGym.longitude, selectedGym.latitude],
    zoom: 14.5,
    attributionControl: true,
  })
  map.addControl(new NavigationControl({ showCompass: false }), 'top-right')

  const element = document.createElement('span')
  element.className = 'gym-detail-map-marker'
  element.setAttribute('aria-hidden', 'true')
  element.innerHTML =
    '<span class="gym-detail-map-marker-shape"><span aria-hidden="true">▲</span></span>'
  marker = new Marker({ element, anchor: 'bottom' })
    .setLngLat([selectedGym.longitude, selectedGym.latitude])
    .addTo(map)
}

function destroyMap() {
  marker?.remove()
  marker = undefined
  map?.remove()
  map = undefined
}

async function logout() {
  await auth.logout()
  await router.replace('/login')
}
</script>

<template>
  <main class="board-shell gym-profile-page">
    <header class="board-header">
      <RouterLink :to="{ name: 'home' }" class="board-brand" aria-label="Climbers’ Hub 홈">
        <span class="board-brand-mark" aria-hidden="true">△</span>
        <span>climbers’ hub<span>.</span></span>
      </RouterLink>
      <nav class="board-nav" aria-label="주요 메뉴">
        <RouterLink :to="{ name: 'home' }">라운지</RouterLink>
        <RouterLink :to="{ name: 'gyms' }" class="active">암장 지도</RouterLink>
        <RouterLink :to="{ name: 'account' }">내 계정</RouterLink>
        <button type="button" @click="logout">로그아웃</button>
      </nav>
      <RouterLink class="board-member" :to="{ name: 'account' }">
        <span class="board-avatar" aria-hidden="true">{{
          Array.from(auth.member?.name ?? 'C')[0]
        }}</span>
        <span
          ><strong>{{ auth.member?.name }}</strong
          ><small>암장 정보 확인 중</small></span
        >
      </RouterLink>
    </header>

    <section v-if="loading" class="gym-profile-state" aria-live="polite">
      <span></span>
      <strong>암장 정보를 불러오는 중이에요</strong>
    </section>

    <section v-else-if="errorMessage" class="gym-profile-state gym-profile-error" role="alert">
      <span aria-hidden="true">!</span>
      <strong>{{ errorMessage }}</strong>
      <RouterLink :to="{ name: 'gyms' }">암장 지도로 돌아가기</RouterLink>
    </section>

    <template v-else-if="gym">
      <section class="gym-profile-hero">
        <div class="gym-profile-breadcrumb">
          <RouterLink :to="{ name: 'gyms' }">서울 암장 지도</RouterLink>
          <span aria-hidden="true">/</span>
          <span>암장 상세</span>
        </div>
        <div class="gym-profile-heading">
          <div>
            <span class="gym-profile-label">SEOUL CLIMBING SPOT</span>
            <h1>{{ gym.name }}</h1>
            <p>{{ gym.address }}</p>
          </div>
          <RouterLink :to="{ name: 'gyms' }" class="gym-profile-back">
            <span aria-hidden="true">←</span> 지도에서 다시 보기
          </RouterLink>
        </div>
        <div class="gym-profile-tags">
          <span>{{ gym.description }}</span>
          <span>DB 검증 완료</span>
        </div>
      </section>

      <section class="gym-profile-layout">
        <article class="gym-profile-info">
          <div class="gym-profile-section-heading">
            <span>VISIT INFORMATION</span>
            <h2>방문 정보</h2>
          </div>
          <dl>
            <div>
              <dt>주소</dt>
              <dd>{{ gym.address }}</dd>
            </div>
            <div>
              <dt>전화번호</dt>
              <dd>{{ gym.phone || '공개된 전화번호가 없어요' }}</dd>
            </div>
            <div>
              <dt>클라이밍 유형</dt>
              <dd>{{ gym.description }}</dd>
            </div>
            <div>
              <dt>위치 좌표</dt>
              <dd>{{ gym.latitude.toFixed(5) }}, {{ gym.longitude.toFixed(5) }}</dd>
            </div>
          </dl>

          <dl>
            <div>
              <dt>운영시간</dt>
              <dd>{{ gym.openHours || '확인된 운영시간이 없어요' }}</dd>
            </div>
            <div>
              <dt>가격</dt>
              <dd>{{ gym.pricingInfo || '가격 정보 준비 중' }}</dd>
            </div>
          </dl>
        </article>

        <article class="gym-profile-map-card">
          <div class="gym-profile-map-heading">
            <div>
              <span>LOCATION</span>
              <h2>지도 위치</h2>
            </div>
            <span class="gym-live-badge"><i></i> SEOUL</span>
          </div>
          <div ref="mapElement" class="gym-profile-map" :aria-label="`${gym.name} 위치 지도`"></div>
        </article>

        <article class="gym-profile-reservation">
          <span class="gym-profile-label">NEXT FEATURE</span>
          <h2>이 암장의 예약 기능을 준비하고 있어요.</h2>
          <p>
            내부 암장 DB 연결을 완료했어요. 다음 단계에서 날짜와 시간대를 선택하는 예약 기능을
            연결할 수 있어요.
          </p>
          <button type="button" disabled>예약 기능 준비 중</button>
        </article>
      </section>

      <p class="gym-data-note">
        공개된 장소 정보를 바탕으로 표시하며 운영시간·가격·휴무일은 실제 암장 안내를 확인해주세요.
      </p>
    </template>
  </main>
</template>
