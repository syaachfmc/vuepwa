
<template>
    <Teleport to="body">
      <div
        v-if="modelValue"
        class="error-modal-overlay"
        @click.self="closeModal"
      >
        <div class="error-modal">
          <div class="error-modal-icon">
            <AppIcon name="alert-circle" :size="28" />
          </div>
  
          <div class="error-modal-title">
            {{ title }}
          </div>
  
          <div class="error-modal-message">
            {{ message }}
          </div>
  
          <div class="error-modal-actions">
            <button
              v-if="showRetry"
              type="button"
              class="refresh-button"
              @click="handleRetry"
            >
              <AppIcon name="refresh-cw" :size="13" />
              {{ retryText }}
            </button>
  
            <button
              v-if="showRelogin"
              type="button"
              class="relogin-button"
              @click="handleRelogin"
            >
              <AppIcon name="log-in" :size="13" />
              {{ reloginText }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </template>
  
  <script setup>
  import AppIcon from './AppIcon.vue';
  import { APP_COLORS } from '../constants/colors.js';
  
  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Terjadi Kesalahan'
    },
    message: {
      type: String,
      default: 'Terjadi kesalahan yang tidak diketahui.'
    },
    showRetry: {
      type: Boolean,
      default: true
    },
    showRelogin: {
      type: Boolean,
      default: true
    },
    retryText: {
      type: String,
      default: 'Coba Lagi'
    },
    reloginText: {
      type: String,
      default: 'Relogin'
    }
  });
  
  const emit = defineEmits([
    'update:modelValue',
    'retry',
    'relogin',
    'close'
  ]);
  
  function closeModal() {
    emit('update:modelValue', false);
    emit('close');
  }
  
  function handleRetry() {
    emit('update:modelValue', false);
    emit('retry');
  }
  
  function handleRelogin() {
    emit('update:modelValue', false);
    emit('relogin');
  }
  </script>
  
  <style scoped>
  .error-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
  }
  
  .error-modal {
    width: 100%;
    max-width: 380px;
    padding: 24px;
    box-sizing: border-box;
    border: 1px solid v-bind('APP_COLORS.borderDefault');
    border-radius: 10px;
    background: v-bind('APP_COLORS.bgPrimaryGrad');
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
    text-align: center;
    animation: errorModalIn 0.2s ease-out;
  }
  
  .error-modal-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
    color: #d93025;
  }
  
  .error-modal-title {
    font-size: 15px;
    font-weight: 700;
    color: v-bind('APP_COLORS.textPrimary');
    margin-bottom: 12px;
  }
  
  .error-modal-message {
    font-size: 12px;
    line-height: 1.6;
    color: v-bind('APP_COLORS.textSecondary');
    overflow-wrap: anywhere;
    white-space: pre-wrap;
    margin-bottom: 22px;
    max-height: 180px;
    overflow-y: auto;
  }
  
  .error-modal-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .error-modal-actions button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 7px 14px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
  }
  
  .refresh-button {
    border: 1px solid #1a73e8;
    background: #1a73e8;
    color: #fff;
  }
  
  .refresh-button:hover {
    background: #1558b0;
  }
  
  .relogin-button {
    border: 1px solid #d93025;
    background: #d93025;
    color: #fff;
  }
  
  .relogin-button:hover {
    background: #a50e0e;
  }
  
  @keyframes errorModalIn {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.97);
    }
  
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  </style>
  