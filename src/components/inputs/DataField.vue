 
<template>
  <div class="form-group">
    <label
      v-if="columnTitle && !noLabel"
      ref="labelElement"
      :for="`col_${id}`"
      class="label"
      @mouseenter="showTooltip"
      @mouseleave="hideTooltip"
    >
      {{ columnTitle }}
    </label>

    <!-- Textbox -->
    <textbox
      v-if="type === 'text' || type === 'number'"
      :id="`col_${id}`"
      v-model="modelValue"
      :type="type === 'number' ? 'number' : 'text'"
      :reset-key="resetKey"
      v-bind="$attrs"
    />

    <!-- DatePicker -->
    <DatePicker
      v-else-if="type === 'date' || type === 'datetime'"
      :id="`col_${id}`"
      v-model="modelValue"
      :enable-time-picker="enableTime || type === 'datetime'"
      :reset-key="resetKey"
      v-bind="$attrs"
    />

    <!-- Dropdown -->
    <dropdown
      v-else-if="type === 'dropdown'"
      :id="`col_${id}`"
      v-model="modelValue"
      :options="options"
      :editable="editable"
      :reset-key="resetKey"
      v-bind="$attrs"
    />

    <!-- Fallback -->
    <input
      v-else
      :id="`col_${id}`"
      v-model="modelValue"
      :type="type"
      class="custom-input"
      v-bind="$attrs"
    />
  </div>

  <!-- Tooltip di luar parent agar tidak terpotong overflow -->
  <Teleport to="body">
    <div
      v-if="tooltipVisible && columnTooltips"
      ref="tooltipElement"
      class="custom-tooltip"
      :style="tooltipStyle"
      role="tooltip"
    >
      {{ columnTooltips }}
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, nextTick, onBeforeUnmount } from 'vue'
import textbox from '../inputs/textbox.vue'
import DatePicker from './DatePicker.vue'
import dropdown from '../inputs/dropdown.vue'

import { SelectedRowStore } from '../../stores/selectedRowStore.js'

defineOptions({
  inheritAttrs: false
})

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  },
  type: {
    type: String,
    default: 'text'
  },
  enableTime: {
    type: Boolean,
    default: false
  },
  options: {
    type: Array,
    default: () => []
  },
  editable: {
    type: Boolean,
    default: false
  },
  resetKey: {
    type: [String, Number],
    default: 0
  },
  tooltips: {
    type: String,
    default: undefined
  },
  noLabel: {
    type: Boolean,
    default: false
  }
})

// Tooltip state
const labelElement = ref(null)
const tooltipElement = ref(null)
const tooltipVisible = ref(false)
const tooltipStyle = ref({
  left: '0px',
  top: '0px'
})

// Binding ke store
const modelValue = computed({
  get() {
    return SelectedRowStore.selectedRow.value?.[String(props.id)] ?? ''
  },
  set(val) {
    if (SelectedRowStore.selectedRow.value) {
      SelectedRowStore.selectedRow.value[String(props.id)] = val
    }
  }
})

// Judul kolom
const columnTitle = computed(() => {
  const col = SelectedRowStore.columns.value?.find(
    c => String(c.id) === String(props.id)
  )

  return col ? col.title : ''
})

// Tooltip: prop eksplisit lebih diprioritaskan.
// String kosong menonaktifkan tooltip.
const columnTooltips = computed(() => {
  if (props.tooltips !== undefined) {
    return props.tooltips
  }

  const col = SelectedRowStore.columns.value?.find(
    c => String(c.id) === String(props.id)
  )

  return col?.tooltips || ''
})

// Hitung posisi tooltip berdasarkan posisi label
async function showTooltip() {
  if (!columnTooltips.value || !labelElement.value) return

  tooltipVisible.value = true
  await nextTick()

  if (!labelElement.value || !tooltipElement.value) return

  const labelRect = labelElement.value.getBoundingClientRect()
  const tooltipRect = tooltipElement.value.getBoundingClientRect()

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const margin = 8
  const gap = 6

  // Posisi horizontal agar tooltip tetap di dalam viewport
  const left = Math.max(
    margin,
    Math.min(
      labelRect.left,
      viewportWidth - tooltipRect.width - margin
    )
  )

  // Utamakan di atas label, pindah ke bawah jika tidak cukup ruang
  let top = labelRect.top - tooltipRect.height - gap

  if (top < margin) {
    top = labelRect.bottom + gap
  }

  // Batasi posisi vertikal jika ruang layar terbatas
  top = Math.max(
    margin,
    Math.min(top, viewportHeight - tooltipRect.height - margin)
  )

  tooltipStyle.value = {
    left: `${left}px`,
    top: `${top}px`
  }
}

function hideTooltip() {
  tooltipVisible.value = false
}

// Tutup tooltip saat halaman digulir atau diubah ukurannya
function handleViewportChange() {
  hideTooltip()
}

window.addEventListener('scroll', handleViewportChange, true)
window.addEventListener('resize', handleViewportChange)

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleViewportChange, true)
  window.removeEventListener('resize', handleViewportChange)
})
</script>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  margin-bottom: 10px;
}

.label {
  cursor: help;
}
</style>

<style>
/* Global karena tooltip dirender di dalam body oleh Teleport */
.custom-tooltip {
  position: fixed;
  z-index: 99999;

  max-width: min(320px, calc(100vw - 16px));
  padding: 7px 10px;

  color: #222;
  background: #fff;

  border: 1px solid #ccc;
  border-radius: 5px;

  font-family: Arial, sans-serif;
  font-size: 12px;
  font-weight: normal;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;

  box-shadow: 0 3px 10px rgb(0 0 0 / 15%);
  pointer-events: none;
}
</style>
 