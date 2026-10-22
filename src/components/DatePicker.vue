<template>
  <div class="datepicker-wrapper">
    <!-- Dirty Badge muncul otomatis jika nilai berubah dari nilai awal -->
    <span v-if="isDirty" class="dirty-badge" title="Data telah diubah"></span>

    <VueDatePicker 
      v-model="internalValue" 
      :teleport="teleport" 
      :formats="formats" 
      :placeholder="placeholder"
      :enable-time-picker="enableTimePicker" 
      :auto-apply="autoApply" 
      :text-input="true"
      />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import '../assets/styles/datepicker.css'
import '../assets/styles/dirtyBadge.css'
import { APP_COLORS } from '../constants/colors.js'

const props = defineProps({
  modelValue: {
    type: [Date, String, Object, null],
    default: null
  },
  placeholder: {
    type: String,
    default: 'Pilih Tanggal'
  },
  teleport: {
    type: Boolean,
    default: true
  },
  formats: {
    type: Object,
    default: () => ({ input: 'dd MMM yyyy' })
  },
  enableTimePicker: {
    type: Boolean,
    default: false
  },
  autoApply: {
    type: Boolean,
    default: true
  },
  // Reset key opsional jika baris/data diganti di parent
  resetKey: {
    type: [String, Number],
    default: 0
  }
})

const emit = defineEmits(['update:modelValue'])

// Helper untuk menyamakan format pembanding (ISO String / timestamp)
function normalizeDate(val) {
  if (!val) return ''
  const dateObj = val instanceof Date ? val : new Date(val)
  return isNaN(dateObj.getTime()) ? String(val) : dateObj.toISOString()
}

// Simpan nilai awal untuk pembanding dirty state
const initialValue = ref(normalizeDate(props.modelValue))

// Hitung status dirty secara mandiri
const isDirty = computed(() => {
  return normalizeDate(props.modelValue) !== initialValue.value
})

// Set baseline saat komponen pertama di-mount
onMounted(() => {
  initialValue.value = normalizeDate(props.modelValue)
})

// Reset baseline jika parent mengubah resetKey (misal ganti baris data)
watch(
  () => props.resetKey,
  () => {
    initialValue.value = normalizeDate(props.modelValue)
  },
  { flush: 'post' }
)

// Menangani sinkronisasi tipe data untuk VueDatePicker
const internalValue = computed({
  get: () => {
    if (!props.modelValue) return null
    if (props.modelValue instanceof Date) return props.modelValue
    const parsed = new Date(props.modelValue)
    return isNaN(parsed.getTime()) ? props.modelValue : parsed
  },
  set: (val) => {
    emit('update:modelValue', val)
  }
})

// Expose fungsi reset jika ingin dipanggil manual oleh parent
function resetOriginalValue() {
  initialValue.value = normalizeDate(props.modelValue)
}

defineExpose({
  resetOriginalValue
})
</script>

<style scoped>
.datepicker-wrapper {
  position: relative;
  display: inline-block;
  width: fit-content;

  --dirty-badge-bg: v-bind('APP_COLORS.dirtyBadgeBg');
  --dirty-badge-border: v-bind('APP_COLORS.dirtyBadgeBorder');
  --dirty-badge-glow: v-bind('APP_COLORS.dirtyBadgeGlow');
}

 
</style>