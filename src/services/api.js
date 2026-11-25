import axios from 'axios'

const api = axios.create({ baseURL: '/api', withCredentials: true })
let csrf = null

export async function refreshCsrf() {
  const { data } = await api.get('/auth/csrf')
  csrf = data
}

api.interceptors.request.use(async (config) => {
  if (!['get', 'head', 'options'].includes(config.method ?? 'get')) {
    if (!csrf) await refreshCsrf()
    config.headers[csrf.headerName] = csrf.token
  }
  return config
})

api.interceptors.response.use(undefined, (error) => {
  if ([401, 403].includes(error.response?.status)) csrf = null
  return Promise.reject(error)
})

export default api
