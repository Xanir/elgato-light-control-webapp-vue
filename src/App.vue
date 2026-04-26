<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import TargetSwitcher from './components/TargetSwitcher.vue'

type TargetType = 'lights' | 'groups'

interface Light {
  serialNumber: string
  displayName?: string
  ip: string
}

interface Group {
  groupName: string
  deviceCount: number
}

interface LightSettings {
  brightness: number
  temperature: number
}

interface UpdatePayload {
  light: LightSettings
  serialNumber?: string
  group?: string
}

const API_BASE = '/api/lights'

const lights = ref<Light[]>([])
const groups = ref<Group[]>([])
const activeType = ref<TargetType>('lights')
const selectedLightSerial = ref<string>('')
const selectedGroupName = ref<string>('')
const brightness = ref<number>(70)
const temperature = ref<number>(260)
const isLoading = ref<boolean>(true)
const errorMessage = ref<string>('')
const submitStatus = ref<string>('')

const selectedLight = computed<Light | undefined>(() =>
  lights.value.find((light) => light.serialNumber === selectedLightSerial.value),
)
const selectedGroup = computed<Group | undefined>(() =>
  groups.value.find((group) => group.groupName === selectedGroupName.value),
)

const selectedTargetName = computed<string>(() => {
  if (activeType.value === 'lights') {
    return selectedLight.value ? getLightLabel(selectedLight.value) : 'No light selected'
  }

  return selectedGroup.value ? selectedGroup.value.groupName : 'No group selected'
})

const canSubmit = computed<boolean>(() => {
  return activeType.value === 'lights' ? Boolean(selectedLight.value) : Boolean(selectedGroup.value)
})

function getLightLabel(light: Light): string {
  return light.displayName?.trim() ? light.displayName : light.ip
}

function selectLight(light: Light): void {
  activeType.value = 'lights'
  selectedLightSerial.value = light.serialNumber
  submitStatus.value = ''
}

function selectGroup(group: Group): void {
  activeType.value = 'groups'
  selectedGroupName.value = group.groupName
  submitStatus.value = ''
}

function ensureSelection(): void {
  if (!selectedLightSerial.value && lights.value.length > 0) {
    selectedLightSerial.value = lights.value[0].serialNumber
  }

  if (!selectedGroupName.value && groups.value.length > 0) {
    selectedGroupName.value = groups.value[0].groupName
  }

  if (activeType.value === 'lights' && lights.value.length === 0 && groups.value.length > 0) {
    activeType.value = 'groups'
  }

  if (activeType.value === 'groups' && groups.value.length === 0 && lights.value.length > 0) {
    activeType.value = 'lights'
  }
}

async function loadData(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [lightsResponse, groupsResponse] = await Promise.all([
      fetch(`${API_BASE}/all`),
      fetch(`${API_BASE}/group`),
    ])

    if (!lightsResponse.ok || !groupsResponse.ok) {
      throw new Error('Unable to load lights and groups.')
    }

    const lightsPayload: unknown = await lightsResponse.json()
    const groupsPayload: unknown = await groupsResponse.json()

    lights.value = Array.isArray(lightsPayload) ? (lightsPayload as Light[]) : []
    groups.value =
      Array.isArray((groupsPayload as { groups?: unknown })?.groups)
        ? ((groupsPayload as { groups: Group[] }).groups)
        : []

    ensureSelection()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unexpected error while loading data.'
  } finally {
    isLoading.value = false
  }
}

async function submitLightUpdate(): Promise<void> {
  if (!canSubmit.value) {
    return
  }

  const payload: UpdatePayload = {
    light: {
      brightness: Number(brightness.value),
      temperature: Number(temperature.value),
    },
  }

  if (activeType.value === 'lights') {
    payload.serialNumber = selectedLight.value!.serialNumber
  } else {
    payload.group = selectedGroup.value!.groupName
  }

  submitStatus.value = ''

  try {
    const response = await fetch(API_BASE, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Unable to submit update.')
    }

    submitStatus.value = 'Update sent successfully.'
  } catch (error) {
    submitStatus.value = error instanceof Error ? error.message : 'Unexpected error while sending update.'
  }
}

onMounted(loadData)
</script>

<template>
  <main class="app-shell">
    <h1>Elgato Light Control</h1>

    <TargetSwitcher v-model="activeType" />

    <section class="panel list-panel">
      <h2>{{ activeType === 'lights' ? 'Lights' : 'Groups' }}</h2>
      <p v-if="isLoading">Loading...</p>
      <p v-else-if="errorMessage" class="error">{{ errorMessage }}</p>
      <ul class="list" v-if="!isLoading && !errorMessage">
        <template v-if="activeType === 'lights'">
          <li v-for="light in lights" :key="light.serialNumber">
            <button
              type="button"
              data-testid="secondary-light-item"
              @click="selectLight(light)"
            >
              {{ getLightLabel(light) }}
            </button>
          </li>
        </template>
        <template v-else>
          <li v-for="group in groups" :key="group.groupName">
            <button
              type="button"
              data-testid="secondary-group-item"
              @click="selectGroup(group)"
            >
              {{ group.groupName }} ({{ group.deviceCount }})
            </button>
          </li>
        </template>
      </ul>
    </section>

    <section class="panel" data-testid="controls-panel">
      <h2>Selected target: {{ selectedTargetName }}</h2>

      <label for="temperature">Temperature (145-340)</label>
      <input id="temperature" v-model.number="temperature" data-testid="temperature-input" type="range" min="145" max="340" />
      <p>{{ temperature }}</p>

      <label for="brightness">Brightness (0-100)</label>
      <input id="brightness" v-model.number="brightness" data-testid="brightness-input" type="range" min="0" max="100" />
      <p>{{ brightness }}</p>

      <button type="button" data-testid="submit-update" :disabled="!canSubmit" @click="submitLightUpdate">
        Submit
      </button>
      <p v-if="submitStatus" :class="submitStatus.includes('success') ? 'success' : 'error'">{{ submitStatus }}</p>
    </section>
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0f172a;
  color: #e2e8f0;
}

.app-shell {
  max-width: 820px;
  margin: 0 auto;
  padding: 2rem 1rem 3rem;
}

h1 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 2rem;
}

.panel {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
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

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

input[type='range'] {
  width: 100%;
}

.error {
  color: #fda4af;
}

.success {
  color: #86efac;
}
</style>
