<template>
  <!-- Buka style binding untuk menerima custom width -->
  <div class="datepicker-wrapper" :style="{ width: customWidth }">
    <!-- Dirty Badge -->
    <span v-if="isDirty" class="dirty-badge" title="Data telah diubah"></span>

    <VueDatePicker 
      v-model="internalValue" 
       
      :teleport="teleport" 
      :formats="formats" 
      :placeholder="placeholder"
      :enable-time-picker="enableTimePicker" 
      :auto-apply="autoApply" 
      :text-input="true"
      :clearable="true"
      
      />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import '../../assets/styles/datepicker.css'
import '../../assets/styles/dirtyBadge.css'
import { APP_COLORS } from '../../constants/colors.js'

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
  resetKey: {
    type: [String, Number],
    default: 0
  },
  // Tambahkan prop width dengan default '70px'
  width: {
    type: String,
    default: '10px'
  }
})

// Konversi nilai width agar fleksibel (misal jika user passing angka 200 atau string '200px')
const customWidth = computed(() => {
  if (typeof props.width === 'number') {
    return `${props.width}px`
  }
  return props.width
})

const emit = defineEmits(['update:modelValue'])

function normalizeDate(val) {
  if (!val) return ''
  const dateObj = val instanceof Date ? val : new Date(val)
  return isNaN(dateObj.getTime()) ? String(val) : dateObj.toISOString()
}

const initialValue = ref(normalizeDate(props.modelValue))

const isDirty = computed(() => {
  return normalizeDate(props.modelValue) !== initialValue.value
})

onMounted(() => {
  initialValue.value = normalizeDate(props.modelValue)
})

watch(
  () => props.resetKey,
  () => {
    initialValue.value = normalizeDate(props.modelValue)
  },
  { flush: 'post' }
)

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
  /* Atur agar inner component VueDatePicker ikut memenuhi wrapper */
  box-sizing: border-box;

  --dirty-badge-bg: v-bind('APP_COLORS.dirtyBadgeBg');
  --dirty-badge-border: v-bind('APP_COLORS.dirtyBadgeBorder');
  --dirty-badge-glow: v-bind('APP_COLORS.dirtyBadgeGlow');
}

 
</style>