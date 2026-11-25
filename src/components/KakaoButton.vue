<script setup>
defineProps({ disabled: Boolean, linking: Boolean })
defineEmits(['click'])
</script>

<template>
  <button class="kakao-button" type="button" :disabled="disabled" @click="$emit('click')">
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.47 2 10.75c0 2.76 1.86 5.18 4.65 6.55l-1.18 4.2c-.08.28.24.5.48.34l5.07-3.37c.32.03.65.04.98.04 5.52 0 10-3.47 10-7.76S17.52 3 12 3Z"
      />
    </svg>
    <span>{{ linking ? '카카오 계정 연결' : '카카오 로그인' }}</span>
  </button>
</template>
