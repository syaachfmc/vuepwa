<template>
    <div 
        ref="wrapperRef"
        class="dropdown-wrapper" 
        v-if="visible"
        @mouseleave="onMouseLeaveWrapper"
    >
        <!-- Indikator Bola Kecil (Dirty Badge) -->
        <span v-if="isDirty" class="dirty-badge" title="Data telah diubah"></span>

        <!-- MODE 1: Editable -->
        <div v-if="editable" class="custom-dropdown-container">
            <input 
                ref="inputRef"
                :value="modelValue" 
                :name="name" 
                :disabled="!enabled" 
                :placeholder="placeholder"
                :required="required"
                :class="[
                    'dropdown',
                    'dropdown-editable',
                    {
                        'dropdown-error': error,
                        'dropdown-disabled': !enabled,
                        'dropdown-dirty': isDirty
                    }
                ]" 
                :style="dropdownStyle" 
                @input="onInput"
                @focus="onFocusEditable" 
                @blur="onBlurEditable"
                @keydown="onKeydownEditable"
                @click="onClick" 
                @mouseenter="onMouseEnter" 
                @mouseleave="onMouseLeave"
            />
            <button 
                type="button"
                tabindex="-1"
                class="dropdown-arrow-btn"
                :disabled="!enabled"
                @click="toggleDropdown"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" :stroke="themeColors.textPrimary" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            <ul v-if="isOpen && enabled" ref="optionsListRef" class="custom-options-list">
                <li 
                    v-for="(option, index) in displayOptions" 
                    :key="index"
                    :ref="el => optionRefs[index] = el"
                    :class="[
                        'custom-option-item', 
                        { 
                            'is-disabled': option.disabled,
                            'is-active': index === focusedIndex,
                            'is-selected': option.value === modelValue
                        }
                    ]"
                    @mousedown.prevent="selectOption(option)"
                    @mouseenter="focusedIndex = index"
                >
                    {{ option.label }}
                </li>
                <li v-if="displayOptions.length === 0" class="custom-option-empty">
                    Tidak ada opsi
                </li>
            </ul>
        </div>

        <!-- MODE 2: Non-Editable -->
        <div v-else class="custom-dropdown-container">
            <div
                ref="selectRef"
                tabindex="0"
                :class="[
                    'dropdown',
                    'dropdown-non-editable',
                    {
                        'dropdown-error': error,
                        'dropdown-disabled': !enabled,
                        'dropdown-dirty': isDirty,
                        'is-placeholder': !selectedLabel
                    }
                ]"
                :style="dropdownStyle"
                @click="toggleDropdown"
                @keydown="onKeydownNonEditable"
                @focus="onFocus"
                @blur="onBlur"
                @mouseenter="onMouseEnter"
                @mouseleave="onMouseLeave"
            >
                <span class="dropdown-selected-text">
                    {{ selectedLabel || placeholder }}
                </span>
                <span class="dropdown-arrow-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" :stroke="themeColors.textPrimary" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </span>
            </div>

            <ul v-if="isOpen && enabled" ref="optionsListRef" class="custom-options-list">
                <li 
                    v-for="(option, index) in normalizedOptions" 
                    :key="index"
                    :ref="el => optionRefs[index] = el"
                    :class="[
                        'custom-option-item', 
                        { 
                            'is-disabled': option.disabled,
                            'is-active': index === focusedIndex,
                            'is-selected': option.value === modelValue
                        }
                    ]"
                    @mousedown.prevent="selectOption(option)"
                    @mouseenter="focusedIndex = index"
                >
                    {{ option.label }}
                </li>
            </ul>
        </div>

        <span v-if="error && errorMessage" class="error-text">
            {{ errorMessage }}
        </span>
    </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { APP_COLORS } from '../constants/colors.js' // Import variabel warna umum

const props = defineProps({
    modelValue: { type: [String, Number, Boolean], default: '' },
    name: { type: String, default: '' },
    options: { type: Array, default: () => [] },
    editable: { type: Boolean, default: false },
    size: { type: Object, default: () => ({ width: '200px', height: '32px' }) },
    font: { type: Object, default: () => ({ family: 'Calibri, Arial, sans-serif', size: '14px', weight: 400, style: 'normal', color: APP_COLORS.textPrimary }) },
    background: { type: Object, default: () => ({ color: APP_COLORS.bgPrimary }) },
    border: { type: Object, default: () => ({ color: APP_COLORS.borderDefault, width: '1px', style: 'solid', radius: '4px' }) },
    shadow: {
        type: Object,
        default: () => ({
            normal: { color: APP_COLORS.shadowColorNormal, offsetX: '0px', offsetY: '2px', blur: '4px', spread: '0px', inset: false },
            hover: { color: APP_COLORS.shadowColorHover, offsetX: '0px', offsetY: '2px', blur: '4px', spread: '0px', inset: true },
            focus: { color: APP_COLORS.shadowColorFocus, offsetX: '0px', offsetY: '2px', blur: '4px', spread: '1px', inset: true },
            error: { color: APP_COLORS.shadowColorError, offsetX: '0px', offsetY: '2px', blur: '4px', spread: '1px', inset: false },
            errorHover: { color: APP_COLORS.shadowColorErrorHover, offsetX: '0px', offsetY: '2px', blur: '4px', spread: '1px', inset: true }
        })
    },
    hover: { type: Object, default: () => ({ borderColor: APP_COLORS.borderHover, backgroundColor: null, color: null }) },
    focus: { type: Object, default: () => ({ borderColor: APP_COLORS.borderFocus, backgroundColor: null, color: null }) },
    text: { type: Object, default: () => ({ align: 'left', padding: '5px 8px' }) },
    enabled: { type: Boolean, default: true },
    visible: { type: Boolean, default: true },
    placeholder: { type: String, default: '' },
    required: { type: Boolean, default: false },
    error: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
    cursor: { type: String, default: 'pointer' }
})

const emit = defineEmits([
    'update:modelValue', 'input', 'change', 'focus', 'blur', 'click'
])

const themeColors = APP_COLORS

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

onMounted(() => {
    initialValue.value = props.modelValue
    document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})

function handleClickOutside(event) {
    if (wrapperRef.value && !wrapperRef.value.contains(event.target)) {
        isOpen.value = false
        isFiltering.value = false
        focusedIndex.value = -1
    }
}

const isDirty = computed(() => props.modelValue !== initialValue.value)

const normalizedOptions = computed(() => {
    return props.options.map(item => {
        if (typeof item === 'object' && item !== null) {
            return {
                label: item.label ?? item.value,
                value: item.value,
                disabled: !!item.disabled
            }
        }
        return { label: String(item), value: item, disabled: false }
    })
})

const selectedLabel = computed(() => {
    const found = normalizedOptions.value.find(opt => opt.value === props.modelValue)
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

watch(displayOptions, () => {
    focusedIndex.value = -1
    optionRefs.value = []
})

watch(isOpen, (newVal) => {
    if (!newVal) {
        focusedIndex.value = -1
    } else {
        const list = props.editable ? displayOptions.value : normalizedOptions.value
        const currentIndex = list.findIndex(opt => opt.value === props.modelValue)
        focusedIndex.value = currentIndex >= 0 ? currentIndex : 0
        scrollToFocusedOption()
    }
})

function onKeydownEditable(event) {
    if (!props.enabled) return

    if (!isOpen.value && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault()
        isOpen.value = true
        isFiltering.value = false
        return
    }

    if (!isOpen.value) return

    if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (displayOptions.value.length === 0) return
        focusedIndex.value = (focusedIndex.value + 1) % displayOptions.value.length
        scrollToFocusedOption()
    } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (displayOptions.value.length === 0) return
        focusedIndex.value = (focusedIndex.value - 1 + displayOptions.value.length) % displayOptions.value.length
        scrollToFocusedOption()
    } else if (event.key === 'Enter') {
        event.preventDefault()
        if (focusedIndex.value >= 0 && focusedIndex.value < displayOptions.value.length) {
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

    if (event.key === ' ' || event.key === 'Enter' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        if (!isOpen.value) {
            isOpen.value = true
            return
        }
    }

    if (!isOpen.value) return

    if (event.key === 'ArrowDown') {
        event.preventDefault()
        focusedIndex.value = (focusedIndex.value + 1) % normalizedOptions.value.length
        scrollToFocusedOption()
    } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        focusedIndex.value = (focusedIndex.value - 1 + normalizedOptions.value.length) % normalizedOptions.value.length
        scrollToFocusedOption()
    } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        if (focusedIndex.value >= 0 && focusedIndex.value < normalizedOptions.value.length) {
            selectOption(normalizedOptions.value[focusedIndex.value])
        }
    } else if (event.key === 'Escape') {
        isOpen.value = false
        focusedIndex.value = -1
    }
}

function scrollToFocusedOption() {
    nextTick(() => {
        if (focusedIndex.value >= 0 && optionRefs.value[focusedIndex.value]) {
            optionRefs.value[focusedIndex.value]?.scrollIntoView({ block: 'nearest' })
        }
    })
}

function makeShadow(shadow = {}) {
    const color = shadow.color || APP_COLORS.shadowColorNormal
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
    const background = props.background || {}
    const border = props.border || {}
    const shadow = props.shadow || {}
    const hover = props.hover || {}
    const focus = props.focus || {}
    const text = props.text || {}

    let currentColor = font.color || APP_COLORS.textPrimary
    let currentBackground = background.color || APP_COLORS.bgPrimary
    let currentBorderColor = border.color || APP_COLORS.borderDefault
    let currentShadow = makeShadow(shadow.normal || {})

    if (props.error) {
        currentBorderColor = APP_COLORS.borderError
        if (shadow.error) currentShadow = makeShadow(shadow.error)
    }

    if (!props.enabled) {
        currentBackground = APP_COLORS.bgDisabled
    }

    if (isHovered.value && props.enabled) {
        if (props.error) {
            if (shadow.errorHover) currentShadow = makeShadow(shadow.errorHover)
        } else {
            if (hover.color) currentColor = hover.color
            if (hover.backgroundColor) currentBackground = hover.backgroundColor
            if (hover.borderColor) currentBorderColor = hover.borderColor
            if (shadow.hover) currentShadow = makeShadow(shadow.hover)
        }
    }

    if (isFocused.value && props.enabled) {
        if (focus.color) currentColor = focus.color
        if (focus.backgroundColor) currentBackground = focus.backgroundColor
        if (focus.borderColor) currentBorderColor = focus.borderColor
        if (shadow.focus) currentShadow = makeShadow(shadow.focus)
    }

    return {
        width: size.width || '200px',
        height: size.height || '32px',
        fontFamily: font.family || 'Arial, sans-serif',
        fontSize: font.size || '14px',
        fontWeight: font.weight ?? 400,
        fontStyle: font.style || 'normal',
        color: currentColor,
        backgroundColor: currentBackground,
        borderColor: currentBorderColor,
        borderWidth: border.width || '1px',
        borderStyle: border.style || 'solid',
        borderRadius: border.radius || '4px',
        boxShadow: currentShadow,
        textAlign: text.align || 'left',
        padding: text.padding || '5px 28px 5px 8px',
        cursor: props.enabled ? (props.editable ? 'text' : props.cursor) : 'not-allowed',
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

function onFocus(event) { isFocused.value = true; emit('focus', event) }
function onBlur(event) { isFocused.value = false; emit('blur', event) }
function onClick(event) { emit('click', event) }
function onMouseEnter() { if (props.enabled) isHovered.value = true }
function onMouseLeave() { isHovered.value = false }
function onMouseLeaveWrapper() { isHovered.value = false }

function focus() { 
    if (props.editable) inputRef.value?.focus()
    else selectRef.value?.focus() 
}
function blur() { 
    if (props.editable) inputRef.value?.blur()
    else selectRef.value?.blur() 
}
function getValue() { return props.modelValue }
function setValue(value) { emit('update:modelValue', value) }
function resetOriginalValue() { initialValue.value = props.modelValue }

defineExpose({
    focus, blur, getValue, setValue, resetOriginalValue, selectRef, inputRef
})
</script>

<style scoped>
/* Menggunakan v-bind CSS Variables dari JavaScript */
.dropdown-wrapper {
    --bg-primary: v-bind('APP_COLORS.bgPrimary');
    --bg-disabled: v-bind('APP_COLORS.bgDisabled');
    --text-primary: v-bind('APP_COLORS.textPrimary');
    --text-secondary: v-bind('APP_COLORS.textSecondary');
    --text-disabled: v-bind('APP_COLORS.textDisabled');
    --border-error: v-bind('APP_COLORS.borderError');
    --dirty-badge-bg: v-bind('APP_COLORS.dirtyBadgeBg');
    --dirty-badge-border: v-bind('APP_COLORS.dirtyBadgeBorder');
    --dirty-badge-glow: v-bind('APP_COLORS.dirtyBadgeGlow');
    --option-list-bg: v-bind('APP_COLORS.optionListBg');
    --option-list-border: v-bind('APP_COLORS.optionListBorder');
    --option-hover-bg: v-bind('APP_COLORS.optionHoverBg');
    --option-hover-text: v-bind('APP_COLORS.optionHoverText');

    position: relative;
    display: inline-flex;
    flex-direction: column;
    width: fit-content;
}

.dropdown {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    font-family: Arial, sans-serif;
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
    user-select: none;
    position: relative;
}

.dropdown-non-editable.is-placeholder .dropdown-selected-text {
    color: var(--text-secondary);
}

.dropdown-selected-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
}

.dropdown-arrow-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 4px;
}

.dropdown-editable {
    background-image: none !important;
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

.custom-options-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin: 2px 0 0 0;
    padding: 4px 0;
    list-style: none;
    background-color: var(--option-list-bg);
    border: 1px solid var(--option-list-border);
    border-radius: 4px;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.15);
    max-height: 180px;
    overflow-y: auto;
    z-index: 1000;
}

.custom-option-item {
    padding: 6px 10px;
    font-size: 14px;
    color: var(--text-primary);
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
}

.custom-option-item:hover,
.custom-option-item.is-active {
    background-color: var(--option-hover-bg) !important;
    color: var(--option-hover-text) !important;
}

.custom-option-item.is-selected {
    font-weight: 600;
}

.custom-option-item.is-disabled {
    color: var(--text-disabled);
    cursor: not-allowed;
    background-color: transparent !important;
}

.custom-option-empty {
    padding: 6px 10px;
    font-size: 13px;
    color: var(--option-empty-text);
    text-align: center;
}


.dropdown-disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

.dropdown-error {
    border-color: var(--border-error) !important;
}

.error-text {
    color: var(--border-error);
    font-size: 12px;
    margin-top: 4px;
}
</style>