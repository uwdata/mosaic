<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useData } from 'vitepress';
import { parse } from 'yaml';
import openapiText from '../../../packages/server/spec/openapi.yaml?raw';
import asyncapiText from '../../../packages/server/spec/asyncapi.yaml?raw';
import schemasText from '../../../packages/server/spec/schemas.yaml?raw';

const SCALAR_URL = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.68.0';

// Scalar does not dereference cross-file $refs, so inline schemas.yaml into
// each document's components.schemas. Mirrors packages/server/spec/index.html.
const shared = parse(schemasText);
function inline(doc) {
  const text = JSON.stringify({ ...doc, components: { ...doc.components, schemas: shared.$defs } })
    .replaceAll('"./schemas.yaml#/$defs/', '"#/components/schemas/')
    .replaceAll('"#/$defs/', '"#/components/schemas/');
  return JSON.parse(text);
}

const sources = [
  { title: 'HTTP', slug: 'http', content: inline(parse(openapiText)), default: true },
  { title: 'WebSocket', slug: 'websocket', content: inline(parse(asyncapiText)) }
];

const { isDark } = useData();
const container = ref(null);
const failed = ref(false);
let scalar = null;
let app = null;
let mounted = false;

function loadScalar() {
  if (window.Scalar) return Promise.resolve(window.Scalar);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCALAR_URL;
    script.onload = () => resolve(window.Scalar);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// forceDarkModeState is read once at creation, so recreate on theme change.
function render() {
  if (!mounted || !scalar || !container.value) return;
  app?.destroy();
  app = scalar.createApiReference(container.value, {
    sources,
    hideClientButton: true,
    hideTestRequestButton: true,
    hideDarkModeToggle: true,
    showToolbar: 'never',
    showDeveloperTools: 'never',
    forceDarkModeState: isDark.value ? 'dark' : 'light'
  });
}

watch(isDark, render);

onMounted(async () => {
  mounted = true;
  try {
    scalar = await loadScalar();
    render();
  } catch {
    failed.value = true;
  }
});

onBeforeUnmount(() => {
  mounted = false;
  app?.destroy();
  app = null;
});
</script>

<template>
  <div class="server-spec">
    <div ref="container" />
    <p v-if="failed" class="server-spec-fallback">
      The interactive reference could not be loaded. The specification sources are in
      <a href="https://github.com/uwdata/mosaic/tree/main/packages/server/spec">packages/server/spec</a>.
    </p>
  </div>
</template>

<style>
.server-spec {
  min-height: calc(100vh - var(--vp-nav-height));
}

.server-spec-fallback {
  padding: 2rem;
  color: var(--vp-c-text-2);
}

.server-spec .scalar-app {
  --scalar-custom-header-height: var(--vp-nav-height);
  --scalar-background-1: var(--vp-c-bg);
  --scalar-color-accent: var(--vp-c-brand-1);
  font-family: var(--vp-font-family-base);
}
</style>
