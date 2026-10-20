<template>
  <div class="form-container">
    <div 
      v-for="column in shipmentStore.columns.value" 
      :key="column.id" 
      class="form-group"
    >
      <label :for="column.id">{{ column.title }}</label>
      <Textbox 
        :id="column.id" 
        v-model="shipmentStore.selectedRow.value[column.id]" 
      />
    </div>
  </div>
</template>

<script setup>
import Textbox from '../textbox.vue'
import { shipmentStore } from '../../stores/shipmentStore.js'
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: row;
  /* Diubah dari column ke row agar berjejer ke kanan */
  flex-wrap: wrap;
  gap: 12px;
  overflow-x: auto;
  border: 1px solid #ccc;
  padding: 5px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
  border: 1px solid rgba(0, 0, 255, 0);
}
</style>