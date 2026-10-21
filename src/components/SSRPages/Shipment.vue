<template>
  <div class="shipment-page">
    <div class="form-container">
      <!-- Meneruskan resetKey tanpa :is-dirty eksternal -->
      <DataField id="9" type="text" :reset-key="resetKey" />
      <DataField id="2" type="text" :reset-key="resetKey" />
      <DataField id="5" type="date" :enable-time="true" :reset-key="resetKey" />
    </div>

    <!-- Tombol aksi opsional -->
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
import { useFormTracker } from '../../useFormTracker.js'

// Flag untuk mencegah watcher 'form' menyalin data saat pergantian row terjadi
const isSwitchingRow = ref(false)

// State resetKey untuk pemicu pembaharuan baseline pada Textbox/DatePicker
const resetKey = ref(0)

// Inisialisasi useFormTracker
const { form, isDirty, commitOriginal, resetToOriginal } = useFormTracker(
  SelectedRowStore.selectedRow.value
)

// Pantau ref SelectedRowStore.selectedRow secara langsung
watch(
  () => SelectedRowStore.selectedRow.value,
  async (newRow) => {
    

    if (newRow && Object.keys(newRow).length > 0) {
      isSwitchingRow.value = true

      // Panggil commitOriginal dari form tracker
      commitOriginal([], newRow)

      // Naikkan resetKey agar DataField -> Textbox/DatePicker mereset initialValue internalnya
      resetKey.value++

      await nextTick()
      isSwitchingRow.value = false
    }
  },
  { deep: false, immediate: true }
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
  const currentData = SelectedRowStore.selectedRow.value

  if (currentData) {
    // Oper data terbaru saat ini agar commitOriginal tidak menerima null
    commitOriginal([], currentData)

    // Perbarui baseline komponen anak (Textbox & DatePicker)
    resetKey.value++

    console.log('Data Shipment tersimpan:', currentData[2])
  }
}

// Handler saat mereset data ke kondisi awal
function handleReset() {
  // 1. Kembalikan data internal tracker ke nilai awal
  resetToOriginal()

  // 2. Salin data awal kembali ke SelectedRowStore agar v-model di input ikut berubah
  if (SelectedRowStore.selectedRow.value) {
    Object.assign(SelectedRowStore.selectedRow.value, form)
  }

  // 3. Pemicu agar Textbox & DatePicker mereset baseline & menyembunyikan dirty badge
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