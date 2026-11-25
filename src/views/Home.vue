<script setup>
defineOptions({ name: 'HomeView' })
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { createPost, deletePost, loadPosts } from '../services/posts'
import PostComments from '../components/PostComments.vue'

const auth = useAuthStore()
const router = useRouter()
const posts = ref([])
const loading = ref(true)
const submitting = ref(false)
const deletingId = ref(null)
const composerOpen = ref(false)
const title = ref('')
const content = ref('')
const query = ref('')
const errorMessage = ref('')
const selectedMedia = ref([])
const openComments = ref(new Set())

const filteredPosts = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase('ko')
  if (!keyword) return posts.value
  return posts.value.filter((post) =>
    [post.title, post.content, post.memberName].some((value) =>
      String(value ?? '')
        .toLocaleLowerCase('ko')
        .includes(keyword),
    ),
  )
})

onMounted(refreshPosts)
onBeforeUnmount(clearSelectedMedia)

async function refreshPosts() {
  loading.value = true
  errorMessage.value = ''
  try {
    posts.value = await loadPosts()
  } catch (error) {
    errorMessage.value =
      error.response?.status === 401
        ? '로그인이 만료됐어요. 다시 로그인해주세요.'
        : '게시글을 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}

async function submitPost() {
  if (submitting.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    await createPost(
      title.value,
      content.value,
      selectedMedia.value.map((item) => item.file),
    )
    title.value = ''
    content.value = ''
    clearSelectedMedia()
    composerOpen.value = false
    await refreshPosts()
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '게시글을 등록하지 못했어요.'
  } finally {
    submitting.value = false
  }
}

function selectMedia(event) {
  const files = Array.from(event.target.files ?? [])
  errorMessage.value = ''
  if (files.length > 5) {
    errorMessage.value = '이미지와 동영상은 최대 5개까지 첨부할 수 있어요.'
    event.target.value = ''
    return
  }
  const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  const videoTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime'])
  let totalBytes = 0
  for (const file of files) {
    const isImage = imageTypes.has(file.type)
    const isVideo = videoTypes.has(file.type)
    if (!isImage && !isVideo) {
      errorMessage.value = 'JPG, PNG, WEBP, GIF 이미지 또는 MP4, WEBM, MOV 영상만 첨부할 수 있어요.'
      event.target.value = ''
      return
    }
    if ((isImage && file.size > 10 * 1024 * 1024) || (isVideo && file.size > 50 * 1024 * 1024)) {
      errorMessage.value = isImage ? '이미지는 10MB 이하여야 해요.' : '동영상은 50MB 이하여야 해요.'
      event.target.value = ''
      return
    }
    totalBytes += file.size
  }
  if (totalBytes > 100 * 1024 * 1024) {
    errorMessage.value = '첨부파일 전체 용량은 100MB 이하여야 해요.'
    event.target.value = ''
    return
  }
  clearSelectedMedia()
  selectedMedia.value = files.map((file) => ({
    file,
    url: URL.createObjectURL(file),
    mediaType: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
  }))
  event.target.value = ''
}

function removeSelectedMedia(index) {
  URL.revokeObjectURL(selectedMedia.value[index].url)
  selectedMedia.value.splice(index, 1)
}

function clearSelectedMedia() {
  selectedMedia.value.forEach((item) => URL.revokeObjectURL(item.url))
  selectedMedia.value = []
}

function toggleComments(postId) {
  const next = new Set(openComments.value)
  if (next.has(postId)) next.delete(postId)
  else next.add(postId)
  openComments.value = next
}

async function removePost(postId) {
  if (deletingId.value || !window.confirm('이 게시글을 삭제할까요?')) return
  deletingId.value = postId
  errorMessage.value = ''
  try {
    await deletePost(postId)
    posts.value = posts.value.filter((post) => post.postId !== postId)
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '게시글을 삭제하지 못했어요.'
  } finally {
    deletingId.value = null
  }
}

async function logout() {
  await auth.logout()
  await router.replace('/login')
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<template>
  <main class="board-shell">
    <header class="board-header">
      <RouterLink to="/" class="board-brand" aria-label="Climbers’ Hub 게시판 홈">
        <span class="board-brand-mark" aria-hidden="true">△</span>
        <span>climbers’ hub<span>.</span></span>
      </RouterLink>
      <nav class="board-nav" aria-label="주요 메뉴">
        <RouterLink to="/" class="active">라운지</RouterLink>
        <RouterLink to="/gyms">암장 지도</RouterLink>
        <RouterLink to="/account">내 계정</RouterLink>
        <button type="button" @click="logout">로그아웃</button>
      </nav>
      <RouterLink class="board-member" to="/account">
        <span class="board-avatar" aria-hidden="true">{{
          Array.from(auth.member?.name ?? 'C')[0]
        }}</span>
        <span
          ><strong>{{ auth.member?.name }}</strong
          ><small>오늘도 한 홀드 더</small></span
        >
      </RouterLink>
    </header>

    <section class="board-hero">
      <div>
        <p>CLIMBERS’ LOUNGE</p>
        <h1>벽 너머의 이야기를<br /><span>함께 나눠요.</span></h1>
        <p class="board-hero-copy">
          완등의 기쁨부터 다음 도전의 고민까지, 클라이머들의 이야기가 모이는 곳.
        </p>
      </div>
      <button class="board-write-button" type="button" @click="composerOpen = !composerOpen">
        {{ composerOpen ? '작성 취소' : '새 이야기 쓰기' }} <span aria-hidden="true">＋</span>
      </button>
    </section>

    <section class="board-content">
      <aside class="board-sidebar">
        <div class="board-side-card">
          <p class="board-side-label">BOARD</p>
          <strong>전체 자유게시판</strong>
          <span>클라이밍에 관한 이야기를 자유롭게 나눠보세요.</span>
        </div>
        <div class="board-guide">
          <span aria-hidden="true">✦</span>
          <div>
            <strong>좋은 대화를 위해</strong>
            <p>서로의 도전과 속도를 존중해주세요.</p>
          </div>
        </div>
      </aside>

      <div class="board-feed">
        <form v-if="composerOpen" class="board-composer" @submit.prevent="submitPost">
          <div class="board-composer-heading">
            <div>
              <span class="board-avatar small">{{ Array.from(auth.member?.name ?? 'C')[0] }}</span>
            </div>
            <div>
              <strong>새 이야기</strong>
              <p>{{ auth.member?.name }}님의 이야기를 들려주세요.</p>
            </div>
          </div>
          <label for="post-title">제목</label>
          <input
            id="post-title"
            v-model.trim="title"
            required
            maxlength="255"
            placeholder="어떤 이야기를 나누고 싶나요?"
          />
          <label for="post-content">내용</label>
          <textarea
            id="post-content"
            v-model.trim="content"
            required
            maxlength="10000"
            rows="6"
            placeholder="클라이밍 이야기를 자유롭게 적어주세요."
          ></textarea>
          <div class="media-picker">
            <label for="post-media"><span aria-hidden="true">▧</span> 이미지·동영상 첨부</label>
            <input
              id="post-media"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              @change="selectMedia"
            />
            <small>최대 5개 · 이미지 10MB · 동영상 50MB</small>
          </div>
          <div v-if="selectedMedia.length" class="media-preview-list">
            <div v-for="(item, index) in selectedMedia" :key="item.url" class="media-preview">
              <img v-if="item.mediaType === 'IMAGE'" :src="item.url" alt="첨부 이미지 미리보기" />
              <video v-else :src="item.url" muted aria-label="첨부 동영상 미리보기"></video>
              <button
                type="button"
                :aria-label="item.file.name + ' 제거'"
                @click="removeSelectedMedia(index)"
              >
                ×
              </button>
              <span>{{ item.file.name }}</span>
            </div>
          </div>
          <div class="board-composer-actions">
            <small>{{ content.length.toLocaleString() }} / 10,000</small>
            <button type="submit" :disabled="submitting">
              {{ submitting ? '등록 중…' : '게시하기' }}
            </button>
          </div>
        </form>

        <div class="board-toolbar">
          <div>
            <strong>최신 이야기</strong><span>{{ posts.length }}개의 글</span>
          </div>
          <label class="board-search">
            <span class="visually-hidden">게시글 검색</span>
            <input v-model="query" type="search" placeholder="제목, 내용, 작성자 검색" />
            <span aria-hidden="true">⌕</span>
          </label>
        </div>

        <div v-if="errorMessage" class="board-alert" role="alert">{{ errorMessage }}</div>
        <div v-if="loading" class="board-empty">게시글을 불러오는 중이에요…</div>
        <div v-else-if="filteredPosts.length === 0" class="board-empty">
          <span aria-hidden="true">△</span>
          <strong>{{ query ? '검색 결과가 없어요.' : '아직 첫 이야기가 없어요.' }}</strong>
          <p>
            {{ query ? '다른 검색어를 입력해보세요.' : '첫 번째 클라이밍 이야기를 남겨보세요.' }}
          </p>
        </div>
        <article v-for="post in filteredPosts" v-else :key="post.postId" class="board-post">
          <div class="board-post-meta">
            <span class="board-avatar small" aria-hidden="true">{{
              Array.from(post.memberName ?? 'C')[0]
            }}</span>
            <div>
              <strong>{{ post.memberName }}</strong
              ><time :datetime="post.createdAt">{{ formatDate(post.createdAt) }}</time>
            </div>
            <span class="board-post-type">FREE TALK</span>
          </div>
          <h2>{{ post.title }}</h2>
          <p>{{ post.content }}</p>
          <div
            v-if="post.media?.length"
            class="post-media-grid"
            :class="{ single: post.media.length === 1 }"
          >
            <template v-for="media in post.media" :key="media.mediaId">
              <img
                v-if="media.mediaType === 'IMAGE'"
                :src="media.mediaUrl"
                :alt="media.originalName"
                loading="lazy"
              />
              <video
                v-else
                :src="media.mediaUrl"
                :aria-label="media.originalName"
                controls
                preload="metadata"
              ></video>
            </template>
          </div>
          <footer>
            <span>POST #{{ post.postId }}</span>
            <div>
              <button type="button" @click="toggleComments(post.postId)">
                {{ openComments.has(post.postId) ? '댓글 닫기' : '댓글 보기' }}
              </button>
              <button
                v-if="post.memberId === auth.member?.memberId"
                type="button"
                :disabled="deletingId === post.postId"
                @click="removePost(post.postId)"
              >
                {{ deletingId === post.postId ? '삭제 중…' : '삭제' }}
              </button>
            </div>
          </footer>
          <PostComments
            v-if="openComments.has(post.postId)"
            :post-id="post.postId"
            :current-member-id="auth.member.memberId"
          />
        </article>
      </div>
    </section>
  </main>
</template>
