<template>
    <div class="textbox-wrapper" v-if="visible">
        <!-- Indikator Bola Kecil (Hanya muncul jika nilai berubah/isDirty) -->
        <span v-if="isDirty" class="dirty-badge" title="Data telah diubah"></span>

        <input ref="inputRef" :type="type" :value="modelValue" :name="name" :placeholder="placeholder"
            :disabled="!enabled" :readonly="readOnly" :maxlength="maxlength" :minlength="minlength" :required="required"
            :autocomplete="autocomplete" :inputmode="inputMode" :min="min" :max="max" :pattern="pattern" :class="[
                'textbox',
                {
                    'textbox-error': error,
                    'textbox-disabled': !enabled,
                    'textbox-readonly': readOnly,
                    'textbox-dirty': isDirty
                }
            ]" :style="textboxStyle" @input="onInput" @change="onChange" @focus="onFocus" @blur="onBlur"
            @keydown="onKeydown" @keyup="onKeyup" @click="onClick" @mouseenter="onMouseEnter"
            @mouseleave="onMouseLeave" />

        <span v-if="error && errorMessage" class="error-text">
            {{ errorMessage }}
        </span>
    </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'

// --- PROPS ---
const props = defineProps({
    modelValue: { type: [String, Number], default: '' },
    name: { type: String, default: '' },
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
    readOnly: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: '' },
    maxlength: { type: Number, default: null },
    minlength: { type: Number, default: null },
    autocomplete: { type: String, default: 'off' },
    inputMode: { type: String, default: null },
    min: { type: [String, Number], default: null },
    max: { type: [String, Number], default: null },
    pattern: { type: String, default: null },
    required: { type: Boolean, default: false },
    error: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
    cursor: { type: String, default: 'text' }
})

// --- EMITS ---
const emit = defineEmits([
    'update:modelValue', 'input', 'change', 'focus', 'blur', 'keydown', 'keyup', 'click'
])

// --- REF & STATE ---
const inputRef = ref(null)
const isFocused = ref(false)
const isHovered = ref(false)

// 1. Variabel penampung nilai awal
const initialValue = ref('')

// Simpan nilai awal saat komponen pertama kali dipasang
onMounted(() => {
    initialValue.value = props.modelValue
})

// 2. Computed untuk mengecek apakah data sudah diedit/berubah
const isDirty = computed(() => {
    return props.modelValue !== initialValue.value
})

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
const textboxStyle = computed(() => {
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
        padding: text.padding || '5px 8px',
        cursor: props.enabled ? props.cursor : 'not-allowed',
        boxSizing: 'border-box',
        outline: 'none'
    }
})

// --- EVENTS ---
function onInput(event) {
    emit('update:modelValue', event.target.value)
    emit('input', event.target.value)
}
function onChange(event) { emit('change', event.target.value) }
function onFocus(event) { isFocused.value = true; emit('focus', event) }
function onBlur(event) { isFocused.value = false; emit('blur', event) }
function onKeydown(event) { emit('keydown', event) }
function onKeyup(event) { emit('keyup', event) }
function onClick(event) { emit('click', event) }
function onMouseEnter() { if (props.enabled) isHovered.value = true }
function onMouseLeave() { isHovered.value = false }

// --- PUBLIC METHODS ---
function focus() { inputRef.value?.focus() }
function blur() { inputRef.value?.blur() }
function select() { inputRef.value?.select() }
function selectAll() { inputRef.value?.select() }
function getValue() { return inputRef.value?.value ?? '' }
function setValue(value) { emit('update:modelValue', value) }

// Method opsional untuk meriset status "asli" setelah data berhasil disimpan ke API
function resetOriginalValue() {
    initialValue.value = props.modelValue
}

defineExpose({
    focus, blur, select, selectAll, getValue, setValue, resetOriginalValue, inputRef
})
</script>

<style scoped>

.textbox-wrapper {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    width: fit-content; /* Sesuai dengan ukuran elemen di dalamnya */
}

.textbox {
    display: inline-block;
    font-family: Arial, sans-serif;
    transition:
        border-color 0.15s ease,
        background-color 0.15s ease,
        color 0.15s ease,
        box-shadow 0.15s ease;
}

/* Style Bola Kecil Indikator */

.textbox-disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

.textbox-readonly {
    cursor: default;
}

.textbox-error {
    border-color: #dc3545 !important;
}

.textbox::placeholder {
    color: #0000005d;
    opacity: 1;
}

.error-text {
    color: #dc3545;
    font-size: 12px;
    margin-top: 4px;
}
</style>