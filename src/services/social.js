import api from './api'

export async function loadSocialProviders() {
  const { data } = await api.get('/auth/social/providers')
  return data
}

export function socialErrorMessage(code) {
  return (
    {
      email_conflict:
        '같은 이메일로 가입한 계정이 있어요. 기존 아이디로 로그인한 뒤 카카오 계정을 연결해주세요.',
      account_already_linked: '이 카카오 계정은 다른 회원에게 이미 연결되어 있어요.',
      provider_already_linked: '이미 다른 카카오 계정이 연결되어 있어요.',
      link_session_expired: '계정 연결 시간이 만료되었어요. 다시 로그인한 뒤 연결해주세요.',
      account_conflict: '계정 연결 정보가 변경되었어요. 다시 시도해주세요.',
      login_failed: '카카오 로그인이 취소되었거나 완료되지 않았어요. 다시 시도해주세요.',
    }[code] ?? '카카오 인증을 완료하지 못했어요. 다시 시도해주세요.'
  )
}

export function startKakaoLogin() {
  window.location.assign('/api/oauth2/authorization/kakao')
}

export async function linkKakao() {
  // CSRF header is supplied by the common API client. No member ID is sent by the browser.
  const { data } = await api.post('/auth/social/kakao/link')
  const destination = new URL(data.authorizationUrl, window.location.origin)
  if (
    destination.origin !== window.location.origin ||
    destination.pathname !== '/api/oauth2/authorization/kakao'
  ) {
    throw new Error('Unexpected authorization URL')
  }
  window.location.assign(destination.href)
}
