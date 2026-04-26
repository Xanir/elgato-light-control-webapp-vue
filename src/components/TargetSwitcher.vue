<script setup lang="ts">
type TargetType = 'lights' | 'groups'

defineProps<{
  modelValue: TargetType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TargetType]
}>()
</script>

<template>
  <section class="panel" data-testid="target-switcher">
    <h2>Select target type</h2>
    <div class="button-row">
      <button
        type="button"
        data-testid="switch-lights"
        :class="{ active: modelValue === 'lights' }"
        @click="emit('update:modelValue', 'lights')"
      >
        Lights
      </button>
      <button
        type="button"
        data-testid="switch-groups"
        :class="{ active: modelValue === 'groups' }"
        @click="emit('update:modelValue', 'groups')"
      >
        Groups
      </button>
    </div>
  </section>
</template>

<style scoped>
.panel {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.button-row {
  display: flex;
  gap: 0.5rem;
}

button {
  width: 100%;
  border: 1px solid #334155;
  background: #0b1220;
  color: #e2e8f0;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
}

button:hover {
  border-color: #64748b;
}

button.active {
  border-color: #6366f1;
  background: #1f2745;
}
</style>
