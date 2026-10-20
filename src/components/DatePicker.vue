<template>
    <div class="datepicker-wrapper">
      <!-- Dirty Badge muncul otomatis jika isDirty bernilai true -->
      <span v-if="isDirty" class="dirty-badge" title="Data telah diubah"></span>
  
      <VueDatePicker
        v-model="internalValue"
        :teleport="teleport"
        :formats="formats"
        :placeholder="placeholder"
        :enable-time-picker="enableTimePicker"
        :auto-apply="autoApply"
      />
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import { VueDatePicker } from '@vuepic/vue-datepicker'
  import '@vuepic/vue-datepicker/dist/main.css'
  import '../assets/styles/datepicker.css'
  import '../assets/styles/dirtyBadge.css'
  import { APP_COLORS } from '../constants/colors.js'
  
  const props = defineProps({
    modelValue: {
      type: [Date, String, Object, null],
      default: null
    },
    isDirty: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: 'Pilih Tanggal'
    },
    teleport: {
      type: Boolean,
      default: true
    },
    formats: {
      type: Object,
      default: () => ({ input: 'dd MMM yyyy' })
    },
    enableTimePicker: {
      type: Boolean,
      default: false
    },
    autoApply: {
      type: Boolean,
      default: true
    }
  })
  
  const emit = defineEmits(['update:modelValue'])
  
  // Menangani sinkronisasi otomatis tipe data string/Date agar terikat sempurna ke v-model Store
  const internalValue = computed({
    get: () => {
      if (!props.modelValue) return null
      if (props.modelValue instanceof Date) return props.modelValue
      const parsed = new Date(props.modelValue)
      return isNaN(parsed.getTime()) ? props.modelValue : parsed
    },
    set: (val) => {
      emit('update:modelValue', val)
    }
  })
  </script>
  
  <style scoped>
  .datepicker-wrapper {
    position: relative;
    display: inline-block;
    width: fit-content;
  
    --dirty-badge-bg: v-bind('APP_COLORS.dirtyBadgeBg');
    --dirty-badge-border: v-bind('APP_COLORS.dirtyBadgeBorder');
    --dirty-badge-glow: v-bind('APP_COLORS.dirtyBadgeGlow');
  }
  </style>