<template>
  <div class="shipment-page">
    <div class="form-container">
      <DataField id="9" type="text" :reset-key="resetKey" />
      <DataField id="2" type="text" :reset-key="resetKey" />
      <DataField id="5" type="date" :enable-time="true" :reset-key="resetKey" />

      <!-- DataField Dropdown dengan properti options dari Column ID 16 -->
      <DataField 
        id="16" 
        type="dropdown" 
        :reset-key="resetKey" 
        :options="vendorOptions" 
      />
    </div>

    <div class="action-buttons">
      <button @click="handleSave">Simpan</button>
      <button @click="handleReset">Reset</button>
    </div>
  </div>
</template>

<script setup>
import { watch, ref, nextTick, onMounted } from 'vue'
import DataField from '../DataField.vue'
import { SelectedRowStore } from '../../stores/selectedRowStore.js'
import { TableStore } from '../../stores/tableStore.js'
import { useFormTracker } from '../../useFormTracker.js'

const isSwitchingRow = ref(false)
const resetKey = ref(0)

// State penampung opsi dropdown Vendor Name
const vendorOptions = ref([])

// Fungsi untuk mengambil/memperbarui opsi dari Column ID 16 (Vendor Name)
function updateVendorOptions() {  
  console.log("getUniqueColumnOptions",TableStore.getUniqueColumnOptions('16'));
  vendorOptions.value = TableStore.getUniqueColumnOptions('16')
}

onMounted(() => {
  // Ambil opsi pertama kali saat komponen dimuat
  updateVendorOptions()
})

 

// Pantau perubahan data tabel secara fleksibel (Ref vs Plain Object)
watch(
  () => TableStore.tableData?.value || TableStore.tableData,
  (newData) => {
    if (newData && newData.length > 0) {
      updateVendorOptions()
    }
  },
  { deep: true, immediate: true } // immediate: true dipanggil langsung saat watcher dibuat
)


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