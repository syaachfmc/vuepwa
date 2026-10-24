<template>
  <div class="shipment-page">
    <div class="form-container">
      <div>
      <DataField id="2" type="text" :reset-key="resetKey" flat readOnly />
      <DataField id="9" type="text" :reset-key="resetKey" :size="{width: '600px',height: '32px'}" />
    </div>
      <DataField id="5" type="date" :enable-time="true" :reset-key="resetKey" />

      <!-- Menggunakan fungsi helper langsung dengan ID kolom -->
      <DataField 
        id="16" 
        type="dropdown" 
        :reset-key="resetKey" 
        :options="getDataListFromColumn('4')" 
        :editable="true"
      />
    </div>

    <div class="action-buttons">
      <button @click="handleSave">Simpan</button>
      <button @click="handleReset">Reset</button>
    </div>
  </div>
</template>

<script setup>
import { watch, ref, nextTick } from 'vue'
import DataField from '../DataField.vue'
import { SelectedRowStore } from '../../stores/selectedRowStore.js'

import { useFormTracker } from '../../composables/useFormTracker.js'
import { useTableHelpers } from '../../composables/useTableHelpers.js'

// Import helper
const { getDataListFromColumn } = useTableHelpers()

const isSwitchingRow = ref(false)
const resetKey = ref(0)
 
// Inisialisasi Tracker & Handler
const { form, isDirty, commitOriginal, resetToOriginal } = useFormTracker(
  SelectedRowStore.selectedRow.value
)

watch(
  () => SelectedRowStore.selectedRow.value,
  async (newRow) => {
    if (newRow && Object.keys(newRow).length > 0) {
      isSwitchingRow.value = true
      commitOriginal([], newRow)
      resetKey.value++

      await nextTick()
      isSwitchingRow.value = false
    }
  },
  { deep: false, immediate: true }
)

watch(
  form,
  (newForm) => {
    if (isSwitchingRow.value) return
    if (SelectedRowStore.selectedRow.value) {
      Object.assign(SelectedRowStore.selectedRow.value, newForm)
    }
  },
  { deep: true }
)

function handleSave() {
  const currentData = SelectedRowStore.selectedRow.value
  if (currentData) {
    commitOriginal([], currentData)
    resetKey.value++
    console.log('Data Shipment tersimpan:', currentData[2])
  }
}

function handleReset() {
  resetToOriginal()
  if (SelectedRowStore.selectedRow.value) {
    Object.assign(SelectedRowStore.selectedRow.value, form)
  }
  resetKey.value++
}
</script>
<style scoped>
.shipment-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px;
}

.form-container {
  display: flex;
  flex-direction:column;
  flex-wrap: wrap;
  gap: 12px;
  overflow-x: auto;
  border: 1px solid #ccc;
  padding: 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons button {
  padding: 6px 12px;
  cursor: pointer;
}
</style>