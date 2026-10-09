<template>
    <div 
        ref="wrapperRef"
        class="dropdown-wrapper" 
        v-if="visible"
        @mouseleave="onMouseLeaveWrapper"
    >
        <!-- Indikator Bola Kecil (Hanya muncul jika nilai berubah/isDirty) -->
        <span v-if="isDirty" class="dirty-badge" title="Data telah diubah"></span>

        <!-- MODE 1: Editable (Bisa diketik + Custom Options Popup) -->
        <div v-if="editable" class="editable-container">
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
            <!-- Tombol Panah Dropdown untuk Mode Editable -->
            <button 
                type="button"
                tabindex="-1"
                class="dropdown-arrow-btn"
                :disabled="!enabled"
                @click="toggleDropdown"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#222222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            <!-- Popup List Opsi untuk Mode Editable -->
            <ul v-if="isOpen && enabled" ref="optionsListRef" class="editable-options-list">
                <li 
                    v-for="(option, index) in displayOptions" 
                    :key="index"
                    :ref="el => optionRefs[index] = el"
                    :class="[
                        'editable-option-item', 
                        { 
                            'is-disabled': option.disabled,
                            'is-active': index === focusedIndex
                        }
                    ]"
                    @mousedown.prevent="selectOption(option)"
                    @mouseenter="focusedIndex = index"
                >
                    {{ option.label }}
                </li>
                <li v-if="displayOptions.length === 0" class="editable-option-empty">
                    Tidak ada opsi
                </li>
            </ul>
        </div>

        <!-- MODE 2: Standard Select Dropdown (Bawaan) -->
        <select 
            v-else
            ref="selectRef"
            :value="modelValue" 
            :name="name" 
            :disabled="!enabled" 
            :required="required"
            :class="[
                'dropdown',
                {
                    'dropdown-error': error,
                    'dropdown-disabled': !enabled,
                    'dropdown-dirty': isDirty
                }
            ]" 
            :style="dropdownStyle" 
            @change="onChange" 
            @focus="onFocus" 
            @blur="onBlur"
            @click="onClick" 
            @mouseenter="onMouseEnter" 
            @mouseleave="onMouseLeave"
        >
            <!-- Opsi Placeholder (jika ada) -->
            <option v-if="placeholder" value="" disabled hidden selected>
                {{ placeholder }}
            </option>

            <!-- Loop Opsi -->
            <option 
                v-for="(option, index) in normalizedOptions" 
                :key="index" 
                :value="option.value"
                :disabled="option.disabled"
            >
                {{ option.label }}
            </option>
        </select>

        <span v-if="error && errorMessage" class="error-text">
            {{ errorMessage }}
        </span>
    </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

// --- PROPS ---
const props = defineProps({
    modelValue: { type: [String, Number, Boolean], default: '' },
    name: { type: String, default: '' },
    options: { type: Array, default: () => [] },
    editable: { type: Boolean, default: false },
    size: { type: Object, default: () => ({ width: '200px', height: '32px' }) },
    font: { type: Object, default: () => ({ family: 'Calibri, Arial, sans-serif', size: '14px', weight: 400, style: 'normal', color: '#222222' }) },
    background: { type: Object, default: () => ({ color: '#ffffff' }) },
    border: { type: Object, default: () => ({ color: '#cccccc', width: '1px', style: 'solid', radius: '4px' }) },
    shadow: {
        type: Object,
        default: () => ({
            normal: { color: 'rgba(0, 0, 0, 0.2)', offsetX: '0px', offsetY: '2px', blur: '4px', spread: '0px', inset: false },
            hover: { color: 'rgba(0, 0, 0, 0.2)', offsetX: '0px', offsetY: '2px', blur: '4px', spread: '0px', inset: true },
            focus: { color: 'rgba(0, 0, 0, 0.2)', offsetX: '0px', offsetY: '2px', blur: '4px', spread: '1px', inset: true },
            error: { color: 'rgba(220, 53, 69, 0.2)', offsetX: '0px', offsetY: '2px', blur: '4px', spread: '1px', inset: false },
            errorHover: { color: 'rgba(220, 53, 69, 0.4)', offsetX: '0px', offsetY: '2px', blur: '4px', spread: '1px', inset: true }
        })
    },
    hover: { type: Object, default: () => ({ borderColor: '#777777', backgroundColor: null, color: null }) },
    focus: { type: Object, default: () => ({ borderColor: '#777777', backgroundColor: null, color: null }) },
    text: { type: Object, default: () => ({ align: 'left', padding: '5px 8px' }) },
    enabled: { type: Boolean, default: true },
    visible: { type: Boolean, default: true },
    placeholder: { type: String, default: '' },
    required: { type: Boolean, default: false },
    error: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
    cursor: { type: String, default: 'pointer' }
})

// --- EMITS ---
const emit = defineEmits([
    'update:modelValue', 'input', 'change', 'focus', 'blur', 'click'
])

// --- REF & STATE ---
const wrapperRef = ref(null)
const selectRef = ref(null)
const inputRef = ref(null)
const optionsListRef = ref(null)
const optionRefs = ref([])

const isFocused = ref(false)
const isHovered = ref(false)
const isOpen = ref(false)
const isFiltering = ref(false)

// Indeks opsi yang sedang disorot via keyboard
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

const isDirty = computed(() => {
    return props.modelValue !== initialValue.value
})

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

const displayOptions = computed(() => {
    if (!isFiltering.value || !props.modelValue) {
        return normalizedOptions.value
    }
    const search = String(props.modelValue).toLowerCase()
    return normalizedOptions.value.filter(opt => 
        opt.label.toLowerCase().includes(search)
    )
})

// Reset focusedIndex ketika opsi yang tampil berubah
watch(displayOptions, () => {
    focusedIndex.value = -1
    optionRefs.value = []
})

// Reset focusedIndex ketika dropdown tertutup
watch(isOpen, (newVal) => {
    if (!newVal) {
        focusedIndex.value = -1
    } else {
        // Cari indeks item yang sedang dipilih jika ada
        const currentIndex = displayOptions.value.findIndex(
            opt => opt.value === props.modelValue
        )
        focusedIndex.value = currentIndex >= 0 ? currentIndex : 0
        scrollToFocusedOption()
    }
})

// --- NAVIGASI KEYBOARD ---
function onKeydownEditable(event) {
    if (!props.enabled) return

    // Jika dropdown tertutup dan user menekan Panah Bawah/Atas -> Buka dropdown
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
            const selectedOpt = displayOptions.value[focusedIndex.value]
            selectOption(selectedOpt)
        }
    } else if (event.key === 'Escape') {
        isOpen.value = false
        isFiltering.value = false
        focusedIndex.value = -1
    }
}

// Otomatis scroll saat berpindah opsi via keyboard
function scrollToFocusedOption() {
    nextTick(() => {
        if (focusedIndex.value >= 0 && optionRefs.value[focusedIndex.value]) {
            optionRefs.value[focusedIndex.value]?.scrollIntoView({
                block: 'nearest'
            })
        }
    })
}

// --- MAKE SHADOW ---
function makeShadow(shadow = {}) {
    const color = shadow.color || 'rgba(0, 0, 0, 0.15)'
    const offsetX = shadow.offsetX || '0px'
    const offsetY = shadow.offsetY || '2px'
    const blur = shadow.blur || '4px'
    const spread = shadow.spread || '0px'
    const inset = shadow.inset ? 'inset ' : ''
    return `${inset}${offsetX} ${offsetY} ${blur} ${spread} ${color}`
}

// --- COMPUTED STYLE ---
const dropdownStyle = computed(() => {
    const size = props.size || {}
    const font = props.font || {}
    const background = props.background || {}
    const border = props.border || {}
    const shadow = props.shadow || {}
    const hover = props.hover || {}
    const focus = props.focus || {}
    const text = props.text || {}

    let currentColor = font.color || '#222222'
    let currentBackground = background.color || '#ffffff'
    let currentBorderColor = border.color || '#999999'
    let currentShadow = makeShadow(shadow.normal || {})

    if (props.error) {
        currentBorderColor = '#dc3545'
        if (shadow.error) currentShadow = makeShadow(shadow.error)
    }

    if (!props.enabled) {
        currentBackground = '#eeeeee'
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
        padding: props.editable ? '5px 28px 5px 8px' : (text.padding || '5px 24px 5px 8px'),
        cursor: props.enabled ? (props.editable ? 'text' : props.cursor) : 'not-allowed',
        boxSizing: 'border-box',
        outline: 'none',
        appearance: 'none',
        webkitAppearance: 'none',
        mozAppearance: 'none'
    }
})

// --- EDITABLE ACTIONS ---
function toggleDropdown() {
    if (!props.enabled) return
    
    if (!isOpen.value) {
        isFiltering.value = false
        isOpen.value = true
        inputRef.value?.focus()
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

// --- EVENTS ---
function onInput(event) {
    const value = event.target.value
    isFiltering.value = true
    isOpen.value = true
    emit('update:modelValue', value)
    emit('input', value)
}

function onChange(event) {
    const value = event.target.value
    emit('update:modelValue', value)
    emit('change', value)
}

function onFocus(event) { isFocused.value = true; emit('focus', event) }
function onBlur(event) { isFocused.value = false; emit('blur', event) }
function onClick(event) { emit('click', event) }
function onMouseEnter() { if (props.enabled) isHovered.value = true }
function onMouseLeave() { isHovered.value = false }
function onMouseLeaveWrapper() { isHovered.value = false }

// --- PUBLIC METHODS ---
function focus() { 
    if (props.editable) inputRef.value?.focus()
    else selectRef.value?.focus() 
}
function blur() { 
    if (props.editable) inputRef.value?.blur()
    else selectRef.value?.blur() 
}
function getValue() { 
    if (props.editable) return inputRef.value?.value ?? ''
    return selectRef.value?.value ?? '' 
}
function setValue(value) { emit('update:modelValue', value) }

function resetOriginalValue() {
    initialValue.value = props.modelValue
}

defineExpose({
    focus, blur, getValue, setValue, resetOriginalValue, selectRef, inputRef
})
</script>

<style scoped>
.dropdown-wrapper {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    width: fit-content;
}

.dropdown {
    display: inline-block;
    font-family: Arial, sans-serif;
    transition:
        border-color 0.15s ease,
        background-color 0.15s ease,
        color 0.15s ease,
        box-shadow 0.15s ease;
    
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23222222' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
}

/* Container khusus mode editable */
.editable-container {
    position: relative;
    display: inline-block;
    width: 100%;
}

.dropdown-editable {
    background-image: none !important;
}

/* Tombol panah pada mode editable */
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

/* Custom list popup untuk mode editable */
.editable-options-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin: 2px 0 0 0;
    padding: 4px 0;
    list-style: none;
    background-color: #ffffff;
    border: 1px solid #cccccc;
    border-radius: 4px;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.15);
    max-height: 180px;
    overflow-y: auto;
    z-index: 1000;
}

.editable-option-item {
    padding: 6px 10px;
    font-size: 14px;
    color: #222222;
    cursor: pointer;
    transition: background-color 0.15s ease;
}

/* Style ketika di-hover mouse atau dipilih via keyboard (is-active) */
.editable-option-item:hover,
.editable-option-item.is-active {
    background-color: #e6f0ff;
    color: #0056b3;
}

.editable-option-item.is-disabled {
    color: #a0a0a0;
    cursor: not-allowed;
    background-color: transparent;
}

.editable-option-empty {
    padding: 6px 10px;
    font-size: 13px;
    color: #888888;
    text-align: center;
}

/* Indikator Bola Kecil (Dirty Badge) */
.dirty-badge {
    position: absolute;
    top: -3px;
    right: -3px;
    width: 8px;
    height: 8px;
    background-color: #ff9100;
    border-width: 1px;
    border-color: #ffc400;
    border-style: solid;
    border-radius: 50%;
    z-index: 1001;
    box-shadow: 0px 0px 5px 2px rgb(255, 251, 0);
    pointer-events: none;
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