<template>
  <div class="shipment-page">
    <div class="form-container">
      <!-- Textbox biasa dengan pengecekan dirty otomatis -->
      <DataField id="9" type="text" :is-dirty="isDirty('9')" />

      <!-- DatePicker tanpa jam -->
      <DataField id="2" type="text" :is-dirty="isDirty('2')" />

      <!-- DatePicker dengan jam -->
      <DataField id="5" type="date" :enable-time="true" :is-dirty="isDirty('5')" />
    </div>
  </div>
</template>

<script setup>
import { watch, ref, nextTick } from 'vue'
import DataField from '../DataField.vue'
import { SelectedRowStore } from '../../stores/selectedRowStore.js'
import { useFormTracker } from '../../useFormTracker.js'
import { ChartNoAxesColumnIcon } from 'lucide-vue-next'

// Flag untuk mencegah watcher 'form' menyalin data saat pergantian row terjadi
const isSwitchingRow = ref(false)

// Inisialisasi useFormTracker
const { form, isDirty, commitOriginal, resetToOriginal } = useFormTracker(
  SelectedRowStore.selectedRow.value
)

// Pantau ref SelectedRowStore.selectedRow secara langsung
watch(
  SelectedRowStore.selectedRow,
  async (newRow) => {
    console.log('ini watch selectedRow', newRow)

    if (newRow && Object.keys(newRow).length > 0) {
      isSwitchingRow.value = true

      commitOriginal(newRow)

      await nextTick()
      isSwitchingRow.value = false
    }
  },
  { deep: true, immediate: true }
)




// Sinkronkan perubahan dari form tracker kembali ke store agar bind dua arah tetap berjalan
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

// Handler saat menyimpan data
function handleSave() {
  commitOriginal()
  console.log('Data Shipment tersimpan:', SelectedRowStore.selectedRow.value)
}

// Handler saat mereset data ke kondisi awal saat baris diklik
function handleReset() {
  resetToOriginal()
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
  flex-direction: row;
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