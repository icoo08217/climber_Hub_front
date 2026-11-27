import api from './api'

export async function loadGyms() {
  const { data } = await api.get('/gyms')
  return data
}

export async function loadGym(gymId) {
  const { data } = await api.get(`/gyms/${gymId}`)
  return data
}
