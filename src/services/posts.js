import api from './api'

export async function loadPosts() {
  const { data } = await api.get('/posts')
  return data
}

export async function createPost(title, content, files = []) {
  if (files.length === 0) {
    const { data } = await api.post('/posts', { title, content })
    return data
  }
  const form = new FormData()
  form.append('post', new Blob([JSON.stringify({ title, content })], { type: 'application/json' }))
  files.forEach((file) => form.append('files', file))
  const { data } = await api.post('/posts', form)
  return data
}

export async function deletePost(postId) {
  await api.delete(`/posts/${postId}`)
}

export async function loadComments(postId) {
  const { data } = await api.get(`/posts/${postId}/comments`)
  return data
}

export async function createComment(postId, content, parentCommentId = null) {
  const { data } = await api.post(`/posts/${postId}/comments`, { content, parentCommentId })
  return data
}

export async function deleteComment(commentId) {
  await api.delete(`/comments/${commentId}`)
}
