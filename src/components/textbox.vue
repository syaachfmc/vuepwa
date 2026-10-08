
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
  />
</template>

<script setup>
import { computed, ref } from 'vue'

/* =========================================================
   PROPS
   ========================================================= */

const props = defineProps({

  // =======================================================
  // VALUE
  // =======================================================

  modelValue: {
    type: [String, Number],
    default: ''
  },

  name: {
    type: String,
    default: ''
  },

  // =======================================================
  // SIZE
  // =======================================================

  size: {
    type: Object,
    default: () => ({
      width: '200px',
      height: '32px'
    })
  },

  // =======================================================
  // FONT
  // =======================================================

  font: {
    type: Object,
    default: () => ({
      family: 'Arial, sans-serif',
      size: '14px',
      weight: 400,
      style: 'normal',
      color: '#222'
    })
  },

  // =======================================================
  // BACKGROUND
  // =======================================================

  background: {
    type: Object,
    default: () => ({
      color: '#ffffff'
    })
  },

  // =======================================================
  // BORDER
  // =======================================================

  border: {
    type: Object,
    default: () => ({
      color: '#999999',
      width: '1px',
      style: 'solid',
      radius: '4px'
    })
  },

  // =======================================================
  // FOCUS
  // =======================================================

  focus: {
    type: Object,
    default: () => ({
      borderColor: '#4285F4',
      backgroundColor: null,
      color: null
    })
  },

  // =======================================================
  // TEXT
  // =======================================================

  text: {
    type: Object,
    default: () => ({
      align: 'left',
      padding: '5px 8px'
    })
  },

  // =======================================================
  // STATE
  // =======================================================

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

  // =======================================================
  // INPUT
  // =======================================================

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

  // =======================================================
  // VALIDATION
  // =======================================================

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

  // =======================================================
  // CURSOR
  // =======================================================

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
   FOCUS STATE
   ========================================================= */

const isFocused = ref(false)


/* =========================================================
   STYLE
   ========================================================= */

const textboxStyle = computed(() => {

  const size = props.size || {}
  const font = props.font || {}
  const background = props.background || {}
  const border = props.border || {}
  const text = props.text || {}
  const focus = props.focus || {}

  return {

    /* -----------------------------------------
       SIZE
    ----------------------------------------- */

    width: size.width || '200px',
    height: size.height || '32px',

    /* -----------------------------------------
       FONT
    ----------------------------------------- */

    fontFamily: font.family || 'Arial, sans-serif',
    fontSize: font.size || '14px',
    fontWeight: font.weight ?? 400,
    fontStyle: font.style || 'normal',
    color:
      isFocused.value && focus.color
        ? focus.color
        : font.color || '#222',

    /* -----------------------------------------
       BACKGROUND
    ----------------------------------------- */

    backgroundColor:
      isFocused.value && focus.backgroundColor
        ? focus.backgroundColor
        : background.color || '#ffffff',

    /* -----------------------------------------
       BORDER
    ----------------------------------------- */

    borderColor:
      props.error
        ? '#dc3545'
        : isFocused.value
          ? (focus.borderColor || border.color || '#999')
          : (border.color || '#999'),

    borderWidth: border.width || '1px',
    borderStyle: border.style || 'solid',
    borderRadius: border.radius || '4px',

    /* -----------------------------------------
       TEXT
    ----------------------------------------- */

    textAlign: text.align || 'left',
    padding: text.padding || '5px 8px',

    /* -----------------------------------------
       CURSOR
    ----------------------------------------- */

    cursor: props.enabled
      ? props.cursor
      : 'not-allowed',

    /* -----------------------------------------
       BOX
    ----------------------------------------- */

    boxSizing: 'border-box',

    /* -----------------------------------------
       OUTLINE
    ----------------------------------------- */

    outline: 'none'
  }
})


/* =========================================================
   EVENTS
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


function onChange(event) {

  emit(
    'change',
    event.target.value
  )
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


/* =========================================================
   PUBLIC METHODS
   VBA-LIKE
   ========================================================= */

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

.textbox {

  display: inline-block;

  font-family: Arial, sans-serif;

  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;

}


/* =========================================================
   HOVER
   ========================================================= */

.textbox:hover:not(:disabled) {

  border-color: #777;

}


/* =========================================================
   FOCUS
   ========================================================= */

.textbox:focus {

  box-shadow:
    0 0 0 1px currentColor;

}


/* =========================================================
   DISABLED
   ========================================================= */

.textbox-disabled {

  opacity: 0.65;

  background-color: #eeeeee !important;

}


/* =========================================================
   READ ONLY
   ========================================================= */

.textbox-readonly {

  background-color: #f5f5f5;

}


/* =========================================================
   ERROR
   ========================================================= */

.textbox-error {

  border-color: #dc3545 !important;

}


.textbox-error:focus {

  box-shadow:
    0 0 0 1px #dc3545;

}


.textbox::placeholder {

  color: #999;

  opacity: 1;

}

</style>


 

