<script setup>
defineOptions({ name: 'LoginView' })
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AuthLayout from '../components/AuthLayout.vue'
import KakaoButton from '../components/KakaoButton.vue'
import { loadSocialProviders, startKakaoLogin, socialErrorMessage } from '../services/social'

const router = useRouter()
const route = useRoute()
const kakaoEnabled = ref(false)
const auth = useAuthStore()
const loginId = ref('')
const password = ref('')
const showPassword = ref(false)
const pending = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  if (route.query.social_error) {
    errorMessage.value = socialErrorMessage(String(route.query.social_error))
    await router.replace({ path: '/login' })
  }
  try {
    kakaoEnabled.value = (await loadSocialProviders()).kakao === true
  } catch {
    /* Local login remains usable. */
  }
})

async function login() {
  if (pending.value) return
  pending.value = true
  errorMessage.value = ''
  try {
    await auth.login(loginId.value.trim(), password.value)
    await router.replace('/')
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ??
      (error.response?.status === 403
        ? '로그인 세션이 만료됐습니다. 다시 시도해주세요.'
        : '로그인할 수 없습니다. 서버 연결을 확인해주세요.')
  } finally {
    password.value = ''
    pending.value = false
  }
}
</script>

<template>
  <AuthLayout
    eyebrow="WELCOME BACK"
    title="다시 만나 반가워요."
    description="오늘도 한 홀드 더. 당신의 다음 도전을 함께할게요."
  >
    <div v-if="errorMessage" class="hub-notice" role="alert">{{ errorMessage }}</div>
    <form class="hub-form" @submit.prevent="login">
      <div class="hub-field">
        <label for="login-id">아이디</label>
        <input
          id="login-id"
          v-model="loginId"
          placeholder="아이디를 입력해주세요"
          autocomplete="username"
          maxlength="50"
          required
          :disabled="pending"
          autocapitalize="none"
          spellcheck="false"
        />
      </div>
      <div class="hub-field">
        <label for="password">비밀번호</label>
        <div class="password-wrap">
          <input
            id="password"
            v-model="password"
            placeholder="비밀번호를 입력해주세요"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            maxlength="72"
            required
            :disabled="pending"
          />
          <button
            class="password-toggle"
            type="button"
            :aria-pressed="showPassword"
            :aria-label="showPassword ? '비밀번호 숨기기' : '비밀번호 보기'"
            :disabled="pending"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? '숨기기' : '보기' }}
          </button>
        </div>
      </div>
      <button class="hub-submit" type="submit" :disabled="pending">
        <span>{{ pending ? '로그인 중…' : '로그인' }}</span
        ><span v-if="!pending" class="arrow" aria-hidden="true">↗</span>
      </button>
    </form>
    <template v-if="kakaoEnabled">
      <div class="social-divider"><span>또는 간편하게</span></div>
      <KakaoButton :disabled="pending" @click="startKakaoLogin" />
    </template>
    <p class="auth-switch">
      아직 함께하지 않으셨나요? <RouterLink to="/signup">회원가입</RouterLink>
    </p>
  </AuthLayout>
</template>
