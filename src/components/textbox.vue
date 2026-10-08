<template>
    <input
        v-if="visible"
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
                'textbox-readonly': readOnly
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
</template>


<script setup>

import { computed, ref } from 'vue'


/* =========================================================
   PROPS
   ========================================================= */

const props = defineProps({

    /* =======================================================
       VALUE
       ======================================================= */

    modelValue: {
        type: [String, Number],
        default: ''
    },

    name: {
        type: String,
        default: ''
    },


    /* =======================================================
       SIZE
       ======================================================= */

    size: {
        type: Object,
        default: () => ({
            width: '200px',
            height: '32px'
        })
    },


    /* =======================================================
       FONT
       ======================================================= */

    font: {
        type: Object,
        default: () => ({
            family: 'Arial, sans-serif',
            size: '14px',
            weight: 400,
            style: 'normal',
            color: '#222222'
        })
    },


    /* =======================================================
       BACKGROUND
       ======================================================= */

    background: {
        type: Object,
        default: () => ({
            color: '#ffffff'
        })
    },


    /* =======================================================
       BORDER
       ======================================================= */

    border: {
        type: Object,
        default: () => ({
            color: '#999999',
            width: '1px',
            style: 'solid',
            radius: '4px'
        })
    },


    /* =======================================================
       SHADOW
       ======================================================= */

    shadow: {
        type: Object,

        default: () => ({

            normal: {
                color: 'rgba(0, 0, 0, 0.3)',
                offsetX: '0px',
                offsetY: '2px',
                blur: '4px',
                spread: '0px',
                inset: false
            },

            hover: {
                color: 'rgba(0, 0, 0, 0.3)',
                offsetX: '0px',
                offsetY: '2px',
                blur: '4px',
                spread: '0px',
                inset: true
            },

            focus: {
                color: 'rgba(66, 133, 244, 0.5)',
                offsetX: '0px',
                offsetY: '2px',
                blur: '4px',
                spread: '1px',
                inset: true
            },

            error: {
                color: 'rgba(220, 53, 69, 0.35)',
                offsetX: '0px',
                offsetY: '0px',
                blur: '5px',
                spread: '1px',
                inset: false
            }

        })
    },


    /* =======================================================
       HOVER
       ======================================================= */

    hover: {
        type: Object,

        default: () => ({
            borderColor: '#777777',
            backgroundColor: null,
            color: null
        })
    },


    /* =======================================================
       FOCUS
       ======================================================= */

    focus: {
        type: Object,

        default: () => ({
            borderColor: '#4285F4',
            backgroundColor: null,
            color: null
        })
    },


    /* =======================================================
       TEXT
       ======================================================= */

    text: {
        type: Object,

        default: () => ({
            align: 'left',
            padding: '5px 8px'
        })
    },


    /* =======================================================
       STATE
       ======================================================= */

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


    /* =======================================================
       INPUT
       ======================================================= */

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


    /* =======================================================
       VALIDATION
       ======================================================= */

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


    /* =======================================================
       CURSOR
       ======================================================= */

    cursor: {
        type: String,
        default: 'text'
    }

})


/* =========================================================
   EVENTS
   ========================================================= */

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


/* =========================================================
   REF
   ========================================================= */

const inputRef = ref(null)


/* =========================================================
   STATE
   ========================================================= */

const isFocused = ref(false)

const isHovered = ref(false)


/* =========================================================
   MAKE SHADOW
   ========================================================= */

function makeShadow(shadow = {}) {

    const color =
        shadow.color || 'rgba(0, 0, 0, 0.15)'

    const offsetX =
        shadow.offsetX || '0px'

    const offsetY =
        shadow.offsetY || '2px'

    const blur =
        shadow.blur || '4px'

    const spread =
        shadow.spread || '0px'

    const inset =
        shadow.inset ? 'inset ' : ''

    return (
        `${inset}` +
        `${offsetX} ` +
        `${offsetY} ` +
        `${blur} ` +
        `${spread} ` +
        `${color}`
    )
}


/* =========================================================
   COMPUTED STYLE
   ========================================================= */

const textboxStyle = computed(() => {

    const size =
        props.size || {}

    const font =
        props.font || {}

    const background =
        props.background || {}

    const border =
        props.border || {}

    const shadow =
        props.shadow || {}

    const hover =
        props.hover || {}

    const focus =
        props.focus || {}

    const text =
        props.text || {}


    /* =======================================================
       DETERMINE CURRENT STATE
       ======================================================= */

    let currentColor =
        font.color || '#222222'

    let currentBackground =
        background.color || '#ffffff'

    let currentBorderColor =
        border.color || '#999999'

    let currentShadow =
        makeShadow(
            shadow.normal || {}
        )


    /* =======================================================
       HOVER
       ======================================================= */

    if (
        isHovered.value &&
        props.enabled &&
        !props.error
    ) {

        if (hover.color) {

            currentColor =
                hover.color

        }

        if (hover.backgroundColor) {

            currentBackground =
                hover.backgroundColor

        }

        if (hover.borderColor) {

            currentBorderColor =
                hover.borderColor

        }

        if (shadow.hover) {

            currentShadow =
                makeShadow(
                    shadow.hover
                )

        }

    }


    /* =======================================================
       FOCUS
       ======================================================= */

    if (
        isFocused.value &&
        props.enabled
    ) {

        if (focus.color) {

            currentColor =
                focus.color

        }

        if (focus.backgroundColor) {

            currentBackground =
                focus.backgroundColor

        }

        if (focus.borderColor) {

            currentBorderColor =
                focus.borderColor

        }

        if (shadow.focus) {

            currentShadow =
                makeShadow(
                    shadow.focus
                )

        }

    }


    /* =======================================================
       ERROR
       ======================================================= */

    if (props.error) {

        currentBorderColor =
            '#dc3545'

        if (shadow.error) {

            currentShadow =
                makeShadow(
                    shadow.error
                )

        }

    }


    /* =======================================================
       DISABLED
       ======================================================= */

    if (!props.enabled) {

        currentBackground =
            '#eeeeee'

    }


    /* =======================================================
       RETURN STYLE
       ======================================================= */

    return {

        /* -----------------------------------------
           SIZE
           ----------------------------------------- */

        width:
            size.width || '200px',

        height:
            size.height || '32px',


        /* -----------------------------------------
           FONT
           ----------------------------------------- */

        fontFamily:
            font.family ||
            'Arial, sans-serif',

        fontSize:
            font.size ||
            '14px',

        fontWeight:
            font.weight ?? 400,

        fontStyle:
            font.style ||
            'normal',

        color:
            currentColor,


        /* -----------------------------------------
           BACKGROUND
           ----------------------------------------- */

        backgroundColor:
            currentBackground,


        /* -----------------------------------------
           BORDER
           ----------------------------------------- */

        borderColor:
            currentBorderColor,

        borderWidth:
            border.width ||
            '1px',

        borderStyle:
            border.style ||
            'solid',

        borderRadius:
            border.radius ||
            '4px',


        /* -----------------------------------------
           SHADOW
           ----------------------------------------- */

        boxShadow:
            currentShadow,


        /* -----------------------------------------
           TEXT
           ----------------------------------------- */

        textAlign:
            text.align ||
            'left',

        padding:
            text.padding ||
            '5px 8px',


        /* -----------------------------------------
           CURSOR
           ----------------------------------------- */

        cursor:
            props.enabled
                ? props.cursor
                : 'not-allowed',


        /* -----------------------------------------
           BOX
           ----------------------------------------- */

        boxSizing:
            'border-box',


        /* -----------------------------------------
           OUTLINE
           ----------------------------------------- */

        outline:
            'none'

    }

})


/* =========================================================
   INPUT EVENT
   ========================================================= */

function onInput(event) {

    emit(
        'update:modelValue',
        event.target.value
    )

    emit(
        'input',
        event.target.value
    )

}


/* =========================================================
   CHANGE EVENT
   ========================================================= */

function onChange(event) {

    emit(
        'change',
        event.target.value
    )

}


/* =========================================================
   FOCUS EVENT
   ========================================================= */

function onFocus(event) {

    isFocused.value = true

    emit(
        'focus',
        event
    )

}


/* =========================================================
   BLUR EVENT
   ========================================================= */

function onBlur(event) {

    isFocused.value = false

    emit(
        'blur',
        event
    )

}


/* =========================================================
   KEYDOWN EVENT
   ========================================================= */

function onKeydown(event) {

    emit(
        'keydown',
        event
    )

}


/* =========================================================
   KEYUP EVENT
   ========================================================= */

function onKeyup(event) {

    emit(
        'keyup',
        event
    )

}


/* =========================================================
   CLICK EVENT
   ========================================================= */

function onClick(event) {

    emit(
        'click',
        event
    )

}


/* =========================================================
   MOUSE ENTER
   ========================================================= */

function onMouseEnter() {

    if (props.enabled) {

        isHovered.value = true

    }

}


/* =========================================================
   MOUSE LEAVE
   ========================================================= */

function onMouseLeave() {

    isHovered.value = false

}


/* =========================================================
   PUBLIC METHOD
   VBA-LIKE
   ========================================================= */

function focus() {

    inputRef.value?.focus()

}


/* =========================================================
   BLUR
   ========================================================= */

function blur() {

    inputRef.value?.blur()

}


/* =========================================================
   SELECT
   ========================================================= */

function select() {

    inputRef.value?.select()

}


/* =========================================================
   SELECT ALL
   ========================================================= */

function selectAll() {

    inputRef.value?.select()

}


/* =========================================================
   GET VALUE
   ========================================================= */

function getValue() {

    return (
        inputRef.value?.value ?? ''
    )

}


/* =========================================================
   SET VALUE
   ========================================================= */

function setValue(value) {

    emit(
        'update:modelValue',
        value
    )

}


/* =========================================================
   EXPOSE
   ========================================================= */

defineExpose({

    focus,

    blur,

    select,

    selectAll,

    getValue,

    setValue,

    inputRef

})

</script>


<style scoped>

/* =========================================================
   TEXTBOX
   ========================================================= */

.textbox {

    display: inline-block;

    font-family:
        Arial,
        sans-serif;

    transition:
        border-color 0.15s ease,
        background-color 0.15s ease,
        color 0.15s ease,
        box-shadow 0.15s ease;

}


/* =========================================================
   DISABLED
   ========================================================= */

.textbox-disabled {

    opacity: 0.65;

    cursor:
        not-allowed;

}


/* =========================================================
   READ ONLY
   ========================================================= */

.textbox-readonly {

    cursor:
        default;

}


/* =========================================================
   ERROR
   ========================================================= */

.textbox-error {

    border-color:
        #dc3545 !important;

}


/* =========================================================
   PLACEHOLDER
   ========================================================= */

.textbox::placeholder {

    color:
        #999999;

    opacity:
        1;

}

</style>