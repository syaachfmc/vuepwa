<template>
  <div ref="wrapperRef" class="dropdown-wrapper" v-if="visible" @mouseleave="onMouseLeaveWrapper">
    <span v-if="isDirty" class="dirty-badge" title="Data telah diubah"></span>

    <!-- MODE 1: Editable -->
    <div v-if="editable" class="custom-dropdown-container">
      <input ref="inputRef" :value="modelValue" :name="name" :disabled="!enabled" :placeholder="placeholder"
        :required="required" :class="[
          'dropdown',
          'dropdown-editable',
          {
            'dropdown-error': error,
            'dropdown-disabled': !enabled,
            'dropdown-dirty': isDirty
          }
        ]" :style="dropdownStyle" @input="onInput" @focus="onFocusEditable" @blur="onBlurEditable"
        @keydown="onKeydownEditable" @click="onClick" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave" />

      <button type="button" tabindex="-1" class="dropdown-arrow-btn" :disabled="!enabled" @click="toggleDropdown">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" :stroke="themeColors.textPrimary || '#333333'"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </div>

    <!-- MODE 2: Non-Editable -->
    <div v-else class="custom-dropdown-container">
      <div ref="selectRef" tabindex="0" :class="[
        'dropdown',
        'dropdown-non-editable',
        {
          'dropdown-error': error,
          'dropdown-disabled': !enabled,
          'dropdown-dirty': isDirty,
          'is-placeholder': !selectedLabel
        }
      ]" :style="dropdownStyle" @click="toggleDropdown" @keydown="onKeydownNonEditable" @focus="onFocus" @blur="onBlur"
        @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
        <span class="dropdown-selected-text" :style="selectedTextStyle">
          {{ selectedLabel || placeholder }}
        </span>

        <span class="dropdown-arrow-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" :stroke="themeColors.textPrimary || '#333333'"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>
    </div>

    <!-- FLOATING OPTIONS LIST WRAPPER -->
    <Teleport to="body">
      <div
        v-if="isOpen && enabled"
        ref="optionsListRef"
        class="options-popover-wrapper"
        :style="floatingListStyle"
      >
        <ul class="custom-options-list">
          <li v-for="(option, index) in (editable ? displayOptions : normalizedOptions)" :key="index"
            :ref="el => optionRefs[index] = el" :class="[
              'custom-option-item',
              {
                'is-disabled': option.disabled,
                'is-active': index === focusedIndex,
                'is-selected': option.value === modelValue
              }
            ]" :style="optionStyle" @mousedown.prevent="selectOption(option)" @mouseenter="focusedIndex = index">
            {{ option.label }}
          </li>

          <li v-if="editable && displayOptions.length === 0" class="custom-option-empty" :style="optionStyle">
            Tidak ada opsi
          </li>
        </ul>

        <!-- Resize handle sebagai DIV terpisah di luar UL -->
        <div
          class="options-resize-handle"
          title="Drag untuk mengubah ukuran"
          aria-label="Resize option list"
          @mousedown.stop.prevent="startResize"
        >
          <AppIcon name="Grip" :size="12" :stroke-width="2" color="#64748b" />
        </div>
      </div>
    </Teleport>

    <span v-if="error && errorMessage" class="error-text">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script setup>
import {
  computed,
  ref,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount
} from 'vue'

import { APP_COLORS } from '../constants/colors.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: ''
  },
  name: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  editable: {
    type: Boolean,
    default: false
  },
  size: {
    type: Object,
    default: () => ({
      width: '200px',
      height: '32px'
    })
  },
  font: {
    type: Object,
    default: () => ({
      family: 'inherit',
      size: 'inherit',
      weight: 400,
      style: 'normal',
      color: APP_COLORS?.textPrimary || '#333333'
    })
  },
  background: {
    type: Object,
    default: () => ({
      color: APP_COLORS?.bgPrimary || '#ffffff'
    })
  },
  border: {
    type: Object,
    default: () => ({
      color: APP_COLORS?.borderDefault || '#cccccc',
      width: '1px',
      style: 'solid',
      radius: '4px'
    })
  },
  shadow: {
    type: Object,
    default: () => ({
      normal: {
        color: APP_COLORS?.shadowColorNormal || 'rgba(0,0,0,0.05)',
        offsetX: '0px',
        offsetY: '2px',
        blur: '4px',
        spread: '0px',
        inset: false
      },
      hover: {
        color: APP_COLORS?.shadowColorHover || 'rgba(0,0,0,0.1)',
        offsetX: '0px',
        offsetY: '2px',
        blur: '4px',
        spread: '0px',
        inset: false
      },
      focus: {
        color: APP_COLORS?.shadowColorFocus || 'rgba(0,123,255,0.25)',
        offsetX: '0px',
        offsetY: '0px',
        blur: '0px',
        spread: '2px',
        inset: false
      },
      error: {
        color: APP_COLORS?.shadowColorError || 'rgba(220,53,69,0.25)',
        offsetX: '0px',
        offsetY: '2px',
        blur: '4px',
        spread: '1px',
        inset: false
      },
      errorHover: {
        color: APP_COLORS?.shadowColorErrorHover || 'rgba(220,53,69,0.35)',
        offsetX: '0px',
        offsetY: '2px',
        blur: '4px',
        spread: '1px',
        inset: false
      }
    })
  },
  hover: {
    type: Object,
    default: () => ({
      borderColor: APP_COLORS?.borderHover || '#999999',
      backgroundColor: null,
      color: null
    })
  },
  focus: {
    type: Object,
    default: () => ({
      borderColor: APP_COLORS?.borderFocus || '#007bff',
      backgroundColor: null,
      color: null
    })
  },
  text: {
    type: Object,
    default: () => ({
      align: 'left',
      padding: '5px 8px'
    })
  },
  enabled: {
    type: Boolean,
    default: true
  },
  visible: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  },
  cursor: {
    type: String,
    default: 'pointer'
  },
  resetKey: {
    type: [String, Number],
    default: 0
  }
})

const emit = defineEmits([
  'update:modelValue',
  'input',
  'change',
  'focus',
  'blur',
  'click'
])

const themeColors = APP_COLORS || {}

const wrapperRef = ref(null)
const selectRef = ref(null)
const inputRef = ref(null)
const optionsListRef = ref(null)
const optionRefs = ref([])

const isFocused = ref(false)
const isHovered = ref(false)
const isOpen = ref(false)
const isFiltering = ref(false)
const focusedIndex = ref(-1)

const initialValue = ref('')

const dropdownRect = ref({ top: 0, left: 0, width: 0, height: 0 })

const resizedListSize = ref(null)
let resizeStart = null

function startResize(event) {
  if (!optionsListRef.value) return

  const rect = optionsListRef.value.getBoundingClientRect()
  resizeStart = {
    mouseX: event.clientX,
    mouseY: event.clientY,
    width: rect.width,
    height: rect.height
  }

  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', stopResize)
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'nwse-resize'
}

function onResizeMove(event) {
  if (!resizeStart) return

  const minWidth = 120
  const minHeight = 60
  const left = dropdownRect.value.left
  const top = dropdownRect.value.top + dropdownRect.value.height + 2

  const maxWidth = Math.max(minWidth, window.innerWidth - left - 8)
  const maxHeight = Math.max(minHeight, window.innerHeight - (top - window.scrollY) - 8)

  const width = Math.min(
    maxWidth,
    Math.max(minWidth, resizeStart.width + event.clientX - resizeStart.mouseX)
  )
  const height = Math.min(
    maxHeight,
    Math.max(minHeight, resizeStart.height + event.clientY - resizeStart.mouseY)
  )

  resizedListSize.value = { width, height }
}

function stopResize() {
  resizeStart = null
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
}

function updateDropdownRect() {
  const targetEl = props.editable ? inputRef.value : selectRef.value
  if (targetEl) {
    const rect = targetEl.getBoundingClientRect()
    dropdownRect.value = {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    }
  }
}

onMounted(() => {
  initialValue.value = props.modelValue
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', updateDropdownRect, true)
  window.removeEventListener('resize', updateDropdownRect)
  stopResize()
})

watch(
  () => props.resetKey,
  () => {
    initialValue.value = props.modelValue
  },
  { flush: 'post' }
)

function handleClickOutside(event) {
  const isClickOnOptions = optionsListRef.value && optionsListRef.value.contains(event.target)
  const isClickOnWrapper = wrapperRef.value && wrapperRef.value.contains(event.target)

  if (!isClickOnWrapper && !isClickOnOptions) {
    isOpen.value = false
    isFiltering.value = false
    focusedIndex.value = -1
  }
}

const isDirty = computed(
  () => props.modelValue !== initialValue.value
)

const normalizedOptions = computed(() => {
  return props.options.map(item => {
    if (typeof item === 'object' && item !== null) {
      return {
        label: String(item.label ?? item.value ?? ''),
        value: item.value,
        disabled: !!item.disabled
      }
    }

    return {
      label: String(item),
      value: item,
      disabled: false
    }
  })
})

const selectedLabel = computed(() => {
  const found = normalizedOptions.value.find(
    opt => opt.value === props.modelValue
  )

  return found ? found.label : ''
})

const displayOptions = computed(() => {
  if (!isFiltering.value || !props.modelValue) {
    return normalizedOptions.value
  }

  const search = String(props.modelValue).toLowerCase()

  return normalizedOptions.value.filter(opt =>
    opt.label.toLowerCase().includes(search)
  )
})

const selectedTextStyle = computed(() => ({
  fontFamily: props.font.family || 'Calibri, Arial, sans-serif',
  fontSize: props.font.size || '14px',
  fontWeight: props.font.weight ?? 400,
  fontStyle: props.font.style || 'normal',
  color: !selectedLabel.value
    ? (APP_COLORS?.textSecondary || '#888888')
    : (props.font.color || APP_COLORS?.textPrimary || '#333333')
}))

const optionStyle = computed(() => ({
  fontFamily: props.font.family || 'Calibri, Arial, sans-serif',
  fontSize: props.font.size || '14px',
  fontWeight: props.font.weight ?? 400,
  fontStyle: props.font.style || 'normal'
}))

const optionsListStyle = computed(() => ({
  fontFamily: props.font.family || 'Calibri, Arial, sans-serif',
  fontSize: props.font.size || '14px'
}))

const floatingListStyle = computed(() => ({
  ...optionsListStyle.value,
  position: 'absolute',
  top: `${dropdownRect.value.top + dropdownRect.value.height + 2}px`,
  left: `${dropdownRect.value.left}px`,
  width: `${resizedListSize.value?.width ?? dropdownRect.value.width}px`,
  height: resizedListSize.value ? `${resizedListSize.value.height}px` : 'auto',
  maxHeight: resizedListSize.value ? '80vh' : '180px',
  zIndex: 9999
}))

watch(displayOptions, () => {
  focusedIndex.value = -1
  optionRefs.value = []
})

watch(isOpen, newVal => {
  if (!newVal) {
    focusedIndex.value = -1
    window.removeEventListener('scroll', updateDropdownRect, true)
    window.removeEventListener('resize', updateDropdownRect)
  } else {
    nextTick(() => {
      updateDropdownRect()
      window.addEventListener('scroll', updateDropdownRect, true)
      window.addEventListener('resize', updateDropdownRect)

      const list = props.editable
        ? displayOptions.value
        : normalizedOptions.value

      const currentIndex = list.findIndex(
        opt => opt.value === props.modelValue
      )

      focusedIndex.value = currentIndex >= 0
        ? currentIndex
        : (list.length > 0 ? 0 : -1)

      scrollToFocusedOption()
    })
  }
})

function onKeydownEditable(event) {
  if (!props.enabled) return

  if (
    !isOpen.value &&
    ['ArrowDown', 'ArrowUp'].includes(event.key)
  ) {
    event.preventDefault()
    isOpen.value = true
    isFiltering.value = false
    return
  }

  if (!isOpen.value) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()

    if (!displayOptions.value.length) return

    focusedIndex.value =
      (focusedIndex.value + 1) % displayOptions.value.length

    scrollToFocusedOption()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()

    if (!displayOptions.value.length) return

    focusedIndex.value =
      (focusedIndex.value - 1 + displayOptions.value.length) %
      displayOptions.value.length

    scrollToFocusedOption()
  } else if (event.key === 'Enter') {
    event.preventDefault()

    if (
      focusedIndex.value >= 0 &&
      focusedIndex.value < displayOptions.value.length
    ) {
      selectOption(displayOptions.value[focusedIndex.value])
    }
  } else if (event.key === 'Escape') {
    isOpen.value = false
    isFiltering.value = false
    focusedIndex.value = -1
  }
}

function onKeydownNonEditable(event) {
  if (!props.enabled) return

  if (
    [' ', 'Enter', 'ArrowDown', 'ArrowUp'].includes(event.key)
  ) {
    event.preventDefault()

    if (!isOpen.value) {
      isFiltering.value = false
      isOpen.value = true
      return
    }
  }

  if (!isOpen.value) return

  const length = normalizedOptions.value.length

  if (event.key === 'ArrowDown') {
    event.preventDefault()

    if (!length) return

    focusedIndex.value = (focusedIndex.value + 1) % length
    scrollToFocusedOption()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()

    if (!length) return

    focusedIndex.value =
      (focusedIndex.value - 1 + length) % length
    scrollToFocusedOption()
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()

    if (
      focusedIndex.value >= 0 &&
      focusedIndex.value < length
    ) {
      selectOption(normalizedOptions.value[focusedIndex.value])
    }
  } else if (event.key === 'Escape') {
    isOpen.value = false
    focusedIndex.value = -1
  }
}

function scrollToFocusedOption() {
  nextTick(() => {
    if (
      focusedIndex.value >= 0 &&
      optionRefs.value[focusedIndex.value]
    ) {
      optionRefs.value[focusedIndex.value]
        .scrollIntoView({ block: 'nearest' })
    }
  })
}

function makeShadow(shadow = {}) {
  const color = shadow.color || APP_COLORS?.shadowColorNormal || 'rgba(0,0,0,0.1)'
  const offsetX = shadow.offsetX || '0px'
  const offsetY = shadow.offsetY || '2px'
  const blur = shadow.blur || '4px'
  const spread = shadow.spread || '0px'
  const inset = shadow.inset ? 'inset ' : ''

  return `${inset}${offsetX} ${offsetY} ${blur} ${spread} ${color}`
}

const dropdownStyle = computed(() => {
  const size = props.size || {}
  const font = props.font || {}
  const border = props.border || {}
  const shadow = props.shadow || {}
  const hover = props.hover || {}
  const focus = props.focus || {}
  const text = props.text || {}

  let currentColor = font.color || APP_COLORS?.textPrimary || '#333333'
  let currentBackground = props.background?.color || APP_COLORS?.bgPrimary || '#ffffff'
  let currentBorderColor = border.color || APP_COLORS?.borderDefault || '#cccccc'
  let currentShadow = makeShadow(shadow.normal || {})

  if (props.error) {
    currentBorderColor = APP_COLORS?.borderError || '#dc3545'

    if (shadow.error) {
      currentShadow = makeShadow(shadow.error)
    }
  }

  if (!props.enabled) {
    currentBackground = APP_COLORS?.bgDisabled || '#e9ecef'
  }

  if (isHovered.value && props.enabled) {
    if (props.error) {
      if (shadow.errorHover) {
        currentShadow = makeShadow(shadow.errorHover)
      }
    } else {
      if (hover.color) currentColor = hover.color

      if (hover.backgroundColor) {
        currentBackground = hover.backgroundColor
      }

      if (hover.borderColor) {
        currentBorderColor = hover.borderColor
      }

      if (shadow.hover) {
        currentShadow = makeShadow(shadow.hover)
      }
    }
  }

  if (isFocused.value && props.enabled) {
    if (focus.color) currentColor = focus.color

    if (focus.backgroundColor) {
      currentBackground = focus.backgroundColor
    }

    if (focus.borderColor) {
      currentBorderColor = focus.borderColor
    }

    if (shadow.focus) {
      currentShadow = makeShadow(shadow.focus)
    }
  }

  return {
    width: size.width,
    height: size.height,
    fontFamily: font.family,
    fontSize: font.size,
    fontWeight: font.weight,
    fontStyle: font.style,
    color: currentColor,
    backgroundColor: currentBackground,
    borderColor: currentBorderColor,
    borderWidth: border.width,
    borderStyle: border.style,
    borderRadius: border.radius,
    boxShadow: currentShadow,
    textAlign: text.align,
    padding: text.padding,
    cursor: props.enabled
      ? (props.editable ? 'text' : props.cursor)
      : 'not-allowed',
    boxSizing: 'border-box',
    outline: 'none'
  }
})

function toggleDropdown() {
  if (!props.enabled) return

  if (!isOpen.value) {
    isFiltering.value = false
    isOpen.value = true

    if (props.editable) {
      inputRef.value?.focus()
    } else {
      selectRef.value?.focus()
    }
  } else {
    isOpen.value = false
  }
}

function selectOption(option) {
  if (option.disabled) return

  emit('update:modelValue', option.value)
  emit('change', option.value)

  isOpen.value = false
  isFiltering.value = false
  focusedIndex.value = -1
}

function onFocusEditable(event) {
  isFocused.value = true

  if (!isOpen.value) {
    isFiltering.value = false
    isOpen.value = true
  }

  emit('focus', event)
}

function onBlurEditable(event) {
  isFocused.value = false
  emit('blur', event)
}

function onInput(event) {
  const value = event.target.value

  isFiltering.value = true
  isOpen.value = true

  emit('update:modelValue', value)
  emit('input', value)
}

function onFocus(event) {
  isFocused.value = true
  emit('focus', event)
}

function onBlur(event) {
  isFocused.value = false
  emit('blur', event)
}

function onClick(event) {
  emit('click', event)
}

function onMouseEnter() {
  if (props.enabled) isHovered.value = true
}

function onMouseLeave() {
  isHovered.value = false
}

function onMouseLeaveWrapper() {
  isHovered.value = false
}

function focus() {
  if (props.editable) {
    inputRef.value?.focus()
  } else {
    selectRef.value?.focus()
  }
}

function blur() {
  if (props.editable) {
    inputRef.value?.blur()
  } else {
    selectRef.value?.blur()
  }
}

function getValue() {
  return props.modelValue
}

function setValue(value) {
  emit('update:modelValue', value)
}

function resetOriginalValue() {
  initialValue.value = props.modelValue
}

defineExpose({
  focus,
  blur,
  getValue,
  setValue,
  resetOriginalValue,
  selectRef,
  inputRef
})
</script>

<style scoped>
.dropdown-wrapper {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  width: fit-content;

  --dirty-badge-bg: v-bind('APP_COLORS.dirtyBadgeBg');
  --dirty-badge-border: v-bind('APP_COLORS.dirtyBadgeBorder');
  --dirty-badge-glow: v-bind('APP_COLORS.dirtyBadgeGlow');
}

.dropdown {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

.custom-dropdown-container {
  position: relative;
  display: inline-block;
  width: 100%;
}

.dropdown-non-editable {
  position: relative;
  user-select: none;
}

.dropdown-selected-text {
  display: block;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
}

.dropdown-arrow-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
}

.dropdown-arrow-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* CONTAINER FLOATING POPOVER */
:global(.options-popover-wrapper) {
  display: flex;
  flex-direction: column;
  background: v-bind('APP_COLORS.bgPrimaryGrad');
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
  overflow: hidden;
}

/* LIST CONTAINER */
:global(.custom-options-list) {
  margin: 0;
  padding: 4px 0 56px;
  list-style: none;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* HANDLE RESIZE DIV DI POJOK KANAN BAWAH */
:global(.options-resize-handle) {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 10;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 16px;
  height: 16px;
  
  cursor: nwse-resize;
  background: v-bind('APP_COLORS.bgPrimary || "#ffffff"'); /* Tutupi lekukan scrollbar */
  border-top-left-radius: 4px;
  touch-action: none;
  user-select: none;
}

:global(.options-resize-handle:hover .app-icon) {
  color: #0369a1 !important;
}

/* ITEM LIST */
.custom-option-item {
  padding: 6px 12px;
  color: #333333;
  cursor: pointer;
  background-color: transparent;
  transition: background-color 0.15s ease, color 0.15s ease;
}

/* ITEM TERPILIH */
.custom-option-item.is-selected {
  font-weight: 600;
  background:  v-bind('APP_COLORS.bgGradSelected') !important ;
  color:  v-bind('APP_COLORS.bgGradTextSelected') !important ;
}

/* HOVER & ACTIVE STATE */
.custom-option-item:hover,
.custom-option-item.is-active {
  background:  v-bind('APP_COLORS.bgGradHover') !important ;
  color:  v-bind('APP_COLORS.bgGradTextHover') !important ;
}



.custom-option-item.is-disabled {
  color: #a1a1aa;
  cursor: not-allowed;
  background-color: transparent !important;
}

.custom-option-empty {
  padding: 8px 12px;
  color: #71717a;
  text-align: center;
}

.dropdown-disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.dropdown-error {
  border-color: #dc3545 !important;
}

.error-text {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
}
</style>