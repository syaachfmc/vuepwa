<template>
  <div class="shipment-page">
    <div class="form-container">
      <!-- Textbox biasa dengan pengecekan dirty otomatis -->
      <DataText id="9" type="text" :is-dirty="isDirty('9')" />

      <!-- DatePicker tanpa jam -->
      <DataText id="2" type="text" :is-dirty="isDirty('2')" />

      <!-- DatePicker dengan jam -->
      <DataText id="5" type="date" :enable-time="true" :is-dirty="isDirty('5')" />
    </div>
  </div>
</template>

<script setup>
import { watch, ref, nextTick } from 'vue'
import DataText from '../DataField.vue'
import { SelectedRowStore } from '../../stores/SelectedRowStore.js'
import { useFormTracker } from '../../useFormTracker.js'

// Flag untuk mencegah watcher 'form' menyalin data saat pergantian row terjadi
const isSwitchingRow = ref(false)

// Inisialisasi useFormTracker
const { form, isDirty, commitOriginal, resetToOriginal } = useFormTracker(
  SelectedRowStore.selectedRow.value
)

// Pantau perubahan pada store untuk memperbarui data form saat baris diklik di DataTable
watch(
  () => SelectedRowStore.selectedRow.value,
  async (newRow) => {
    if (newRow && Object.keys(newRow).length > 0) {
      isSwitchingRow.value = true
      
      // Salin data row baru dan jadikan sebagai snapshot original yang baru
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