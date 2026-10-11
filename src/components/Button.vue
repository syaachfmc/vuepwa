<template>
    <button
      ref="buttonRef"
      class="app-button"
      :class="[
        `app-button--${size}`,
        {
          'is-disabled': disabled,
          'is-loading': loading
        }
      ]"
      :type="type"
      :disabled="disabled || loading"
      :style="buttonStyle"
      @click="handleClick"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
      @focus="isFocused = true"
      @blur="isFocused = false"
    >
      <span v-if="loading" class="button-spinner"></span>
  
      <span class="button-content">
        <slot>{{ label }}</slot>
      </span>
    </button>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { APP_COLORS } from '../constants/colors.js'
  
  const props = defineProps({
    label: {
      type: String,
      default: 'Button'
    },
  
    type: {
      type: String,
      default: 'button',
      validator: value =>
        ['button', 'submit', 'reset'].includes(value)
    },
  
    size: {
      type: String,
      default: 'medium',
      validator: value =>
        ['small', 'medium', 'large'].includes(value)
    },
  
    disabled: {
      type: Boolean,
      default: false
    },
  
    loading: {
      type: Boolean,
      default: false
    },
  
    fullWidth: {
      type: Boolean,
      default: false
    }
  })
  
  const emit = defineEmits(['click'])
  
  const buttonRef = ref(null)
  const isHovered = ref(false)
  const isFocused = ref(false)
  
  const buttonStyle = computed(() => {
    const colors = APP_COLORS
  
    let currentBorder = colors.buttonBorder
    let currentShadow = colors.buttonShadow || 'rgba(0, 0, 0, 0.1)'
  
    if (props.disabled || props.loading) {
      currentShadow = 'transparent'
    } else if (isFocused.value) {
      currentBorder = colors.buttonBorderFocus
      currentShadow = colors.buttonShadowFocus || 'rgba(0, 0, 0, 0.25)'
    } else if (isHovered.value) {
      currentBorder = colors.buttonBorderHover
      currentShadow = colors.buttonShadowHover || 'rgba(0, 0, 0, 0.15)'
    }
  
    return {
      '--button-bg': colors.buttonBg,
      '--button-bg-solid': colors.buttonBgSolid,
      '--button-bg-disabled': colors.buttonBgDisabled,
  
      '--button-text': colors.buttonText,
      '--button-text-disabled': colors.buttonTextDisabled,
  
      '--button-border': currentBorder,
      '--button-shadow': currentShadow,
  
      '--button-radius': '4px',
  
      width: props.fullWidth ? '100%' : undefined
    }
  })
  
  function handleClick(event) {
    if (props.disabled || props.loading) return
  
    emit('click', event)
  }
  
  defineExpose({
    buttonRef
  })
  </script>
  
  <style scoped>
  .app-button {
    box-sizing: border-box;
    position: relative;
  
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
  
    color: var(--button-text);
    background: var(--button-bg);
  
    border: 1px solid var(--button-border);
    border-radius: var(--button-radius);
  
    box-shadow: 0 1px 3px var(--button-shadow);
  
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
  
    transition:
      background 0.18s ease,
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      transform 0.12s ease,
      opacity 0.18s ease;
  }
  
  /* Ukuran tombol */
  
  .app-button--small {
    min-height: 30px;
    padding: 5px 12px;
    font-size: 12px;
  }
  
  .app-button--medium {
    min-height: 36px;
    padding: 8px 16px;
    font-size: 14px;
  }
  
  .app-button--large {
    min-height: 42px;
    padding: 10px 20px;
    font-size: 15px;
  }
  
  /* Hover */
  
  .app-button:not(.is-disabled):not(.is-loading):hover {
    box-shadow: 0 2px 4px var(--button-shadow);
  }
  
  /* Active */
  
  .app-button:not(.is-disabled):not(.is-loading):active {
    transform: translateY(1px);
  
    box-shadow: 0 1px 2px var(--button-shadow);
  }
  
  /* Focus */
  
  .app-button:focus-visible {
    outline: none;
  
    box-shadow: 0 0 0 2px var(--button-shadow);
  }
  
  /* Disabled & Loading */
  
  .app-button.is-disabled,
  .app-button.is-loading {
    color: var(--button-text-disabled);
    background: var(--button-bg-disabled);
  
    border-color: var(--button-border);
  
    box-shadow: none;
  
    cursor: not-allowed;
    opacity: 0.75;
  }
  
  /* Slot / label */
  
  .button-content {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Loading indicator */
  
  .button-spinner {
    width: 13px;
    height: 13px;
  
    flex-shrink: 0;
  
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
  
    animation: button-spin 0.65s linear infinite;
  }
  
  @keyframes button-spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .app-button {
      transition: none;
    }
  
    .button-spinner {
      animation-duration: 1.5s;
    }
  }
  </style>