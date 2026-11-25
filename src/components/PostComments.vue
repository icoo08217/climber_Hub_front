<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { createComment, deleteComment, loadComments } from '../services/posts'

const props = defineProps({
  postId: { type: Number, required: true },
  currentMemberId: { type: Number, required: true },
})

const comments = ref([])
const loading = ref(true)
const pending = ref(false)
const deletingId = ref(null)
const content = ref('')
const replyingTo = ref(null)
const replyDrafts = reactive({})
const errorMessage = ref('')
const totalCount = computed(() =>
  comments.value.reduce((total, comment) => total + 1 + comment.replies.length, 0),
)

onMounted(refresh)

async function refresh() {
  loading.value = true
  errorMessage.value = ''
  try {
    comments.value = await loadComments(props.postId)
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '댓글을 불러오지 못했어요.'
  } finally {
    loading.value = false
  }
}

async function submit(parentCommentId = null) {
  if (pending.value) return
  const draft = parentCommentId ? replyDrafts[parentCommentId] : content.value
  if (!draft?.trim()) return
  pending.value = true
  errorMessage.value = ''
  try {
    await createComment(props.postId, draft.trim(), parentCommentId)
    if (parentCommentId) {
      replyDrafts[parentCommentId] = ''
      replyingTo.value = null
    } else content.value = ''
    await refresh()
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '댓글을 등록하지 못했어요.'
  } finally {
    pending.value = false
  }
}

async function remove(commentId) {
  if (deletingId.value || !window.confirm('이 댓글을 삭제할까요? 대댓글도 함께 삭제됩니다.')) return
  deletingId.value = commentId
  errorMessage.value = ''
  try {
    await deleteComment(commentId)
    await refresh()
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '댓글을 삭제하지 못했어요.'
  } finally {
    deletingId.value = null
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<template>
  <section class="comment-thread" aria-label="댓글">
    <div class="comment-heading">
      <strong>댓글</strong><span>{{ totalCount }}</span>
    </div>
    <form class="comment-form" @submit.prevent="submit()">
      <textarea
        v-model="content"
        required
        maxlength="1000"
        rows="2"
        placeholder="따뜻한 댓글을 남겨주세요."
      ></textarea>
      <button :disabled="pending || !content.trim()">
        {{ pending ? '등록 중…' : '댓글 등록' }}
      </button>
    </form>
    <div v-if="errorMessage" class="comment-error" role="alert">{{ errorMessage }}</div>
    <p v-if="loading" class="comment-state">댓글을 불러오는 중이에요…</p>
    <p v-else-if="comments.length === 0" class="comment-state">첫 댓글을 남겨보세요.</p>
    <div v-else class="comment-list">
      <article v-for="comment in comments" :key="comment.commentId" class="comment-item">
        <header>
          <span class="board-avatar comment-avatar">{{
            Array.from(comment.memberName ?? 'C')[0]
          }}</span>
          <div>
            <strong>{{ comment.memberName }}</strong
            ><time>{{ formatDate(comment.createdAt) }}</time>
          </div>
        </header>
        <p>{{ comment.content }}</p>
        <footer>
          <button
            type="button"
            @click="replyingTo = replyingTo === comment.commentId ? null : comment.commentId"
          >
            답글
          </button>
          <button
            v-if="comment.memberId === currentMemberId"
            type="button"
            :disabled="deletingId === comment.commentId"
            @click="remove(comment.commentId)"
          >
            삭제
          </button>
        </footer>
        <form
          v-if="replyingTo === comment.commentId"
          class="reply-form"
          @submit.prevent="submit(comment.commentId)"
        >
          <input
            v-model="replyDrafts[comment.commentId]"
            required
            maxlength="1000"
            :placeholder="comment.memberName + '님에게 답글'"
          />
          <button :disabled="pending">등록</button>
        </form>
        <div v-if="comment.replies.length" class="reply-list">
          <article
            v-for="reply in comment.replies"
            :key="reply.commentId"
            class="comment-item reply-item"
          >
            <header>
              <span class="reply-arrow" aria-hidden="true">↳</span>
              <span class="board-avatar comment-avatar">{{
                Array.from(reply.memberName ?? 'C')[0]
              }}</span>
              <div>
                <strong>{{ reply.memberName }}</strong
                ><time>{{ formatDate(reply.createdAt) }}</time>
              </div>
            </header>
            <p>{{ reply.content }}</p>
            <footer v-if="reply.memberId === currentMemberId">
              <button
                type="button"
                :disabled="deletingId === reply.commentId"
                @click="remove(reply.commentId)"
              >
                삭제
              </button>
            </footer>
          </article>
        </div>
      </article>
    </div>
  </section>
</template>
