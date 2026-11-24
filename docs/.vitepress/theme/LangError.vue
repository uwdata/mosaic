<script setup lang="ts">
const props = defineProps<{language: string}>();
</script>

<template>
  <div class="custom-block warning">
    <p>Language <code>{{ language }}</code> is not recognised. Use the toggle above to select <strong>JS</strong> or <strong>Python</strong>.</p>
  </div>
</template>
