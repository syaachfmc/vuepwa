<template>
    <div class="form-group">
      <label :for="`col_${id}`">{{ columnTitle }}</label>
      
      <!-- Render Textbox jika type === 'text' -->
      <Textbox 
        v-if="type === 'text'"
        :id="`col_${id}`" 
        v-model="SelectedRowStore.selectedRow.value[String(id)]" 
      />
  
      <!-- Render DatePicker jika type === 'date' atau 'datetime' -->
      <DatePicker
        v-else-if="type === 'date' || type === 'datetime'"
        :id="`col_${id}`"
        v-model="SelectedRowStore.selectedRow.value[String(id)]"
        :enable-time-picker="enableTime || type === 'datetime'"
        :is-dirty="trackerIsDirty ? trackerIsDirty(String(id)) : false"
      />
  
      <!-- Siapkan tempat untuk type lain nanti (opsional) -->
      <input 
        v-else
        type="text"
        :id="`col_${id}`"
        v-model="SelectedRowStore.selectedRow.value[String(id)]"
        class="custom-input"
      />
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import Textbox from './textbox.vue'
  import DatePicker from './DatePicker.vue'
  import { SelectedRowStore } from '../stores/selectedRowStore.js'
  
  const props = defineProps({
    id: {
      type: [String, Number],
      required: true
    },
    type: {
      type: String,
      default: 'text'
    },
    enableTime: {
      type: Boolean,
      default: false
    },
    trackerIsDirty: {
      type: Function,
      default: null
    }
  })
  
  // Cari judul kolom otomatis berdasarkan ID
  const columnTitle = computed(() => {
    const col = SelectedRowStore.columns.value.find(c => String(c.id) === String(props.id))
    return col ? col.title : ''
  })
  </script>
  
  <style scoped>
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 180px;
  }
  
  .custom-input {
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  </style>