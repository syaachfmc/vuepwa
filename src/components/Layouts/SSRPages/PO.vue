<template>
  <div class="shipment-page">
    <div class="form-container">


      <div class="divrow">
        <ContainerB title="PO">
          <div class="divrow">
            <DataField id="12" type="text" :reset-key="resetKey" />
            <DataField id="13" type="text" :reset-key="resetKey" :size="{ width: '70px', height: '32px' }" />
            <DataField id="15" type="text" :reset-key="resetKey" :size="{ width: '100px', height: '32px' }" />
          </div>
          <div class="divrow">
            <DataField id="16" type="dropdown" :reset-key="resetKey" :size="{ width: '390px', height: '32px' }" editable
              :options="optionDataList('16')" />
          </div>
        </ContainerB>


      </div>

  
    </div>

    <div class="action-buttons">
      <button @click="handleSave">Simpan</button>
      <button @click="handleReset">Reset</button>
    </div>
  </div>
</template>

<script setup>
import { watch, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import DataField from '../../inputs/DataField.vue'

import ContainerB from '../../inputs/ContainerB.vue'

import { SelectedRowStore } from '../../../stores/selectedRowStore.js'
import { useFormTracker } from '../../../composables/useFormTracker.js'
import { useTableHelpers } from '../../../composables/useTableHelpers.js'

import { loadDropdownList, getDropdownOptions } from '../../../stores/dropdownStore.js'

onMounted(() => {
  // Ambil data dropdown saat komponen dimuat
  loadDropdownList();
});


const { optionDataList } = useTableHelpers()

const isSwitchingRow = ref(false)

// Inisialisasi Tracker & Handler
const resetKey = ref(0)

const {
  form,
  isDirty,
  commitOriginal,
  resetToOriginal,
  unregister
} = useFormTracker(SelectedRowStore.selectedRow.value, {
  refresh: () => resetKey.value++
})

onBeforeUnmount(() => {
  unregister()
})


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
  flex-direction: column;
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

.divcolumn {
  display: flex;
  flex-direction: column;
}

.divrow {
  display: flex;
  flex-direction: row;
  gap: 10px;

}
</style>