<script setup>
defineOptions({ name: 'AccountView' })
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AuthLayout from '../components/AuthLayout.vue'
import KakaoButton from '../components/KakaoButton.vue'
import { loadSocialProviders, linkKakao, socialErrorMessage } from '../services/social'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const kakaoEnabled = ref(false)
const linking = ref(false)
const socialMessage = ref('')
const pending = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  if (route.query.social_error)
    errorMessage.value = socialErrorMessage(String(route.query.social_error))
  else if (route.query.social === 'success') socialMessage.value = '카카오 인증이 완료되었어요.'
  if (route.query.social || route.query.social_error) await router.replace({ path: '/account' })
  try {
    kakaoEnabled.value = (await loadSocialProviders()).kakao === true
  } catch {
    /* Existing profile remains usable. */
  }
})

async function connectKakao() {
  if (linking.value || pending.value) return
  linking.value = true
  errorMessage.value = ''
  try {
    await linkKakao()
  } catch (error) {
    errorMessage.value =
      error.response?.status === 401
        ? '세션이 만료됐어요. 다시 로그인해주세요.'
        : '카카오 계정을 연결할 수 없어요. 다시 시도해주세요.'
    linking.value = false
  }
}

async function logout() {
  if (pending.value) return
  pending.value = true
  errorMessage.value = ''
  try {
    await auth.logout()
    await router.replace('/login')
  } catch (error) {
    if (error.response?.status === 401) {
      auth.member = null
      await router.replace('/login')
    } else errorMessage.value = '로그아웃하지 못했습니다. 다시 시도해주세요.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <AuthLayout
    eyebrow="YOUR CLIMBING JOURNEY"
    :title="(auth.member?.name ?? '클라이머') + '님, 반가워요.'"
    description="내 정보와 연결된 로그인 계정을 한곳에서 관리하세요."
  >
    <RouterLink class="settings-back" to="/">← 게시판으로 돌아가기</RouterLink>
    <span class="profile-badge"><span class="status-dot"></span> 로그인되어 있어요</span>
    <section class="profile-card" aria-label="내 회원 정보">
      <div class="profile-top">
        <span class="profile-avatar" aria-hidden="true">{{
          Array.from(auth.member?.name ?? 'C')[0]
        }}</span>
        <div>
          <strong>{{ auth.member?.name }}</strong
          ><small>CLIMBERS’ HUB MEMBER</small>
        </div>
      </div>
      <dl class="profile-details">
        <dt>아이디</dt>
        <dd>{{ auth.member?.loginId ?? '소셜 로그인 회원' }}</dd>
        <dt>이메일</dt>
        <dd>{{ auth.member?.email ?? '등록된 이메일 없음' }}</dd>
      </dl>
    </section>
    <RouterLink class="hub-secondary-link" to="/settings/profile">
      개인정보 수정 <span aria-hidden="true">→</span>
    </RouterLink>
    <div v-if="socialMessage" class="hub-notice success" role="status">{{ socialMessage }}</div>
    <section class="social-connections" aria-label="연결된 로그인 계정">
      <h3>로그인 계정 연결</h3>
      <p>연결한 계정으로도 같은 회원 정보를 이용할 수 있어요.</p>
      <div v-if="auth.member?.linkedProviders?.includes('KAKAO')" class="linked-provider">
        <span>카카오</span><span>연결됨 ✓</span>
      </div>
      <KakaoButton
        v-else-if="kakaoEnabled"
        linking
        :disabled="linking || pending"
        @click="connectKakao"
      />
      <p v-else>카카오 계정 연결은 현재 준비 중이에요.</p>
    </section>
    <div v-if="errorMessage" class="hub-notice" role="alert">{{ errorMessage }}</div>
    <button class="hub-submit hub-logout" :disabled="pending || linking" @click="logout">
      {{ pending ? '로그아웃 중…' : '로그아웃' }} <span class="arrow" aria-hidden="true">↗</span>
    </button>
  </AuthLayout>
</template>
