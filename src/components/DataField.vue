<template>
  <div class="form-group">
    <label v-if="columnTitle && !noLabel" :for="`col_${id}`" class="label" :title=columnTooltips>
      {{ columnTitle }}
    </label>

    <!-- Render Textbox jika type === 'text' atau 'number' -->
    <Textbox v-if="type === 'text' || type === 'number'" :id="`col_${id}`" v-model="modelValue"
      :type="type === 'number' ? 'number' : 'text'" :reset-key="resetKey" v-bind="$attrs" />

    <!-- Render DatePicker jika type === 'date' atau 'datetime' -->
    <DatePicker v-else-if="type === 'date' || type === 'datetime'" :id="`col_${id}`" v-model="modelValue"
      :enable-time-picker="enableTime || type === 'datetime'" :reset-key="resetKey" v-bind="$attrs" />

    <!-- Render Dropdown jika type === 'dropdown' -->
    <Dropdown v-else-if="type === 'dropdown'" :id="`col_${id}`" v-model="modelValue" :options="options"
      :editable="editable" :reset-key="resetKey" v-bind="$attrs" />

    <!-- Fallback type lain -->
    <input v-else :id="`col_${id}`" v-model="modelValue" :type="type" class="custom-input" v-bind="$attrs" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Textbox from './textbox.vue'
import DatePicker from './DatePicker.vue'
import Dropdown from './dropdown.vue'

import { SelectedRowStore } from '../stores/selectedRowStore.js'

// Mencegah attribute otomatis menempel pada root element (.form-group)
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
    default: ''
  },
  noLabel: {
    type: Boolean,
    default: false
  }
})

// Computed 2-way binding ke store agar reaktif dan sintaks lebih bersih
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

// Cari judul kolom otomatis berdasarkan ID dari store
const columnTitle = computed(() => {
  const col = SelectedRowStore.columns.value?.find(
    c => String(c.id) === String(props.id)
  )
  return col ? col.title : ''
})


// Cari judul kolom tooltips otomatis berdasarkan ID dari store
const columnTooltips = computed(() => {
  const col = SelectedRowStore.columns.value?.find(
    c => String(c.id) === String(props.id)
  )

  return col?.tooltips || props.tooltips || ''
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
</style>
