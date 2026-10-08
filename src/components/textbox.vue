<template>
    <input
      ref="inputRef"
      type="text"
      :value="modelValue"
      :name="name"
      :placeholder="placeholder"
      :disabled="!enabled"
      :readonly="readOnly"
      :maxlength="maxlength"
      :style="{
        width: width,
        height: height
      }"
      class="textbox"
      @input="onInput"
      @change="onChange"
      @keydown="onKeydown"
    />
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  defineProps({
    modelValue: {
      type: String,
      default: ''
    },
  
    name: {
      type: String,
      default: ''
    },
  
    placeholder: {
      type: String,
      default: ''
    },
  
    width: {
      type: String,
      default: '200px'
    },
  
    height: {
      type: String,
      default: '32px'
    },
  
    enabled: {
      type: Boolean,
      default: true
    },
  
    readOnly: {
      type: Boolean,
      default: false
    },
  
    maxlength: {
      type: Number,
      default: null
    }
  })
  
  const emit = defineEmits([
    'update:modelValue',
    'change',
    'keydown'
  ])
  
  const inputRef = ref(null)
  
  function onInput(event) {
    emit('update:modelValue', event.target.value)
  }
  
  function onChange(event) {
    emit('change', event.target.value)
  }
  
  function onKeydown(event) {
    emit('keydown', event)
  }
  
  function focus() {
    inputRef.value?.focus()
  }
  
  function select() {
    inputRef.value?.select()
  }
  
  defineExpose({
    focus,
    select
  })
  </script>
  
  <style scoped>
  .textbox {
    box-sizing: border-box;
  
    padding: 5px 8px;
  
    border: 1px solid #ff0000;
    border-radius: 3px;
  
    font-family: Arial, sans-serif;
    font-size: 14px;
  
    outline: none;
  }
  
  .textbox:focus {
    border-color: #4285f4;
    box-shadow: 0 0 0 1px #4285f4;
  }
  
  .textbox:disabled {
    background: #f3e8e8;
    color: #777;
  }
  </style>