<script setup>
defineOptions({ name: 'AccountView' })
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AuthLayout from '../components/AuthLayout.vue'
import KakaoButton from '../components/KakaoButton.vue'
import PasswordVisibilityIcon from '../components/PasswordVisibilityIcon.vue'
import { loadSocialProviders, linkKakao, socialErrorMessage } from '../services/social'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const name = ref(auth.member?.name ?? '')
const email = ref(auth.member?.email ?? '')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const selectedImage = ref(null)
const previewUrl = ref('')
const imageInput = ref(null)
const kakaoEnabled = ref(false)
const linking = ref(false)
const pending = ref(false)
const profilePending = ref(false)
const passwordPending = ref(false)
const imagePending = ref(false)
const message = ref('')
const errorMessage = ref('')

const profileImage = computed(() => previewUrl.value || auth.member?.profileImageUrl || '')

onMounted(async () => {
  if (route.query.social_error)
    errorMessage.value = socialErrorMessage(String(route.query.social_error))
  else if (route.query.social === 'success') message.value = '카카오 인증이 완료되었어요.'
  if (route.query.social || route.query.social_error) await router.replace({ path: '/account' })
  try {
    kakaoEnabled.value = (await loadSocialProviders()).kakao === true
  } catch {
    /* The account page remains usable when provider settings cannot be loaded. */
  }
})

onBeforeUnmount(clearPreview)

function apiMessage(error, fallback) {
  return error.response?.data?.message ?? fallback
}

function clearNotices() {
  message.value = ''
  errorMessage.value = ''
}

function clearPreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

function chooseImage(event) {
  clearNotices()
  const file = event.target.files?.[0]
  if (!file) return
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    errorMessage.value = 'JPG, PNG, WEBP, GIF 이미지만 올릴 수 있어요.'
    event.target.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = '프로필 사진은 5MB 이하로 선택해주세요.'
    event.target.value = ''
    return
  }
  clearPreview()
  selectedImage.value = file
  previewUrl.value = URL.createObjectURL(file)
}

async function uploadImage() {
  if (!selectedImage.value || imagePending.value) return
  imagePending.value = true
  clearNotices()
  try {
    await auth.uploadProfileImage(selectedImage.value)
    selectedImage.value = null
    clearPreview()
    if (imageInput.value) imageInput.value.value = ''
    message.value = '프로필 사진을 저장했어요.'
  } catch (error) {
    errorMessage.value = apiMessage(error, '프로필 사진을 저장하지 못했어요.')
  } finally {
    imagePending.value = false
  }
}

async function deleteImage() {
  if (!auth.member?.profileImageUrl || imagePending.value) return
  if (!window.confirm('현재 프로필 사진을 삭제할까요?')) return
  imagePending.value = true
  clearNotices()
  try {
    await auth.deleteProfileImage()
    selectedImage.value = null
    clearPreview()
    message.value = '프로필 사진을 삭제했어요.'
  } catch (error) {
    errorMessage.value = apiMessage(error, '프로필 사진을 삭제하지 못했어요.')
  } finally {
    imagePending.value = false
  }
}

async function saveProfile() {
  if (profilePending.value) return
  profilePending.value = true
  clearNotices()
  try {
    await auth.updateProfile({ name: name.value, email: email.value || null })
    name.value = auth.member?.name ?? ''
    email.value = auth.member?.email ?? ''
    message.value = '기본 정보를 수정했어요.'
  } catch (error) {
    errorMessage.value = apiMessage(error, '개인정보를 수정하지 못했어요.')
  } finally {
    profilePending.value = false
  }
}

async function savePassword() {
  if (passwordPending.value) return
  clearNotices()
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = '새 비밀번호 확인이 일치하지 않아요.'
    return
  }
  if (newPassword.value.length < 8 || new TextEncoder().encode(newPassword.value).length > 72) {
    errorMessage.value = '새 비밀번호는 8자 이상, UTF-8 기준 72바이트 이하로 입력해주세요.'
    return
  }
  passwordPending.value = true
  try {
    await auth.changePassword(currentPassword.value, newPassword.value)
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    message.value = '비밀번호를 변경했어요.'
  } catch (error) {
    errorMessage.value = apiMessage(error, '비밀번호를 변경하지 못했어요.')
  } finally {
    passwordPending.value = false
  }
}

async function connectKakao() {
  if (linking.value || pending.value) return
  linking.value = true
  clearNotices()
  try {
    await linkKakao()
  } catch (error) {
    errorMessage.value =
      error.response?.status === 401
        ? '세션이 만료됐어요. 다시 로그인해주세요.'
        : '카카오 계정을 연결할 수 없어요.'
    linking.value = false
  }
}

async function logout() {
  if (pending.value) return
  pending.value = true
  clearNotices()
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
    eyebrow="MY ACCOUNT"
    title="내 계정 상세"
    description="프로필 사진과 회원 정보, 비밀번호, 연결 계정을 한곳에서 관리하세요."
  >
    <RouterLink class="settings-back" to="/">← 게시판으로 돌아가기</RouterLink>
    <span class="profile-badge"><span class="status-dot"></span> 로그인되어 있어요</span>

    <div v-if="message" class="hub-notice success" role="status">{{ message }}</div>
    <div v-if="errorMessage" class="hub-notice" role="alert">{{ errorMessage }}</div>

    <div class="settings-stack account-detail-stack">
      <section class="settings-card" aria-labelledby="photo-heading">
        <div class="settings-card-heading">
          <span class="settings-icon" aria-hidden="true">01</span>
          <div>
            <h3 id="photo-heading">프로필 사진</h3>
            <p>JPG, PNG, WEBP, GIF · 최대 5MB</p>
          </div>
        </div>
        <div class="account-photo-editor">
          <span class="account-photo-preview">
            <img v-if="profileImage" :src="profileImage" alt="내 프로필 사진 미리보기" />
            <span v-else aria-hidden="true">{{ Array.from(auth.member?.name ?? 'C')[0] }}</span>
          </span>
          <div class="account-photo-controls">
            <label class="account-file-button">
              사진 선택
              <input
                ref="imageInput"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                :disabled="imagePending"
                @change="chooseImage"
              />
            </label>
            <button
              type="button"
              class="account-photo-save"
              :disabled="!selectedImage || imagePending"
              @click="uploadImage"
            >
              {{ imagePending ? '처리 중…' : '사진 저장' }}
            </button>
            <button
              v-if="auth.member?.profileImageUrl"
              type="button"
              class="account-photo-delete"
              :disabled="imagePending"
              @click="deleteImage"
            >
              삭제
            </button>
          </div>
        </div>
      </section>

      <section class="settings-card" aria-labelledby="profile-heading">
        <div class="settings-card-heading">
          <span class="settings-icon" aria-hidden="true">02</span>
          <div>
            <h3 id="profile-heading">기본 정보</h3>
            <p>로그인 아이디와 권한은 확인만 할 수 있어요.</p>
          </div>
        </div>
        <form class="hub-form settings-form" @submit.prevent="saveProfile">
          <fieldset :disabled="profilePending">
            <div class="hub-field">
              <label for="account-login-id">로그인 아이디</label>
              <input
                id="account-login-id"
                :value="auth.member?.loginId ?? '소셜 로그인 회원'"
                disabled
              />
            </div>
            <div class="hub-field">
              <label for="account-role">회원 권한</label>
              <input
                id="account-role"
                :value="auth.member?.role === 'ADMIN' ? '관리자' : '일반 회원'"
                disabled
              />
            </div>
            <div class="hub-field">
              <label for="account-name">이름</label>
              <input
                id="account-name"
                v-model.trim="name"
                required
                maxlength="50"
                autocomplete="name"
              />
            </div>
            <div class="hub-field">
              <label for="account-email">이메일 <small>(선택)</small></label>
              <input
                id="account-email"
                v-model.trim="email"
                type="email"
                maxlength="255"
                autocomplete="email"
                placeholder="climber@example.com"
              />
            </div>
          </fieldset>
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
          <span class="settings-icon" aria-hidden="true">03</span>
          <div>
            <h3 id="password-heading">비밀번호 변경</h3>
            <p>현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.</p>
          </div>
        </div>
        <form class="hub-form settings-form" @submit.prevent="savePassword">
          <fieldset :disabled="passwordPending">
            <div class="hub-field">
              <label for="current-password">현재 비밀번호</label>
              <div class="password-wrap">
                <input
                  id="current-password"
                  v-model="currentPassword"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  required
                  maxlength="72"
                  autocomplete="current-password"
                />
                <button
                  class="password-toggle"
                  type="button"
                  :aria-pressed="showCurrentPassword"
                  :aria-label="showCurrentPassword ? '현재 비밀번호 숨기기' : '현재 비밀번호 보기'"
                  @click="showCurrentPassword = !showCurrentPassword"
                >
                  <PasswordVisibilityIcon :visible="showCurrentPassword" />
                </button>
              </div>
            </div>
            <div class="hub-field">
              <label for="new-password">새 비밀번호</label>
              <div class="password-wrap">
                <input
                  id="new-password"
                  v-model="newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  required
                  minlength="8"
                  maxlength="72"
                  autocomplete="new-password"
                />
                <button
                  class="password-toggle"
                  type="button"
                  :aria-pressed="showNewPassword"
                  :aria-label="showNewPassword ? '새 비밀번호 숨기기' : '새 비밀번호 보기'"
                  @click="showNewPassword = !showNewPassword"
                >
                  <PasswordVisibilityIcon :visible="showNewPassword" />
                </button>
              </div>
            </div>
            <div class="hub-field">
              <label for="confirm-password">새 비밀번호 확인</label>
              <div class="password-wrap">
                <input
                  id="confirm-password"
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  required
                  minlength="8"
                  maxlength="72"
                  autocomplete="new-password"
                />
                <button
                  class="password-toggle"
                  type="button"
                  :aria-pressed="showConfirmPassword"
                  :aria-label="showConfirmPassword ? '비밀번호 확인 숨기기' : '비밀번호 확인 보기'"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <PasswordVisibilityIcon :visible="showConfirmPassword" />
                </button>
              </div>
            </div>
          </fieldset>
          <button class="hub-submit" :disabled="passwordPending">
            {{ passwordPending ? '변경 중…' : '비밀번호 변경' }}
          </button>
        </form>
      </section>

      <section class="settings-card social-connections" aria-label="연결된 로그인 계정">
        <div class="settings-card-heading">
          <span class="settings-icon" aria-hidden="true">04</span>
          <div>
            <h3>로그인 계정 연결</h3>
            <p>연결한 계정으로도 같은 회원 정보를 이용할 수 있어요.</p>
          </div>
        </div>
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
    </div>

    <RouterLink
      v-if="auth.member?.role === 'ADMIN'"
      class="hub-secondary-link account-admin-link"
      to="/admin/gym-owners"
    >
      암장 관리인 지정 <span aria-hidden="true">→</span>
    </RouterLink>
    <button class="hub-submit hub-logout" :disabled="pending || linking" @click="logout">
      {{ pending ? '로그아웃 중…' : '로그아웃' }} <span class="arrow" aria-hidden="true">↗</span>
    </button>
  </AuthLayout>
</template>
