<script setup>
defineProps({ visible: Boolean })
</script>

<template>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="12" cy="12" r="2.7" fill="none" stroke="currentColor" stroke-width="1.8" />
    <path
      v-if="visible"
      d="m4 4 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
    />
  </svg>
</template>
