
<template>
  <div class="datepicker-wrapper" :style="{ width: customWidth }">

    <!-- Dirty Badge -->
    <span
      v-if="isDirty"
      class="dirty-badge"
      title="Data telah diubah"
    ></span>

    <VueDatePicker
      ref="datePickerRef"
      v-model="internalValue"
      :teleport="teleport"
      :formats="formats"
      :placeholder="placeholder"
      :enable-time-picker="enableTimePicker"
      :auto-apply="autoApply"
      :text-input="true"
      :clearable="true"

      @open="onFocus"
      @closed="onBlur"
      @internal-model-change="onInput"
      @update:model-value="onChange"
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

// --------------------------------------------------
// PROPS
// --------------------------------------------------

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
  width: {
    type: String,
    default: '10px'
  }
})

// --------------------------------------------------
// EMITS
// --------------------------------------------------

const emit = defineEmits([
  'update:modelValue',
  'input',
  'change',
  'focus',
  'blur',
  'keydown',
  'keyup',
  'click',
  'dirty-change'
])

// --------------------------------------------------
// REF & WIDTH
// --------------------------------------------------

const datePickerRef = ref(null)

const customWidth = computed(() => {
  if (typeof props.width === 'number') {
    return `${props.width}px`
  }

  return props.width
})

// --------------------------------------------------
// DATE NORMALIZATION
// --------------------------------------------------

function normalizeDate(val) {
  if (!val) return ''

  const dateObj = val instanceof Date ? val : new Date(val)

  return isNaN(dateObj.getTime())
    ? String(val)
    : dateObj.toISOString()
}

// --------------------------------------------------
// DIRTY STATE
// --------------------------------------------------

const initialValue = ref(normalizeDate(props.modelValue))

const isDirty = computed(() => {
  return normalizeDate(props.modelValue) !== initialValue.value
})

watch(
  isDirty,
  (newValue) => {
    emit('dirty-change', newValue)
  },
  { immediate: true }
)

// --------------------------------------------------
// INITIAL VALUE & RESET
// --------------------------------------------------

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

// --------------------------------------------------
// V-MODEL
// --------------------------------------------------

const internalValue = computed({
  get: () => {
    if (!props.modelValue) return null

    if (props.modelValue instanceof Date) {
      return props.modelValue
    }

    const parsed = new Date(props.modelValue)

    return isNaN(parsed.getTime())
      ? props.modelValue
      : parsed
  },

  set: (val) => {
    emit('update:modelValue', val)
  }
})

// --------------------------------------------------
// EVENTS
// --------------------------------------------------

function onInput(value) {
  emit('input', value)
}

function onChange(value) {
  emit('change', value)
}

function onFocus() {
  emit('focus')
}

function onBlur() {
  emit('blur')
}

function onKeydown(event) {
  emit('keydown', event)
}

function onKeyup(event) {
  emit('keyup', event)
}

function onClick(event) {
  emit('click', event)
}

// --------------------------------------------------
// PUBLIC METHODS
// --------------------------------------------------

function focus() {
  datePickerRef.value?.$el
    ?.querySelector('input')
    ?.focus()
}

function blur() {
  datePickerRef.value?.$el
    ?.querySelector('input')
    ?.blur()
}

function getValue() {
  return props.modelValue
}

function setValue(value) {
  emit('update:modelValue', value)
}

function resetOriginalValue() {
  initialValue.value = normalizeDate(props.modelValue)
}

// --------------------------------------------------
// EXPOSE METHODS TO PARENT
// --------------------------------------------------

defineExpose({
  focus,
  blur,
  getValue,
  setValue,
  resetOriginalValue,
  datePickerRef
})

</script>

<style scoped>
.datepicker-wrapper {
  position: relative;
  display: inline-block;
  box-sizing: border-box;

  --dirty-badge-bg: v-bind('APP_COLORS.dirtyBadgeBg');
  --dirty-badge-border: v-bind('APP_COLORS.dirtyBadgeBorder');
  --dirty-badge-glow: v-bind('APP_COLORS.dirtyBadgeGlow');
}
</style>
