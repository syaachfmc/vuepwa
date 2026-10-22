<template>
    <div class="textbox-wrapper" v-if="visible">
        <!-- Indikator ketika nilai berbeda dari nilai awal -->
        <span v-if="isDirty" class="dirty-badge" title="Data telah diubah"></span>

        <textarea v-if="multiline" ref="inputRef" :value="modelValue" :name="name" :placeholder="placeholder"
            :disabled="!enabled" :readonly="readOnly" :maxlength="maxlength" :minlength="minlength" :required="required"
            :class="[
                'textbox',
                'textbox-multiline',
                {
                    'textbox-error': error,
                    'textbox-disabled': !enabled,
                    'textbox-readonly': readOnly,
                    'textbox-dirty': isDirty
                }
            ]" :style="textboxStyle" rows="1" @input="onInput" @change="onChange" @focus="onFocus" @blur="onBlur"
            @keydown="onKeydown" @keyup="onKeyup" @click="onClick" @mouseenter="onMouseEnter"
            @mouseleave="onMouseLeave" />

        <input v-else ref="inputRef" :type="type" :value="modelValue" :name="name" :placeholder="placeholder"
            :disabled="!enabled" :readonly="readOnly" :maxlength="maxlength" :minlength="minlength" :required="required"
            :autocomplete="autocomplete" :inputmode="inputMode" :min="min" :max="max" :pattern="pattern" :class="[
                'textbox',
                {
                    'textbox-error': error,
                    'textbox-disabled': !enabled,
                    'textbox-readonly': readOnly,
                    'textbox-dirty': isDirty
                }
            ]" :style="textboxStyle" @input="onInput" @change="onChange" @focus="onFocus" @blur="onBlur" @keydown="onKeydown"
            @keyup="onKeyup" @click="onClick" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave" />

        <span v-if="error && errorMessage" class="error-text">
            {{ errorMessage }}
        </span>
    </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { APP_COLORS } from '../constants/colors.js'

// --------------------------------------------------
// PROPS
// --------------------------------------------------
const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: ''
    },

    name: {
        type: String,
        default: ''
    },

    multiline: {
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
            weight: 'normal',
            style: 'normal',
            color: APP_COLORS.textPrimary
        })
    },

    background: {
        type: Object,
        default: () => ({
            background: APP_COLORS.bgPrimary
        })
    },

    border: {
        type: Object,
        default: () => ({
            color: APP_COLORS.borderDefault,
            width: '1px',
            style: 'solid',
            radius: '4px'
        })
    },

    shadow: {
        type: Object,
        default: () => ({
            normal: {
                color: APP_COLORS.shadowColorNormal,
                offsetX: '0px',
                offsetY: '2px',
                blur: '4px',
                spread: '0px',
                inset: false
            },
            hover: {
                color: APP_COLORS.shadowColorHover,
                offsetX: '0px',
                offsetY: '2px',
                blur: '4px',
                spread: '0px',
                inset: true
            },
            focus: {
                color: APP_COLORS.shadowColorFocus,
                offsetX: '0px',
                offsetY: '2px',
                blur: '4px',
                spread: '1px',
                inset: true
            },
            error: {
                color: APP_COLORS.shadowColorError,
                offsetX: '0px',
                offsetY: '2px',
                blur: '4px',
                spread: '1px',
                inset: false
            },
            errorHover: {
                color: APP_COLORS.shadowColorErrorHover,
                offsetX: '0px',
                offsetY: '2px',
                blur: '4px',
                spread: '1px',
                inset: true
            }
        })
    },

    hover: {
        type: Object,
        default: () => ({
            borderColor: APP_COLORS.borderHover,
            backgroundColor: null,
            color: null
        })
    },

    focus: {
        type: Object,
        default: () => ({
            borderColor: APP_COLORS.borderFocus,
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

    readOnly: {
        type: Boolean,
        default: false
    },

    visible: {
        type: Boolean,
        default: true
    },

    type: {
        type: String,
        default: 'text'
    },

    placeholder: {
        type: String,
        default: ''
    },

    maxlength: {
        type: Number,
        default: null
    },

    minlength: {
        type: Number,
        default: null
    },

    autocomplete: {
        type: String,
        default: 'off'
    },

    inputMode: {
        type: String,
        default: null
    },

    min: {
        type: [String, Number],
        default: null
    },

    max: {
        type: [String, Number],
        default: null
    },

    pattern: {
        type: String,
        default: null
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
        default: 'text'
    },

    // Ubah nilai ini setiap kali parent mengganti baris/data.
    // Tidak wajib digunakan jika parent mengatur baseline
    // melalui resetOriginalValue().
    resetKey: {
        type: [String, Number],
        default: 0
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
    'click'
])

// --------------------------------------------------
// REF & STATE
// --------------------------------------------------
const inputRef = ref(null)

const isFocused = ref(false)
const isHovered = ref(false)

// Normalisasi agar nilai 123 dan string "123"
// tidak dianggap berbeda hanya karena tipe datanya.
function normalizeValue(value) {
    return value == null ? '' : String(value)
}

// Nilai awal untuk pembanding dirty state.
const initialValue = ref(normalizeValue(props.modelValue))

// --------------------------------------------------
// DIRTY STATE
// --------------------------------------------------
const isDirty = computed(() => {
    return normalizeValue(props.modelValue) !== initialValue.value
})

// --------------------------------------------------
// INITIAL VALUE & ROW SWITCH
// --------------------------------------------------

// Ambil baseline ketika komponen pertama kali dipasang.
onMounted(() => {
    initialValue.value = normalizeValue(props.modelValue)
})

// Reset baseline ketika parent mengubah resetKey.
// Dilakukan secara eksplisit agar perubahan nilai akibat
// pengguna mengetik tidak mereset baseline secara otomatis.
watch(
    () => props.resetKey,
    () => {
        initialValue.value = normalizeValue(props.modelValue)
    },
    { flush: 'post' }
)

// --------------------------------------------------
// MAKE SHADOW
// --------------------------------------------------
function makeShadow(shadow = {}) {
    const color =
        shadow.color ?? APP_COLORS.shadowColorNormal

    const offsetX = shadow.offsetX ?? '0px'
    const offsetY = shadow.offsetY ?? '2px'
    const blur = shadow.blur ?? '4px'
    const spread = shadow.spread ?? '0px'
    const inset = shadow.inset ? 'inset ' : ''

    return `${inset}${offsetX} ${offsetY} ${blur} ${spread} ${color}`
}

// --------------------------------------------------
// COMPUTED STYLE
// --------------------------------------------------
const textboxStyle = computed(() => {
    const size = props.size || {}
    const font = props.font || {}
    const background = props.background || {}
    const border = props.border || {}
    const shadow = props.shadow || {}
    const hover = props.hover || {}
    const focus = props.focus || {}
    const text = props.text || {}

    let currentColor =
        font.color ?? APP_COLORS.textPrimary

    let currentBackground =
        background.color ?? APP_COLORS.bgPrimaryGrad

    let currentBorderColor =
        border.color ?? APP_COLORS.borderDefault

    let currentShadow = makeShadow(shadow.normal || {})

    // Disabled mempunyai prioritas tertinggi.
    if (!props.enabled) {
        currentBackground = APP_COLORS.bgDisabled
        currentColor = APP_COLORS.textDisabled
    } else {
        // Hover
        if (isHovered.value) {
            if (hover.color != null) {
                currentColor = hover.color
            }

            if (hover.backgroundColor != null) {
                currentBackground = hover.backgroundColor
            }

            if (hover.borderColor != null) {
                currentBorderColor = hover.borderColor
            }

            if (props.error) {
                currentShadow = makeShadow(
                    shadow.errorHover || shadow.error || {}
                )
            } else {
                currentShadow = makeShadow(
                    shadow.hover || shadow.normal || {}
                )
            }
        }

        // Focus mengalahkan hover, tetapi tidak menghilangkan
        // status error pada border dan shadow.
        if (isFocused.value) {
            if (focus.color != null) {
                currentColor = focus.color
            }

            if (focus.backgroundColor != null) {
                currentBackground = focus.backgroundColor
            }

            if (focus.borderColor != null) {
                currentBorderColor = focus.borderColor
            }

            currentShadow = makeShadow(
                props.error
                    ? (shadow.error || {})
                    : (shadow.focus || shadow.normal || {})
            )
        }

        // Error selalu mempertahankan border error.
        if (props.error) {
            currentBorderColor = APP_COLORS.borderError

            if (!isFocused.value) {
                currentShadow = makeShadow(
                    isHovered.value
                        ? (shadow.errorHover || shadow.error || {})
                        : (shadow.error || {})
                )
            }
        }
    }

    return {
        width: size.width,
        height: size.height,

        fontFamily: font.family,
        fontSize: font.size,
        fontWeight: font.weight,
        fontStyle: font.style,

        // Gunakan warna yang sudah dihitung agar hover/focus
        // benar-benar memengaruhi warna teks.
        color: currentColor,

        background: currentBackground,

        borderColor: currentBorderColor,
        borderWidth: border.width,
        borderStyle: border.style,
        borderRadius: border.radius,

        boxShadow: currentShadow,

        textAlign: text.align,
        padding: text.padding,

        cursor: props.enabled
            ? props.cursor
            : 'not-allowed',

        boxSizing: 'border-box',
        outline: 'none'
    }
})

// --------------------------------------------------
// EVENTS
// --------------------------------------------------
function onInput(event) {
    const value = event.target.value

    emit('update:modelValue', value)
    emit('input', value)
}

function onChange(event) {
    emit('change', event.target.value)
}

function onFocus(event) {
    isFocused.value = true
    emit('focus', event)
}

function onBlur(event) {
    isFocused.value = false
    emit('blur', event)
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

function onMouseEnter() {
    if (props.enabled) {
        isHovered.value = true
    }
}

function onMouseLeave() {
    isHovered.value = false
}

// --------------------------------------------------
// PUBLIC METHODS
// --------------------------------------------------
function focus() {
    inputRef.value?.focus()
}

function blur() {
    inputRef.value?.blur()
}

function select() {
    inputRef.value?.select()
}

function selectAll() {
    inputRef.value?.select()
}

function getValue() {
    return inputRef.value?.value ?? ''
}

function setValue(value) {
    emit('update:modelValue', value)
}

// Tetapkan nilai saat ini sebagai baseline baru.
// Panggil setelah data berhasil disimpan atau setelah
// parent selesai mengganti data baris.
function resetOriginalValue() {
    initialValue.value = normalizeValue(props.modelValue)
}

// --------------------------------------------------
// EXPOSE METHODS TO PARENT
// --------------------------------------------------
defineExpose({
    focus,
    blur,
    select,
    selectAll,
    getValue,
    setValue,
    resetOriginalValue,
    inputRef
})
</script>

<style scoped>
.textbox-wrapper {
    --text-secondary: v-bind('APP_COLORS.textSecondary');
    --border-error: v-bind('APP_COLORS.borderError');

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
    font-family: inherit;

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
