<script setup>
defineProps({ eyebrow: String, title: String, description: String })
</script>

<template>
  <main class="hub-shell">
    <section class="story-panel" aria-label="Climbers’ Hub 소개">
      <RouterLink to="/" class="hub-brand" aria-label="Climbers’ Hub 홈">
        <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path
            d="m5 30 12-21 7 12 4-7 9 16H5Z"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linejoin="round"
          />
          <path d="m12 18 5 3 5-3" stroke="currentColor" stroke-width="2" />
        </svg>
        <span
          >climbers<span class="brand-apostrophe">’</span> hub<span class="brand-dot">.</span></span
        >
      </RouterLink>
      <div class="story-copy">
        <span class="story-kicker"
          ><span class="status-dot"></span> YOUR NEXT MOVE STARTS HERE</span
        >
        <h1>다음 홀드를 향한<br />우리의 <span>시작.</span></h1>
        <p>벽 앞에서 만나는 새로운 가능성.<br />나만의 클라이밍 여정을 이곳에서 시작하세요.</p>
      </div>
      <div class="climbing-art" aria-hidden="true">
        <svg viewBox="0 0 640 420" fill="none">
          <defs>
            <pattern id="wall-grid" width="42" height="42" patternUnits="userSpaceOnUse">
              <circle cx="21" cy="21" r="1.3" fill="#ffffff" opacity=".17" />
            </pattern>
          </defs>
          <path d="M0 115 260 18l170 90 210-75v387H0Z" fill="#23483d" />
          <path d="m260 18 38 224-88 178H0V115Z" fill="#2b5143" />
          <path d="m430 108-132 134 108 178h234V33Z" fill="#1e4239" />
          <path d="M0 0h640v420H0z" fill="url(#wall-grid)" />
          <path
            d="m117 357 79-72 73-16 59-80 99-39 65-86"
            stroke="#bdcfb5"
            stroke-width="1.5"
            stroke-dasharray="5 9"
            opacity=".5"
          />
          <g fill="#d2e88c" stroke="#e5f3b7" stroke-width="1.5">
            <path d="m104 347 21-7 16 15-6 15-31 3-9-12Z" />
            <path d="m182 277 17-11 17 12-5 14-28 5-8-10Z" />
            <path d="m252 260 22-8 15 12-5 16-27 2-10-10Z" />
            <path d="m315 180 18-10 19 9-3 16-27 4-13-10Z" />
            <path d="m414 140 17-9 18 13-7 15-24 1-10-10Z" />
            <path d="m479 58 16-8 17 12-4 16-26 1-9-10Z" />
          </g>
          <g fill="#a67e68" opacity=".8">
            <path d="m100 177 24-7 10 14-13 12-24-3Z" />
            <path d="m410 317 21-9 19 13-11 17-28-3Z" />
            <path d="m527 243 18-6 18 17-11 10-25-4Z" />
          </g>
          <circle cx="494" cy="66" r="28" stroke="#d2e88c" opacity=".4" />
          <path d="m488 66 4 4 8-9" stroke="#edf7d8" stroke-width="2" />
        </svg>
        <div class="route-label">
          <span class="route-dot"></span> ONE HOLD AT A TIME <span>↗</span>
        </div>
      </div>
      <div class="story-footer"><span>FIND YOUR OWN WAY UP.</span><span>EST. 2026</span></div>
    </section>
    <section class="form-panel">
      <div class="form-panel-top">
        <span>CLIMB. CONNECT. REPEAT.</span><span class="small-mountain" aria-hidden="true">△</span>
      </div>
      <div class="form-content">
        <p class="form-eyebrow">{{ eyebrow }}</p>
        <h2>{{ title }}</h2>
        <p class="form-description">{{ description }}</p>
        <slot />
      </div>
      <footer class="form-footer">© 2026 Climbers’ Hub <span>made by 전병찬</span></footer>
    </section>
  </main>
</template>
