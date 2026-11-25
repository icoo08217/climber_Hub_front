<script setup>
defineOptions({ name: 'ProfileSettingsView' })
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import AuthLayout from '../components/AuthLayout.vue'

const auth = useAuthStore()
const name = ref(auth.member?.name ?? '')
const email = ref(auth.member?.email ?? '')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const profilePending = ref(false)
const passwordPending = ref(false)
const profileMessage = ref('')
const profileError = ref('')
const passwordMessage = ref('')
const passwordError = ref('')

function apiMessage(error, fallback) {
  return error.response?.data?.message ?? fallback
}

async function saveProfile() {
  if (profilePending.value) return
  profilePending.value = true
  profileMessage.value = ''
  profileError.value = ''
  try {
    await auth.updateProfile({ name: name.value, email: email.value || null })
    name.value = auth.member?.name ?? ''
    email.value = auth.member?.email ?? ''
    profileMessage.value = '개인정보를 수정했어요.'
  } catch (error) {
    profileError.value = apiMessage(error, '개인정보를 수정하지 못했어요. 다시 시도해주세요.')
  } finally {
    profilePending.value = false
  }
}

async function savePassword() {
  if (passwordPending.value) return
  passwordMessage.value = ''
  passwordError.value = ''
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = '새 비밀번호 확인이 일치하지 않아요.'
    return
  }
  if (newPassword.value.length < 8 || new TextEncoder().encode(newPassword.value).length > 72) {
    passwordError.value = '새 비밀번호는 8자 이상, UTF-8 기준 72바이트 이하로 입력해주세요.'
    return
  }
  passwordPending.value = true
  try {
    await auth.changePassword(currentPassword.value, newPassword.value)
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    passwordMessage.value = '비밀번호를 변경했어요.'
  } catch (error) {
    passwordError.value = apiMessage(error, '비밀번호를 변경하지 못했어요. 다시 시도해주세요.')
  } finally {
    passwordPending.value = false
  }
}
</script>

<template>
  <AuthLayout
    eyebrow="ACCOUNT SETTINGS"
    title="내 정보를 관리해요."
    description="이름과 이메일을 최신 정보로 유지하고, 비밀번호를 안전하게 변경할 수 있어요."
  >
    <RouterLink class="settings-back" to="/account">← 내 계정으로 돌아가기</RouterLink>

    <div class="settings-stack">
      <section class="settings-card" aria-labelledby="profile-heading">
        <div class="settings-card-heading">
          <span class="settings-icon" aria-hidden="true">01</span>
          <div>
            <h3 id="profile-heading">기본 정보</h3>
            <p>로그인 아이디는 변경할 수 없어요.</p>
          </div>
        </div>
        <form class="hub-form settings-form" @submit.prevent="saveProfile">
          <fieldset :disabled="profilePending">
            <div class="hub-field">
              <label for="profile-login-id">아이디</label>
              <input
                id="profile-login-id"
                :value="auth.member?.loginId ?? '소셜 로그인 회원'"
                disabled
              />
            </div>
            <div class="hub-field">
              <label for="profile-name">이름</label>
              <input
                id="profile-name"
                v-model.trim="name"
                required
                maxlength="50"
                autocomplete="name"
              />
            </div>
            <div class="hub-field">
              <label for="profile-email">이메일 <small>(선택)</small></label>
              <input
                id="profile-email"
                v-model.trim="email"
                type="email"
                maxlength="255"
                autocomplete="email"
                placeholder="climber@example.com"
              />
            </div>
          </fieldset>
          <div v-if="profileMessage" class="hub-notice success" role="status">
            {{ profileMessage }}
          </div>
          <div v-if="profileError" class="hub-notice" role="alert">{{ profileError }}</div>
          <button class="hub-submit" :disabled="profilePending">
            {{ profilePending ? '저장 중…' : '기본 정보 저장' }}
          </button>
        </form>
      </section>

      <section
        v-if="auth.member?.localLoginEnabled"
        class="settings-card"
        aria-labelledby="password-heading"
      >
        <div class="settings-card-heading">
          <span class="settings-icon" aria-hidden="true">02</span>
          <div>
            <h3 id="password-heading">비밀번호 변경</h3>
            <p>현재 비밀번호 확인 후 변경할 수 있어요.</p>
          </div>
        </div>
        <form class="hub-form settings-form" @submit.prevent="savePassword">
          <fieldset :disabled="passwordPending">
            <div class="hub-field">
              <label for="current-password">현재 비밀번호</label>
              <input
                id="current-password"
                v-model="currentPassword"
                type="password"
                required
                autocomplete="current-password"
              />
            </div>
            <div class="hub-field">
              <label for="new-password">새 비밀번호</label>
              <input
                id="new-password"
                v-model="newPassword"
                type="password"
                required
                minlength="8"
                maxlength="72"
                autocomplete="new-password"
              />
              <small>8자 이상, UTF-8 기준 72바이트 이하</small>
            </div>
            <div class="hub-field">
              <label for="confirm-password">새 비밀번호 확인</label>
              <input
                id="confirm-password"
                v-model="confirmPassword"
                type="password"
                required
                minlength="8"
                maxlength="72"
                autocomplete="new-password"
              />
            </div>
          </fieldset>
          <div v-if="passwordMessage" class="hub-notice success" role="status">
            {{ passwordMessage }}
          </div>
          <div v-if="passwordError" class="hub-notice" role="alert">{{ passwordError }}</div>
          <button class="hub-submit" :disabled="passwordPending">
            {{ passwordPending ? '변경 중…' : '비밀번호 변경' }}
          </button>
        </form>
      </section>

      <section v-else class="settings-card social-password-note">
        <div class="settings-card-heading">
          <span class="settings-icon" aria-hidden="true">02</span>
          <div>
            <h3>비밀번호</h3>
            <p>현재 소셜 계정으로 로그인하고 있어 비밀번호 변경 항목이 없어요.</p>
          </div>
        </div>
      </section>
    </div>
  </AuthLayout>
</template>
