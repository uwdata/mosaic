<script setup>
import DefaultTheme from "vitepress/theme";
</script>

<template>
  <DefaultTheme.Layout>
    <template #home-hero-image>
      <a href="./examples/flights-10m.html">
        <video autoplay loop muted src="/demo-dark.mp4" class="video dark" />
        <video autoplay loop muted src="/demo-light.mp4" class="video light" />
      </a>
    </template>
  </DefaultTheme.Layout>
</template>

<style scoped>
.video {
  position: absolute;
  top: 50%;
  left: 50%;
  transform:translate(-50%, -50%);
  max-height: 190px;
}

html:not(.dark) .video.dark {
  display:none
}

.dark .video.light {
  display:none
}

@media (min-width: 640px) {
  .video {
    max-height: 256px;
  }
}

@media (min-width: 960px) {
  .video {
    max-height: 320px;
  }
}
</style>
