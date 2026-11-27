<script setup>
defineOptions({ name: 'AdminGymOwnersView' })
import { computed, onMounted, ref } from 'vue'
import api from '../services/api'

const data = ref({ members: [], gyms: [] })
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const selectedGymId = ref(null)
const selectedMemberId = ref('')
const memberKeyword = ref('')
const editingManagerId = ref(null)

const selectedGym = computed(() =>
  data.value.gyms.find((gym) => gym.gymId === Number(selectedGymId.value)),
)
const editingManager = computed(() =>
  selectedGym.value?.owners.find((owner) => owner.memberId === editingManagerId.value),
)
const managerIds = computed(
  () => new Set(selectedGym.value?.owners.map((owner) => owner.memberId) ?? []),
)
const candidateMembers = computed(() => {
  const keyword = memberKeyword.value.trim().toLocaleLowerCase('ko-KR')
  return data.value.members.filter((member) => {
    if (managerIds.value.has(member.memberId)) return false
    if (!keyword) return true
    return [member.name, member.loginId, member.email, member.role]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase('ko-KR').includes(keyword))
  })
})

onMounted(loadManagementData)

async function loadManagementData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await api.get('/admin/gym-owners')
    data.value = response.data
    if (!data.value.gyms.some((gym) => gym.gymId === Number(selectedGymId.value))) {
      selectedGymId.value = data.value.gyms[0]?.gymId ?? null
    }
  } catch (error) {
    errorMessage.value =
      error.response?.status === 403
        ? '관리자만 이 화면을 이용할 수 있어요.'
        : '암장 관리인 정보를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

function resetMemberSelection() {
  selectedMemberId.value = ''
  memberKeyword.value = ''
}

function selectGym() {
  editingManagerId.value = null
  resetMemberSelection()
  successMessage.value = ''
  errorMessage.value = ''
}

function startEditing(manager) {
  editingManagerId.value = manager.memberId
  resetMemberSelection()
  successMessage.value = ''
  errorMessage.value = ''
}

function cancelEditing() {
  editingManagerId.value = null
  resetMemberSelection()
}

async function saveManager() {
  if (!selectedGym.value || !selectedMemberId.value || saving.value) return
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const memberId = Number(selectedMemberId.value)
    if (editingManager.value) {
      const previousManager = editingManager.value
      const response = await api.patch(
        `/admin/gyms/${selectedGym.value.gymId}/owners/${previousManager.memberId}`,
        { newMemberId: memberId },
      )
      selectedGym.value.owners = selectedGym.value.owners.map((manager) =>
        manager.memberId === previousManager.memberId ? response.data : manager,
      )
      successMessage.value = `${previousManager.name}님에서 ${response.data.name}님으로 관리인을 수정했습니다.`
      editingManagerId.value = null
    } else {
      const response = await api.post(`/admin/gyms/${selectedGym.value.gymId}/owners`, {
        memberId,
      })
      selectedGym.value.owners.push(response.data)
      successMessage.value = `${response.data.name}님을 ${selectedGym.value.name}의 관리인으로 지정했습니다.`
    }
    selectedGym.value.owners.sort((left, right) => left.name.localeCompare(right.name, 'ko-KR'))
    resetMemberSelection()
  } catch (error) {
    errorMessage.value =
      error.response?.status === 409
        ? '이미 이 암장의 관리인으로 지정된 회원입니다.'
        : editingManager.value
          ? '암장 관리인을 수정하지 못했습니다.'
          : '암장 관리인을 지정하지 못했습니다.'
  } finally {
    saving.value = false
  }
}

async function removeManager(manager) {
  if (!selectedGym.value || saving.value) return
  if (!window.confirm(`${manager.name}님을 ${selectedGym.value.name} 관리인에서 삭제할까요?`))
    return
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await api.delete(`/admin/gyms/${selectedGym.value.gymId}/owners/${manager.memberId}`)
    selectedGym.value.owners = selectedGym.value.owners.filter(
      (current) => current.memberId !== manager.memberId,
    )
    if (editingManagerId.value === manager.memberId) cancelEditing()
    successMessage.value = `${manager.name}님의 암장 관리인 지정을 삭제했습니다.`
  } catch {
    errorMessage.value = '암장 관리인 지정을 삭제하지 못했습니다.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="admin-owner-page">
    <header class="admin-owner-header">
      <div>
        <span>CLIMBERS’ HUB ADMIN</span>
        <h1>암장 관리인 지정</h1>
        <p>암장을 선택한 뒤 회원을 검색해 관리인을 지정·수정·삭제할 수 있습니다.</p>
      </div>
      <RouterLink to="/account">내 계정으로 돌아가기</RouterLink>
    </header>

    <p v-if="errorMessage" class="admin-owner-notice error" role="alert">{{ errorMessage }}</p>
    <p v-if="successMessage" class="admin-owner-notice success" role="status">
      {{ successMessage }}
    </p>

    <section v-if="loading" class="admin-owner-state" aria-live="polite">
      관리 정보를 불러오는 중입니다…
    </section>
    <section v-else-if="data.gyms.length === 0" class="admin-owner-state">
      <strong>등록된 암장이 없습니다.</strong>
      <p>먼저 DB에 암장을 등록하면 이 화면에서 관리인을 지정할 수 있습니다.</p>
    </section>

    <section v-else class="admin-owner-layout">
      <aside class="admin-gym-picker" aria-label="관리할 암장 선택">
        <div class="admin-owner-section-title">
          <span>GYM</span><strong>{{ data.gyms.length }}곳</strong>
        </div>
        <label>
          <span>암장 선택</span>
          <select v-model="selectedGymId" @change="selectGym">
            <option v-for="gym in data.gyms" :key="gym.gymId" :value="gym.gymId">
              {{ gym.name }} (관리인 {{ gym.owners.length }}명)
            </option>
          </select>
        </label>
        <div v-if="selectedGym" class="admin-selected-gym-summary">
          <strong>{{ selectedGym.name }}</strong>
          <small>{{ selectedGym.address }}</small>
          <span>{{ selectedGym.verificationStatus === 'VERIFIED' ? '검증 완료' : '검증 중' }}</span>
        </div>
      </aside>

      <div v-if="selectedGym" class="admin-owner-workspace">
        <section class="admin-owner-card">
          <div class="admin-owner-section-title">
            <div>
              <span>CURRENT MANAGERS</span>
              <h2>현재 암장 관리인</h2>
            </div>
            <small>{{ selectedGym.owners.length }}명</small>
          </div>

          <p v-if="selectedGym.owners.length === 0" class="admin-owner-empty">
            아직 지정된 관리인이 없습니다.
          </p>
          <ul v-else class="admin-current-owners">
            <li v-for="manager in selectedGym.owners" :key="manager.memberId">
              <span class="admin-owner-avatar" aria-hidden="true">{{
                Array.from(manager.name)[0]
              }}</span>
              <div class="admin-manager-info">
                <strong>{{ manager.name }}</strong>
                <small>로그인 ID: {{ manager.loginId || '소셜 로그인 회원' }}</small>
                <small>이메일: {{ manager.email || '등록되지 않음' }}</small>
              </div>
              <div class="admin-manager-actions">
                <button
                  class="edit"
                  type="button"
                  :disabled="saving"
                  @click="startEditing(manager)"
                >
                  수정
                </button>
                <button
                  class="delete"
                  type="button"
                  :disabled="saving"
                  @click="removeManager(manager)"
                >
                  삭제
                </button>
              </div>
            </li>
          </ul>
        </section>

        <section class="admin-owner-card">
          <div class="admin-owner-section-title">
            <div>
              <span>{{ editingManager ? 'EDIT MANAGER' : 'ASSIGN MANAGER' }}</span>
              <h2>
                {{ editingManager ? `${editingManager.name}님 관리인 수정` : '새 관리인 지정' }}
              </h2>
            </div>
            <button
              v-if="editingManager"
              class="admin-edit-cancel"
              type="button"
              @click="cancelEditing"
            >
              수정 취소
            </button>
          </div>
          <p v-if="editingManager" class="admin-edit-guide">
            아래에서 새 관리인을 검색해 선택하면 현재 관리인을 교체합니다.
          </p>
          <label class="admin-member-search">
            <span>회원 검색</span>
            <input
              v-model="memberKeyword"
              type="search"
              placeholder="이름, 로그인 ID, 이메일 또는 권한"
            />
          </label>
          <label class="admin-member-select">
            <span>검색된 회원</span>
            <select v-model="selectedMemberId" :disabled="saving || candidateMembers.length === 0">
              <option value="">관리인으로 지정할 회원을 선택하세요</option>
              <option
                v-for="member in candidateMembers"
                :key="member.memberId"
                :value="member.memberId"
              >
                {{ member.name }} · {{ member.loginId || member.email || '소셜 회원' }} ·
                {{ member.role }}
              </option>
            </select>
          </label>
          <p v-if="candidateMembers.length === 0" class="admin-owner-empty">
            검색 조건에 맞는 지정 가능한 회원이 없습니다.
          </p>
          <button
            class="admin-assign-button"
            type="button"
            :disabled="saving || !selectedMemberId"
            @click="saveManager"
          >
            {{ saving ? '처리 중…' : editingManager ? '관리인 수정' : '관리인 지정' }}
          </button>
        </section>
      </div>
    </section>
  </main>
</template>
