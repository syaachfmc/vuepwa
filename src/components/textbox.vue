<template>
    <div class="textbox-wrapper" v-if="visible">
        <!-- Indikator Bola Kecil (Hanya muncul jika nilai berubah/isDirty) -->
        <span v-if="isDirty" class="dirty-badge" title="Data telah diubah"></span>

        <input 
            ref="inputRef" 
            :type="type" 
            :value="modelValue" 
            :name="name" 
            :placeholder="placeholder"
            :disabled="!enabled" 
            :readonly="readOnly" 
            :maxlength="maxlength" 
            :minlength="minlength" 
            :required="required"
            :autocomplete="autocomplete" 
            :inputmode="inputMode" 
            :min="min" 
            :max="max" 
            :pattern="pattern" 
            :class="[
                'textbox',
                {
                    'textbox-error': error,
                    'textbox-disabled': !enabled,
                    'textbox-readonly': readOnly,
                    'textbox-dirty': isDirty
                }
             ]" 
            :style="textboxStyle" 
            @input="onInput" 
            @change="onChange" 
            @focus="onFocus" 
            @blur="onBlur"
            @keydown="onKeydown" 
            @keyup="onKeyup" 
            @click="onClick" 
            @mouseenter="onMouseEnter"
            @mouseleave="onMouseLeave" 
        />

        <span v-if="error && errorMessage" class="error-text">
            {{ errorMessage }}
        </span>
    </div>
</template>

<script setup>
    import { computed, ref, onMounted } from 'vue'
    import { APP_COLORS } from '../constants/colors.js' // Import variabel warna umum

    // --- PROPS ---
    const props = defineProps({
        modelValue: { type: [String, Number], default: '' },
        name: { type: String, default: '' },
        size: { type: Object, default: () => ({ width: '200px', height: '32px' }) },
        
        font: { 
                type: Object, 
                default: () => ({ 
                    family: 'inherit', // Mengikuti font dari parent / CSS global (*)
                    size: 'inherit',   // (Opsional) Mengikuti ukuran font parent jika diinginkan
                    weight: 'normal', 
                    style: 'normal', 
                    color: APP_COLORS.textPrimary 
                    }) 
                },

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
        const color = shadow.color || APP_COLORS.shadowColorNormal
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

        let currentColor = font.color || APP_COLORS.textPrimary
                
        let currentBackground = APP_COLORS.bgPrimaryGrad
        
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
            width: size.width,
            height: size.height,
            fontFamily: font.family,
            fontSize: font.size,
            fontWeight: font.weight,
            fontStyle: font.style,
            color: currentColor,
            background: currentBackground,
            borderColor: currentBorderColor,
            borderWidth: border.width,
            borderStyle: border.style,
            borderRadius: border.radius,
            boxShadow: currentShadow,
            textAlign: text.align,
            padding: text.padding,
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
    --text-secondary: v-bind('APP_COLORS.textSecondary');
    --border-error: v-bind('APP_COLORS.borderError');
    /* Tambahkan variabel warna dirty badge */
    --dirty-badge-bg: v-bind('APP_COLORS.dirtyBadgeBg');
    --dirty-badge-border: v-bind('APP_COLORS.dirtyBadgeBorder');
    --dirty-badge-glow: v-bind('APP_COLORS.dirtyBadgeGlow');

    position: relative;
    display: inline-flex;
    flex-direction: column;
    width: fit-content;
}

 
.textbox {
    display: inline-block;
    font-family: inherit; /* Pastikan input mewarisi font global / parent */
    transition:
        border-color 0.15s ease,
        background-color 0.15s ease,
        color 0.15s ease,
        box-shadow 0.15s ease;
}

.textbox-disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

.textbox-readonly {
    cursor: default;
}

.textbox-error {
    border-color: var(--border-error) !important;
}

.textbox::placeholder {
    color: var(--text-secondary);
    opacity: 1;
}

.error-text {
    color: var(--border-error);
    font-size: 12px;
    margin-top: 4px;
}
</style>