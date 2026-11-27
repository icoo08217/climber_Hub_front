import { defineStore } from 'pinia'
import { ref } from 'vue'
import api, { refreshCsrf } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const member = ref(null)
  const initialized = ref(false)
  let restoreRequest

  function restore({ force = false } = {}) {
    if (initialized.value && !force) return Promise.resolve(member.value)
    if (restoreRequest && !force) return restoreRequest

    restoreRequest = api
      .get('/auth/me')
      .then(({ data }) => {
        member.value = data
        return data
      })
      .catch((error) => {
        if (error.response?.status !== 401) throw error
        member.value = null
        return null
      })
      .finally(() => {
        initialized.value = true
        restoreRequest = undefined
      })

    return restoreRequest
  }

  async function login(loginId, password) {
    await refreshCsrf()
    const { data } = await api.post('/auth/login', { loginId, password })
    member.value = data
    initialized.value = true
    await refreshCsrf()
  }

  async function signup(form) {
    await refreshCsrf()
    await api.post('/auth/signup', form)
  }

  async function updateProfile(profile) {
    const { data } = await api.patch('/members/me/profile', profile)
    member.value = data
  }

  async function changePassword(currentPassword, newPassword) {
    await api.patch('/members/me/password', { currentPassword, newPassword })
  }

  async function uploadProfileImage(file) {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await api.post('/members/me/profile-image', formData)
    member.value = data
  }

  async function deleteProfileImage() {
    const { data } = await api.delete('/members/me/profile-image')
    member.value = data
  }

  async function logout() {
    await refreshCsrf()
    await api.post('/auth/logout')
    member.value = null
    initialized.value = true
  }

  return {
    member,
    initialized,
    restore,
    login,
    signup,
    updateProfile,
    changePassword,
    uploadProfileImage,
    deleteProfileImage,
    logout,
  }
})
