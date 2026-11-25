<script setup>
defineOptions({ name: 'SignupView' })
import { reactive, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import AuthLayout from '../components/AuthLayout.vue'

const auth = useAuthStore()
const form = reactive({ loginId: '', password: '', email: '', name: '' })
const showPassword = ref(false)
const pending = ref(false)
const errorMessage = ref('')
const success = ref(false)

async function signup() {
  if (pending.value) return
  if (new TextEncoder().encode(form.password).length > 72) {
    errorMessage.value = '비밀번호는 UTF-8 기준 72바이트 이하여야 합니다.'
    return
  }
  pending.value = true
  errorMessage.value = ''
  try {
    await auth.signup({
      ...form,
      loginId: form.loginId.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
    })
    success.value = true
    form.password = ''
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ?? '가입할 수 없습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <AuthLayout
    eyebrow="JOIN THE COMMUNITY"
    title="첫 홀드, 함께 잡아요."
    description="나만의 계정을 만들고 클라이밍 여정을 시작하세요."
  >
    <template v-if="success">
      <div class="success-mark" aria-hidden="true">✓</div>
      <div class="hub-notice success" role="status">
        가입이 완료되었어요!<br />등록한 아이디와 비밀번호로 로그인해주세요.
      </div>
      <RouterLink class="hub-submit text-decoration-none" to="/login"
        >로그인하러 가기 <span class="arrow" aria-hidden="true">↗</span></RouterLink
      >
    </template>
    <template v-else>
      <div v-if="errorMessage" class="hub-notice" role="alert">{{ errorMessage }}</div>
      <form class="hub-form signup-form" @submit.prevent="signup">
        <fieldset class="signup-fields" :disabled="pending">
          <div class="hub-field">
            <label for="signup-id">아이디</label>
            <input
              id="signup-id"
              v-model="form.loginId"
              placeholder="나만의 아이디"
              autocomplete="username"
              pattern="[a-z0-9_]{4,50}"
              minlength="4"
              maxlength="50"
              required
              aria-describedby="id-help"
              autocapitalize="none"
              spellcheck="false"
            />
            <small id="id-help">영문 소문자·숫자·밑줄 조합, 4~50자</small>
          </div>
          <div class="hub-field">
            <label for="signup-name">이름 / 닉네임</label>
            <input
              id="signup-name"
              v-model="form.name"
              placeholder="어떻게 불러드릴까요?"
              autocomplete="nickname"
              maxlength="50"
              required
            />
          </div>
          <div class="hub-field">
            <label for="signup-email">이메일</label>
            <input
              id="signup-email"
              v-model="form.email"
              placeholder="hello@example.com"
              type="email"
              autocomplete="email"
              maxlength="255"
              required
            />
          </div>
          <div class="hub-field">
            <label for="signup-password">비밀번호</label>
            <div class="password-wrap">
              <input
                id="signup-password"
                v-model="form.password"
                placeholder="8자 이상 입력해주세요"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                minlength="8"
                maxlength="72"
                required
                aria-describedby="password-help"
              />
              <button
                class="password-toggle"
                type="button"
                :aria-pressed="showPassword"
                :aria-label="showPassword ? '비밀번호 숨기기' : '비밀번호 보기'"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '숨기기' : '보기' }}
              </button>
            </div>
            <small id="password-help">8자 이상, 한글 등 다국어 포함 시 최대 72바이트</small>
          </div>
          <button class="hub-submit" type="submit">
            <span>{{ pending ? '가입 중…' : '함께 시작하기' }}</span
            ><span v-if="!pending" class="arrow" aria-hidden="true">↗</span>
          </button>
        </fieldset>
      </form>
      <p class="auth-switch">이미 계정이 있으신가요? <RouterLink to="/login">로그인</RouterLink></p>
    </template>
  </AuthLayout>
</template>
