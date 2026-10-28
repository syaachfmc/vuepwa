<template>
    <div class="checkbox-wrapper" v-if="visible">
        <!-- Indikator ketika nilai berbeda dari nilai awal -->
        <span v-if="isDirty" class="dirty-badge" title="Data telah diubah"></span>

        <label :class="[
            'checkbox-container',
            {
                'checkbox-disabled': !enabled,
                'checkbox-readonly': readOnly,
                'checkbox-error': error,
                'checkbox-dirty': isDirty
            }
        ]" :style="checkboxContainerStyle" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
            <input ref="inputRef" type="checkbox" :name="name" :checked="modelValue" :disabled="!enabled || readOnly"
                :required="required" class="checkbox-input" @change="onChange" @focus="onFocus" @blur="onBlur"
                @keydown="onKeydown" @keyup="onKeyup" @click="onClick" />

            <!-- Custom Checkbox Box -->
            <span class="checkbox-custom" :style="customBoxStyle">
                <!-- Ikon Centang (Checked State) -->
                <svg v-if="modelValue && !indeterminate" class="checkbox-icon" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>

                <!-- Ikon Minus (Indeterminate State) -->
                <svg v-else-if="indeterminate" class="checkbox-icon" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </span>

            <!-- Label Text -->
            <span v-if="label || $slots.default" class="checkbox-label" :style="labelStyle">
                <slot>{{ label }}</slot>
            </span>
        </label>

        <span v-if="error && errorMessage" class="error-text">
            {{ errorMessage }}
        </span>
    </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { APP_COLORS } from '../../constants/colors.js'

// --------------------------------------------------
// PROPS
// --------------------------------------------------
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    indeterminate: {
        type: Boolean,
        default: false
    },
    label: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: ''
    },
    size: {
        type: Object,
        default: () => ({
            boxSize: '32px',
            fontSize: '14px'
        })
    },
    font: {
        type: Object,
        default: () => ({
            family: 'inherit',
            weight: 'normal',
            style: 'normal',
            color: APP_COLORS.textPrimary
        })
    },
    background: {
        type: Object,
        default: () => ({
            unchecked: APP_COLORS.bgPrimaryGrad,
            checked: APP_COLORS.bgPrimaryGrad
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
                offsetY: '1px',
                blur: '2px',
                spread: '0px',
                inset: false
            },
            hover: {
                color: APP_COLORS.shadowColorHover,
                offsetX: '0px',
                offsetY: '2px',
                blur: '4px',
                spread: '0px',
                inset: false
            },
            focus: {
                color: APP_COLORS.shadowColorFocus,
                offsetX: '0px',
                offsetY: '0px',
                blur: '0px',
                spread: '2px',
                inset: false
            }
        })
    },
    hover: {
        type: Object,
        default: () => ({
            borderColor: APP_COLORS.borderHover,
            backgroundColor: null
        })
    },
    focus: {
        type: Object,
        default: () => ({
            borderColor: APP_COLORS.borderFocus
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

// --------------------------------------------------
// EMITS
// --------------------------------------------------
const emit = defineEmits([
    'update:modelValue',
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

// Baseline awal untuk pembanding dirty state
const initialValue = ref(Boolean(props.modelValue))
const initialIndeterminate = ref(Boolean(props.indeterminate))

// --------------------------------------------------
// DIRTY STATE
// --------------------------------------------------
const isDirty = computed(() => {
    return (
        Boolean(props.modelValue) !== initialValue.value ||
        Boolean(props.indeterminate) !== initialIndeterminate.value
    )
})

// Sync property indeterminate ke elemen DOM input asli
watch(
    () => props.indeterminate,
    (val) => {
        if (inputRef.value) {
            inputRef.value.indeterminate = Boolean(val)
        }
    },
    { immediate: true }
)

// --------------------------------------------------
// INITIAL VALUE & RESET KEY WATCHER
// --------------------------------------------------
onMounted(() => {
    initialValue.value = Boolean(props.modelValue)
    initialIndeterminate.value = Boolean(props.indeterminate)
    if (inputRef.value) {
        inputRef.value.indeterminate = Boolean(props.indeterminate)
    }
})

watch(
    () => props.resetKey,
    () => {
        initialValue.value = Boolean(props.modelValue)
        initialIndeterminate.value = Boolean(props.indeterminate)
    },
    { flush: 'post' }
)

// --------------------------------------------------
// MAKE SHADOW
// --------------------------------------------------
function makeShadow(shadow = {}) {
    const color = shadow.color ?? APP_COLORS.shadowColorNormal
    const offsetX = shadow.offsetX ?? '0px'
    const offsetY = shadow.offsetY ?? '2px'
    const blur = shadow.blur ?? '4px'
    const spread = shadow.spread ?? '0px'
    const inset = shadow.inset ? 'inset ' : ''
    return `${inset}${offsetX} ${offsetY} ${blur} ${spread} ${color}`
}

// --------------------------------------------------
// COMPUTED STYLES
// --------------------------------------------------
const checkboxContainerStyle = computed(() => {
    return {
        cursor: !props.enabled
            ? 'not-allowed'
            : props.readOnly
                ? 'default'
                : props.cursor
    }
})

const customBoxStyle = computed(() => {
    const size = props.size || {}
    const background = props.background || {}
    const border = props.border || {}
    const shadow = props.shadow || {}
    const hover = props.hover || {}
    const focus = props.focus || {}

    const boxSize = size.boxSize ?? '18px'
    const isActive = props.modelValue || props.indeterminate

    let currentBg = isActive
        ? background.checked ?? '#3b82f6'
        : background.unchecked ?? APP_COLORS.bgPrimary

    let currentBorderColor = border.color ?? APP_COLORS.borderDefault
    let currentShadow = makeShadow(shadow.normal || {})

    if (!props.enabled) {
        currentBg = APP_COLORS.bgDisabled
        currentBorderColor = APP_COLORS.borderDisabled || border.color
    } else {
        // Hover
        if (isHovered.value) {
            if (hover.borderColor != null) {
                currentBorderColor = hover.borderColor
            }
            if (!isActive && hover.backgroundColor != null) {
                currentBg = hover.backgroundColor
            }
            currentShadow = makeShadow(shadow.hover || shadow.normal || {})
        }

        // Focus
        if (isFocused.value) {
            if (focus.borderColor != null) {
                currentBorderColor = focus.borderColor
            }
            currentShadow = makeShadow(shadow.focus || shadow.normal || {})
        }

        // Error State
        if (props.error) {
            currentBorderColor = APP_COLORS.borderError
        }
    }

    return {
        width: boxSize,
        height: boxSize,
        backgroundColor: currentBg,
        border: `${border.width ?? '1px'} ${border.style ?? 'solid'} ${currentBorderColor}`,
        borderRadius: border.radius ?? '4px',
        boxShadow: currentShadow
    }
})

const labelStyle = computed(() => {
    const font = props.font || {}
    const size = props.size || {}

    return {
        fontFamily: font.family ?? 'inherit',
        fontSize: size.fontSize ?? '14px',
        fontWeight: font.weight ?? 'normal',
        fontStyle: font.style ?? 'normal',
        color: !props.enabled ? APP_COLORS.textDisabled : font.color ?? APP_COLORS.textPrimary
    }
})

// --------------------------------------------------
// EVENTS
// --------------------------------------------------
function onChange(event) {
    if (props.readOnly) return
    const checked = event.target.checked
    emit('update:modelValue', checked)
    emit('change', checked)
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
    if (props.readOnly) {
        event.preventDefault()
        return
    }
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

function getValue() {
    return inputRef.value?.checked ?? false
}

function setValue(value) {
    emit('update:modelValue', Boolean(value))
}

function resetOriginalValue() {
    initialValue.value = Boolean(props.modelValue)
    initialIndeterminate.value = Boolean(props.indeterminate)
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
    inputRef
})
</script>

<style scoped>
.checkbox-wrapper {
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

.checkbox-container {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    position: relative;
    user-select: none;
}

.checkbox-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    margin: 0;
    pointer-events: none;
}

.checkbox-custom {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    flex-shrink: 0;
    transition:
        border-color 0.15s ease,
        background-color 0.15s ease,
        box-shadow 0.15s ease;
    background: v-bind('APP_COLORS.bgPrimaryGrad');
}

.checkbox-icon {
    width: 70%;
    height: 70%;
    color: #ffffff;
}

.checkbox-label {
    line-height: 1.2;
}

.checkbox-disabled {
    opacity: 0.65;
    cursor: not-allowed !important;
}

.checkbox-readonly {
    cursor: default !important;
}

.error-text {
    color: var(--border-error);
    font-size: 12px;
    margin-top: 4px;
}
</style>