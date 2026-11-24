<script setup lang="ts">

interface Props {
  modelValue?: string;
  ariaLabel?: string; 
}

const { modelValue = 'js', ariaLabel = 'Documentation language' } = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div class="vgplot-toggle" role="tablist" :aria-label="ariaLabel">
    <button
      role="tab"
      type="button"
      :aria-selected="modelValue === 'js'"
      :class="{ active: modelValue === 'js' }"
      @click="$emit('update:modelValue', 'js')"
    >
      JS
    </button>
    <button
      role="tab"
      type="button"
      :aria-selected="modelValue === 'python'"
      :class="{ active: modelValue === 'python' }"
      @click="$emit('update:modelValue', 'python')"
    >
      Python
    </button>
  </div>
</template>
